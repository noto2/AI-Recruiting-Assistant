import React, { useState, useRef } from 'react';
import { InitialCandidate, FinalCandidate } from '../types';
import { generateFinalBulkReport } from '../services/geminiService';
import Loader from './Loader';

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
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);
const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);


// --- Helper Functions & Components ---
const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
}

const PortfolioUploader: React.FC<{
    candidate: InitialCandidate;
    file: File | null;
    setFile: (file: File | null) => void;
}> = ({ candidate, file, setFile }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="mt-4">
            {file ? (
                <div className="flex items-center justify-between p-2 bg-slate-700 rounded-md">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-slate-200 text-sm" title={file.name}>{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-xs text-red-400 hover:text-red-300 font-medium flex-shrink-0 ml-2">제거</button>
                </div>
            ) : (
                <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-slate-600/50 rounded-md border border-slate-600 hover:bg-slate-600"
                >
                    <UploadIcon className="w-4 h-4" />
                    포트폴리오 추가 (선택)
                    <input type="file" ref={inputRef} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" accept=".pdf"/>
                </button>
            )}
        </div>
    );
};

// --- Main Component ---
interface BulkReportDisplayProps {
  initialReport: InitialCandidate[];
  jd: { jdText: string | null; jdFile: File | null };
  onReset: () => void;
}

