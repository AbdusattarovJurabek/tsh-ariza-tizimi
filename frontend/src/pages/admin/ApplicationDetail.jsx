import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI, downloadBlob } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { ArrowLeft, FileText, Download, MapPin, Clock, MessageSquare, CheckCircle, X, Share2 } from 'lucide-react';
import { FILE_TYPE_LABELS, STATUS_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

function AdminCountdownBanner({ approvedAt, appNumber }) {
  const [days, setDays] = useState(null);
  const [deadline, setDeadline] = useState(null);

  useEffect(() => {
    function calcWorkingDays(approvedDate, total = 15) {
      const now = new Date();
      const approved = new Date(approvedDate);
      let passed = 0;
      let cur = new Date(approved); cur.setHours(0,0,0,0);
      const today = new Date(now); today.setHours(0,0,0,0);
      while (cur <= today) { const d=cur.getDay(); if(d!==0&&d!==6) passed++; cur.setDate(cur.getDate()+1); }
      return Math.max(0, total - passed);
    }
    function calcDeadline(approvedDate, total = 15) {
      let count=0; let cur=new Date(approvedDate);
      while(count<total){cur.setDate(cur.getDate()+1);const d=cur.getDay();if(d!==0&&d!==6)count++;}
      return cur;
    }
    if (approvedAt) { setDays(calcWorkingDays(approvedAt)); setDeadline(calcDeadline(approvedAt)); }
  }, [approvedAt]);

  if (days === null) return null;

  const color = days === 0 ? 'red' : days <= 3 ? 'orange' : 'green';
  const c = { red:'border-red-200 bg-red-50 text-red-700', orange:'border-orange-200 bg-orange-50 text-orange-700', green:'border-green-200 bg-green-50 text-green-700' }[color];
  const trackUrl = `${window.location.origin}/track?code=${appNumber}`;

  return (
    <div className={`rounded-xl border ${c} p-4`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">{days}</div>
          <div>
            <p className="text-sm font-semibold">
              {days === 0 ? '⚠️ PDF yuborish muddati tugagan!' : `📋 PDF yuborish uchun ${days} ish kuni qoldi`}
            </p>
            {deadline && <p className="text-xs opacity-70">Muddat: {deadline.toLocaleDateString('uz-UZ', {day:'2-digit',month:'long',year:'numeric'})}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Share2 size={13} className="opacity-60"/>
          <a href={trackUrl} target="_blank" rel="noreferrer" className="text-xs underline font-mono opacity-80">Ochiq havola</a>
          <button onClick={()=>{navigator.clipboard.writeText(trackUrl);toast.success('Nusxalandi!');}}
            className="text-xs px-2 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-80">📋</button>
        </div>
      </div>
    </div>
  );
}

const ADMIN_STATUSES = [
  { value: 'UNDER_REVIEW', label: "Ko'rib chiqilmoqda", color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'HAS_ISSUES', label: 'Kamchilik bor', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { value: 'APPROVED', label: 'Tasdiqlash', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'REJECTED', label: 'Rad etish', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
];

const Field = ({ label, value }) => (
  <div>
    <span className="text-xs text-gray-400">{label}</span>
    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || <span className="text-gray-400 italic">—</span>}</p>
  </div>
);

export default function AdminApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminAPI.getApplication(id)
      .then(res => { setApp(res.data); setComment(res.data.admin_comment || ''); })
      .catch(() => { toast.error('Ariza topilmadi'); navigate('/admin/applications'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) { toast.error('Status tanlang'); return; }
    if (selectedStatus === 'HAS_ISSUES' && !comment) { toast.error('Kamchilik haqida izoh yozing'); return; }
    setUpdating(true);
    try {
      const res = await adminAPI.updateStatus(id, { status: selectedStatus, comment });
      setApp(prev => ({ ...prev, status: res.data.status, admin_comment: res.data.admin_comment, approved_at: res.data.approved_at || prev.approved_at }));
      setSelectedStatus('');
      toast.success('Status yangilandi');
      // Reload to get updated history
      const fresh = await adminAPI.getApplication(id);
      setApp(fresh.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'pdf') {
        const res = await adminAPI.exportPDF(id);
        downloadBlob(res.data, `ariza-${app.app_number}.pdf`);
      } else {
        const res = await adminAPI.exportWord(id);
        downloadBlob(res.data, `ariza-${app.app_number}.docx`);
      }
      toast.success('Yuklab olindi');
    } catch { toast.error('Export xatosi'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!app) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{app.app_number}</code>
              <StatusBadge status={app.status} />
            </div>
            <h2 className="font-bold text-gray-800 mt-1">{app.subject_name || 'Nomi kiritilmagan'}</h2>
            <p className="text-sm text-gray-500">{app.user?.full_name} • {app.user?.region} {app.user?.district ? '• ' + app.user.district : ''}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => handleExport('word')} disabled={!!exporting} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> {exporting === 'word' ? '...' : 'Word'}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText size={15} /> {exporting === 'pdf' ? '...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* APPROVED countdown - admin uchun */}
      {app.status === 'APPROVED' && app.approved_at && (
        <AdminCountdownBanner approvedAt={app.approved_at} appNumber={app.app_number} />
      )}

      {/* Admin action panel */}
      <div className="card border-2 border-primary-100">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">Arizani ko'rib chiqish</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {ADMIN_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setSelectedStatus(s.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border-2 ${
                selectedStatus === s.value ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'
              } ${s.color}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin izohi</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Foydalanuvchiga izoh yozing..."
          />
        </div>
        <button
          onClick={handleUpdateStatus}
          disabled={!selectedStatus || updating}
          className="btn-primary flex items-center gap-2"
        >
          {updating ? (
            <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Yangilanmoqda...</>
          ) : 'Saqlash'}
        </button>
      </div>

      {/* Application data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b">Subyekt ma'lumotlari</h3>
          <div className="space-y-3">
            <Field label="Subyekt nomi" value={app.subject_name} />
            <Field label="Rahbar F.I.Sh." value={app.leader_full_name} />
            <Field label="Yuridik manzil" value={app.legal_address} />
            <Field label="STIR" value={app.stir} />
            <Field label="MFO" value={app.mfo} />
            <Field label="Hisob raqam" value={app.bank_account} />
            <Field label="Bank nomi" value={app.bank_name} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b">Yer maydoni</h3>
          <div className="space-y-3">
            <Field label="Umumiy yer maydoni (ga)" value={app.total_land_area} />
            <Field label="Bog' maydoni (ga)" value={app.garden_area} />
            <Field label="Bog' manzili" value={app.garden_address} />
            <Field label="Reestr raqami" value={app.registry_number} />
            <Field label="Qaror raqami" value={app.land_decision_number} />
            <Field label="Ijara shartnomasi" value={`${app.lease_contract_number || ''} ${app.lease_contract_date || ''}`.trim() || null} />
            {app.location_url && (
              <div>
                <span className="text-xs text-gray-400">Lokatsiya</span>
                <a href={app.location_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary-600 hover:underline mt-0.5">
                  <MapPin size={14} /> Ko'rish
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b">Agrotexnik</h3>
          <div className="space-y-3">
            <Field label="Tuproq tipi" value={app.soil_type} />
            <Field label="Tuproq tarkibi" value={app.soil_composition} />
            <Field label="Tuproq sifati" value={app.soil_quality} />
            <Field label="Suv ta'minoti" value={app.water_supply_info} />
            <Field label="Ob-havo tahlili" value={app.weather_analysis} />
            <Field label="Ilmiy tavsiya" value={app.scientific_recommendation} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b">Loyiha</h3>
          <div className="space-y-3">
            <Field label="Meva turi" value={app.fruit_type} />
            <Field label="Meva navi" value={app.fruit_variety} />
            <Field label="Ekish sxemasi" value={app.planting_scheme} />
            <Field label="Ko'chat soni" value={app.seedling_count} />
            <Field label="Loyiha summasi" value={app.project_amount ? `${parseInt(app.project_amount).toLocaleString()} so'm` : null} />
            <Field label="Doimiy ish o'rni" value={app.permanent_jobs} />
            <Field label="Mavsumiy ish o'rni" value={app.seasonal_jobs} />
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b text-sm">Ilova qilingan hujjatlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(FILE_TYPE_LABELS).map(([type, label]) => {
            const file = app.files?.find(f => f.file_type === type);
            return (
              <div key={type} className={`flex items-center gap-3 p-3 rounded-lg border ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {file ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <X size={16} className="text-gray-300 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                  {file && (
                    <a href={`/${file.file_path}`} target="_blank" rel="noreferrer"
                      className="text-xs text-primary-600 hover:underline truncate block">
                      {file.file_name}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status history */}
      {app.status_history?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b text-sm">Ariza tarixi</h3>
          <div className="space-y-3">
            {app.status_history.map(h => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={12} className="text-primary-600" />
                  </div>
                  <div className="w-0.5 bg-gray-200 flex-1 mt-1"></div>
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={h.new_status} />
                    <span className="text-xs text-gray-400">{h.changed_by?.full_name}</span>
                    <span className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString('uz-UZ')}</span>
                  </div>
                  {h.comment && <p className="text-xs text-gray-600 mt-1">{h.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
