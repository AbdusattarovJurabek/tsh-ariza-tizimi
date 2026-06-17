import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Login va parolni kiriting');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Xush kelibsiz, ${user.full_name}!`);
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'USER') {
        navigate('/');
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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f2540 0%, #1e3a5f 50%, #16a34a 100%)' }}>
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 px-12 text-white">
        <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
          <Leaf size={40} className="text-green-400" />
        </div>
        <h1 className="text-4xl font-bold mb-3 text-center">Agrosanoat</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-4 text-center">Rivojlantirish Agentligi</h2>
        <p className="text-white/70 text-center max-w-md text-lg leading-relaxed">
          Bog' tashkil etish bo'yicha texnik shart arizalarini elektron tarzda topshirish va kuzatib borish tizimi
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-sm">
          {[
            { num: '200+', label: 'Foydalanuvchi' },
            { num: '6', label: 'Bosqich' },
            { num: '12', label: 'Hujjat turi' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold text-green-300">{num}</div>
              <div className="text-xs text-white/70 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[440px] px-6 py-12 bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
              <Leaf size={32} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Tizimga kirish</h2>
          <p className="text-gray-500 text-sm mb-8">Login va parolingizni kiriting</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Login</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10"
                  placeholder="username"
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
            <p className="text-xs text-gray-500 font-medium mb-2">Test ma'lumotlari:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>Super Admin:</span><code className="bg-gray-200 px-1 rounded">superadmin / Admin@123</code></div>
              <div className="flex justify-between"><span>Admin:</span><code className="bg-gray-200 px-1 rounded">admin1 / Admin@123</code></div>
              <div className="flex justify-between"><span>Foydalanuvchi:</span><code className="bg-gray-200 px-1 rounded">user001 / User@123</code></div>
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
