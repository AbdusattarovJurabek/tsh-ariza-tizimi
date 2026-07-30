import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, Users, BarChart2,
  LogOut, X, Leaf, Settings, ClipboardList, UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Tizimdan chiqdingiz");
    navigate('/login');
  };

  const isAdmin = user?.role === 'SUPERADMIN';
  const isTasdiqlovchi = user?.role === 'TASDIQLOVCHI';
  const isImzolovchi = user?.role === 'IMZOLOVCHI';

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-navy-800
      transform transition-transform duration-300 ease-in-out
      lg:relative lg:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}
    style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2540 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ARA</p>
            <p className="text-gray-400 text-xs">TSH Tizimi</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-gray-400 text-xs">
              {user?.role === 'SUPERADMIN' ? 'Super Admin' : user?.role === 'TASDIQLOVCHI' ? 'Tasdiqlovchi' : user?.role === 'IMZOLOVCHI' ? 'Imzolovchi' : 'Foydalanuvchi'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <>
            <p className="px-4 py-2 text-gray-500 text-xs uppercase font-semibold tracking-wider">Super Admin</p>
            <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
            <NavItem to="/admin/applications" icon={ClipboardList} label="Barcha arizalar" onClick={onClose} />
            <NavItem to="/admin/statistics" icon={BarChart2} label="Statistika" onClick={onClose} />
            <NavItem to="/admin/users" icon={Users} label="Foydalanuvchilar" onClick={onClose} />
          </>
        )}
        {isTasdiqlovchi && (
          <>
            <p className="px-4 py-2 text-gray-500 text-xs uppercase font-semibold tracking-wider">Tasdiqlovchi</p>
            <NavItem to="/tasdiqlovchi" icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
            <NavItem to="/tasdiqlovchi/applications" icon={ClipboardList} label="Arizalar" onClick={onClose} />
          </>
        )}
        {user?.role === 'USER' && (
          <>
            <p className="px-4 py-2 text-gray-500 text-xs uppercase font-semibold tracking-wider">Mening arizalarim</p>
            <NavItem to="/" icon={LayoutDashboard} label="Bosh sahifa" onClick={onClose} />
            <NavItem to="/farmers" icon={UserCheck} label="Fermerlar bazasi" onClick={onClose} />
            <NavItem to="/applications/new" icon={PlusCircle} label="Yangi ariza" onClick={onClose} />
          </>
        )}

        <div className="border-t border-white/10 pt-2 mt-4">
          <NavItem to="/change-password" icon={Settings} label="Parol o'zgartirish" onClick={onClose} />
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );
}
