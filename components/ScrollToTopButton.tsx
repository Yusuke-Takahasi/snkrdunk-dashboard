'use client';

type ScrollToTopButtonProps = {
  onScrollToTop: () => void;
};

export function ScrollToTopButton({ onScrollToTop }: ScrollToTopButtonProps) {
  const handleClick = () => {
    onScrollToTop();
  };

  return (
    <button
      type="button"
      aria-label="ページの先頭へ戻る"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}


