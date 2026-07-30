import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteApplicationModal({
  application,
  open,
  deleting,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !deleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, deleting, onClose]);

  if (!open || !application) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-application-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative border-b border-red-100 bg-gradient-to-br from-red-50 to-orange-50 px-6 py-6 text-center">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 disabled:opacity-50"
            aria-label="Yopish"
          >
            <X size={19} />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
            <AlertTriangle size={30} className="text-red-600" />
          </div>
          <h2 id="delete-application-title" className="text-xl font-bold text-gray-900">
            Arizani o‘chirishni xohlaysizmi?
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Bu amalni ortga qaytarib bo‘lmaydi. Ariza va unga yuklangan barcha hujjatlar o‘chiriladi.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ariza raqami</p>
            <p className="mt-1 font-mono text-sm font-semibold text-gray-800">
              {application.app_number}
            </p>
            {application.subject_name && (
              <p className="mt-1 truncate text-sm text-gray-500">{application.subject_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  O‘chirilmoqda...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  O‘chirish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
