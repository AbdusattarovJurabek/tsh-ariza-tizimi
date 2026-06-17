import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationAPI, downloadBlob } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Edit2, Send, Download, MapPin, MessageSquare, Clock, FileText, Share2, CheckCircle } from 'lucide-react';
import { FILE_TYPE_LABELS, STATUS_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

function CountdownBanner({ approvedAt, appNumber }) {
  const [days, setDays] = useState(null);
  const [deadline, setDeadline] = useState(null);

  useEffect(() => {
    // Ish kunlarini hisoblash (frontend)
    function calcWorkingDays(approvedDate, total = 15) {
      const now = new Date();
      const approved = new Date(approvedDate);
      let passed = 0;
      let cur = new Date(approved);
      cur.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      while (cur <= today) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) passed++;
        cur.setDate(cur.getDate() + 1);
      }
      return Math.max(0, total - passed);
    }
    function calcDeadline(approvedDate, total = 15) {
      let count = 0;
      let cur = new Date(approvedDate);
      while (count < total) {
        cur.setDate(cur.getDate() + 1);
        const d = cur.getDay();
        if (d !== 0 && d !== 6) count++;
      }
      return cur;
    }
    if (approvedAt) {
      setDays(calcWorkingDays(approvedAt));
      setDeadline(calcDeadline(approvedAt));
    }
  }, [approvedAt]);

  if (days === null) return null;

  const color = days === 0 ? 'red' : days <= 3 ? 'orange' : 'green';
  const colors = {
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    circle: '#ef4444' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', circle: '#f59e0b' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  circle: '#16a34a' },
  }[color];

  const radius = 28; const circ = 2 * Math.PI * radius;
  const dash = Math.max(0, days / 15) * circ;

  const trackUrl = `${window.location.origin}/track?code=${appNumber}`;

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-3`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6"/>
            <circle cx="36" cy="36" r={radius} fill="none" stroke={colors.circle} strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)"/>
            <text x="36" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill={colors.circle}>{days}</text>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${colors.text}`}>
            {days === 0 ? '⚠️ Muddat tugagan!' : `📋 PDF hujjat yuborish uchun ${days} ish kuni qoldi`}
          </p>
          {deadline && (
            <p className="text-xs text-gray-500 mt-0.5">
              Muddat: {deadline.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {days === 0 ? 'Agentlik bilan bog\'laning.' : 'Agentlik 15 ish kuni ichida siz bilan bog\'lanadi.'}
          </p>
        </div>
      </div>
      {/* Tracking link */}
      <div className="flex items-center gap-2 pt-2 border-t border-current border-opacity-10">
        <Share2 size={13} className="text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500">Ochiq havola:</span>
        <a href={trackUrl} target="_blank" rel="noreferrer"
          className="text-xs text-blue-600 hover:underline truncate font-mono">{trackUrl}</a>
        <button onClick={() => { navigator.clipboard.writeText(trackUrl); toast.success('Havola nusxalandi!'); }}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 ml-auto">📋</button>
      </div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || <span className="text-gray-400 italic">Kiritilmagan</span>}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="card">
    <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b text-sm">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadWord = async () => {
    setDownloading(true);
    try {
      const res = await applicationAPI.exportWord(id);
      downloadBlob(res.data, `ariza-${app.app_number}.docx`);
      toast.success('Word fayl yuklab olindi');
    } catch {
      toast.error('Yuklab olishda xato');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    applicationAPI.getOne(id)
      .then(res => setApp(res.data))
      .catch(() => { toast.error('Ariza topilmadi'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!app) return null;

  const canEdit = ['DRAFT', 'HAS_ISSUES'].includes(app.status);

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
            <h2 className="font-bold text-gray-800 mt-1">{app.subject_name || 'Ariza'}</h2>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {app.status === 'APPROVED' && (
            <button
              onClick={handleDownloadWord}
              disabled={downloading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <FileText size={15} />
              {downloading ? 'Yuklanmoqda...' : 'Word yuklab olish'}
            </button>
          )}
          {canEdit && (
            <Link to={`/applications/${app.id}/edit`} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit2 size={15} /> Tahrirlash
            </Link>
          )}
        </div>
      </div>

      {/* 15 ish kun countdown - APPROVED uchun */}
      {app.status === 'APPROVED' && app.approved_at && (
        <CountdownBanner approvedAt={app.approved_at} appNumber={app.app_number} />
      )}

      {/* Admin comment */}
      {app.admin_comment && (
        <div className={`rounded-xl p-4 border flex gap-3 ${
          app.status === 'HAS_ISSUES' ? 'bg-orange-50 border-orange-200' :
          app.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <MessageSquare size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Admin izohi:</p>
            <p className="text-sm text-gray-600">{app.admin_comment}</p>
          </div>
        </div>
      )}

      <Section title="1. Subyekt ma'lumotlari">
        <Field label="Subyekt nomi" value={app.subject_name} />
        <Field label="Rahbar F.I.Sh." value={app.leader_full_name} />
        <Field label="Yuridik manzil" value={app.legal_address} />
        <Field label="STIR" value={app.stir} />
        <Field label="MFO" value={app.mfo} />
        <Field label="Hisob raqam" value={app.bank_account} />
        <Field label="Bank nomi" value={app.bank_name} />
      </Section>

      <Section title="2. Yer maydoni ma'lumotlari">
        <Field label="Umumiy yer maydoni (ga)" value={app.total_land_area} />
        <Field label="Ixtisoslik" value={app.land_specialization} />
        <Field label="Bog' maydoni (ga)" value={app.garden_area} />
        <Field label="Yer konturi" value={app.land_contour} />
        <Field label="Bog' manzili" value={app.garden_address} />
        <Field label="Qaror raqami" value={app.land_decision_number} />
        <Field label="Qaror sanasi" value={app.land_decision_date} />
        <Field label="Ijara shartnomasi raqami" value={app.lease_contract_number} />
        <Field label="Shartnoma sanasi" value={app.lease_contract_date} />
        <Field label="Reestr raqami" value={app.registry_number} />
        {app.location_url && (
          <div className="col-span-full">
            <span className="text-xs text-gray-500">Lokatsiya</span>
            <a href={app.location_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-sm text-primary-600 hover:underline mt-0.5">
              <MapPin size={14} /> Google Maps'da ko'rish
            </a>
          </div>
        )}
      </Section>

      <Section title="3. Agrotexnik ma'lumotlar">
        <Field label="Tuproq tipi" value={app.soil_type} />
        <Field label="Tuproq tarkibi" value={app.soil_composition} />
        <Field label="Tuproq sifati" value={app.soil_quality} />
        <Field label="Tuproq unumdorligi" value={app.soil_fertility} />
        <div className="col-span-full">
          <Field label="Suv ta'minlanganlik xulosasi" value={app.water_supply_info} />
        </div>
        <div className="col-span-full">
          <Field label="5 yillik ob-havo tahlili" value={app.weather_analysis} />
        </div>
        <div className="col-span-full">
          <Field label="Ilmiy tavsiya" value={app.scientific_recommendation} />
        </div>
      </Section>

      <Section title="4. Ko'chat va Loyiha ma'lumotlari">
        <Field label="Meva turi" value={app.fruit_type} />
        <Field label="Meva navi" value={app.fruit_variety} />
        <Field label="Ekish sxemasi" value={app.planting_scheme} />
        <Field label="Ko'chat soni (dona)" value={app.seedling_count} />
        <Field label="Ekilish davri" value={app.planting_period} />
        <Field label="Suv manbasi" value={app.water_source} />
        <Field label="Loyiha summasi (so'm)" value={app.project_amount ? parseInt(app.project_amount).toLocaleString() : null} />
        <Field label="Doimiy ish o'rni" value={app.permanent_jobs} />
        <Field label="Mavsumiy ish o'rni" value={app.seasonal_jobs} />
        <div className="col-span-full">
          <Field label="Ta'minotchi korxonalar" value={app.supplier_companies} />
        </div>
      </Section>

      {/* Files */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b text-sm">5. Ilova qilingan hujjatlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(FILE_TYPE_LABELS).map(([type, label]) => {
            const file = app.files?.find(f => f.file_type === type);
            return (
              <div key={type} className={`flex items-center gap-3 p-3 rounded-lg border ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${file ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                <div className="pb-3 min-w-0">
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
