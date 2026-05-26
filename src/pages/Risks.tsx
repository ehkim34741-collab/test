import { useState } from 'react';
import { Search, Plus, AlertTriangle, ShieldCheck, Archive } from 'lucide-react';
import { risks } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import type { Risk } from '../types';

type Level = Risk['probability'];
const levelScore: Record<Level, number> = { low: 1, medium: 2, high: 3 };
const levelLabel: Record<Level, string> = { low: '낮음', medium: '보통', high: '높음' };
const levelColor: Record<Level, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

function riskLevel(probability: Level, impact: Level): { label: string; color: string } {
  const score = levelScore[probability] * levelScore[impact];
  if (score >= 6) return { label: '매우 높음', color: 'bg-red-500' };
  if (score >= 4) return { label: '높음', color: 'bg-orange-500' };
  if (score >= 2) return { label: '보통', color: 'bg-amber-500' };
  return { label: '낮음', color: 'bg-green-500' };
}

const matrixCells = [
  { prob: 'high' as Level, impacts: ['high', 'high', 'high'] as Level[] },
  { prob: 'medium' as Level, impacts: ['medium', 'high', 'high'] as Level[] },
  { prob: 'low' as Level, impacts: ['low', 'medium', 'high'] as Level[] },
];

export default function Risks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Risk['status']>('all');

  const filtered = risks.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch = r.title.includes(search) || r.projectName.includes(search) || r.owner.includes(search);
    return matchStatus && matchSearch;
  });

  const openCount = risks.filter(r => r.status === 'open').length;
  const mitigatedCount = risks.filter(r => r.status === 'mitigated').length;
  const closedCount = risks.filter(r => r.status === 'closed').length;
  const highRiskCount = risks.filter(r => r.probability === 'high' && r.impact === 'high').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리스크 관리</h1>
          <p className="text-gray-500 mt-1">총 {risks.length}개 리스크 등록</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          리스크 등록
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '진행중', value: openCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '완화', value: mitigatedCount, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '종료', value: closedCount, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: '심각 리스크', value: highRiskCount, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={card.color} />
                <span className="text-sm text-gray-600">{card.label}</span>
              </div>
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Risk Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">리스크 매트릭스</h2>
          <div className="relative">
            <div className="text-xs text-gray-500 text-center mb-2">← 영향도 →</div>
            <div className="grid grid-cols-4 gap-1">
              <div /> {/* empty corner */}
              {['낮음', '보통', '높음'].map(l => (
                <div key={l} className="text-center text-xs text-gray-500 py-1">{l}</div>
              ))}
              {matrixCells.map(({ prob, impacts }) => (
                <>
                  <div key={prob} className="text-xs text-gray-500 flex items-center justify-end pr-2">
                    {levelLabel[prob]}
                  </div>
                  {impacts.map((imp, i) => {
                    const rl = riskLevel(prob, imp);
                    const count = risks.filter(r => r.probability === prob && r.impact === imp && r.status === 'open').length;
                    return (
                      <div
                        key={i}
                        className={`${rl.color} rounded-lg h-14 flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center mt-3">↑ 발생 가능성 ↑</div>
          </div>
        </div>

        {/* Distribution by Project */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">프로젝트별 리스크 현황</h2>
          <div className="space-y-3">
            {Array.from(new Set(risks.map(r => r.projectName))).map(projectName => {
              const projectRisks = risks.filter(r => r.projectName === projectName);
              const openRisks = projectRisks.filter(r => r.status === 'open').length;
              return (
                <div key={projectName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-3">{projectName}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                      <span className="text-red-600 font-medium">{openRisks}개 진행중</span>
                      <span>총 {projectRisks.length}개</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {projectRisks.map(r => {
                      const rl = riskLevel(r.probability, r.impact);
                      return (
                        <div
                          key={r.id}
                          className={`h-2 flex-1 rounded-full ${
                            r.status === 'closed' ? 'bg-gray-200' :
                            r.status === 'mitigated' ? 'bg-amber-300' :
                            rl.color
                          }`}
                          title={r.title}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="리스크명, 프로젝트, 담당자 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {([['all', '전체'], ['open', '진행중'], ['mitigated', '완화'], ['closed', '종료']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">리스크</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">프로젝트</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">발생 가능성</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">영향도</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">위험 수준</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">담당자</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">검토일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(risk => {
                const rl = riskLevel(risk.probability, risk.impact);
                return (
                  <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{risk.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[180px]">
                      <span className="truncate block">{risk.projectName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor[risk.probability]}`}>
                        {levelLabel[risk.probability]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor[risk.impact]}`}>
                        {levelLabel[risk.impact]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${rl.color}`}>
                        {rl.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={risk.status} type="risk" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{risk.owner}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{risk.reviewDate.replace(/-/g, '.')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
