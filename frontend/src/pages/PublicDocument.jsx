import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DocumentPreview from '../components/DocumentPreview';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"/>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-700 font-medium mb-2">Hujjat topilmadi</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  const isSigned = data.status === 'SIGNED';

  // API dan kelgan data ni DocumentPreview formatiga mapping
  const wordData = {
    subject_name: data.subject_name,
    stir: data.stir,
    leader_full_name: data.leader_full_name,
    legal_address: data.legal_address,
    mfo: data.mfo,
    bank_account: data.bank_account,
    bank_name: data.bank_name,
    total_land_area: data.total_land_area,
    garden_area: data.garden_area,
    land_specialization: data.land_specialization,
    garden_address: data.garden_address,
    land_decision_date: data.land_decision_date,
    land_decision_number: data.land_decision_number,
    lease_contract_date: data.lease_contract_date,
    lease_contract_number: data.lease_contract_number,
    registry_number: data.registry_number,
    soil_type: data.soil_type,
    soil_quality: data.soil_quality,
    water_supply_info: data.water_supply_info,
    weather_analysis: data.weather_analysis,
    fruit_type: data.fruit_type,
    fruit_variety: data.fruit_variety,
    planting_scheme: data.planting_scheme,
    seedling_count: data.seedling_count,
    planting_period: data.planting_period,
    water_source: data.water_source,
    project_amount: data.project_amount,
    permanent_jobs: data.permanent_jobs,
    seasonal_jobs: data.seasonal_jobs,
    supplier_companies: data.supplier_companies,
    scientific_recommendation: data.scientific_recommendation,
    // word_content override (agar tasdiqlovchi/imzolovchi o'zgartirgan bo'lsa)
    ...(data.word_content || {}),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100">
        {/* Yuqori panel — print paytida yashiriladi */}
        <div className="no-print sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-green-700">ARA</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600">Texnik shart hujjati</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                isSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isSigned ? '✅ Imzolandi' : `⏳ ${data.status_label || data.status}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isSigned && (
                <a
                  href={`/api/public/download/${encodeURIComponent(app_number)}`}
                  className="px-4 py-2 border border-green-600 text-green-700 rounded-lg text-sm hover:bg-green-50 font-medium"
                  download
                >
                  ⬇ Word yuklab olish
                </a>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium"
              >
                🖨️ PDF sifatida saqlash
              </button>
            </div>
          </div>
        </div>

        {/* Imzolangan — tasdiqlash banneri */}
        {isSigned && (
          <div className="no-print max-w-4xl mx-auto mt-4 px-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(window.location.href)}&size=80x80`}
                alt="QR" className="rounded w-16 h-16 shrink-0"
              />
              <div>
                <div className="font-semibold text-emerald-800 text-sm">Hujjat imzolangan va tasdiqlangan</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Imzolangan sana: <strong>{new Date(data.signed_at).toLocaleDateString('uz-UZ')}</strong>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Haqiqiyligini tekshirish uchun QR kodni skaner qiling yoki
                  <a href={window.location.href} className="text-emerald-600 hover:underline ml-1">
                    {window.location.href}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hujjat (DocumentPreview) */}
        <div className="pt-4 pb-10">
          <DocumentPreview
            wordData={wordData}
            appNumber={data.app_number}
            signedAt={isSigned ? data.signed_at : null}
            editable={false}
          />
        </div>
      </div>
    </>
  );
}
