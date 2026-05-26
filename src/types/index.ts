export interface Project {
  id: string;
  name: string;
  code: string;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  team: string[];
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  description: string;
  tags: string[];
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  department: string;
  allocation: number;
  projects: string[];
  skills: string[];
  email: string;
  phone: string;
  joinDate: string;
}

export interface Risk {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'open' | 'mitigated' | 'closed';
  mitigation: string;
  owner: string;
  createdDate: string;
  reviewDate: string;
}

export interface Activity {
  id: string;
  type: 'project' | 'task' | 'risk' | 'resource';
  action: string;
  target: string;
  user: string;
  timestamp: string;
}

export interface KPI {
  label: string;
  value: number | string;
  change: number;
  unit?: string;
}
