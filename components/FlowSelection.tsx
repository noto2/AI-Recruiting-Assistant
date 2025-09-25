import React from 'react';

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM12 15.75a9.094 9.094 0 01-3.742-.479 3 3 0 014.682-2.72M9.11 3.004a11.97 11.97 0 00-5.614.658 2.25 2.25 0 00-1.28 2.243V18a2.25 2.25 0 001.28 2.243c1.897.53 3.741.658 5.614.658 1.872 0 3.717-.128 5.614-.658a2.25 2.25 0 001.28-2.243V5.905a2.25 2.25 0 00-1.28-2.243A11.97 11.97 0 0014.89 3.004H9.11z" />
    </svg>
);

interface FlowSelectionProps {
    onSelect: (flow: 'individual' | 'bulk') => void;
}

const FlowSelection: React.FC<FlowSelectionProps> = ({ onSelect }) => {
    return (
        <div className="p-6 bg-slate-800 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-teal-300 mb-2">어떤 작업을 시작할까요?</h2>
            <p className="text-slate-400 mb-8">수행할 분석 유형을 선택해주세요.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onClick={() => onSelect('individual')}
                    className="p-8 bg-slate-700 rounded-lg border border-slate-600 hover:border-blue-500 hover:bg-slate-600/50 transition-all duration-300 cursor-pointer flex flex-col items-center"
                >
                    <UserIcon className="w-12 h-12 text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-100 mb-2">개별 이력서 분석</h3>
                    <p className="text-slate-400 text-sm">한 명의 지원자 서류를 심층 분석하여 리포트를 생성합니다.</p>
                </div>
                <div
                    onClick={() => onSelect('bulk')}
                    className="p-8 bg-slate-700 rounded-lg border border-slate-600 hover:border-teal-500 hover:bg-slate-600/50 transition-all duration-300 cursor-pointer flex flex-col items-center"
                >
                    <UsersIcon className="w-12 h-12 text-teal-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-100 mb-2">여러 이력서 동시 분석</h3>
                    <p className="text-slate-400 text-sm">여러 이력서를 JD와 비교하여 상위 후보자를 빠르게 선별합니다.</p>
                </div>
            </div>
        </div>
    );
};

export default FlowSelection;
