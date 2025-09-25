import React, { useMemo, useState } from 'react';

// --- Helper Types ---
interface Summary {
  score: string;
  rating: string;
  greenFlags: string[];
  redFlags: string[];
  coreCompetencies: string[];
}
interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  cultural: string[];
}
interface ParsedReport {
  summary: Summary;
  details: string;
  questions: InterviewQuestions;
  checklist: string[];
}

// --- Icons ---
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ExclamationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

// --- Parser ---
const parseList = (text: string | undefined): string[] => {
    if (!text) return [];
    return text.trim().split('\n').map(s => s.replace(/^-/, '').trim()).filter(Boolean);
};

const parseReport = (text: string): ParsedReport | null => {
  try {
    const summaryMatch = text.match(/\[핵심 요약\]([\s\S]*?)\[핵심 요약 끝\]/);
    const summaryContent = summaryMatch ? summaryMatch[1] : '';

    const summary: Summary = {
      score: summaryContent.match(/SCORE:\s*(.*)/)?.[1].trim() ?? 'N/A',
      rating: summaryContent.match(/RATING:\s*(.*)/)?.[1].trim() ?? 'N/A',
      greenFlags: parseList(summaryContent.match(/GREEN_FLAGS:([\s\S]*?)RED_FLAGS:/)?.[1]),
      redFlags: parseList(summaryContent.match(/RED_FLAGS:([\s\S]*?)CORE_COMPETENCIES:/)?.[1]),
      coreCompetencies: parseList(summaryContent.match(/CORE_COMPETENCIES:([\s\S]*)/)?.[1]),
    };

    const details = text.match(/\[상세 분석\]([\s\S]*?)\[상세 분석 끝\]/)?.[1].trim() ?? '';
    
    const questionsText = text.match(/\[면접 질문 리스트\]([\s\S]*?)\[면접 질문 리스트 끝\]/)?.[1] ?? '';
    const questions: InterviewQuestions = {
      technical: parseList(questionsText.match(/# 기술 역량([\s\S]*?)# 경험 기반/)?.[1]),
      behavioral: parseList(questionsText.match(/# 경험 기반([\s\S]*?)# 문화 적합성/)?.[1]),
      cultural: parseList(questionsText.match(/# 문화 적합성([\s\S]*)/)?.[1]),
    };

    const checklist = parseList(text.match(/\[검증 체크리스트\]([\s\S]*?)\[검증 체크리스트 끝\]/)?.[1]);


    return { summary, details, questions, checklist };
  } catch (error) {
    console.error("Failed to parse report:", error);
    return null;
  }
};

const getRatingColor = (rating?: string) => {
    switch(rating) {
        case '매우 적합': return 'text-green-400';
        case '적합': return 'text-blue-400';
        case '검토 필요': return 'text-yellow-400';
        case '부적합': return 'text-red-400';
        default: return 'text-slate-100';
    }
}

interface ReportDisplayProps {
  reportContent: string;
  onReset: () => void;
  resumeFileName?: string;
}

// --- Main Component ---
const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportContent, onReset, resumeFileName }) => {
    const [activeTab, setActiveTab] = useState('details');
    const parsedReport = useMemo(() => parseReport(reportContent), [reportContent]);

    if (!parsedReport) {
        return <div className="bg-slate-800 p-8 rounded-lg shadow-lg text-red-400">리포트 형식을 분석하는 데 실패했습니다. 다시 시도해주세요.</div>
    }

    const { summary, details, questions, checklist } = parsedReport;
    const numericScore = parseInt(summary.score, 10);
    const ratingColor = getRatingColor(summary.rating);

    const escapeCsv = (str: string | undefined) => {
        if (!str) return '""';
        const newStr = str.replace(/"/g, '""');
        return `"${newStr}"`;
    };

    const handleDownloadCsv = () => {
        if (!parsedReport) return;
    
        const rows = [
            ["Category", "Sub-Category", "Content"],
            ["Summary", "Score", summary.score],
            ["Summary", "Rating", summary.rating],
            ...summary.greenFlags.map(f => ["Summary", "Green Flag", escapeCsv(f)]),
            ...summary.redFlags.map(f => ["Summary", "Red Flag", escapeCsv(f)]),
            ...summary.coreCompetencies.map(c => ["Summary", "Core Competency", escapeCsv(c)]),
            ["Detailed Analysis", "", escapeCsv(details)],
            ...questions.technical.map(q => ["Interview Question", "Technical", escapeCsv(q)]),
            ...questions.behavioral.map(q => ["Interview Question", "Behavioral", escapeCsv(q)]),
            ...questions.cultural.map(q => ["Interview Question", "Cultural", escapeCsv(q)]),
            ...checklist.map(i => ["Verification Checklist", "Item", escapeCsv(i)]),
        ];
    
        const csvContent = rows.map(e => e.join(",")).join("\r\n");
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        const safeCandidateName = resumeFileName 
            ? resumeFileName.replace(/\.pdf$/i, '').replace(/[^a-z0-9ㄱ-힣]/gi, '_') 
            : 'candidate';
        const fileName = `HR-GPT_개별리포트_${safeCandidateName}.csv`;
        
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'questions':
                return (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-bold text-teal-300 mb-2">기술 역량</h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {questions.technical.map((q, i) => <li key={`tech-${i}`}>{q}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-teal-300 mb-2">경험 기반</h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {questions.behavioral.map((q, i) => <li key={`behav-${i}`}>{q}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-teal-300 mb-2">문화 적합성</h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {questions.cultural.map((q, i) => <li key={`cult-${i}`}>{q}</li>)}
                            </ul>
                        </div>
                    </div>
                );
            case 'checklist':
                return (
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {checklist.map((item, i) => <li key={`check-${i}`}>{item}</li>)}
                    </ul>
                );
            case 'details':
            default:
                return <p className="text-slate-300 whitespace-pre-wrap">{details}</p>;
        }
    };

    return (
    <div className="space-y-8">
        {/* 1. OVERVIEW */}
        <section className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-teal-300 mb-6 text-center"># 인재 분석 리포트</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-400 mb-2">JD 적합도</p>
                    <div className="relative w-36 h-36">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"></path>
                            {!isNaN(numericScore) && (
                                <path className={`${ratingColor} transition-all duration-1000`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${numericScore}, 100`} strokeLinecap="round"
                                ></path>
                            )}
                        </svg>
                        <div className={`absolute inset-0 flex flex-col items-center justify-center ${ratingColor} get-rating-color`}>
                            <span className="text-4xl font-bold">{summary.score}</span>
                            <span className="text-sm">/ 100</span>
                        </div>
                    </div>
                    <p className={`text-lg font-bold mt-2 ${ratingColor} get-rating-color`}>{summary.rating}</p>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="flex items-center gap-2 font-semibold text-green-400 mb-2"><CheckCircleIcon className="w-5 h-5"/>긍정적 신호 (Green Flags)</h3>
                        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                            {summary.greenFlags.map((flag, i) => <li key={`g-${i}`}>{flag}</li>)}
                        </ul>
                    </div>
                     <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-2"><ExclamationCircleIcon className="w-5 h-5"/>확인 필요 (Red Flags)</h3>
                        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                            {summary.redFlags.map((flag, i) => <li key={`r-${i}`}>{flag}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* 2. DETAILS & QUESTIONS */}
        <section className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div>
                <div className="border-b border-slate-700 mb-4">
                    <nav className="flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('details')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>상세 분석</button>
                        <button onClick={() => setActiveTab('questions')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'questions' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>면접 질문 리스트</button>
                        <button onClick={() => setActiveTab('checklist')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'checklist' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>검증 체크리스트</button>
                    </nav>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                    {renderTabContent()}
                </div>
            </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-10 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleDownloadCsv}
              className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
              CSV로 다운로드
            </button>
            <button
              onClick={onReset}
              className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              새로운 분석 시작하기
            </button>
      </div>
    </div>
  );
};

export default ReportDisplay;