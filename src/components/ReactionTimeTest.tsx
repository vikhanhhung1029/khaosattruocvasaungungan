import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactionTestResult } from '../types';
import { soundFx } from '../utils/sound';
import { Zap, AlertTriangle, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface ReactionTimeTestProps {
  phaseTitle: string; // "Trước khi ngủ" hoặc "Sau khi ngủ"
  onComplete: (result: ReactionTestResult) => void;
}

type TestState = 'intro' | 'ready' | 'waiting' | 'active' | 'fault' | 'result_trial' | 'finished';

const TOTAL_TRIALS = 5;

export const ReactionTimeTest: React.FC<ReactionTimeTestProps> = ({
  phaseTitle,
  onComplete,
}) => {
  const [testState, setTestState] = useState<TestState>('intro');
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const [trials, setTrials] = useState<number[]>([]);
  const [lastTrialMs, setLastTrialMs] = useState<number>(0);
  const [faultCount, setFaultCount] = useState<number>(0);

  const startTimeRef = useRef<number>(0);
  const timerTimeoutRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) {
        clearTimeout(timerTimeoutRef.current);
      }
    };
  }, []);

  // Start a specific trial
  const startTrial = useCallback(() => {
    setTestState('waiting');

    // Random delay between 1.6s and 3.8s
    const randomDelay = Math.floor(1600 + Math.random() * 2200);

    timerTimeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now();
      setTestState('active');
      soundFx.playReactionSignal();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
    }, randomDelay);
  }, []);

  // Handle user tap or key press
  const handleUserTrigger = useCallback(() => {
    if (testState === 'intro') {
      setCurrentTrial(1);
      setTrials([]);
      setFaultCount(0);
      startTrial();
      return;
    }

    if (testState === 'waiting') {
      // User tapped too early!
      if (timerTimeoutRef.current) {
        clearTimeout(timerTimeoutRef.current);
      }
      soundFx.playError();
      setFaultCount((prev) => prev + 1);
      setTestState('fault');
      return;
    }

    if (testState === 'active') {
      // Valid hit!
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      soundFx.playSuccess();
      setLastTrialMs(elapsed);

      const updatedTrials = [...trials, elapsed];
      setTrials(updatedTrials);

      if (updatedTrials.length >= TOTAL_TRIALS) {
        setTestState('finished');
      } else {
        setTestState('result_trial');
      }
      return;
    }

    if (testState === 'fault' || testState === 'result_trial') {
      // Proceed to next trial
      setCurrentTrial(trials.length + 1);
      startTrial();
      return;
    }
  }, [testState, trials, startTrial]);

  // Keyboard accessibility (Space or Enter to trigger)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleUserTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUserTrigger]);

  const handleFinish = () => {
    const avg = Math.round(trials.reduce((a, b) => a + b, 0) / trials.length);
    const fastest = Math.min(...trials);
    onComplete({
      trials,
      averageTime: avg,
      fastestTime: fastest,
      faults: faultCount,
    });
  };

  const currentAverage =
    trials.length > 0
      ? Math.round(trials.reduce((a, b) => a + b, 0) / trials.length)
      : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Title & Trial Counter Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bài 1: Kiểm Tra Phản Ứng Nhanh ({phaseTitle})
            </h2>
            <p className="text-xs text-slate-500">
              Quy chuẩn 5 lần thử · Đo lường thời gian phản xạ (ms)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Lần thử</span>
          <span className="text-sm font-bold font-mono text-rose-600 tabular-nums">
            {testState === 'finished' ? 5 : currentTrial} / {TOTAL_TRIALS}
          </span>
        </div>
      </div>

      {/* Main Interactive Screen / Touch Arena */}
      {testState !== 'finished' ? (
        <div
          onClick={handleUserTrigger}
          className={`w-full min-h-[360px] sm:min-h-[400px] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-200 shadow-inner relative overflow-hidden ${
            testState === 'intro'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : testState === 'waiting'
              ? 'bg-amber-500 text-white'
              : testState === 'active'
              ? 'bg-rose-600 text-white animate-pulse'
              : testState === 'fault'
              ? 'bg-slate-800 text-rose-400'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {/* State Content */}
          {testState === 'intro' && (
            <div className="space-y-4 max-w-sm">
              <div className="w-20 h-20 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-rose-500 shadow-lg" />
              </div>
              <h3 className="text-xl font-bold">Hướng Dẫn Thực Hiện</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Khi bắt đầu, màn hình sẽ chuyển sang chế độ chuẩn bị. Khi bạn nhìn thấy{' '}
                <span className="text-rose-400 font-bold">Hình Tròn Màu Đỏ</span> xuất hiện, hãy chạm vào màn hình hoặc bấm phím càng nhanh càng tốt!
              </p>
              <div className="inline-block px-5 py-3 rounded-2xl bg-white text-slate-900 text-xs font-bold shadow-md">
                Chạm vào đây để bắt đầu lần thử 1
              </div>
            </div>
          )}

          {testState === 'waiting' && (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto" />
              <h3 className="text-2xl font-black tracking-tight">ĐỢI HÌNH TRÒN ĐỎ...</h3>
              <p className="text-xs text-amber-100 font-medium">
                Giữ tay sẵn sàng! Đừng bấm sớm kẻo bị phạm quy.
              </p>
            </div>
          )}

          {testState === 'active' && (
            <div className="space-y-4">
              {/* The required Red Circle Symbol */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white shadow-2xl mx-auto flex items-center justify-center border-4 border-rose-200 transform scale-110 transition-transform">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    BẤM!
                  </span>
                </div>
              </div>
              <h3 className="text-3xl font-black tracking-wider drop-shadow-md">
                BẤM NGAY!
              </h3>
              <p className="text-xs text-rose-100">Chạm màn hình hoặc ấn phím cách thật nhanh</p>
            </div>
          )}

          {testState === 'fault' && (
            <div className="space-y-3 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Bấm Quá Sớm!</h3>
              <p className="text-xs text-slate-300">
                Ký hiệu màu đỏ chưa xuất hiện. Lần bấm sớm này bị phạt lỗi.
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold">
                Chạm để thử lại lần {currentTrial}
              </div>
            </div>
          )}

          {testState === 'result_trial' && (
            <div className="space-y-3 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-emerald-100 uppercase font-semibold">
                  Lần thử {trials.length}
                </span>
                <div className="text-4xl font-black font-mono tracking-tight my-1 tabular-nums">
                  {lastTrialMs} ms
                </div>
                <p className="text-xs text-emerald-100">
                  {lastTrialMs < 250
                    ? 'Tốc độ xuất sắc'
                    : lastTrialMs < 350
                    ? 'Rất tốt, phản xạ nhanh'
                    : 'Phản xạ ổn định'}
                </p>
              </div>
              <div className="inline-block px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow">
                Chạm để bắt đầu lần {trials.length + 1}/{TOTAL_TRIALS}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 text-[10px] opacity-70">
            Hỗ trợ cảm ứng điện thoại & phím Space trên máy tính
          </div>
        </div>
      ) : (
        /* Summary after 5 trials */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Hoàn Thành Bài Kiểm Tra Phản Ứng!
            </h3>
            <p className="text-xs text-slate-500">
              Đã ghi nhận đủ 5 lần thử nghiệm phản xạ của học sinh.
            </p>
          </div>

          {/* Average time card */}
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Thời Gian Phản Ứng Trung Bình
            </span>
            <div className="text-4xl sm:text-5xl font-black text-indigo-600 font-mono my-1 tabular-nums">
              {currentAverage} <span className="text-lg font-bold text-slate-600">ms</span>
            </div>
            <div className="text-xs text-slate-600">
              Nhanh nhất: <span className="font-bold text-emerald-600 font-mono">{Math.min(...trials)} ms</span> · Số lần phạm quy: <span className="font-bold text-rose-500">{faultCount}</span>
            </div>
          </div>

          {/* Individual trials list */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
              Chi tiết 5 lần thử:
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {trials.map((ms, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-600 font-semibold block">
                    Lần {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 tabular-nums">
                    {ms}
                  </span>
                  <span className="text-[9px] text-slate-600 block">ms</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setTestState('intro');
                setCurrentTrial(1);
                setTrials([]);
                setFaultCount(0);
              }}
              className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kiểm tra lại lần nữa</span>
            </button>

            <button
              onClick={handleFinish}
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 hover:bg-indigo-700 transition"
            >
              <span>Tiếp tục: Bài kiểm tra chú ý 10 chữ A (10s)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Trial progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {[1, 2, 3, 4, 5].map((num) => {
          const isDone = trials.length >= num;
          const isCurrent = currentTrial === num && testState !== 'finished';
          return (
            <div
              key={num}
              className={`h-2 rounded-full transition-all ${
                isDone
                  ? 'w-6 bg-emerald-500'
                  : isCurrent
                  ? 'w-6 bg-rose-500'
                  : 'w-2 bg-slate-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
