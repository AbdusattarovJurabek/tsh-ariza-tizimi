import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Leaf, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Login va parolni kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(username.trim(), password);
      const { user, token } = res.data;
      login(user, token);

      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'USER') {
        navigate('/');
      } else if (user.role === 'TASDIQLOVCHI') {
        navigate('/tasdiqlovchi');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 text-white mb-4 shadow-lg shadow-primary-500/30">
            <Leaf size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ARA TSH Tizimi</h1>
          <p className="text-gray-400 text-sm mt-1">Bog'dorchilik va uzumchilik loyihalari bo'yicha texnik shartlar olinadigan avtomatlashtirilgan axborot tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
          <h2 className="text-lg font-semibold text-navy-800 mb-6 text-center">Tizimga kirish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Login / STIR</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10"
                  placeholder="STIR yoki foydalanuvchi nomi"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Kirish...
                </span>
              ) : 'Kirish'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-2">Tizimga kirish:</p>
            <div className="space-y-1.5 text-xs text-gray-600">
              {[
                { rol: 'Arizachi', login: 'user001', parol: 'User@123' },
                { rol: 'Tasdiqlovchi', login: 'tasdiqlovchi1', parol: 'Admin@123' },
                { rol: 'Super Admin', login: 'superadmin', parol: 'Admin@123' },
              ].map(({ rol, login, parol }) => (
                <div key={login} className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 w-24 shrink-0">{rol}:</span>
                  <code
                    className="bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors flex-1 text-center"
                    onClick={() => { setUsername(login); setPassword(parol); }}
                    title="Bosing — avtomatik to'ldiradi"
                  >
                    {login}
                  </code>
                </div>
              ))}
              <p className="text-gray-400 text-center pt-1">Bosing — avtomatik to'ldiriladi</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 Agrosanoat Rivojlantirish Agentligi
          </p>
        </div>
      </div>
    </div>
  );
}
