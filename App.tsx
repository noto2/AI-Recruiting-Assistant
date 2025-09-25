import React, { useState, useCallback } from 'react';
import { AppPhase, InitialCandidate, FinalCandidate } from './types';
import { generateReport } from './services/geminiService';
import Loader from './components/Loader';
import ReportDisplay from './components/ReportDisplay';
import DataInputForm from './components/DataInputForm';
import FlowSelection from './components/FlowSelection';
import BulkDataInputForm from './components/BulkDataInputForm';
import BulkReportDisplay from './components/BulkReportDisplay';

const App: React.FC = () => {
  // Common state
  const [appPhase, setAppPhase] = useState<AppPhase>(AppPhase.FLOW_SELECTION);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // Individual flow state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState<string>('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [report, setReport] = useState<string>('');

  // Bulk flow state
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [initialBulkReport, setInitialBulkReport] = useState<InitialCandidate[] | null>(null);

  const handleIndividualAnalysis = useCallback(async () => {
    if (!resumeFile || (!jdText && !jdFile)) {
      setError('이력서 PDF와 JD는 필수 입력 항목입니다.');
      return;
    }
    setError(null);
    setLoadingMessage('AI가 지원자의 서류를 꼼꼼하게 검토하고 있습니다...');
    setAppPhase(AppPhase.LOADING);
    try {
      const generatedReport = await generateReport(resumeFile, portfolioFile, jdText, jdFile);
      setReport(generatedReport);
      setAppPhase(AppPhase.REPORT_INDIVIDUAL);
    } catch (e) {
      console.error(e);
      setError('리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setAppPhase(AppPhase.INDIVIDUAL_INPUT);
    }
  }, [resumeFile, portfolioFile, jdText, jdFile]);

  const handleSelectFlow = (flow: 'individual' | 'bulk') => {
    if (flow === 'individual') {
      setAppPhase(AppPhase.INDIVIDUAL_INPUT);
    } else {
      setAppPhase(AppPhase.BULK_INPUT);
    }
  };
  
  const resetApp = () => {
    // Reset all state
    setError(null);
    setLoadingMessage('');
    setResumeFile(null);
    setPortfolioFile(null);
    setJdText('');
    setJdFile(null);
    setReport('');
    setResumeFiles([]);
    setInitialBulkReport(null);
    setAppPhase(AppPhase.FLOW_SELECTION);
  };

  const renderContent = () => {
    switch (appPhase) {
      case AppPhase.FLOW_SELECTION:
        return <FlowSelection onSelect={handleSelectFlow} />;
      
      case AppPhase.INDIVIDUAL_INPUT:
        return (
          <DataInputForm
            title="1. 검증 정보 입력"
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            portfolioFile={portfolioFile}
            setPortfolioFile={setPortfolioFile}
            jdText={jdText}
            setJdText={setJdText}
            jdFile={jdFile}
            setJdFile={setJdFile}
            onSubmit={handleIndividualAnalysis}
            error={error}
          />
        );

      case AppPhase.BULK_INPUT:
        return (
          <BulkDataInputForm 
            setAppPhase={setAppPhase}
            setError={setError}
            setLoadingMessage={setLoadingMessage}
            setInitialBulkReport={setInitialBulkReport}
            error={error}
            jdText={jdText}
            setJdText={setJdText}
            jdFile={jdFile}
            setJdFile={setJdFile}
            resumeFiles={resumeFiles}
            setResumeFiles={setResumeFiles}
          />
        );

      case AppPhase.LOADING:
        return <Loader message={loadingMessage} />;

      case AppPhase.REPORT_INDIVIDUAL:
        return <ReportDisplay reportContent={report} onReset={resetApp} resumeFileName={resumeFile?.name} />;

      case AppPhase.REPORT_BULK:
        return (
          <BulkReportDisplay
            initialReport={initialBulkReport!}
            jd={{ jdText, jdFile }}
            onReset={resetApp}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            우리 회사에 잘 맞을까?
          </h1>
          <p className="text-slate-400 mt-2">AI 기반 인재 검증 어시스턴트</p>
        </header>
        <main>
          {renderContent()}
        </main>
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;