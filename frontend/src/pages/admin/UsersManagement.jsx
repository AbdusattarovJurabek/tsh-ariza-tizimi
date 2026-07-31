import React, { useState, useEffect, useCallback } from 'react';
import { userAPI, downloadBlob } from '../../services/api';
import { UserPlus, Download, Upload, Search, Edit2, Key, Trash2, X, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { UZBEKISTAN_REGIONS, UZBEKISTAN_DISTRICTS } from '../../utils/constants';
import toast from 'react-hot-toast';

export const formatUzbekPhone = (val) => {
  if (!val) return '+998 ';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);

  let res = '+998';
  if (digits.length > 0) res += ` (${digits.slice(0, 2)}`;
  if (digits.length >= 2) res += `) ${digits.slice(2, 5)}`;
  if (digits.length >= 5) res += `-${digits.slice(5, 7)}`;
  if (digits.length >= 7) res += `-${digits.slice(7, 9)}`;

  return res;
};

// Modal tashqarida — re-render bo'lmaydi
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// UserForm TASHQARIDA aniqlangan
const UserForm = ({ form, onChange, onSubmit, submitting, isEdit }) => {
  const districts = UZBEKISTAN_DISTRICTS[form.region] || [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">F.I.Sh. *</label>
          <input
            className="input-field text-sm"
            value={form.full_name}
            onChange={e => onChange('full_name', e.target.value)}
            placeholder="To'liq ism familiyasi"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Login *</label>
          <input
            className="input-field text-sm font-mono"
            value={form.username}
            onChange={e => onChange('username', e.target.value)}
            placeholder="username"
            required
            disabled={isEdit}
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Parol *</label>
            <input
              type="password"
              className="input-field text-sm"
              value={form.password}
              onChange={e => onChange('password', e.target.value)}
              placeholder="Kamida 6 belgi"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
          <select
            className="input-field text-sm font-medium"
            value={form.role}
            onChange={e => onChange('role', e.target.value)}
          >
            <option value="USER">Foydalanuvchi</option>
            <option value="TASDIQLOVCHI">Tasdiqlovchi</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Holat (Status)</label>
          <select
            className="input-field text-sm font-medium"
            value={form.status || 'ACTIVE'}
            onChange={e => onChange('status', e.target.value)}
          >
            <option value="ACTIVE">🟢 Faol (Active)</option>
            <option value="BLOCKED">🔴 Bloklangan (Blocked)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Viloyat</label>
          <select
            className="input-field text-sm font-medium"
            value={form.region}
            onChange={e => {
              onChange('region', e.target.value);
              onChange('district', '');
            }}
          >
            <option value="">Viloyatni tanlang...</option>
            {UZBEKISTAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tuman</label>
          <select
            className="input-field text-sm font-medium"
            value={form.district}
            onChange={e => onChange('district', e.target.value)}
            disabled={!form.region}
          >
            <option value="">{form.region ? "Tuman tanlang..." : "Avval viloyatni tanlang"}</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon (O'zbekiston)</label>
          <input
            className="input-field text-sm font-mono"
            value={form.phone || '+998 '}
            onChange={e => onChange('phone', formatUzbekPhone(e.target.value))}
            placeholder="+998 (90) 123-45-67"
            maxLength={19}
          />
        </div>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-sm font-bold shadow-sm mt-2">
        {submitting ? 'Saqlanmoqda...' : isEdit ? '💾 Saqlash' : '➕ Yaratish'}
      </button>
    </form>
  );
};

const EMPTY_FORM = { full_name: '', username: '', password: '', role: 'USER', status: 'ACTIVE', region: '', district: '', phone: '+998 ' };

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showReset, setShowReset] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [resetPass, setResetPass] = useState('');

  const loadUsers = useCallback(() => {
    setLoading(true);
    userAPI.getAll({ search, page, limit: 20 })
      .then(res => { setUsers(res.data.data); setTotal(res.data.total); })
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.username || !form.password) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    try {
      await userAPI.create(form);
      toast.success('Foydalanuvchi yaratildi');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xato');
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userAPI.update(showEdit.id, form);
      toast.success('Foydalanuvchi ma’lumotlari yangilandi');
      setShowEdit(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xato');
    } finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (u) => {
    try {
      const res = await userAPI.toggleStatus(u.id);
      const isBlocked = res.data.status === 'BLOCKED';
      toast.success(isBlocked ? `${u.full_name} bloklandi 🔴` : `${u.full_name} faollashtirildi 🟢`);
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: res.data.status } : item));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Statusni o‘zgartirishda xato');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPass || resetPass.length < 6) { toast.error('Parol kamida 6 ta belgi bo‘lishi shart'); return; }
    setSubmitting(true);
    try {
      await userAPI.resetPassword(showReset.id, { new_password: resetPass });
      toast.success('Parol yangilandi ✓');
      setShowReset(null);
      setResetPass('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Parol yangilashda xato');
    } finally { setSubmitting(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await userAPI.delete(showDelete.id);
      toast.success("Foydalanuvchi to'liq o'chirildi");
      setShowDelete(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "O'chirishda xato");
    } finally { setSubmitting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setSubmitting(true);
    try {
      const res = await userAPI.importExcel(formData);
      setImportResult(res.data);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import xatosi');
    } finally { setSubmitting(false); e.target.value = ''; }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await userAPI.exportExcel();
      downloadBlob(res.data, 'foydalanuvchilar.xlsx');
      toast.success('Yuklab olindi');
    } catch { toast.error('Export xatosi'); }
    finally { setExporting(false); }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const openEdit = (u) => {
    setForm({
      full_name: u.full_name,
      username: u.username,
      password: '',
      role: u.role,
      status: u.status || 'ACTIVE',
      region: u.region || '',
      district: u.district || '',
      phone: u.phone ? formatUzbekPhone(u.phone) : '+998 '
    });
    setShowEdit(u);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Ism yoki login bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} /> Yangi foydalanuvchi
        </button>
        <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer font-medium">
          <Upload size={16} /> {submitting ? 'Importlanmoqda...' : 'Excel import'}
          <input type="file" accept=".xlsx" className="hidden" onChange={handleImport} disabled={submitting} />
        </label>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm font-medium">
          <Download size={16} /> Export
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        Excel import uchun ustunlar: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">full_name, username, password, region, district, phone</code>
      </div>

      {importResult && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Import natijasi</h4>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <p className="text-sm text-green-600 mb-2">
            <CheckCircle size={14} className="inline mr-1" />{importResult.created} ta foydalanuvchi yaratildi
          </p>
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Jadval */}
      <div className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Jami: <span className="text-primary-600 font-extrabold">{total}</span> ta foydalanuvchi</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['F.I.Sh.', 'Login', 'Rol', 'Viloyat / Tuman', 'Telefon', 'Holat (Status)', 'Arizalar', 'Amallar'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800">{u.full_name}</td>
                    <td className="py-3 px-4"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-700">{u.username}</code></td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : u.role === 'TASDIQLOVCHI' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                        {u.role === 'SUPERADMIN' ? 'Super Admin' : u.role === 'TASDIQLOVCHI' ? 'Tasdiqlovchi' : 'Foydalanuvchi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {u.region ? `${u.region}${u.district ? `, ${u.district}` : ''}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs font-mono font-medium">
                      {u.phone ? formatUzbekPhone(u.phone) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                            : 'bg-red-50 text-red-700 border-red-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                        }`}
                        title="Statusni o'zgartirish uchun bosing"
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>🟢 Faol</span>
                          </>
                        ) : (
                          <>
                            <Lock size={12} className="text-red-600" />
                            <span>🔴 Bloklangan</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-bold">{u._count?.applications || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { setShowReset(u); setResetPass(''); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Parolni almashtirish"
                        >
                          <Key size={15} />
                        </button>
                        <button
                          onClick={() => setShowDelete(u)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Foydalanuvchini o'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Yaratish modali */}
      {showCreate && (
        <Modal title="➕ Yangi foydalanuvchi yaratish" onClose={() => setShowCreate(false)}>
          <UserForm
            form={form}
            onChange={handleFormChange}
            onSubmit={handleCreate}
            submitting={submitting}
            isEdit={false}
          />
        </Modal>
      )}

      {/* Tahrirlash modali */}
      {showEdit && (
        <Modal title="✏️ Foydalanuvchini tahrirlash" onClose={() => setShowEdit(null)}>
          <UserForm
            form={form}
            onChange={handleFormChange}
            onSubmit={handleEdit}
            submitting={submitting}
            isEdit={true}
          />
        </Modal>
      )}

      {/* Parol reset modali */}
      {showReset && (
        <Modal title={`🔑 Parolni almashtirish: ${showReset.full_name}`} onClose={() => setShowReset(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Foydalanuvchi logini: <code className="font-bold text-gray-800 font-mono">@{showReset.username}</code>
              </p>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Yangi Parol *</label>
              <input
                type="password"
                className="input-field text-sm"
                value={resetPass}
                onChange={e => setResetPass(e.target.value)}
                placeholder="Yangi parol (kamida 6 ta belgi)"
                required
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowReset(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm transition-colors"
              >
                {submitting ? 'Saqlanmoqda...' : '💾 Parolni saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Chiroyli O'chirish Modali */}
      {showDelete && (
        <Modal title="🗑 Foydalanuvchini o'chirish" onClose={() => setShowDelete(null)}>
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-base">{showDelete.full_name}</h4>
              <p className="text-xs text-gray-500 font-mono font-bold mt-0.5">@{showDelete.username}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 leading-relaxed text-left">
              ⚠️ <strong>Diqqat!</strong> Ushbu foydalanuvchini va unga tegishli barcha arizalarni to'liq va doimiy ravishda bazadan o'chirib yuborasiz. Ushbu amalni ortga qaytarib bo'lmaydi.
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDelete(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4.5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {submitting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
