import React, { useRef, useState } from 'react';
import { AppPhase } from '../types';
import { generateInitialBulkReport } from '../services/geminiService';

interface BulkDataInputFormProps {
    setAppPhase: (phase: AppPhase) => void;
    setError: (error: string | null) => void;
    setLoadingMessage: (message: string) => void;
    setInitialBulkReport: (report: any) => void;
    error: string | null;
    jdText: string;
    setJdText: (text: string) => void;
    jdFile: File | null;
    setJdFile: (file: File | null) => void;
    resumeFiles: File[];
    setResumeFiles: (files: File[]) => void;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 18A5.25 5.25 0 009 20.25h6a5.25 5.25 0 005.25-5.25c0-2.01-1.125-3.75-2.625-4.583A5.25 5.25 0 0012 4.503a5.25 5.25 0 00-5.25 5.25c0 .351.042.693.125 1.022A5.25 5.25 0 003.75 18z" />
    </svg>
);

const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const MultiFileInput: React.FC<{
    id: string;
    label: string;
    files: File[];
    setFiles: (files: File[]) => void;
    accept: string;
    uploadHelpText: string;
    required?: boolean;
}> = ({ id, label, files, setFiles, accept, uploadHelpText, required }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            const newFiles = Array.from(selectedFiles);
            const totalFiles = files.length + newFiles.length;

            if (totalFiles > 10) {
                const remainingSlots = 10 - files.length;
                const filesToAdd = remainingSlots > 0 ? newFiles.slice(0, remainingSlots) : [];
                if (filesToAdd.length > 0) {
                     setFiles([...files, ...filesToAdd]);
                }
                setUploadError('최대 10개의 이력서만 업로드할 수 있습니다. 10개까지만 추가되었습니다.');
            } else {
                setFiles([...files, ...newFiles]);
            }
        }
        if(e.target) {
            e.target.value = '';
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setUploadError(null);
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const isLimitReached = files.length >= 10;

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                {label} {required && `(필수, ${files.length}/10개)`}
            </label>
            <div
                onClick={() => {
                    if (isLimitReached) {
                        setUploadError('최대 10개의 이력서만 업로드할 수 있습니다.');
                        return;
                    }
                    inputRef.current?.click();
                }}
                className={`flex flex-col items-center justify-center p-6 bg-slate-700 rounded-md border-2 border-dashed border-slate-600 transition ${
                    isLimitReached 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-slate-600/50 hover:border-blue-500 cursor-pointer'
                }`}
            >
                <UploadIcon className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-sm text-slate-400">{uploadHelpText}</span>
                <input
                    type="file"
                    id={id}
                    ref={inputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                    multiple
                    disabled={isLimitReached}
                />
            </div>
            {uploadError && <p className="text-sm text-red-400 mt-2">{uploadError}</p>}
            {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded-md border border-slate-600">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                <span className="truncate text-slate-200 text-sm" title={file.name}>{file.name}</span>
                            </div>
                            <button onClick={() => handleRemoveFile(index)} className="text-sm text-red-400 hover:text-red-300 font-medium flex-shrink-0 ml-2">
                                제거
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const BulkDataInputForm: React.FC<BulkDataInputFormProps> = (props) => {
    const {
        setAppPhase, setError, setLoadingMessage, setInitialBulkReport,
        error, jdText, setJdText, jdFile, setJdFile, resumeFiles, setResumeFiles
    } = props;
    
    const [jdInputMode, setJdInputMode] = useState<'text' | 'file'>('text');

    const isSubmitDisabled = resumeFiles.length === 0 || (!jdText && !jdFile);

    const handleJdModeChange = (mode: 'text' | 'file') => {
        setJdInputMode(mode);
        if (mode === 'text') {
            setJdFile(null);
        } else {
            setJdText('');
        }
    };

    const handleSubmit = async () => {
        if (resumeFiles.length < 2) {
            setError('여러 이력서 동시 분석을 위해서는 최소 2개 이상의 이력서 파일이 필요합니다.');
            return;
        }
        setError(null);
        setLoadingMessage('여러 이력서를 JD와 비교 분석 중입니다...');
        setAppPhase(AppPhase.LOADING);
        try {
            const result = await generateInitialBulkReport(resumeFiles, jdText, jdFile);
            setInitialBulkReport(result);
            setAppPhase(AppPhase.REPORT_BULK);
        } catch(e) {
            console.error(e);
            setError('리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setAppPhase(AppPhase.BULK_INPUT);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-teal-300 mb-4">1. 다중 분석 정보 입력</h2>
                <p className="text-slate-400 mb-6">
                    분석할 모든 이력서와 채용 공고(JD)를 입력해주세요. AI가 JD를 기준으로 이력서를 평가하여 상위 5명을 선별합니다.
                </p>

                <div className="space-y-4">
                    <MultiFileInput id="resume-bulk" label="지원자 이력서 PDF" files={resumeFiles} setFiles={setResumeFiles} accept=".pdf" uploadHelpText="최대 10개 PDF 파일을 드래그하거나 클릭하여 업로드" required />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">채용 공고 (JD) (필수)</label>
                        <div className="flex mb-2 rounded-md p-1 bg-slate-700">
                            <button
                                onClick={() => handleJdModeChange('text')}
                                className={`flex-1 text-sm font-semibold py-2 rounded ${jdInputMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600/50' } transition-colors`}
                            >
                                텍스트 붙여넣기
                            </button>
                            <button
                                onClick={() => handleJdModeChange('file')}
                                className={`flex-1 text-sm font-semibold py-2 rounded ${jdInputMode === 'file' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600/50' } transition-colors`}
                            >
                                파일 업로드
                            </button>
                        </div>
                        {jdInputMode === 'text' ? (
                            <textarea id="jd" rows={8} className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-blue-500" placeholder="채용 공고 내용을 여기에 붙여넣으세요." value={jdText} onChange={(e) => setJdText(e.target.value)} />
                        ) : (
                            <div
                                onClick={() => document.getElementById('jd-file-input')?.click()}
                                className="flex flex-col items-center justify-center p-6 bg-slate-700 rounded-md border-2 border-dashed border-slate-600 hover:bg-slate-600/50 hover:border-blue-500 transition cursor-pointer"
                            >
                                <UploadIcon className="w-10 h-10 text-slate-500 mb-2" />
                                <span className="text-sm text-slate-400">JD 파일(PDF, PNG, JPG)을 업로드하세요</span>
                                <input type="file" id="jd-file-input" onChange={(e) => setJdFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg" className="hidden" />
                            </div>
                        )}
                        {jdFile && (
                             <div className="mt-3 flex items-center justify-between p-2 bg-slate-700 rounded-md border border-slate-600">
                                <div className="flex items-center gap-2 overflow-hidden">
                                   <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                   <span className="truncate text-slate-200 text-sm" title={jdFile.name}>{jdFile.name}</span>
                               </div>
                               <button onClick={() => setJdFile(null)} className="text-sm text-red-400 hover:text-red-300 font-medium flex-shrink-0 ml-2">
                                   제거
                               </button>
                           </div>
                        )}
                    </div>
                </div>
            </div>
            {error && <p className="text-red-400 text-center">{error}</p>}
            <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                상위 5명 후보자 분석하기
            </button>
        </div>
    );
};

export default BulkDataInputForm;