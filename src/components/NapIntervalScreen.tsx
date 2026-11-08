import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/sound';
import { Bed, Clock, Play, Pause, RotateCcw, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface NapIntervalScreenProps {
  onConfirmNapDuration: (durationMinutes: number, notes?: string) => void;
}

const PRESET_MINUTES = [15, 20, 25, 30, 45, 60];

export const NapIntervalScreen: React.FC<NapIntervalScreenProps> = ({
  onConfirmNapDuration,
}) => {
  const [minutes, setMinutes] = useState<number>(20);
  const [customInput, setCustomInput] = useState<string>('20');
  const [napNotes, setNapNotes] = useState<string>('');

  // Live Timer states (if student wants to sleep right now with app timer)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(20 * 60);
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      soundFx.stopAlarmLoop();
    };
  }, []);

  useEffect(() => {
    if (!isTimerRunning) return;

    timerIntervalRef.current = window.setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setIsAlarmRinging(true);
          soundFx.startAlarmLoop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const stopAlarm = () => {
    soundFx.stopAlarmLoop();
    setIsAlarmRinging(false);
  };

  const handleSelectPreset = (m: number) => {
    setMinutes(m);
    setCustomInput(String(m));
    if (!isTimerRunning) {
      setTimerSecondsLeft(m * 60);
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      setMinutes(parsed);
      if (!isTimerRunning) {
        setTimerSecondsLeft(parsed * 60);
      }
    }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      if (timerSecondsLeft <= 0) {
        setTimerSecondsLeft(minutes * 60);
      }
      setIsTimerRunning(true);
    }
  };

  const resetTimer = () => {
    stopAlarm();
    setIsTimerRunning(false);
    setTimerSecondsLeft(minutes * 60);
  };

  const handleProceed = () => {
    stopAlarm();
    onConfirmNapDuration(minutes, napNotes.trim());
  };

  const formatTimerDisplay = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Active Alarm Banner (Ringing continuously until user dismisses) */}
      {isAlarmRinging && (
        <div className="p-5 rounded-3xl bg-rose-600 text-white shadow-2xl border-2 border-rose-400 animate-bounce space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              <div>
                <h3 className="text-base font-black tracking-wide uppercase">
                  Đã Hết Giờ Ngủ Ngắn! Báo Thức Đang Kêu
                </h3>
                <p className="text-xs text-rose-100">
                  Chuông báo thức sẽ kêu liên tục cho đến khi bạn tắt bên dưới.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={stopAlarm}
              className="flex-1 h-12 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <span>Tắt Báo Thức</span>
            </button>
            <button
              onClick={handleProceed}
              className="flex-1 h-12 rounded-xl bg-rose-950 text-white hover:bg-rose-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <span>Tắt Báo Thức & Vào Đánh Giá Sau Ngủ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Title Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Giai Đoạn Nghỉ Ngơi: Giấc Ngủ Ngắn (Power Nap)
            </h2>
            <p className="text-xs text-slate-500">
              Nhập thời gian bạn đã ngủ hoặc sử dụng đồng hồ báo thức bên dưới
            </p>
          </div>
        </div>

        {/* Input Duration */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            Chọn hoặc nhập số phút đã ngủ:
          </label>

          {/* Quick preset chips */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectPreset(m)}
                className={`min-h-[44px] rounded-xl text-xs font-bold font-mono transition-all ${
                  minutes === m
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m} phút
              </button>
            ))}
          </div>

          {/* Custom input input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Hoặc tự nhập số phút:</span>
            <div className="relative w-32">
              <input
                type="number"
                min="1"
                max="300"
                value={customInput}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-full h-10 px-3 pr-12 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-600 font-semibold">
                phút
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Live Power Nap Timer Widget */}
      <div className={`rounded-3xl p-6 text-white text-center space-y-4 shadow-xl transition-colors ${
        isAlarmRinging ? 'bg-rose-950 border-2 border-rose-500' : 'bg-slate-900'
      }`}>
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Clock className="w-4 h-4" />
          <span>Đồng Hồ Hẹn Giờ Báo Thức Ngủ Ngắn</span>
        </div>

        <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight my-2 tabular-nums text-white">
          {formatTimerDisplay(timerSecondsLeft)}
        </div>

        <div className="flex justify-center gap-3">
          {isAlarmRinging ? (
            <button
              onClick={stopAlarm}
              className="min-h-[44px] px-6 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-2 transition-transform active:scale-95 animate-pulse"
            >
              <span>Tắt tiếng chuông báo thức</span>
            </button>
          ) : (
            <button
              onClick={toggleTimer}
              className={`min-h-[44px] px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isTimerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ ngủ'}</span>
            </button>
          )}

          <button
            onClick={resetTimer}
            className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          {isAlarmRinging
            ? 'Chuông báo thức đang kêu liên tục. Nhấn "Tắt Báo Thức" để tắt.'
            : 'Khi đếm hết giờ, chuông báo thức sẽ kêu liên tục cho đến khi bạn tắt.'}
        </p>
      </div>

      {/* Science Insight Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Gợi Ý Khoa Học Về Giấc Ngủ Ngắn</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {minutes <= 20 ? (
            <span>
              <strong>15 - 20 phút (Lý tưởng):</strong> Giúp phục hồi nhanh sự tỉnh táo và phản xạ của não bộ mà không rơi vào pha ngủ sâu, bạn sẽ thức dậy sảng khoái và không bị chuếnh choáng.
            </span>
          ) : minutes <= 30 ? (
            <span>
              <strong>25 - 30 phút:</strong> Tốt cho việc nạp năng lượng cơ bắp và giảm mệt mỏi, tuy nhiên cần vài phút vận động nhẹ sau khi thức dậy để đạt sự tập trung tối đa.
            </span>
          ) : (
            <span>
              <strong>{minutes} phút:</strong> Giấc ngủ dài hơn 30 phút có thể kích hoạt giấc ngủ sóng chậm (Slow-wave sleep), có thể gây hiện tượng "quán tính giấc ngủ" trong khoảng 10-15 phút đầu sau khi thức dậy.
            </span>
          )}
        </p>
      </div>

      {/* Optional Note input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Ghi chú thêm về giấc ngủ (tùy chọn):
        </label>
        <input
          type="text"
          value={napNotes}
          onChange={(e) => setNapNotes(e.target.value)}
          placeholder="VD: Ngủ sâu, môi trường yên tĩnh, thức dậy sảng khoái..."
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      {/* Confirm CTA */}
      <div className="pt-2">
        <button
          onClick={handleProceed}
          className="w-full h-13 rounded-2xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] hover:bg-indigo-700 transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã thức dậy: Chuyển sang Khảo sát & Đánh giá Sau Khi Ngủ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
