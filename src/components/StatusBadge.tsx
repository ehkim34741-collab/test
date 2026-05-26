interface StatusBadgeProps {
  status: string;
  type?: 'project' | 'task' | 'risk' | 'priority';
}

const projectStatusConfig: Record<string, { label: string; className: string }> = {
  'on-track': { label: '정상', className: 'bg-green-100 text-green-700' },
  'at-risk': { label: '위험', className: 'bg-amber-100 text-amber-700' },
  'delayed': { label: '지연', className: 'bg-red-100 text-red-700' },
  'completed': { label: '완료', className: 'bg-blue-100 text-blue-700' },
};

const taskStatusConfig: Record<string, { label: string; className: string }> = {
  'todo': { label: '예정', className: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: '진행중', className: 'bg-blue-100 text-blue-700' },
  'review': { label: '검토중', className: 'bg-purple-100 text-purple-700' },
  'done': { label: '완료', className: 'bg-green-100 text-green-700' },
};

const riskStatusConfig: Record<string, { label: string; className: string }> = {
  'open': { label: '진행중', className: 'bg-red-100 text-red-700' },
  'mitigated': { label: '완화', className: 'bg-amber-100 text-amber-700' },
  'closed': { label: '종료', className: 'bg-gray-100 text-gray-600' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  'low': { label: '낮음', className: 'bg-gray-100 text-gray-600' },
  'medium': { label: '보통', className: 'bg-blue-100 text-blue-700' },
  'high': { label: '높음', className: 'bg-orange-100 text-orange-700' },
  'critical': { label: '긴급', className: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status, type = 'project' }: StatusBadgeProps) {
  const configMap = {
    project: projectStatusConfig,
    task: taskStatusConfig,
    risk: riskStatusConfig,
    priority: priorityConfig,
  };

  const config = configMap[type][status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
