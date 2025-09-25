import React, { useRef, useState } from 'react';

interface DataInputFormProps {
  title: string;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  portfolioFile: File | null;
  setPortfolioFile: (file: File | null) => void;
  jdText: string;
  setJdText: (text: string) => void;
  jdFile: File | null;
  setJdFile: (file: File | null) => void;
  onSubmit: () => void;
  error: string | null;
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


const FileInput: React.FC<{
    id: string;
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    accept: string;
    uploadHelpText: string;
    required?: boolean;
}> = ({ id, label, file, setFile, accept, uploadHelpText, required }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
                {label} {required && '(필수)'}
            </label>
            {file ? (
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-md border border-slate-600">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-slate-200" title={file.name}>{file.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="text-sm text-red-400 hover:text-red-300 font-medium flex-shrink-0 ml-2">
                        제거
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 bg-slate-700 rounded-md border-2 border-dashed border-slate-600 hover:bg-slate-600/50 hover:border-blue-500 transition cursor-pointer"
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
                    />
                </div>
            )}
        </div>
    );
}


const DataInputForm: React.FC<DataInputFormProps> = ({
  title,
  resumeFile,
  setResumeFile,
  portfolioFile,
  setPortfolioFile,
  jdText,
  setJdText,
  jdFile,
  setJdFile,
  onSubmit,
  error,
}) => {
  const [jdInputMode, setJdInputMode] = useState<'text' | 'file'>('text');

  const isSubmitDisabled = !resumeFile || (!jdText && !jdFile);

  const handleJdModeChange = (mode: 'text' | 'file') => {
      setJdInputMode(mode);
      if (mode === 'text') {
          setJdFile(null);
      } else {
          setJdText('');
      }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-teal-300 mb-4">{title}</h2>
        <p className="text-slate-400 mb-6">
          지원자의 이력서, 포트폴리오와 채용 공고(JD)를 아래에 입력해 주세요.
        </p>

        <div className="space-y-4">
          <FileInput id="resume" label="지원자 이력서 PDF" file={resumeFile} setFile={setResumeFile} accept=".pdf" uploadHelpText="PDF 파일을 드래그하거나 클릭하여 업로드" required />
          <FileInput id="portfolio" label="지원자 포트폴리오 PDF (선택)" file={portfolioFile} setFile={setPortfolioFile} accept=".pdf" uploadHelpText="PDF 파일을 드래그하거나 클릭하여 업로드" />
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                채용 공고 (JD) (필수)
            </label>
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
                <textarea
                  id="jd"
                  rows={8}
                  className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="채용 공고 내용을 여기에 붙여넣으세요."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
            ) : (
                <FileInput id="jd-file" label="" file={jdFile} setFile={setJdFile} accept=".pdf,.png,.jpg,.jpeg" uploadHelpText="JD 파일(PDF, PNG, JPG)을 업로드하세요" />
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-red-400 text-center">{error}</p>}
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
      >
        인재 분석 리포트 생성하기
      </button>
    </div>
  );
};

export default DataInputForm;