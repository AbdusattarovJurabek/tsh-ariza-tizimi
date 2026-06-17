import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasdiqlovchiAPI } from '../../services/api';

const STATUS_COLORS = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  HAS_ISSUES: 'bg-orange-100 text-orange-800',
  SENT_TO_SIGNER: 'bg-purple-100 text-purple-800',
  SIGNED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};
const STATUS_LABELS = {
  SUBMITTED: 'Yuborilgan', UNDER_REVIEW: "Ko'rib chiqilmoqda",
  APPROVED: 'Tasdiqlandi', HAS_ISSUES: 'Kamchilik bor',
  SENT_TO_SIGNER: 'Imzolovchida', SIGNED: 'Imzolandi', REJECTED: 'Rad etildi',
};

export default function TasdiqlovchiDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    tasdiqlovchiAPI.getStatistics().then(r => setStats(r.data));
    tasdiqlovchiAPI.getApplications({ limit: 5 }).then(r => setRecent(r.data.data));
  }, []);

  const cards = [
    { label: 'Yangi arizalar', key: 'SUBMITTED', color: 'border-blue-500 bg-blue-50', icon: '📥' },
    { label: "Ko'rib chiqilmoqda", key: 'UNDER_REVIEW', color: 'border-yellow-500 bg-yellow-50', icon: '🔍' },
    { label: 'Tasdiqlandi', key: 'APPROVED', color: 'border-green-500 bg-green-50', icon: '✅' },
    { label: 'Imzolovchida', key: 'SENT_TO_SIGNER', color: 'border-purple-500 bg-purple-50', icon: '✍️' },
    { label: 'Imzolandi', key: 'SIGNED', color: 'border-emerald-500 bg-emerald-50', icon: '🏆' },
    { label: 'Kamchilik bor', key: 'HAS_ISSUES', color: 'border-orange-500 bg-orange-50', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tasdiqlovchi paneli</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.key} className={`border-l-4 rounded-lg p-4 ${c.color}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold">{stats?.by_status?.[c.key] || 0}</div>
            <div className="text-xs text-gray-600">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">So'nggi arizalar</h2>
          <Link to="/tasdiqlovchi/applications" className="text-sm text-primary-600 hover:underline">Barchasi →</Link>
        </div>
        <div className="divide-y">
          {recent.map(app => (
            <Link key={app.id} to={`/tasdiqlovchi/applications/${app.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div>
                <div className="font-medium text-sm">{app.app_number}</div>
                <div className="text-xs text-gray-500">{app.subject_name || '—'}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status] || app.status}
              </span>
            </Link>
          ))}
          {recent.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">Arizalar yo'q</div>}
        </div>
      </div>
    </div>
  );
}
