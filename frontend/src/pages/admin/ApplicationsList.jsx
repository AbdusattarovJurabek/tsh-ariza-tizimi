import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI, downloadBlob } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { UZBEKISTAN_REGIONS } from '../../utils/constants';

const STATUSES = ['', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'HAS_ISSUES', 'APPROVED', 'REJECTED'];
const STATUS_LABELS = { '': 'Barchasi', DRAFT: 'Qoralama', SUBMITTED: 'Yuborilgan', UNDER_REVIEW: "Ko'rib chiqilmoqda", HAS_ISSUES: 'Kamchilik', APPROVED: 'Tasdiqlandi', REJECTED: 'Rad etildi' };

export default function AdminApplicationsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ data: [], total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    region: '', fruit_type: '', date_from: '', date_to: '',
    min_amount: '', max_amount: '', page: 1, limit: 20
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    adminAPI.getApplications(params)
      .then(res => setData(res.data))
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setF = (key, val) => setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
  const clearFilters = () => setFilters({ search: '', status: '', region: '', fruit_type: '', date_from: '', date_to: '', min_amount: '', max_amount: '', page: 1, limit: 20 });

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await adminAPI.exportAllExcel();
      downloadBlob(res.data, 'arizalar.xlsx');
      toast.success('Excel yuklab olindi');
    } catch { toast.error('Export xatosi'); }
    finally { setExporting(false); }
  };

  const activeFiltersCount = [filters.status, filters.region, filters.fruit_type, filters.date_from, filters.min_amount].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="input-field pl-10"
            placeholder="Ariza raqami, subyekt nomi, STIR bo'yicha qidirish..."
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-primary-400 text-primary-600' : ''}`}
        >
          <Filter size={16} />
          Filtr {activeFiltersCount > 0 && <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
        </button>
        <button onClick={handleExportExcel} disabled={exporting} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> {exporting ? 'Yuklanmoqda...' : 'Excel'}
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setF('status', s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.status === s
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-700 text-sm">Kengaytirilgan filtr</h4>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={12} /> Tozalash
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Viloyat</label>
              <select className="input-field text-sm" value={filters.region} onChange={e => setF('region', e.target.value)}>
                <option value="">Barchasi</option>
                {UZBEKISTAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meva turi</label>
              <input className="input-field text-sm" value={filters.fruit_type} onChange={e => setF('fruit_type', e.target.value)} placeholder="Masalan: Olma" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sana (dan)</label>
              <input type="date" className="input-field text-sm" value={filters.date_from} onChange={e => setF('date_from', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sana (gacha)</label>
              <input type="date" className="input-field text-sm" value={filters.date_to} onChange={e => setF('date_to', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min summa</label>
              <input type="number" className="input-field text-sm" value={filters.min_amount} onChange={e => setF('min_amount', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max summa</label>
              <input type="number" className="input-field text-sm" value={filters.max_amount} onChange={e => setF('max_amount', e.target.value)} placeholder="∞" />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <p className="text-sm text-gray-600">Jami: <span className="font-semibold">{data.total}</span> ta ariza</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : data.data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Arizalar topilmadi</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Ariza raqami', 'Subyekt', 'Rahbar', 'Viloyat', 'Meva turi', "Bog' maydoni", 'Status', 'Sana', 'Amal'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{app.app_number}</code>
                    </td>
                    <td className="py-3 px-4 max-w-32 truncate font-medium text-gray-700">{app.subject_name || '—'}</td>
                    <td className="py-3 px-4 max-w-28 truncate text-gray-600">{app.leader_full_name || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{app.user?.region || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{app.fruit_type || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{app.garden_area ? `${app.garden_area} ga` : '—'}</td>
                    <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('uz-UZ') : new Date(app.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/admin/applications/${app.id}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-xs">
                        <Eye size={14} /> Ko'rish
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500">{data.page}-sahifa / {data.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={data.page <= 1}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Oldingi
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={data.page >= data.totalPages}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                Keyingi <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
