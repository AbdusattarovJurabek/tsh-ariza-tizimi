import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasdiqlovchiAPI } from '../../services/api';

const STATUS_COLORS = {
  SUBMITTED: 'bg-blue-100 text-blue-800', UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800', HAS_ISSUES: 'bg-orange-100 text-orange-800',
  SENT_TO_SIGNER: 'bg-purple-100 text-purple-800', SIGNED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};
const STATUS_LABELS = {
  SUBMITTED: 'Yuborilgan', UNDER_REVIEW: "Ko'rib chiqilmoqda", APPROVED: 'Tasdiqlandi',
  HAS_ISSUES: 'Kamchilik bor', SENT_TO_SIGNER: 'Imzolovchida', SIGNED: 'Imzolandi', REJECTED: 'Rad etildi',
};

export default function TasdiqlovchiApplicationsList() {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await tasdiqlovchiAPI.getApplications({ search, status, page, limit: 20 });
      setApps(r.data.data);
      setTotal(r.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status, page]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Arizalar ro'yxati</h1>

      <div className="flex gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Qidirish..." className="border rounded-lg px-3 py-2 text-sm flex-1" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Barcha statuslar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Ariza raqami</th>
              <th className="px-4 py-3 text-left">Subyekt</th>
              <th className="px-4 py-3 text-left">Rahbar</th>
              <th className="px-4 py-3 text-left">Meva turi</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Yuklanmoqda...</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Arizalar yo'q</td></tr>
            ) : apps.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/tasdiqlovchi/applications/${app.id}`} className="text-primary-600 hover:underline font-medium">
                    {app.app_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{app.subject_name || '—'}</td>
                <td className="px-4 py-3">{app.leader_full_name || '—'}</td>
                <td className="px-4 py-3">{app.fruit_type || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status] || app.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('uz-UZ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
          <span>Jami: {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">←</button>
            <span className="px-3 py-1">{page}</span>
            <button disabled={apps.length < 20} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
