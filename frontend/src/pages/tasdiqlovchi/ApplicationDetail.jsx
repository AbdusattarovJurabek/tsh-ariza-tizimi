import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasdiqlovchiAPI, downloadBlob } from '../../services/api';
import toast from 'react-hot-toast';

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

const WORD_FIELDS = [
  { key: 'subject_name', label: 'Subyekt nomi' },
  { key: 'leader_full_name', label: 'Rahbar F.I.Sh.' },
  { key: 'legal_address', label: 'Yuridik manzil' },
  { key: 'stir', label: 'INN/STIR' },
  { key: 'mfo', label: 'MFO' },
  { key: 'bank_account', label: 'Hisob raqami' },
  { key: 'bank_name', label: 'Bank nomi' },
  { key: 'total_land_area', label: 'Jami yer maydoni (ga)' },
  { key: 'garden_area', label: "Bog' maydoni (ga)" },
  { key: 'land_specialization', label: 'Ixtisoslashtirish' },
  { key: 'garden_address', label: "Bog' manzili" },
  { key: 'land_decision_number', label: 'Yer qaror raqami' },
  { key: 'land_decision_date', label: 'Qaror sanasi' },
  { key: 'lease_contract_number', label: 'Ijara shartnoma raqami' },
  { key: 'lease_contract_date', label: 'Shartnoma sanasi' },
  { key: 'soil_type', label: 'Tuproq turi' },
  { key: 'soil_quality', label: 'Tuproq sifati' },
  { key: 'fruit_type', label: 'Meva turi' },
  { key: 'fruit_variety', label: 'Nav' },
  { key: 'planting_scheme', label: 'Ekish sxemasi' },
  { key: 'seedling_count', label: "Ko'chat soni" },
  { key: 'planting_period', label: 'Ekish muddati' },
  { key: 'water_source', label: 'Suv manbai' },
  { key: 'project_amount', label: 'Loyiha summasi' },
  { key: 'permanent_jobs', label: 'Doimiy ish o\'rni' },
  { key: 'seasonal_jobs', label: 'Mavsumiy ish o\'rni' },
  { key: 'scientific_recommendation', label: 'Ilmiy tavsiya' },
  { key: 'weather_analysis', label: 'Ob-havo tahlili' },
  { key: 'supplier_companies', label: 'Yetkazib beruvchilar' },
];

export default function TasdiqlovchiApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info'); // info | word
  const [wordData, setWordData] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    tasdiqlovchiAPI.getApplication(id).then(r => {
      setApp(r.data);
      // word_content yoki application maydonlaridan boshlang'ich qiymatlar
      const wc = r.data.word_content || {};
      const initial = {};
      WORD_FIELDS.forEach(f => {
        initial[f.key] = wc[f.key] !== undefined ? wc[f.key] : (r.data[f.key] || '');
      });
      setWordData(initial);
      setLoading(false);
    }).catch(() => { toast.error('Ariza topilmadi'); navigate('/tasdiqlovchi/applications'); });
  }, [id]);

  const saveWordContent = async () => {
    setSaving(true);
    try {
      await tasdiqlovchiAPI.updateWordContent(id, wordData);
      toast.success('Saqlandi');
    } catch { toast.error('Saqlashda xato'); }
    setSaving(false);
  };

  const downloadWord = async () => {
    try {
      const r = await tasdiqlovchiAPI.exportWord(id);
      downloadBlob(r.data, `ariza-${app.app_number}.docx`);
      toast.success('Word yuklanmoqda...');
    } catch { toast.error('Xato yuz berdi'); }
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    try {
      await tasdiqlovchiAPI.updateStatus(id, { status: newStatus, comment });
      toast.success('Status yangilandi');
      setStatusModal(false);
      setApp(prev => ({ ...prev, status: newStatus, admin_comment: comment }));
      if (newStatus === 'SENT_TO_SIGNER') {
        toast.success("Imzolovchiga yuborildi ✓");
      }
    } catch (e) { toast.error(e.response?.data?.error || 'Xato'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/></div>;

  const canSendToSigner = ['APPROVED'].includes(app.status);
  const canChangeStatus = !['SENT_TO_SIGNER', 'SIGNED'].includes(app.status);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">← Orqaga</button>
          <h1 className="text-xl font-bold">{app.app_number}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
          {canChangeStatus && (
            <button onClick={() => setStatusModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Status o'zgartirish
            </button>
          )}
          {canSendToSigner && (
            <button onClick={() => { setNewStatus('SENT_TO_SIGNER'); setStatusModal(true); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
              ✍️ Imzolovchiga yuborish
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {['info', 'word'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t === 'info' ? '📋 Ariza ma\'lumotlari' : '📝 Word hujjat (tahrirlash)'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Subyekt:</span> <strong>{app.subject_name || '—'}</strong></div>
            <div><span className="text-gray-500">Rahbar:</span> <strong>{app.leader_full_name || '—'}</strong></div>
            <div><span className="text-gray-500">INN:</span> <strong>{app.stir || '—'}</strong></div>
            <div><span className="text-gray-500">Meva turi:</span> <strong>{app.fruit_type || '—'}</strong></div>
            <div><span className="text-gray-500">Bog' maydoni:</span> <strong>{app.garden_area ? `${app.garden_area} ga` : '—'}</strong></div>
            <div><span className="text-gray-500">Loyiha summasi:</span> <strong>{app.project_amount ? `${app.project_amount?.toLocaleString()} so'm` : '—'}</strong></div>
            <div><span className="text-gray-500">Yuborilgan:</span> <strong>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('uz-UZ') : '—'}</strong></div>
            <div><span className="text-gray-500">Arizachi:</span> <strong>{app.user?.full_name}</strong></div>
          </div>
          {app.admin_comment && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <strong>Izoh:</strong> {app.admin_comment}
            </div>
          )}
          {app.files?.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-sm">Yuklangan fayllar ({app.files.length})</h3>
              <div className="space-y-1">
                {app.files.map(f => (
                  <a key={f.id} href={`/uploads/${f.file_path?.split('/').pop() || f.file_name}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                    📎 {f.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Word tahrirlash tab */}
      {tab === 'word' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Quyidagi maydonlarni tahrirlang, so'ng Word ni yuklab oling.</p>
            <div className="flex gap-2">
              <button onClick={saveWordContent} disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
              </button>
              <button onClick={downloadWord}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                ⬇️ Word yuklab olish
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {WORD_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <input
                  value={wordData[f.key] || ''}
                  onChange={e => setWordData(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Status o'zgartirish</h3>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Tanlang...</option>
              <option value="UNDER_REVIEW">Ko'rib chiqilmoqda</option>
              <option value="APPROVED">Tasdiqlash</option>
              <option value="HAS_ISSUES">Kamchilik bor</option>
              <option value="REJECTED">Rad etish</option>
              <option value="SENT_TO_SIGNER">Imzolovchiga yuborish</option>
            </select>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Izoh (ixtiyoriy)..." rows={3}
              className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(false)} className="px-4 py-2 border rounded-lg text-sm">Bekor</button>
              <button onClick={updateStatus} disabled={!newStatus}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
