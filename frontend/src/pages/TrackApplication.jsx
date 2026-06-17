import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, CheckCircle, Clock, AlertCircle, XCircle, FileText, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_CONFIG = {
  DRAFT:        { label: 'Qoralama',           color: 'gray',   icon: FileText },
  SUBMITTED:    { label: 'Qabul qilindi',       color: 'blue',   icon: Clock },
  UNDER_REVIEW: { label: "Ko'rib chiqilmoqda",  color: 'yellow', icon: Clock },
  HAS_ISSUES:   { label: 'Kamchilik mavjud',    color: 'orange', icon: AlertCircle },
  APPROVED:     { label: 'Tasdiqlandi',         color: 'green',  icon: CheckCircle },
  REJECTED:     { label: "Rad etildi",          color: 'red',    icon: XCircle },
};

const colorMap = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   ring: 'bg-gray-500' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-300',   ring: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-300', ring: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-300', ring: 'bg-orange-500' },
  green:  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-300',  ring: 'bg-green-500' },
  red:    { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-300',    ring: 'bg-red-500' },
};

function CountdownCircle({ days }) {
  const total = 15;
  const pct = Math.max(0, Math.min(1, days / total));
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;
  const color = days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#16a34a';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="70" y="62" textAnchor="middle" fontSize="32" fontWeight="bold" fill={color}>{days}</text>
        <text x="70" y="80" textAnchor="middle" fontSize="11" fill="#6b7280">ish kuni</text>
        <text x="70" y="95" textAnchor="middle" fontSize="10" fill="#6b7280">qoldi</text>
      </svg>
      <p className="text-sm text-center" style={{ color }}>
        {days === 0 ? 'Muddati tugadi' : days <= 3 ? 'Muddat tugayapti!' : days <= 7 ? 'Muddat yaqinlashmoqda' : 'Jarayonda'}
      </p>
    </div>
  );
}

export default function TrackApplication() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appNumber, setAppNumber] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL-dagi code parametri bilan avtomatik qidirish
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setAppNumber(code);
      handleSearch(code);
    }
  }, []);

  const handleSearch = async (number) => {
    const q = (number || appNumber).trim().toUpperCase();
    if (!q) { setError("Iltimos ariza raqamini kiriting"); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.get(`${API_BASE}/public/track/${q}`);
      setResult(res.data);
      setSearchParams({ code: q }, { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || 'Ariza topilmadi');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.DRAFT) : null;
  const colors = cfg ? colorMap[cfg.color] : null;
  const StatusIcon = cfg?.icon || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">🌿</div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">Agrosanoat rivojlantirish agentligi</h1>
            <p className="text-xs text-gray-500">Ariza holati tekshirish tizimi</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-gray-800">Ariza holatini tekshirish</h2>
            <p className="text-sm text-gray-500">Ariza raqamingizni kiriting va holatini bilib oling</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={appNumber}
              onChange={e => setAppNumber(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Masalan: ARA-TSH-2025-0001"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
              Qidirish
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <XCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && cfg && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${colors.ring} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                  <StatusIcon size={24} className={colors.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-white bg-opacity-70 px-2 py-0.5 rounded font-mono text-gray-700">{result.app_number}</code>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className={`font-bold text-lg mt-1 ${colors.text}`}>{result.subject_name || 'Ariza'}</h3>
                  {result.leader_full_name && (
                    <p className="text-sm text-gray-600 mt-0.5">Rahbar: {result.leader_full_name}</p>
                  )}
                  {result.fruit_type && (
                    <p className="text-sm text-gray-600">Meva turi: {result.fruit_type} {result.garden_area ? `• ${result.garden_area} ga` : ''}</p>
                  )}
                </div>
              </div>

              {/* Kamchilik izohi */}
              {result.status === 'HAS_ISSUES' && result.admin_comment && (
                <div className="mt-4 bg-orange-100 border border-orange-300 rounded-xl px-4 py-3 text-sm text-orange-800">
                  <strong>Izoh:</strong> {result.admin_comment}
                </div>
              )}
            </div>

            {/* Countdown - faqat APPROVED uchun */}
            {result.status === 'APPROVED' && result.countdown_days !== null && (
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h4 className="text-sm font-semibold text-gray-700 text-center mb-4">📋 PDF hujjat yuborish muddati</h4>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <CountdownCircle days={result.countdown_days} />
                  </div>
                  <div className="flex-1 space-y-3 text-sm text-gray-600">
                    <p>
                      Arizangiz <strong className="text-green-700">tasdiqlandi</strong>. Agentlik 15 ish kuni ichida
                      sizga PDF hujjat yuborishi kerak.
                    </p>
                    {result.approved_at && (
                      <p>
                        Tasdiqlangan sana:{' '}
                        <strong>{new Date(result.approved_at).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                      </p>
                    )}
                    {result.deadline_date && (
                      <p>
                        Muddat tugaydi:{' '}
                        <strong className={result.countdown_days <= 3 ? 'text-red-600' : 'text-gray-800'}>
                          {new Date(result.deadline_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </strong>
                      </p>
                    )}
                    {result.countdown_days === 0 && (
                      <p className="text-red-600 font-medium">
                        ⚠️ Muddat tugagan. Agentlik bilan bog'laning.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status izoh bloki */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Ariza jarayoni</h4>
              <div className="space-y-2">
                {[
                  { s: 'SUBMITTED',    label: 'Qabul qilindi' },
                  { s: 'UNDER_REVIEW', label: "Ko'rib chiqilmoqda" },
                  { s: 'APPROVED',     label: 'Tasdiqlandi' },
                ].map(({ s, label }, i) => {
                  const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'HAS_ISSUES', 'APPROVED', 'REJECTED'];
                  const currentIdx = statuses.indexOf(result.status);
                  const thisIdx = statuses.indexOf(s);
                  const done = result.status === 'APPROVED' ? true : currentIdx > thisIdx;
                  const active = result.status === s || (s === 'UNDER_REVIEW' && result.status === 'HAS_ISSUES');
                  return (
                    <div key={s} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? 'bg-yellow-50' : done ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-green-500 text-white' : active ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${done ? 'text-green-700' : active ? 'text-yellow-700 font-medium' : 'text-gray-400'}`}>{label}</span>
                      {active && !done && <span className="ml-auto text-xs text-yellow-600 font-medium animate-pulse">Jarayonda</span>}
                      {done && <span className="ml-auto text-xs text-green-600">✅</span>}
                    </div>
                  );
                })}
                {result.status === 'REJECTED' && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✕</div>
                    <span className="text-sm text-red-700 font-medium">Rad etildi</span>
                  </div>
                )}
              </div>
              {result.submitted_at && (
                <p className="text-xs text-gray-400 mt-3">
                  Yuborilgan sana: {new Date(result.submitted_at).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t bg-white">
        Agrosanoat rivojlantirish agentligi © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
