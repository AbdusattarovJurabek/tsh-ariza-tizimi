import React, { useState, useEffect, useCallback } from 'react';
import { userAPI, downloadBlob } from '../../services/api';
import { UserPlus, Download, Upload, Search, Edit2, Key, Trash2, X, CheckCircle } from 'lucide-react';
import { UZBEKISTAN_REGIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

// Modal tashqarida — re-render bo'lmaydi
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// UserForm TASHQARIDA aniqlangan — focus yo'qolmaydi
const UserForm = ({ form, onChange, onSubmit, submitting, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">F.I.Sh. *</label>
        <input
          className="input-field text-sm"
          value={form.full_name}
          onChange={e => onChange('full_name', e.target.value)}
          placeholder="To'liq ism"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Login *</label>
        <input
          className="input-field text-sm"
          value={form.username}
          onChange={e => onChange('username', e.target.value)}
          placeholder="username"
          required
          disabled={isEdit}
        />
      </div>
      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Parol *</label>
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
        <select
          className="input-field text-sm"
          value={form.role}
          onChange={e => onChange('role', e.target.value)}
        >
          <option value="USER">Foydalanuvchi</option>
          <option value="TASDIQLOVCHI">Tasdiqlovchi</option>
          <option value="SUPERADMIN">Super Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Viloyat</label>
        <select
          className="input-field text-sm"
          value={form.region}
          onChange={e => onChange('region', e.target.value)}
        >
          <option value="">Tanlang...</option>
          {UZBEKISTAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tuman</label>
        <input
          className="input-field text-sm"
          value={form.district}
          onChange={e => onChange('district', e.target.value)}
          placeholder="Tuman"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
        <input
          className="input-field text-sm"
          value={form.phone}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="+998..."
        />
      </div>
    </div>
    <button type="submit" disabled={submitting} className="btn-primary w-full">
      {submitting ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Yaratish'}
    </button>
  </form>
);

const EMPTY_FORM = { full_name: '', username: '', password: '', role: 'USER', region: '', district: '', phone: '' };

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showReset, setShowReset] = useState(null);
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

  // Form fieldini o'zgartirish — ichki funksiya emas, useCallback bilan
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
      toast.success('Yangilandi');
      setShowEdit(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xato');
    } finally { setSubmitting(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPass || resetPass.length < 6) { toast.error('Parol kamida 6 ta belgi'); return; }
    setSubmitting(true);
    try {
      await userAPI.resetPassword(showReset.id, { new_password: resetPass });
      toast.success('Parol yangilandi');
      setShowReset(null);
      setResetPass('');
    } catch { toast.error('Xato'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`${user.full_name}ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await userAPI.delete(user.id);
      toast.success("O'chirildi");
      loadUsers();
    } catch { toast.error('Xato'); }
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
      region: u.region || '',
      district: u.district || '',
      phone: u.phone || ''
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
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus size={16} /> Yangi
        </button>
        <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
          <Upload size={16} /> {submitting ? 'Importlanmoqda...' : 'Excel import'}
          <input type="file" accept=".xlsx" className="hidden" onChange={handleImport} disabled={submitting} />
        </label>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        Excel import uchun ustunlar: <code className="bg-blue-100 px-1 rounded">full_name, username, password, region, district, phone</code>
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
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <p className="text-sm text-gray-600">Jami: <span className="font-semibold">{total}</span> ta foydalanuvchi</p>
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
                  {['F.I.Sh.', 'Login', 'Rol', 'Viloyat', 'Telefon', 'Holat', 'Arizalar', 'Amal'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{u.full_name}</td>
                    <td className="py-3 px-4"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{u.username}</code></td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : ['TASDIQLOVCHI', 'IMZOLOVCHI'].includes(u.role) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role === 'SUPERADMIN' ? 'Super Admin' : u.role === 'TASDIQLOVCHI' ? 'Tasdiqlovchi' : u.role === 'IMZOLOVCHI' ? 'Imzolovchi' : 'Foydalanuvchi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{u.region || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status === 'ACTIVE' ? 'Faol' : 'Faol emas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{u._count?.applications || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="text-blue-500 hover:text-blue-700" title="Tahrirlash"><Edit2 size={15} /></button>
                        <button onClick={() => { setShowReset(u); setResetPass(''); }} className="text-yellow-500 hover:text-yellow-700" title="Parolni reset"><Key size={15} /></button>
                        <button onClick={() => handleDelete(u)} className="text-red-400 hover:text-red-600" title="O'chirish"><Trash2 size={15} /></button>
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
        <Modal title="Yangi foydalanuvchi" onClose={() => setShowCreate(false)}>
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
        <Modal title="Foydalanuvchini tahrirlash" onClose={() => setShowEdit(null)}>
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
        <Modal title={`Parolni reset: ${showReset.full_name}`} onClose={() => setShowReset(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Yangi parol</label>
              <input
                type="password"
                className="input-field"
                value={resetPass}
                onChange={e => setResetPass(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Yangilanmoqda...' : "Parolni o'zgartirish"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
