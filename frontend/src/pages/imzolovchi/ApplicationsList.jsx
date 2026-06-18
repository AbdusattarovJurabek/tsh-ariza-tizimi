import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imzolovchiAPI } from '../../services/api';

export default function ImzolovchiApplicationsList() {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    imzolovchiAPI.getApplications({ status, page, limit: 20 }).then(r => {
      setApps(r.data.data || []);
      setTotal(r.data.total || 0);
    });
  }, [status, page]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Hujjatlar ro'yxati</h1>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
        className="border rounded-lg px-3 py-2 text-sm">
        <option value="">Barchasi</option>
        <option value="SENT_TO_SIGNER">Imzo kutilmoqda</option>
        <option value="SIGNED">Imzolandi</option>
      </select>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Ariza raqami</th>
              <th className="px-4 py-3 text-left">Subyekt</th>
              <th className="px-4 py-3 text-left">Rahbar</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Yuborilgan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {apps.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Hujjatlar yo'q</td></tr>
            ) : apps.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/imzolovchi/applications/${app.id}`} className="text-primary-600 hover:underline font-medium">
                    {app.app_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{app.subject_name || '—'}</td>
                <td className="px-4 py-3">{app.leader_full_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === 'SIGNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                    {app.status === 'SIGNED' ? 'Imzolandi' : 'Imzo kutilmoqda'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {app.sent_to_signer_at ? new Date(app.sent_to_signer_at).toLocaleDateString('uz-UZ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
          <span>Jami: {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">←</button>
            <span className="px-3 py-1">{page}</span>
            <button disabled={apps.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
