import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const toggle = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error('Yangi parollar mos kelmadi'); return;
    }
    if (form.new_password.length < 6) {
      toast.error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak'); return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        old_password: form.old_password,
        new_password: form.new_password
      });
      updateUser({ must_change_password: false });
      toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
      navigate(user?.role === 'USER' ? '/' : '/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Parol o\'zgartirishda xato');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, field, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type={show[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={set(field)}
          className="input-field pl-9 pr-10"
          placeholder={placeholder}
          required
        />
        <button type="button" onClick={() => toggle(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Parolni o'zgartirish</h2>
        {user?.must_change_password && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-sm text-yellow-700">
            Birinchi kirishda parolni o'zgartirish talab etiladi
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!user?.must_change_password && (
            <PasswordInput label="Eski parol" field="old" placeholder="••••••••" />
          )}
          <PasswordInput label="Yangi parol" field="new" placeholder="Kamida 6 ta belgi" />
          <PasswordInput label="Yangi parolni tasdiqlang" field="confirm" placeholder="Parolni qaytaring" />
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Saqlanmoqda...' : "Parolni o'zgartirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
