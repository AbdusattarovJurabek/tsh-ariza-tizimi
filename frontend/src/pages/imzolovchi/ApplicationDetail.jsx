import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imzolovchiAPI, downloadBlob } from '../../services/api';
import WordDocPreview from '../../components/WordDocPreview';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  SENT_TO_SIGNER: 'bg-purple-100 text-purple-800',
  SIGNED:         'bg-emerald-100 text-emerald-800',
};
const STATUS_LABELS = {
  SENT_TO_SIGNER: 'Imzolovchida',
  SIGNED:         'Imzolandi',
};

/** Imzolangan hujjatni PDF sifatida print windowda ochib beradi */
async function openPdfPrint(id, appNumber) {
  try {
    const response = await imzolovchiAPI.previewWord(id);

    // ArrayBuffer olish
    let arrayBuffer;
    if (response.data instanceof ArrayBuffer) {
      arrayBuffer = response.data;
    } else if (response.data?.buffer instanceof ArrayBuffer) {
      const d = response.data;
      arrayBuffer = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
    } else {
      arrayBuffer = response.data;
    }

    // mammoth → HTML
    let convertFn;
    if (window.mammoth?.convertToHtml) {
      convertFn = window.mammoth.convertToHtml.bind(window.mammoth);
    } else {
      const m = await import('mammoth');
      convertFn = (m.default?.convertToHtml || m.convertToHtml).bind(m.default || m);
    }
    const result = await convertFn({ arrayBuffer });
    const bodyHtml = result.value || '';

    // Print oynasi ochish
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { toast.error("Pop-up bloklangan. Brauzer sozlamalarini tekshiring."); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8"/>
<title>TSH-${appNumber} — Imzolangan hujjat</title>
<style>
  @page { size: A4; margin: 20mm 25mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    margin: 0; padding: 0;
  }
  p { margin: 4px 0; text-align: justify; }
  h1,h2,h3,h4,h5 { text-align: center; margin: 10px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  td, th { border: 1px solid #999; padding: 5px 8px; font-size: 11pt; }
  img { display: block; margin: 8px auto; max-width: 160px; max-height: 160px; height: auto; }
  .stamp {
    border: 2px solid #166534;
    border-radius: 50%;
    width: 80px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    margin: 10px auto;
    font-size: 9pt; color: #166534; text-align: center; padding: 4px;
  }
  .signed-banner {
    border: 1.5px solid #166534;
    background: #f0fdf4;
    border-radius: 6px;
    padding: 8px 16px;
    margin: 12px 0;
    text-align: center;
    font-size: 11pt;
    color: #166534;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="signed-banner">
  ✅ IMZOLANGAN HUJJAT &nbsp;|&nbsp; ${appNumber} &nbsp;|&nbsp; ${new Date().toLocaleDateString('uz-UZ')}
</div>
${bodyHtml}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
</script>
</body>
</html>`);
    win.document.close();
  } catch (e) {
    console.error('PDF ochishda xato:', e);
    toast.error('PDF ochishda xato: ' + e.message);
  }
}

export default function ImzolovchiApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signModal, setSignModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    imzolovchiAPI.getApplication(id)
      .then(r => { setApp(r.data); setLoading(false); })
      .catch(() => {
        toast.error('Ariza topilmadi');
        navigate('/imzolovchi/applications');
      });
  }, [id]);

  const downloadWord = async () => {
    try {
      const r = await imzolovchiAPI.exportWord(id);
      downloadBlob(r.data, `TSH-${app.app_number}.docx`);
      toast.success('Word yuklanmoqda...');
    } catch {
      toast.error('Xato yuz berdi');
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    toast('PDF tayyorlanmoqda...', { icon: '⏳' });
    await openPdfPrint(id, app.app_number);
    setPdfLoading(false);
  };

  const signDocument = async () => {
    setSigning(true);
    try {
      const r = await imzolovchiAPI.sign(id);
      toast.success('Hujjat imzolandi ✓');
      setApp(prev => ({ ...prev, status: 'SIGNED', signed_at: r.data.signed_at || new Date().toISOString() }));
      setSignModal(false);

      // Imzolangandan keyin avtomatik PDF ochish
      toast('Imzolangan hujjat PDF sifatida ochilmoqda...', { icon: '📄', duration: 3000 });
      setTimeout(async () => {
        await openPdfPrint(id, app.app_number);
      }, 800);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Imzolashda xato');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const isSigned = app.status === 'SIGNED';
  const publicUrl = `${window.location.origin}/document/${app.app_number}`;

  return (
    <div className="flex flex-col -m-4 lg:-m-6" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Yuqori panel */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-sm font-medium">
            ← Orqaga
          </button>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-800 text-sm">{app.app_number}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'}`}>
            {STATUS_LABELS[app.status] || app.status}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadWord}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            ⬇ Word yuklab olish
          </button>
          <button onClick={downloadPdf} disabled={pdfLoading}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
            {pdfLoading ? '⏳...' : '📄 PDF yuklab olish'}
          </button>
          {!isSigned && (
            <button onClick={() => setSignModal(true)}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
              ✍️ Imzolash
            </button>
          )}
        </div>
      </div>

      {/* QR + imzolangan banner */}
      {isSigned && (
        <div className="shrink-0 bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-3 flex-wrap">
          <span className="text-emerald-700 text-sm font-medium">✅ Hujjat imzolangan</span>
          <a href={publicUrl} target="_blank" rel="noreferrer"
            className="text-sm text-blue-600 hover:underline font-medium">
            🔗 Ochiq sahifa
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Nusxa olindi'); }}
            className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-0.5">
            Nusxa
          </button>
          <button onClick={downloadPdf} disabled={pdfLoading}
            className="ml-auto text-xs bg-rose-600 text-white rounded px-3 py-1 hover:bg-rose-700 disabled:opacity-50">
            {pdfLoading ? '⏳...' : '📄 PDF'}
          </button>
        </div>
      )}

      {/* Word preview */}
      <div className="flex-1 overflow-hidden">
        <WordDocPreview
          fetchFn={() => imzolovchiAPI.previewWord(id)}
          editable={false}
        />
      </div>

      {/* Imzolash modal */}
      {signModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">✍️</div>
            <h3 className="font-bold text-lg mb-2">Hujjatni imzolash</h3>
            <p className="text-gray-600 text-sm mb-6">
              <strong>{app.app_number}</strong> raqamli TSH hujjatini imzolaysizmi?<br />
              Imzolangandan keyin o'zgartirish kiritib bo'lmaydi.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSignModal(false)}
                className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">
                Bekor
              </button>
              <button onClick={signDocument} disabled={signing}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                {signing ? 'Imzolanmoqda...' : '✓ Imzolash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
