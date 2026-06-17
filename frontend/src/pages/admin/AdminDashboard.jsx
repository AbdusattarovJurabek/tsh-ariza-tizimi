import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Users, TrendingUp, Leaf, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const content = (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

const COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#f97316', '#22c55e', '#ef4444'];
const STATUS_NAMES = { DRAFT: 'Qoralama', SUBMITTED: 'Yuborilgan', UNDER_REVIEW: "Ko'rib chiqilmoqda", HAS_ISSUES: 'Kamchilik', APPROVED: 'Tasdiqlandi', REJECTED: 'Rad etildi' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStatistics()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Statistikani yuklashda xato'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!stats) return null;

  const pieData = Object.entries(stats.by_status).map(([key, val]) => ({
    name: STATUS_NAMES[key], value: val
  })).filter(d => d.value > 0);

  const barData = stats.fruit_stats?.slice(0, 8).map(f => ({
    name: f.fruit_type, count: f.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Jami arizalar" value={stats.total} color="bg-blue-500" to="/admin/applications" />
        <StatCard icon={Clock} label="Ko'rib chiqilmoqda" value={stats.by_status.UNDER_REVIEW} color="bg-yellow-500" />
        <StatCard icon={CheckCircle} label="Tasdiqlangan" value={stats.by_status.APPROVED} color="bg-green-500" />
        <StatCard icon={AlertCircle} label="Kamchilik / Rad" value={(stats.by_status.HAS_ISSUES || 0) + (stats.by_status.REJECTED || 0)} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card text-center">
          <Leaf size={24} className="text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{(stats.total_garden_area || 0).toFixed(1)}</p>
          <p className="text-sm text-gray-500">Jami bog' maydoni (ga)</p>
        </div>
        <div className="card text-center">
          <DollarSign size={24} className="text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{((stats.total_project_amount || 0) / 1e9).toFixed(1)} mlrd</p>
          <p className="text-sm text-gray-500">Jami loyiha summasi</p>
        </div>
        <div className="card text-center">
          <Users size={24} className="text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{(stats.total_permanent_jobs || 0) + (stats.total_seasonal_jobs || 0)}</p>
          <p className="text-sm text-gray-500">Jami ish o'rinlari</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(stats.by_status).map(([status, count], i) => (
          <div key={status} className="card !p-3 text-center">
            <p className="text-xl font-bold" style={{ color: COLORS[i] }}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{STATUS_NAMES[status]}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Status bo'yicha taqsimot</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {barData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Meva turi bo'yicha arizalar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Arizalar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/applications?status=SUBMITTED" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Yangi arizalar</p>
              <p className="text-sm text-gray-500">{stats.by_status.SUBMITTED} ta ariza ko'rib chiqishni kutmoqda</p>
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Foydalanuvchilar</p>
              <p className="text-sm text-gray-500">Boshqarish va import qilish</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
