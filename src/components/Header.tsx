import React from 'react';
import { Moon, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasActiveSession: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasActiveSession,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight truncate max-w-[200px] sm:max-w-xs">
              Khảo Sát Giấc Ngủ Ngắn
            </h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Nghiên cứu & Đánh giá Nhận thức Học sinh
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onReset}
            title="Làm bài khảo sát mới từ đầu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Làm lại từ đầu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
