import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle, AlertCircle, Clock, Eye, Trash2 } from 'lucide-react';
import { applicationAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DeleteApplicationModal from '../components/DeleteApplicationModal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function UserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  useEffect(() => {
    applicationAPI.getAll()
      .then(res => setApplications(res.data))
      .catch(() => toast.error('Arizalarni yuklashda xato'))
      .finally(() => setLoading(false));
  }, []);

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const handleDelete = async (application) => {
    setDeletingId(application.id);
    try {
      await applicationAPI.delete(application.id);
      setApplications(current => current.filter(item => item.id !== application.id));
      toast.success("Ariza o'chirildi");
      setApplicationToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Arizani o'chirishda xato");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Xush kelibsiz, {user?.full_name}! 👋</h2>
        <p className="text-primary-100 text-sm">Bog' tashkil etish arizangizni yaratish yoki holati bilan tanishishingiz mumkin.</p>
        <Link
          to="/applications/new"
          className="inline-flex items-center gap-2 mt-4 bg-white text-primary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors text-sm"
        >
          <PlusCircle size={16} />
          Yangi ariza yaratish
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Jami arizalar" value={applications.length} color="bg-blue-500" />
        <StatCard icon={Clock} label="Yuborilgan" value={(counts.SUBMITTED || 0) + (counts.UNDER_REVIEW || 0)} color="bg-yellow-500" />
        <StatCard icon={CheckCircle} label="Tasdiqlangan" value={counts.APPROVED || 0} color="bg-green-500" />
        <StatCard icon={AlertCircle} label="Kamchilik" value={(counts.HAS_ISSUES || 0) + (counts.REJECTED || 0)} color="bg-red-500" />
      </div>

      {/* Applications list */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800">Mening arizalarim</h3>
          <Link to="/applications/new" className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
            <PlusCircle size={15} /> Yangi ariza
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Hali ariza yo'q</p>
            <p className="text-gray-400 text-sm mt-1">Birinchi arizangizni yarating</p>
            <Link to="/applications/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              <PlusCircle size={16} /> Ariza yaratish
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Ariza raqami</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Subyekt nomi</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Sana</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{app.app_number}</code>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-700">{app.subject_name || <span className="text-gray-400 italic">Kiritilmagan</span>}</td>
                    <td className="py-3 px-3"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <Link to={`/applications/${app.id}`} className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-xs font-medium">
                          <Eye size={14} /> Ko'rish
                        </Link>
                        {['DRAFT', 'HAS_ISSUES'].includes(app.status) && (
                          <Link to={`/applications/${app.id}/edit`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            Tahrirlash
                          </Link>
                        )}
                        {['DRAFT', 'HAS_ISSUES', 'REJECTED'].includes(app.status) && (
                          <button
                            type="button"
                            onClick={() => setApplicationToDelete(app)}
                            disabled={deletingId === app.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                            title="Arizani o'chirish"
                          >
                            <Trash2 size={14} />
                            {deletingId === app.id ? "O'chirilmoqda..." : "O'chirish"}
                          </button>
                        )}
                        {!['DRAFT'].includes(app.status) && (
                          <a href={`/track?code=${app.app_number}`} target="_blank" rel="noreferrer"
                            className="text-gray-400 hover:text-gray-600 text-xs font-medium" title="Ochiq tracking havolasi">
                            🔗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteApplicationModal
        application={applicationToDelete}
        open={Boolean(applicationToDelete)}
        deleting={deletingId === applicationToDelete?.id}
        onClose={() => setApplicationToDelete(null)}
        onConfirm={() => handleDelete(applicationToDelete)}
      />
    </div>
  );
}
