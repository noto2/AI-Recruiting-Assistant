import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-lg shadow-lg">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-lg text-slate-300 text-center">
        {message}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        최상의 분석을 위해 최대 1~2분 정도 소요될 수 있습니다.
      </p>
    </div>
  );
};

export default Loader;