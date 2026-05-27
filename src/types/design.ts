export type DesignStatus = '작성중' | '검토중' | '승인완료' | '반려';
export type CustomerReviewStatus = '검토전' | '검토중' | '승인' | '반려';
export type DesignType = '요구사항 정의서' | '화면 설계서' | '데이터베이스 설계서';
export type DesignPhase = '분석' | '설계' | '구현' | '테스트' | '이행';

export interface DesignVersion {
  version: string;       // v1.0, v1.1
  fileName: string;
  fileSize: string;
  fileData?: string;     // base64
  uploadedAt: string;
  uploadedBy: string;
  note: string;
}

export interface Design {
  id: string;
  name: string;
  type: DesignType;
  projectId: string;
  projectName: string;
  phase: DesignPhase;
  manager: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd?: string;
  status: DesignStatus;
  customerReviewer: string;
  customerReviewStatus: CustomerReviewStatus;
  relatedRequirementIds: string[];
  currentVersion: string;
  versions: DesignVersion[];
  createdAt: string;
  updatedAt: string;
}
