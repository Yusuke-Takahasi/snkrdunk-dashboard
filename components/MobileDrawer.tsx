'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SidebarContent } from './Sidebar';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" aria-modal="true" role="dialog" aria-label="メニュー">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity"
        aria-label="メニューを閉じる"
      />
      <div className="absolute left-0 top-0 bottom-0 w-[min(280px,100vw-3rem)] max-w-full bg-slate-50 border-r border-slate-200 shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 shrink-0">
          <span className="text-sm font-semibold text-slate-700">メニュー</span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <SidebarContent onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
