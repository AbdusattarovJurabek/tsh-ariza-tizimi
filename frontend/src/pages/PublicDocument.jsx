import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

export default function PublicDocument() {
  const { app_number } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/public/track/${encodeURIComponent(app_number)}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setError("Hujjat topilmadi yoki ariza raqami noto'g'ri."); setLoading(false); });
  }, [app_number]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"/>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  const isSigned = data.status === 'SIGNED';
  const verifyUrl = `${window.location.origin}/document/${data.app_number}`;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:p-0">
      {/* Chop etish tugmasi */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <span className="text-sm text-gray-500">📄 Hujjat ko'rinishi</span>
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
          🖨️ Chop etish / PDF saqlash
        </button>
      </div>

      {/* Hujjat */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-green-700 text-white px-8 py-6 text-center">
          <div className="text-lg font-bold">O'ZBEKISTON RESPUBLIKASI</div>
          <div className="text-sm opacity-90">Agrosanoat rivojlantirish agentligi</div>
          <div className="text-xs opacity-75 mt-1">Texnik shart hujjati</div>
        </div>

        {/* Status banner */}
        <div className={`px-8 py-3 text-center text-sm font-medium ${isSigned ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-yellow-50 text-yellow-800 border-b border-yellow-100'}`}>
          {isSigned ? `✅ Hujjat imzolandi — ${new Date(data.signed_at).toLocaleDateString('uz-UZ')}` : `⏳ ${data.status_label}`}
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Ariza raqami */}
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Ariza raqami</div>
            <div className="text-2xl font-bold text-gray-800">{data.app_number}</div>
          </div>

          {/* Asosiy ma'lumotlar */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Subyekt ma'lumotlari</div>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                <Row label="Tashkilot nomi" value={data.subject_name} />
                <Row label="Rahbar F.I.Sh." value={data.leader_full_name} />
                <Row label="Meva turi" value={data.fruit_type} />
                <Row label="Bog' maydoni" value={data.garden_area ? `${data.garden_area} gektar` : null} />
                <Row label="Yuborilgan sana" value={data.submitted_at ? new Date(data.submitted_at).toLocaleDateString('uz-UZ') : null} />
                {isSigned && <Row label="Imzolangan sana" value={new Date(data.signed_at).toLocaleDateString('uz-UZ')} highlight />}
              </tbody>
            </table>
          </div>

          {/* QR va tasdiqlash */}
          {isSigned && (
            <div className="border rounded-xl p-4 flex items-center gap-4 bg-emerald-50">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=100x100`}
                alt="QR" className="rounded flex-shrink-0" />
              <div className="text-sm">
                <div className="font-semibold text-emerald-800 mb-1">Hujjat haqiqiyligini tekshirish</div>
                <div className="text-gray-600 text-xs">QR kodni skaner qiling yoki quyidagi havola orqali kiring:</div>
                <a href={verifyUrl} className="text-emerald-600 text-xs break-all hover:underline">{verifyUrl}</a>
              </div>
            </div>
          )}

          {/* Imzo joyi */}
          {isSigned && (
            <div className="border-t pt-4 mt-6">
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Imzolagan:</div>
                  <div className="font-medium">Agentlik direktori</div>
                  <div className="mt-6 border-t border-gray-400 pt-1 text-xs text-gray-500 w-40">Imzo</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs mb-1">Sana:</div>
                  <div className="font-medium">{new Date(data.signed_at).toLocaleDateString('uz-UZ')}</div>
                  <div className="mt-6 border-t border-gray-400 pt-1 text-xs text-gray-500 w-32">M.O.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 pb-4 text-center text-xs text-gray-400">
          Ushbu hujjat {new Date().toLocaleDateString('uz-UZ')} sanasida {window.location.origin} saytidan olingan
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  if (!value) return null;
  return (
    <tr className={highlight ? 'bg-emerald-50' : ''}>
      <td className="px-4 py-2 text-gray-500 w-40">{label}</td>
      <td className="px-4 py-2 font-medium text-gray-800">{value}</td>
    </tr>
  );
}
