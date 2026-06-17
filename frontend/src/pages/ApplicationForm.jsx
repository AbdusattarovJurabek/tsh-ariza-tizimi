import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Save, Send, Upload, X, FileText,
  CheckCircle, User, MapPin, Leaf, Briefcase, Paperclip, Eye
} from 'lucide-react';
import { applicationAPI, farmerAPI } from '../services/api';
import { FRUIT_TYPES, UZBEKISTAN_REGIONS, FILE_TYPE_LABELS } from '../utils/constants';

const STEPS = [
  { id: 1, label: "Subyekt ma'lumotlari", icon: User },
  { id: 2, label: "Yer maydoni", icon: MapPin },
  { id: 3, label: "Agrotexnik", icon: Leaf },
  { id: 4, label: "Loyiha", icon: Briefcase },
  { id: 5, label: "Hujjatlar", icon: Paperclip },
  { id: 6, label: "Tekshirish", icon: Eye },
];

const FILE_TYPES = Object.entries(FILE_TYPE_LABELS);

const InputField = ({ label, required, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input className={`input-field ${error ? 'border-red-400' : ''}`} {...props} />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const TextareaField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea rows={3} className="input-field resize-none" {...props} />
  </div>
);

export default function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appId, setAppId] = useState(id ? parseInt(id) : null);
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Fermer
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [foundFarmer, setFoundFarmer] = useState(null);

  // Tasdiqlash modali
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    subject_name: '', leader_full_name: '', legal_address: '',
    stir: '', mfo: '', bank_account: '', bank_name: '',
    total_land_area: '', land_specialization: '', garden_area: '',
    land_contour: '', garden_address: '', location_url: '', qr_code: '',
    land_decision_number: '', land_decision_date: '', lease_contract_number: '',
    lease_contract_date: '', registry_number: '',
    soil_type: '', soil_composition: '', soil_quality: '', soil_fertility: '',
    water_supply_info: '', weather_analysis: '', scientific_recommendation: '',
    fruit_type: '', fruit_variety: '', planting_scheme: '',
    seedling_count: '', planting_period: '', water_source: '',
    project_amount: '', permanent_jobs: '', seasonal_jobs: '', supplier_companies: ''
  });

  // Fermerlarni yuklash
  useEffect(() => {
    farmerAPI.getAll().then(res => setFarmers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      applicationAPI.getOne(id).then(res => {
        const data = res.data;
        const newForm = {};
        Object.keys(form).forEach(k => {
          newForm[k] = data[k] !== null && data[k] !== undefined ? String(data[k]) : '';
        });
        setForm(newForm);
        setFiles(data.files || []);
        setAppId(data.id);
        if (data.farmer_id) setSelectedFarmerId(String(data.farmer_id));
      }).catch(() => toast.error('Arizani yuklashda xato'));
    }
  }, [id]);

  // Fermer topilganda avtomatik to'ldirish va qulflash
  const applyFarmer = (farmer) => {
    setSelectedFarmerId(String(farmer.id));
    setFoundFarmer(farmer);
    setForm(prev => ({
      ...prev,
      // Fermerdan olinadigan maydonlar (keyinchalik readonly bo'ladi)
      subject_name:     farmer.full_name        || prev.subject_name,
      leader_full_name: farmer.leader_full_name || prev.leader_full_name,
      legal_address:    farmer.legal_address    || prev.legal_address,
      stir:             farmer.stir             || prev.stir,
      total_land_area:  farmer.land_area        ? String(farmer.land_area) : prev.total_land_area,
    }));
  };

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));

    // INN kiritilganda fermer bazasidan qidirish va avtomatik to'ldirish
    if (field === 'stir') {
      const trimmed = value.replace(/\D/g, '').slice(0, 9);
      setForm(prev => ({ ...prev, stir: trimmed }));
      if (trimmed.length === 9) {
        const match = farmers.find(f => f.stir && f.stir.trim() === trimmed);
        if (match) {
          applyFarmer(match);
        } else {
          setFoundFarmer(null);
          setSelectedFarmerId('');
          // Agar avval to'ldirilgan bo'lsa, tozalash
          setForm(prev => ({
            ...prev,
            stir: trimmed,
            subject_name: '',
            leader_full_name: '',
            legal_address: '',
            total_land_area: '',
          }));
        }
      } else {
        setFoundFarmer(null);
        setSelectedFarmerId('');
      }
      return; // set ichida ikkinchi setForm chaqirilmasin
    }
  };

  // Fermerdan olingan maydonlarmi? (readonly bo'lishi kerak)
  const isFarmerField = foundFarmer && selectedFarmerId
    ? ['subject_name', 'leader_full_name', 'legal_address']
    : [];

  const validateStep1 = () => {
    const e = {};
    if (!form.stir || form.stir.length !== 9) {
      e.stir = "INN aynan 9 ta raqam bo'lishi kerak";
    } else if (!foundFarmer) {
      e.stir = "Bu INN bo'yicha fermer topilmadi. Avval fermer qo'shing";
    }
    if (!form.subject_name)     e.subject_name     = 'Majburiy maydon';
    if (!form.leader_full_name) e.leader_full_name = 'Majburiy maydon';
    if (!form.legal_address)    e.legal_address    = 'Majburiy maydon';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.garden_area) e.garden_area = 'Majburiy maydon';
    if (!form.garden_address) e.garden_address = 'Majburiy maydon';
    return e;
  };

  const validateStep4 = () => {
    const e = {};
    if (!form.fruit_type) e.fruit_type = 'Majburiy maydon';
    if (!form.seedling_count) e.seedling_count = 'Majburiy maydon';
    return e;
  };

  const saveData = async (showToast = true) => {
    setSaving(true);
    try {
      const payload = { ...form, farmer_id: selectedFarmerId || null };
      if (appId) {
        await applicationAPI.update(appId, payload);
        if (showToast) toast.success('Saqlandi');
      } else {
        const res = await applicationAPI.create(payload);
        setAppId(res.data.id);
        navigate(`/applications/${res.data.id}/edit`, { replace: true });
        if (showToast) toast.success('Ariza yaratildi');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    let e = {};
    if (step === 1) e = validateStep1();
    if (step === 2) e = validateStep2();
    if (step === 4) e = validateStep4();

    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    await saveData(false);
    setStep(s => Math.min(s + 1, 6));
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  };

  // Yuborish — avval tasdiqlash modali
  const handleSubmitClick = () => {
    if (!appId) { toast.error('Avval arizani saqlang'); return; }
    setShowConfirm(true);
  };

  const handleSubmitConfirmed = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await applicationAPI.submit(appId);
      toast.success('Ariza muvaffaqiyatli yuborildi!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Yuborishda xato');
    } finally {
      setSubmitting(false);
    }
  };

  const FileUploadSection = ({ fileType, label }) => {
    const existing = files.find(f => f.file_type === fileType);

    const onDrop = useCallback(async (acceptedFiles) => {
      if (!appId) { await saveData(false); }
      if (!acceptedFiles[0]) return;
      setUploadingFile(fileType);
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      formData.append('file_type', fileType);
      try {
        const res = await applicationAPI.uploadFile(appId, formData);
        setFiles(prev => [...prev.filter(f => f.file_type !== fileType), res.data]);
        toast.success('Fayl yuklandi');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Fayl yuklashda xato');
      } finally {
        setUploadingFile(null);
      }
    }, [appId, fileType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024,
      disabled: !!uploadingFile,
    });

    const handleDelete = async (fileId) => {
      try {
        await applicationAPI.deleteFile(appId, fileId);
        setFiles(prev => prev.filter(f => f.id !== fileId));
        toast.success("Fayl o'chirildi");
      } catch {
        toast.error("O'chirishda xato");
      }
    };

    return (
      <div className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
        <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
        {existing ? (
          <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 flex-1 truncate">{existing.file_name}</span>
            <button onClick={() => handleDelete(existing.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <input {...getInputProps()} />
            {uploadingFile === fileType ? (
              <div className="flex items-center justify-center gap-2 text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-xs">Yuklanmoqda...</span>
              </div>
            ) : (
              <>
                <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Fayl tashlang yoki bosing</p>
                <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC (max 10MB)</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Subyekt ma'lumotlari</h3>

            {/* ① INN — ENG BIRINCHI, fermer qidiradi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                INN (STIR) <span className="text-red-500">*</span>
                <span className="text-xs text-primary-600 font-normal ml-2">— bazadan avtomatik to'ldiriladi</span>
              </label>
              <div className="flex gap-2">
                <input
                  className={`input-field font-mono flex-1 ${errors.stir ? 'border-red-400' : foundFarmer ? 'border-green-400 bg-green-50' : ''}`}
                  value={form.stir}
                  onChange={set('stir')}
                  placeholder="9 ta raqam kiriting..."
                  maxLength={9}
                  inputMode="numeric"
                />
                {/* INN progress indikator */}
                {form.stir.length > 0 && form.stir.length < 9 && (
                  <span className="flex items-center text-xs text-gray-400 whitespace-nowrap">
                    {form.stir.length}/9
                  </span>
                )}
              </div>
              {/* INN progress bar */}
              {form.stir.length > 0 && (
                <div className="flex gap-0.5 mt-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      i < form.stir.length
                        ? (form.stir.length === 9 ? (foundFarmer ? 'bg-green-500' : 'bg-red-400') : 'bg-yellow-400')
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
              {errors.stir && <p className="text-red-500 text-xs mt-1">{errors.stir}</p>}

              {/* Topilgan fermer kartochkasi */}
              {foundFarmer && (
                <div className="mt-2 bg-green-50 border border-green-300 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 text-sm">✅</span>
                    <p className="text-sm font-bold text-green-800">{foundFarmer.full_name}</p>
                    <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Topildi</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-0.5 pl-5">
                    {foundFarmer.leader_full_name && <p>👤 {foundFarmer.leader_full_name}</p>}
                    {(foundFarmer.region || foundFarmer.district) && (
                      <p>📍 {[foundFarmer.region, foundFarmer.district].filter(Boolean).join(', ')}</p>
                    )}
                    {foundFarmer.land_area && <p>🌾 Yer maydoni: {foundFarmer.land_area} ga</p>}
                  </div>
                  <p className="text-xs text-green-600 mt-2 pl-5">
                    Quyidagi maydonlar avtomatik to'ldirildi va o'zgartirib bo'lmaydi.
                  </p>
                </div>
              )}

              {/* Topilmadi → fermer qo'shish havola */}
              {form.stir.length === 9 && !foundFarmer && (
                <div className="mt-2 bg-orange-50 border border-orange-300 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-orange-500 text-sm flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm text-orange-800 font-medium">
                      Bu INN bo'yicha fermer topilmadi
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Avval{' '}
                      <a href="/farmers" target="_blank" className="underline font-semibold hover:text-orange-800">
                        Fermerlar sahifasida →
                      </a>{' '}
                      fermerni qo'shing, so'ng qaytib keling.
                    </p>
                  </div>
                </div>
              )}

              {form.stir.length === 0 && farmers.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Fermerlar bazasi bo'sh.{' '}
                  <a href="/farmers" target="_blank" className="text-primary-600 underline">Fermer qo'shish →</a>
                </p>
              )}
            </div>

            {/* ② Fermerdan olingan maydonlar — readonly */}
            <div className={`space-y-4 transition-all ${!foundFarmer ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Quyidagi ma'lumotlar fermer bazasidan olingan va o'zgartirib bo'lmaydi
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subyekt nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    readOnly
                    className="input-field bg-gray-50 text-gray-700 cursor-not-allowed"
                    value={form.subject_name}
                    placeholder="INN kiritilganda avtomatik to'ldiriladi"
                  />
                  {errors.subject_name && <p className="text-red-500 text-xs mt-1">{errors.subject_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rahbar (Direktor) F.I.Sh. <span className="text-red-500">*</span>
                  </label>
                  <input
                    readOnly
                    className="input-field bg-gray-50 text-gray-700 cursor-not-allowed"
                    value={form.leader_full_name}
                    placeholder="INN kiritilganda avtomatik to'ldiriladi"
                  />
                  {errors.leader_full_name && <p className="text-red-500 text-xs mt-1">{errors.leader_full_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yuridik manzil <span className="text-red-500">*</span>
                </label>
                <textarea
                  readOnly
                  rows={2}
                  className="input-field resize-none bg-gray-50 text-gray-700 cursor-not-allowed"
                  value={form.legal_address}
                  placeholder="INN kiritilganda avtomatik to'ldiriladi"
                />
                {errors.legal_address && <p className="text-red-500 text-xs mt-1">{errors.legal_address}</p>}
              </div>
            </div>

            {/* ③ Qo'lda kiritiladigan rekvizitlar */}
            <div className="pt-2 border-t">
              <h4 className="font-medium text-gray-700 mb-3 text-sm">Bank rekvizitlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="MFO" value={form.mfo} onChange={set('mfo')} placeholder="5 ta raqam" maxLength={5} />
                <InputField label="Hisob raqam" value={form.bank_account} onChange={set('bank_account')} placeholder="20 ta raqam" />
                <InputField label="Bank nomi" value={form.bank_name} onChange={set('bank_name')} placeholder="Bank nomi" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Yer maydoni ma'lumotlari</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Umumiy yer maydoni (ga)" value={form.total_land_area} onChange={set('total_land_area')} type="number" step="0.01" placeholder="0.00" />
              <InputField label="Ixtisoslik" value={form.land_specialization} onChange={set('land_specialization')} placeholder="Yer uchastkasi ixtisosligi" />
              <InputField label="Bog' maydoni (ga)" required value={form.garden_area} onChange={set('garden_area')} type="number" step="0.01" placeholder="0.00" error={errors.garden_area} />
              <InputField label="Yer maydoni konturi" value={form.land_contour} onChange={set('land_contour')} placeholder="Kontur raqami" />
            </div>
            <TextareaField label="Bog' tashkil qilinadigan manzil" required value={form.garden_address} onChange={set('garden_address')} placeholder="To'liq manzil" />
            {/* Lokatsiya + QR kod */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokatsiya havolasi (Google Maps)</label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    className="input-field"
                    value={form.location_url}
                    onChange={set('location_url')}
                    placeholder="https://maps.google.com/..."
                  />
                  {form.location_url && (
                    <a href={form.location_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      🔗 Xaritada ko'rish
                    </a>
                  )}
                </div>
                {/* QR kod preview */}
                {form.location_url && form.location_url.startsWith('http') && (
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(form.location_url)}&size=100x100&margin=2`}
                      alt="QR kod"
                      className="w-24 h-24 border rounded-lg bg-white p-1"
                    />
                    <span className="text-xs text-gray-400">QR kod</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Yer ajratish qarori raqami" value={form.land_decision_number} onChange={set('land_decision_number')} placeholder="Qaror raqami" />
              <InputField label="Qaror sanasi" value={form.land_decision_date} onChange={set('land_decision_date')} type="date" />
              <InputField label="Ijara shartnomasi raqami" value={form.lease_contract_number} onChange={set('lease_contract_number')} placeholder="Shartnoma raqami" />
              <InputField label="Shartnoma sanasi" value={form.lease_contract_date} onChange={set('lease_contract_date')} type="date" />
              <InputField label="Reestr raqami" value={form.registry_number} onChange={set('registry_number')} placeholder="Reestr raqami" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Agrotexnik ma'lumotlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Tuproq tipi" value={form.soil_type} onChange={set('soil_type')} placeholder="Qo'ng'ir, bo'z..." />
              <InputField label="Tuproq tarkibi" value={form.soil_composition} onChange={set('soil_composition')} placeholder="Tarkibi" />
              <InputField label="Tuproq sifati" value={form.soil_quality} onChange={set('soil_quality')} placeholder="Sifat ko'rsatkichi" />
              <InputField label="Tuproq unumdorligi" value={form.soil_fertility} onChange={set('soil_fertility')} placeholder="Unumdorlik darajasi" />
            </div>
            <TextareaField label="Suv ta'minlanganlik xulosasi" value={form.water_supply_info} onChange={set('water_supply_info')} placeholder="Suv ta'minoti haqida ma'lumot" />
            <TextareaField label="5 yillik ob-havo tahlili" value={form.weather_analysis} onChange={set('weather_analysis')} placeholder="Ob-havo tahlili ma'lumotlari" />
            <TextareaField label="Ilmiy-tadqiqot tavsiyasi" value={form.scientific_recommendation} onChange={set('scientific_recommendation')} placeholder="Ilmiy muassasa tavsiyasi" />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Ko'chat va Loyiha ma'lumotlari</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meva turi <span className="text-red-500">*</span></label>
                <select className={`input-field ${errors.fruit_type ? 'border-red-400' : ''}`} value={form.fruit_type} onChange={set('fruit_type')}>
                  <option value="">Tanlang...</option>
                  {FRUIT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {errors.fruit_type && <p className="text-red-500 text-xs mt-1">{errors.fruit_type}</p>}
              </div>
              <InputField label="Meva navi" value={form.fruit_variety} onChange={set('fruit_variety')} placeholder="Navlar ro'yxati" />
              <InputField label="Ekish sxemasi" value={form.planting_scheme} onChange={set('planting_scheme')} placeholder="masalan: 4x2m" />
              <InputField label="Ko'chat soni (dona)" required value={form.seedling_count} onChange={set('seedling_count')} type="number" placeholder="0" error={errors.seedling_count} />
              <InputField label="Taxminiy ekilish davri" value={form.planting_period} onChange={set('planting_period')} placeholder="masalan: 2026-yil bahor" />
              <InputField label="Suv manbasi" value={form.water_source} onChange={set('water_source')} placeholder="Kanal, quduq, daryo..." />
              <InputField label="Loyiha summasi (so'm)" value={form.project_amount} onChange={set('project_amount')} type="number" placeholder="0" />
            </div>
            <h4 className="font-medium text-gray-700 pt-2">Ish o'rinlari</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Doimiy ish o'rni" value={form.permanent_jobs} onChange={set('permanent_jobs')} type="number" placeholder="0" />
              <InputField label="Mavsumiy ish o'rni" value={form.seasonal_jobs} onChange={set('seasonal_jobs')} type="number" placeholder="0" />
            </div>
            <TextareaField label="Ta'minotchi korxonalar" value={form.supplier_companies} onChange={set('supplier_companies')} placeholder="Ko'chat, sug'orish uskunalari ta'minotchilari" />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Hujjatlar yuklash</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              PDF, JPG, PNG, DOC, DOCX formatlar qabul qilinadi (har biri max 10MB)
            </div>
            {!appId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                Hujjat yuklash uchun avval arizani saqlang
                <button onClick={() => saveData(true)} className="ml-3 underline font-medium">Saqlash</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FILE_TYPES.map(([type, label]) => (
                <FileUploadSection key={type} fileType={type} label={label} />
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">Tekshirish va yuborish</h3>

            {selectedFarmerId && farmers.find(f => String(f.id) === selectedFarmerId) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">🌾</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Fermer</p>
                  <p className="text-sm text-green-700">{farmers.find(f => String(f.id) === selectedFarmerId)?.full_name}</p>
                </div>
              </div>
            )}

            {[
              { title: "1. Subyekt ma'lumotlari", items: [
                ['Subyekt nomi', form.subject_name],
                ['Rahbar', form.leader_full_name],
                ['Yuridik manzil', form.legal_address],
                ['STIR', form.stir],
                ['MFO', form.mfo],
                ['Bank', form.bank_name],
              ]},
              { title: "2. Yer maydoni", items: [
                ["Umumiy maydon (ga)", form.total_land_area],
                ["Bog' maydoni (ga)", form.garden_area],
                ["Bog' manzili", form.garden_address],
                ['Reestr raqami', form.registry_number],
              ]},
              { title: "3. Agrotexnik", items: [
                ['Tuproq tipi', form.soil_type],
                ['Suv ta\'minoti', form.water_supply_info],
              ]},
              { title: "4. Loyiha", items: [
                ['Meva turi', form.fruit_type],
                ['Meva navi', form.fruit_variety],
                ["Ko'chat soni", form.seedling_count],
                ['Loyiha summasi', form.project_amount ? `${parseInt(form.project_amount).toLocaleString()} so'm` : ''],
                ["Doimiy ish o'rni", form.permanent_jobs],
                ["Mavsumiy ish o'rni", form.seasonal_jobs],
              ]},
            ].map(({ title, items }) => (
              <div key={title} className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">{title}</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-xs text-gray-500 min-w-0 flex-shrink-0">{k}:</dt>
                      <dd className="text-xs text-gray-800 font-medium truncate">{v || <span className="text-gray-400 italic">kiritilmagan</span>}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-700 mb-3 text-sm">5. Yuklangan hujjatlar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FILE_TYPES.map(([type, label]) => {
                  const f = files.find(f => f.file_type === type);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      {f ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> : <X size={14} className="text-gray-300 flex-shrink-0" />}
                      <span className={`text-xs ${f ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ Diqqat!</p>
              <p className="text-sm text-yellow-700 mt-1">
                Arizani yuborganingizdan so'ng, admin "Kamchilik bor" statusini qo'ymaguncha tahrirlash imkoniyati bo'lmaydi. Ma'lumotlar to'g'riligini tekshiring.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="card !p-4">
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? 'border-primary-600 bg-primary-600 text-white' :
                    isDone ? 'border-primary-500 bg-primary-50 text-primary-600' :
                    'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${isActive ? 'text-primary-600' : isDone ? 'text-primary-500' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${isDone ? 'bg-primary-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="card">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={handlePrev} disabled={step === 1} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={16} /> Orqaga
        </button>

        <div className="flex gap-3">
          <button onClick={() => saveData(true)} disabled={saving} className="btn-secondary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>

          {step < 6 ? (
            <button onClick={handleNext} disabled={saving} className="btn-primary flex items-center gap-2">
              Keyingi <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmitClick}
              disabled={submitting || saving}
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send size={16} /> {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          )}
        </div>
      </div>

      {/* Tasdiqlash modali */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send size={28} />
              </div>
              <h2 className="text-xl font-bold">Arizani yuborish</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-center mb-2 font-medium text-lg">
                Rostan ham yubormoqchimisiz?
              </p>
              <p className="text-gray-500 text-sm text-center mb-6">
                Ariza adminlar ko'rib chiqishi uchun yuboriladi. Yuborilgandan so'ng tahrirlab bo'lmaydi.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmitConfirmed}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Ha, yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
