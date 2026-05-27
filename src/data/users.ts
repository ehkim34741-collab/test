export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'PM' | '기획자' | '개발자' | '테스터' | '운영' | '분석가';
  email: string;
}

// 사용자 계정 관리 파일 - 이 파일에서 직접 추가/수정하세요
export const users: User[] = [
  { id: 'U001', username: 'pm',        password: 'pm1234',   displayName: '김PM',   role: 'PM',    email: 'pm@project.com' },
  { id: 'U002', username: 'planner',   password: 'plan1234', displayName: '이기획', role: '기획자', email: 'planner@project.com' },
  { id: 'U003', username: 'developer', password: 'dev1234',  displayName: '박개발', role: '개발자', email: 'dev@project.com' },
  { id: 'U004', username: 'tester',    password: 'test1234', displayName: '최테스터', role: '테스터', email: 'tester@project.com' },
  { id: 'U005', username: 'analyst',   password: 'ana1234',  displayName: '정분석', role: '분석가', email: 'analyst@project.com' },
];
