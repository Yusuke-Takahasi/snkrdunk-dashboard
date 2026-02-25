'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';

type MobileHeaderProps = {
  onMenuOpen: () => void;
};

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 shrink-0">
      <Link href="/" className="flex items-center min-h-[44px] min-w-[44px] -ml-2">
        <Image
          src="/logo.png"
          alt="Minty"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </Link>
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="メニューを開く"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
