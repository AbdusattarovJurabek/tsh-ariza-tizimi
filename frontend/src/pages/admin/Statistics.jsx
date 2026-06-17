import React, { useEffect, useState } from 'react';
import { adminAPI, downloadBlob } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Leaf, DollarSign, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const STATUS_NAMES = { DRAFT: 'Qoralama', SUBMITTED: 'Yuborilgan', UNDER_REVIEW: "Ko'rib chiqilmoqda", HAS_ISSUES: 'Kamchilik', APPROVED: 'Tasdiqlandi', REJECTED: 'Rad etildi' };

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminAPI.getStatistics()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Yuklab olinmadi'))
      .finally(() => setLoading(false));
  }, []);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await adminAPI.exportAllExcel();
      downloadBlob(res.data, 'statistika-arizalar.xlsx');
      toast.success('Yuklab olindi');
    } catch { toast.error('Xato'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!stats) return null;

  const statusData = Object.entries(stats.by_status).map(([key, value]) => ({ name: STATUS_NAMES[key], value })).filter(d => d.value > 0);
  const fruitData = stats.fruit_stats?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleExportExcel} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> {exporting ? 'Yuklanmoqda...' : 'Excel yuklab olish'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <FileText size={24} className="text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">Jami arizalar</p>
        </div>
        <div className="card text-center">
          <Leaf size={24} className="text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">{(stats.total_garden_area || 0).toFixed(1)}</p>
          <p className="text-sm text-gray-500">Jami bog' maydoni (ga)</p>
        </div>
        <div className="card text-center">
          <DollarSign size={24} className="text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">{((stats.total_project_amount || 0) / 1e9).toFixed(2)}</p>
          <p className="text-sm text-gray-500">Loyiha summasi (mlrd so'm)</p>
        </div>
        <div className="card text-center">
          <Users size={24} className="text-purple-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-800">{(stats.total_permanent_jobs || 0) + (stats.total_seasonal_jobs || 0)}</p>
          <p className="text-sm text-gray-500">Jami ish o'rinlari</p>
        </div>
      </div>

      {/* Status breakdown table */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">Status bo'yicha taqsimot</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(stats.by_status).map(([status, count], i) => (
            <div key={status} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${COLORS[i]}15` }}>
              <p className="text-2xl font-bold" style={{ color: COLORS[i] }}>{count}</p>
              <p className="text-xs text-gray-600 mt-1">{STATUS_NAMES[status]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Status bo'yicha doira diagram</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {fruitData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Meva turi bo'yicha</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fruitData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fruit_type" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Arizalar soni" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Jobs breakdown */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">Ish o'rinlari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total_permanent_jobs || 0}</p>
              <p className="text-sm text-gray-500">Doimiy ish o'rinlari</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total_seasonal_jobs || 0}</p>
              <p className="text-sm text-gray-500">Mavsumiy ish o'rinlari</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
