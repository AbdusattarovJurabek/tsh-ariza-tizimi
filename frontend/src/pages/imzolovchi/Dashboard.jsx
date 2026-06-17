import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imzolovchiAPI } from '../../services/api';

export default function ImzolovchiDashboard() {
  const [apps, setApps] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, signed: 0 });

  useEffect(() => {
    imzolovchiAPI.getApplications({ limit: 10 }).then(r => {
      const data = r.data.data;
      setApps(data);
      setCounts({
        pending: data.filter(a => a.status === 'SENT_TO_SIGNER').length,
        signed: data.filter(a => a.status === 'SIGNED').length,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Imzolovchi paneli</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-5">
          <div className="text-3xl font-bold text-purple-700">{counts.pending}</div>
          <div className="text-sm text-gray-600 mt-1">✍️ Imzo kutilmoqda</div>
        </div>
        <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-lg p-5">
          <div className="text-3xl font-bold text-emerald-700">{counts.signed}</div>
          <div className="text-sm text-gray-600 mt-1">✅ Imzolandi</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Imzo kutilayotgan hujjatlar</h2>
          <Link to="/imzolovchi/applications" className="text-sm text-primary-600 hover:underline">Barchasi →</Link>
        </div>
        <div className="divide-y">
          {apps.filter(a => a.status === 'SENT_TO_SIGNER').map(app => (
            <Link key={app.id} to={`/imzolovchi/applications/${app.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div>
                <div className="font-medium text-sm">{app.app_number}</div>
                <div className="text-xs text-gray-500">{app.subject_name || '—'} · {app.leader_full_name || '—'}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                Imzo kutilmoqda
              </span>
            </Link>
          ))}
          {apps.filter(a => a.status === 'SENT_TO_SIGNER').length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">Imzo kutilayotgan hujjat yo'q</div>
          )}
        </div>
      </div>
    </div>
  );
}