const BulkReportDisplay: React.FC<BulkReportDisplayProps> = ({ initialReport, jd, onReset }) => {
    const [portfolioFiles, setPortfolioFiles] = useState<Map<number, File>>(new Map());
    const [finalReport, setFinalReport] = useState<FinalCandidate[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCandidate, setActiveCandidate] = useState<number | null>(null);

    const handleSetPortfolioFile = (candidateId: number, file: File | null) => {
        const newMap = new Map(portfolioFiles);
        if (file) {
            newMap.set(candidateId, file);
        } else {
            newMap.delete(candidateId);
        }
        setPortfolioFiles(newMap);
    };

    const handleFinalAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const portfolios = Array.from(portfolioFiles.entries()).map(([candidateId, file]) => ({ candidateId, file }));
            const result = await generateFinalBulkReport(initialReport, portfolios, jd.jdText, jd.jdFile);
            setFinalReport(result);
            if (result.length > 0) {
              setActiveCandidate(result[0].candidateId);
            }
        } catch (e) {
            console.error(e);
            setError("최종 후보자 분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const handleDownloadCsv = () => {
        if (!finalReport) return;

        const headers = ["ID", "File Name", "Score", "Summary", "Type", "Question/Checklist Item"];
        let csvContent = headers.join(",") + "\r\n";


        finalReport.forEach(candidate => {
            const common = [candidate.candidateId, escapeCsv(candidate.fileName), candidate.finalScore, escapeCsv(candidate.finalSummary)];
            
            candidate.interviewQuestions.technical.forEach(q => { csvContent += [...common, "Technical", escapeCsv(q)].join(",") + "\r\n"; });
            candidate.interviewQuestions.behavioral.forEach(q => { csvContent += [...common, "Behavioral", escapeCsv(q)].join(",") + "\r\n"; });
            candidate.interviewQuestions.cultural.forEach(q => { csvContent += [...common, "Cultural", escapeCsv(q)].join(",") + "\r\n"; });
            candidate.verificationChecklist.forEach(c => { csvContent += [...common, "Checklist", escapeCsv(c)].join(",") + "\r\n"; });
        });

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "HR-GPT_Final_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <Loader message="포트폴리오를 반영하여 최종 후보자를 선별 중입니다..." />;
    
    // --- FINAL REPORT VIEW (STEP 2) ---
    if (finalReport) {
        return (
            <div className="space-y-6">
                 <section className="p-6 bg-slate-800 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-teal-300 mb-2"># 최종 후보자 리포트 (상위 3명)</h2>
                    <p className="text-slate-400 mb-6">포트폴리오 등 추가 자료를 종합하여 선별된 최종 후보자입니다. 각 후보자를 클릭하여 상세 면접 질문을 확인하세요.</p>
                     
                    {finalReport.map((candidate, index) => (
                        <div key={candidate.candidateId} className="mb-4">
                            <button onClick={() => setActiveCandidate(activeCandidate === candidate.candidateId ? null : candidate.candidateId)} className="w-full p-4 bg-slate-700 rounded-t-lg flex justify-between items-center hover:bg-slate-600">
                                <div className='text-left'>
                                    <span className={`font-bold text-lg ${getScoreColor(candidate.finalScore)} get-rating-color`}>{`#${index + 1} `}</span>
                                    <span className='font-semibold text-slate-200'>{candidate.fileName}</span>
                                    <p className="text-sm text-slate-400 mt-1">{candidate.finalSummary}</p>
                                </div>
                                <div className='text-right'>
                                    <p className={`text-2xl font-bold ${getScoreColor(candidate.finalScore)} get-rating-color`}>{candidate.finalScore}점</p>
                                </div>
                            </button>
                            <div style={{ display: activeCandidate === candidate.candidateId ? 'block' : 'none' }} className="p-4 bg-slate-700/50 space-y-4 rounded-b-lg">
                                <div>
                                    <h4 className="font-bold text-teal-300 mb-2">기술 역량 질문</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                        {candidate.interviewQuestions.technical.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-teal-300 mb-2">경험/행동 기반 질문</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                        {candidate.interviewQuestions.behavioral.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-teal-300 mb-2">문화 적합성 질문</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                        {candidate.interviewQuestions.cultural.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                                <div className="pt-2 border-t border-slate-600">
                                    <h4 className="font-bold text-yellow-400 mb-2">검증 체크리스트</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                        {candidate.verificationChecklist.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                 </section>

                <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={handleDownloadCsv} className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700">CSV로 다운로드</button>
                    <button onClick={onReset} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">새로운 분석 시작하기</button>
                </div>
            </div>
        )
    }

    // --- INITIAL REPORT VIEW (STEP 1) ---
    return (
        <div className="space-y-6">
            <section className="p-6 bg-slate-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-teal-300 mb-2"># 1차 스크리닝 결과 (상위 5명)</h2>
                <p className="text-slate-400 mb-6">JD와의 적합도를 기준으로 선별된 상위 후보자입니다. 각 후보자의 포트폴리오를 추가하면 더 정확한 최종 후보자를 추천받을 수 있습니다.</p>
                <div className="space-y-4">
                    {initialReport.map((candidate, index) => (
                        <div key={candidate.candidateId} className="p-4 bg-slate-700/50 rounded-lg">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-200">
                                        <span className={`font-bold text-lg ${getScoreColor(candidate.score)} get-rating-color`}>{`#${index + 1} `}</span>
                                        {candidate.fileName}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">{candidate.summary}</p>
                                    <div className="text-xs mt-3 flex gap-4">
                                        <div>
                                            <h4 className="font-semibold text-green-400 mb-1 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" />Green Flags</h4>
                                            <ul className="list-disc list-inside pl-2">
                                                {candidate.greenFlags.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-red-400 mb-1 flex items-center gap-1"><ExclamationCircleIcon className="w-4 h-4" />Red Flags</h4>
                                            <ul className="list-disc list-inside pl-2">
                                                {candidate.redFlags.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-slate-400 text-sm">적합도</p>
                                    <p className={`text-3xl font-bold ${getScoreColor(candidate.score)} get-rating-color`}>{candidate.score}점</p>
                                </div>
                            </div>
                            <PortfolioUploader candidate={candidate} file={portfolioFiles.get(candidate.candidateId) || null} setFile={(file) => handleSetPortfolioFile(candidate.candidateId, file)} />
                        </div>
                    ))}
                </div>
            </section>
            
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button onClick={handleFinalAnalysis} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">
                    최종 후보 3명 분석하기 {portfolioFiles.size > 0 && `(포트폴리오 ${portfolioFiles.size}개 포함)`}
                </button>
                 <button onClick={onReset} className="w-full sm:w-auto bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-slate-700 text-sm">
                    처음으로
                </button>
            </div>
        </div>
    );
};

export default BulkReportDisplay;