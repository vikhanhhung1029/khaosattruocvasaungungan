import React, { useState } from 'react';
import { AlertnessLevel, FatigueLevel } from '../types';
import { ALERTNESS_OPTIONS, FATIGUE_OPTIONS } from './PreNapSurvey';
import { Sun, ArrowRight } from 'lucide-react';

interface PostNapSurveyProps {
  initialAlertness?: AlertnessLevel;
  initialFatigue?: FatigueLevel;
  onSubmit: (alertness: AlertnessLevel, fatigue: FatigueLevel) => void;
}

export const PostNapSurvey: React.FC<PostNapSurveyProps> = ({
  initialAlertness = 4,
  initialFatigue = 4,
  onSubmit,
}) => {
  const [alertness, setAlertness] = useState<AlertnessLevel>(initialAlertness);
  const [fatigue, setFatigue] = useState<FatigueLevel>(initialFatigue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(alertness, fatigue);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Introduction Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phần 2: Đánh Giá Sau Khi Ngủ Ngắn (Post-Nap)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Bạn vừa hoàn thành giấc ngủ ngắn. Vui lòng đánh giá lại mức độ tỉnh táo và mức độ mệt mỏi hiện tại, sau đó thực hiện 3 bài kiểm tra để so sánh sự thay đổi nhận thức.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Mức độ tỉnh táo */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              1. Bảng Đánh Giá Mức Độ Tỉnh Táo (Sau khi ngủ)
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md font-mono">
              {alertness}/5 điểm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá mức độ minh mẫn và tỉnh táo của bạn ngay sau khi thức dậy:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {ALERTNESS_OPTIONS.map((opt) => {
            const isSelected = alertness === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => setAlertness(opt.level)}
                className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.level}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Mức độ mệt mỏi */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              2. Bảng Đánh Giá Mức Độ Mệt Mỏi (Sau khi ngủ)
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md font-mono">
              {fatigue}/5 điểm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá mức độ mệt mỏi của bạn sau khi thức dậy:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {FATIGUE_OPTIONS.map((opt) => {
            const isSelected = fatigue === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => setFatigue(opt.level)}
                className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.level}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-amber-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full h-13 rounded-2xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] hover:bg-indigo-700 transition"
        >
          <span>Tiếp tục: Bắt đầu 3 bài kiểm tra sau khi ngủ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-2">
          (Thực hiện với bộ đề ngẫu nhiên mới để đảm bảo tính khách quan khoa học)
        </p>
      </div>
    </form>
  );
};
