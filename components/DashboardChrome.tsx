'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { ScrollToTopButton } from './ScrollToTopButton';

export function DashboardChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const scrollToTop = useCallback(() => {
    if (mainRef.current && mainRef.current.scrollTop > 0) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const showScrollToTop = pathname === '/';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto min-w-0 text-slate-900"
      >
        {children}
      </main>
      {showScrollToTop && <ScrollToTopButton onScrollToTop={scrollToTop} />}
    </div>
  );
}

