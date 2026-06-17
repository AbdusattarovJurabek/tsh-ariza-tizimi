import React from 'react';
import { Menu, Bell, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Bosh sahifa',
  '/applications/new': 'Yangi ariza yaratish',
  '/change-password': "Parol o'zgartirish",
  '/admin': 'Admin Dashboard',
  '/admin/applications': 'Barcha arizalar',
  '/admin/statistics': 'Statistika',
  '/admin/users': 'Foydalanuvchilar',
};

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'TSH Ariza Tizimi';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Leaf size={20} className="text-primary-600 hidden lg:block" />
          <h1 className="text-gray-800 font-semibold text-base">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
          <span className="text-xs text-gray-400">{user?.region || 'ARA Tizimi'}</span>
        </div>
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user?.full_name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
