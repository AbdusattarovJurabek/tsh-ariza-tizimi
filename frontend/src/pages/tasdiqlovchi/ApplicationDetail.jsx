import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasdiqlovchiAPI, downloadBlob } from '../../services/api';
import WordDocPreview from '../../components/WordDocPreview';
import toast from 'react-hot-toast';
import { STATUS_TRANSITIONS } from '../../utils/constants';

const STATUS_COLORS = {
  SUBMITTED:'bg-blue-100 text-blue-800', UNDER_REVIEW:'bg-yellow-100 text-yellow-800',
  APPROVED:'bg-green-100 text-green-800', HAS_ISSUES:'bg-orange-100 text-orange-800',
  SENT_TO_SIGNER:'bg-purple-100 text-purple-800', SIGNED:'bg-emerald-100 text-emerald-800',
  REJECTED:'bg-red-100 text-red-800',
};
const STATUS_LABELS = {
  SUBMITTED:'Yuborilgan', UNDER_REVIEW:"Ko'rib chiqilmoqda", APPROVED:'Tasdiqlandi',
  HAS_ISSUES:'Kamchilik bor', SENT_TO_SIGNER:'Imzolovchida', SIGNED:'Imzolandi', REJECTED:'Rad etildi',
};

export default function TasdiqlovchiApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [app, setApp]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment]   = useState('');

  useEffect(() => {
    tasdiqlovchiAPI.getApplication(id)
      .then(r => { setApp(r.data); setLoading(false); })
      .catch(() => { toast.error('Ariza topilmadi'); navigate('/tasdiqlovchi/applications'); });
  }, [id]);

  const saveContent = async () => {
    setSaving(true);
    try {
      const html = previewRef.current?.getHtml();
      if (html) {
        await tasdiqlovchiAPI.saveHtmlContent(id, html);
        toast.success('Saqlandi ✓');
      }
    } catch { toast.error('Saqlashda xato'); }
    setSaving(false);
  };

  const downloadWord = async () => {
    try {
      try {
        const html = previewRef.current?.getHtml();
        if (html) await tasdiqlovchiAPI.saveHtmlContent(id, html);
      } catch (e) {
        console.warn('HTML content saqlashda ogohlik:', e);
      }
      const r = await tasdiqlovchiAPI.exportWord(id);
      downloadBlob(r.data, `TSH-${app.app_number}.docx`);
      toast.success('Word yuklanmoqda...');
    } catch (err) {
      console.error('Word export error:', err);
      toast.error('Word yaratishda xato');
    }
  };

  const downloadPdf = async () => {
    try {
      const r = await tasdiqlovchiAPI.exportPDF(id);
      downloadBlob(r.data, `TSH-${app.app_number}.html`);
      toast.success('PDF tayyorlandi');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF yaratishda xato');
    }
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    try {
      await tasdiqlovchiAPI.updateStatus(id, { status: newStatus, comment });
      toast.success('Status yangilandi');
      setStatusModal(false);
      setApp(prev => ({ ...prev, status: newStatus }));
    } catch (e) { toast.error(e.response?.data?.error || 'Xato'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  const isReadOnly      = !['UNDER_REVIEW', 'APPROVED'].includes(app.status);
  const allowedStatuses = STATUS_TRANSITIONS[app.status] || [];
  const canChangeStatus = allowedStatuses.length > 0;

  return (
    <div className="flex flex-col -m-4 lg:-m-6" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Yuqori panel */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-sm">← Orqaga</button>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-sm text-gray-800">{app.app_number}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isReadOnly && (
            <button onClick={saveContent} disabled={saving}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? '⏳...' : '💾 Saqlash'}
            </button>
          )}
          <button onClick={downloadWord}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            ⬇ Word
          </button>
          <button onClick={downloadPdf}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            📄 PDF Ma'lumot
          </button>
          {canChangeStatus && (
            <button onClick={() => { setNewStatus(''); setStatusModal(true); }}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
              📋 Status
            </button>
          )}
        </div>
      </div>

      {/* Word preview — to'liq ekran, to'g'ridan-to'g'ri tahrirlash */}
      <div className="flex-1 overflow-hidden">
        <WordDocPreview
          ref={previewRef}
          fetchFn={() => tasdiqlovchiAPI.previewWord(id)}
          editable={!isReadOnly}
        />
      </div>

      {/* Status modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Status o'zgartirish</h3>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Tanlang...</option>
              {[
                ['APPROVED', 'Tasdiqlash'],
                ['HAS_ISSUES', 'Qayta ishlashga yuborish (Kamchilik bor)'],
                ['REJECTED', 'Rad etish'],
              ].filter(([value]) => allowedStatuses.includes(value))
                .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Izoh..." rows={3}
              className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(false)} className="px-4 py-2 border rounded-lg text-sm">Bekor</button>
              <button onClick={updateStatus} disabled={!newStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
