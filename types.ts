export enum AppPhase {
  FLOW_SELECTION,
  INDIVIDUAL_INPUT,
  BULK_INPUT,
  LOADING,
  REPORT_INDIVIDUAL,
  REPORT_BULK,
}

export interface InitialCandidate {
  candidateId: number;
  fileName: string;
  score: number;
  summary: string;
  greenFlags: string[];
  redFlags: string[];
}

export interface FinalCandidate {
  candidateId: number;
  fileName: string;
  finalScore: number;
  finalSummary: string;
  interviewQuestions: {
    technical: string[];
    behavioral: string[];
    cultural: string[];
  };
  verificationChecklist: string[];
}
