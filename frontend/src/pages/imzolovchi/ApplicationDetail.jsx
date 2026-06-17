import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imzolovchiAPI, downloadBlob } from '../../services/api';
import toast from 'react-hot-toast';

const APP_BASE = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000';

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
  { key: 'fruit_type', label: 'Meva turi' },
  { key: 'fruit_variety', label: 'Nav' },
  { key: 'planting_scheme', label: 'Ekish sxemasi' },
  { key: 'seedling_count', label: "Ko'chat soni" },
  { key: 'project_amount', label: 'Loyiha summasi' },
  { key: 'permanent_jobs', label: 'Doimiy ish o\'rni' },
  { key: 'seasonal_jobs', label: 'Mavsumiy ish o\'rni' },
  { key: 'scientific_recommendation', label: 'Ilmiy tavsiya' },
  { key: 'supplier_companies', label: 'Yetkazib beruvchilar' },
];

export default function ImzolovchiApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [wordData, setWordData] = useState({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);

  useEffect(() => {
    imzolovchiAPI.getApplication(id).then(r => {
      setApp(r.data);
      const wc = r.data.word_content || {};
      const initial = {};
      WORD_FIELDS.forEach(f => {
        initial[f.key] = wc[f.key] !== undefined ? wc[f.key] : (r.data[f.key] || '');
      });
      setWordData(initial);
      setLoading(false);
    }).catch(() => { toast.error('Topilmadi'); navigate('/imzolovchi/applications'); });
  }, [id]);

  const saveWordContent = async () => {
    setSaving(true);
    try {
      await imzolovchiAPI.updateWordContent(id, wordData);
      toast.success('Saqlandi');
    } catch { toast.error('Xato'); }
    setSaving(false);
  };

  const downloadWord = async () => {
    try {
      const r = await imzolovchiAPI.exportWord(id);
      downloadBlob(r.data, `ariza-${app.app_number}.docx`);
    } catch { toast.error('Xato'); }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      await imzolovchiAPI.sign(id);
      toast.success('Hujjat imzolandi! ✅');
      setApp(prev => ({ ...prev, status: 'SIGNED', signed_at: new Date().toISOString() }));
      setConfirmSign(false);
    } catch (e) { toast.error(e.response?.data?.error || 'Xato'); }
    setSigning(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/></div>;

  const publicDocUrl = `${APP_BASE}/document/${app.app_number}`;
  const isSigned = app.status === 'SIGNED';
  const canSign = app.status === 'SENT_TO_SIGNER';

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">← Orqaga</button>
          <h1 className="text-xl font-bold">{app.app_number}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
            {isSigned ? '✅ Imzolandi' : '✍️ Imzo kutilmoqda'}
          </span>
          {canSign && (
            <button onClick={() => setConfirmSign(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
              🖊️ Imzolash (QR orqali tasdiqlash)
            </button>
          )}
        </div>
      </div>

      {/* QR va public link (imzolangandan keyin) */}
      {isSigned && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicDocUrl)}&size=80x80`}
            alt="QR" className="rounded" />
          <div>
            <div className="font-medium text-emerald-800 mb-1">Hujjat imzolandi — ochiq havola:</div>
            <a href={publicDocUrl} target="_blank" rel="noreferrer"
              className="text-sm text-emerald-600 hover:underline break-all">{publicDocUrl}</a>
            <div className="text-xs text-gray-500 mt-1">
              Imzolangan: {new Date(app.signed_at).toLocaleString('uz-UZ')}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        {['info', 'word'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {t === 'info' ? "📋 Ma'lumotlar" : '📝 Hujjat tahrirlash'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Subyekt:</span> <strong>{app.subject_name || '—'}</strong></div>
            <div><span className="text-gray-500">Rahbar:</span> <strong>{app.leader_full_name || '—'}</strong></div>
            <div><span className="text-gray-500">INN:</span> <strong>{app.stir || '—'}</strong></div>
            <div><span className="text-gray-500">Meva turi:</span> <strong>{app.fruit_type || '—'}</strong></div>
            <div><span className="text-gray-500">Bog' maydoni:</span> <strong>{app.garden_area ? `${app.garden_area} ga` : '—'}</strong></div>
            <div><span className="text-gray-500">Loyiha summasi:</span> <strong>{app.project_amount ? `${Number(app.project_amount).toLocaleString()} so'm` : '—'}</strong></div>
          </div>
        </div>
      )}

      {/* Word tahrirlash */}
      {tab === 'word' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Imzolashdan oldin hujjatni tahrirlashingiz mumkin.</p>
            <div className="flex gap-2">
              {!isSigned && (
                <button onClick={saveWordContent} disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
                </button>
              )}
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
                  onChange={e => !isSigned && setWordData(prev => ({ ...prev, [f.key]: e.target.value }))}
                  readOnly={isSigned}
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${isSigned ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Imzolash tasdiqlash modal */}
      {confirmSign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-2">Hujjatni imzolash</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hujjat imzolangandan so'ng arizachi javob xatini ko'ra oladi.
              QR kod orqali ommaviy havola ochiladi.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-500">Ochiq havola:</div>
              <div className="text-sm font-medium break-all">{publicDocUrl}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSign(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Bekor</button>
              <button onClick={handleSign} disabled={signing}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {signing ? 'Imzolanmoqda...' : '✅ Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
