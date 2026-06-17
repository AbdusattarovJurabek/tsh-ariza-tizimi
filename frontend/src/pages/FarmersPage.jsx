import React, { useState, useEffect } from 'react';
import { farmerAPI } from '../services/api';
import { UZBEKISTAN_REGIONS, UZBEKISTAN_DISTRICTS } from '../utils/constants';
import toast from 'react-hot-toast';

const emptyForm = {
  full_name: '',
  leader_full_name: '',
  legal_address: '',
  stir: '',
  region: '',
  district: '',
  land_area: ''
};

function validate(form) {
  const errors = {};
  if (!form.full_name.trim())        errors.full_name        = 'Fermer nomi majburiy';
  if (!form.leader_full_name.trim()) errors.leader_full_name = 'Direktor F.I.Sh. majburiy';
  if (!form.stir.trim())             errors.stir             = 'INN majburiy';
  else if (!/^\d{9}$/.test(form.stir.trim())) errors.stir   = 'INN aynan 9 ta raqamdan iborat bo\'lishi kerak';
  if (!form.region)                  errors.region           = 'Viloyat majburiy';
  if (!form.district)                errors.district         = 'Tuman majburiy';
  if (!form.legal_address.trim())    errors.legal_address    = 'Yuridik manzil majburiy';
  if (!form.land_area || isNaN(parseFloat(form.land_area)) || parseFloat(form.land_area) <= 0)
                                     errors.land_area        = 'Yer maydoni majburiy (0 dan katta)';
  return errors;
}

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default function FarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { loadFarmers(); }, []);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getAll();
      setFarmers(res.data);
    } catch {
      toast.error('Fermerlarni yuklashda xato');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      [field]: val,
      // Viloyat o'zgarganda tumanni tozalash
      ...(field === 'region' ? { district: '' } : {})
    }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const openAdd = () => {
    setEditFarmer(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditFarmer(f);
    setForm({
      full_name:        f.full_name        || '',
      leader_full_name: f.leader_full_name || '',
      legal_address:    f.legal_address    || '',
      stir:             f.stir             || '',
      region:           f.region           || '',
      district:         f.district         || '',
      land_area:        f.land_area        ? String(f.land_area) : ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Majburiy maydonlarni to'liq to'ldiring");
      return;
    }
    setSaving(true);
    try {
      if (editFarmer) {
        await farmerAPI.update(editFarmer.id, form);
        toast.success('Fermer yangilandi');
      } else {
        await farmerAPI.create(form);
        toast.success("Fermer qo'shildi");
      }
      setShowModal(false);
      loadFarmers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Xato';
      // STIR takror bo'lsa
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('stir')) {
        setErrors(prev => ({ ...prev, stir: 'Bu INN allaqachon mavjud' }));
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await farmerAPI.delete(deleteId);
      toast.success("Fermer o'chirildi");
      setDeleteId(null);
      loadFarmers();
    } catch (err) {
      toast.error(err.response?.data?.error || "O'chirishda xato");
      setDeleteId(null);
    }
  };

  const districts = form.region ? (UZBEKISTAN_DISTRICTS[form.region] || []) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fermerlar bazasi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ariza berishda INN kiritilsa, fermer ma'lumotlari avtomatik to'ldiriladi
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi fermer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : farmers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Fermerlar bazasi bo'sh</p>
          <p className="text-gray-400 text-sm mt-1">Ariza berish uchun avval fermer qo'shing</p>
          <button onClick={openAdd} className="btn-primary mt-4">Birinchi fermerni qo'shish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {f.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.full_name}</h3>
                    {f.stir && <p className="text-xs text-gray-500 font-mono">INN: {f.stir}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(f)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Tahrirlash">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteId(f.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="O'chirish">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                {f.leader_full_name && (
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Direktor: {f.leader_full_name}</span>
                  </div>
                )}
                {f.region && (
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{f.region}{f.district ? `, ${f.district}` : ''}</span>
                  </div>
                )}
                {f.legal_address && (
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="line-clamp-1">{f.legal_address}</span>
                  </div>
                )}
                {f.land_area && (
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Yer maydoni: <strong>{f.land_area} ga</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Qo'shish / Tahrirlash modali */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editFarmer ? 'Fermerni tahrirlash' : "Yangi fermer qo'shish"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* INN — birinchi */}
              <Field label="INN (STIR)" required error={errors.stir}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={form.stir}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setForm(prev => ({ ...prev, stir: val }));
                    if (errors.stir) setErrors(prev => ({ ...prev, stir: '' }));
                  }}
                  placeholder="9 ta raqam"
                  className={`input-field font-mono ${errors.stir ? 'border-red-400' : ''}`}
                />
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < form.stir.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </Field>

              {/* Fermer nomi */}
              <Field label="Fermer (tashkilot) nomi" required error={errors.full_name}>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set('full_name')}
                  placeholder="Masalan: Bahor Fermer xo'jaligi"
                  className={`input-field ${errors.full_name ? 'border-red-400' : ''}`}
                />
              </Field>

              {/* Direktor FIO */}
              <Field label="Direktor F.I.Sh." required error={errors.leader_full_name}>
                <input
                  type="text"
                  value={form.leader_full_name}
                  onChange={set('leader_full_name')}
                  placeholder="Familiya Ism Sharif"
                  className={`input-field ${errors.leader_full_name ? 'border-red-400' : ''}`}
                />
              </Field>

              {/* Viloyat */}
              <Field label="Viloyat" required error={errors.region}>
                <select
                  value={form.region}
                  onChange={set('region')}
                  className={`input-field ${errors.region ? 'border-red-400' : ''}`}
                >
                  <option value="">— Viloyatni tanlang —</option>
                  {UZBEKISTAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              {/* Tuman */}
              <Field label="Tuman" required error={errors.district}>
                <select
                  value={form.district}
                  onChange={set('district')}
                  disabled={!form.region}
                  className={`input-field ${errors.district ? 'border-red-400' : ''} ${!form.region ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">{form.region ? '— Tumanni tanlang —' : '— Avval viloyat tanlang —'}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>

              {/* Yuridik manzil */}
              <Field label="Yuridik manzil" required error={errors.legal_address}>
                <input
                  type="text"
                  value={form.legal_address}
                  onChange={set('legal_address')}
                  placeholder="To'liq yuridik manzil"
                  className={`input-field ${errors.legal_address ? 'border-red-400' : ''}`}
                />
              </Field>

              {/* Yer maydoni */}
              <Field label="Yer maydoni (ga)" required error={errors.land_area}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.land_area}
                  onChange={set('land_area')}
                  placeholder="Masalan: 5.5"
                  className={`input-field ${errors.land_area ? 'border-red-400' : ''}`}
                />
              </Field>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Bekor qilish
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50">
                {saving ? 'Saqlanmoqda...' : editFarmer ? 'Yangilash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O'chirish tasdiqlash */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Fermerni o'chirish</h3>
                <p className="text-sm text-gray-500">Bu amalni bekor qilib bo'lmaydi</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                Bekor qilish
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
