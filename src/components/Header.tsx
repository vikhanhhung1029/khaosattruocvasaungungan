import React, { useRef } from 'react';
import { Moon, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasActiveSession: boolean;
  onAdminOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasActiveSession,
  onAdminOpen,
}) => {
  const logoClicks = useRef(0);

  const handleLogoClick = () => {
    logoClicks.current += 1;
    if (logoClicks.current >= 5) {
      logoClicks.current = 0;
      onAdminOpen?.();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 min-h-14 py-2 flex items-center justify-between gap-2">
        {/* The logo is a discreet entry point; Google authentication still protects admin access. */}
        <button type="button" onClick={handleLogoClick} aria-label="Logo" className="flex min-w-0 items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight leading-tight truncate max-w-[150px] sm:max-w-xs">
              Khảo Sát Giấc Ngủ Ngắn
            </h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Nghiên cứu & Đánh giá Nhận thức Học sinh
            </p>
          </div>
        </button>

        {hasActiveSession && (
          <div className="flex items-center shrink-0">
            <button
              onClick={onReset}
              title="Xóa tiến độ hiện tại và bắt đầu khảo sát mới"
              className="min-h-11 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Làm lại từ đầu</span>
              <span className="sm:hidden">Làm lại</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
