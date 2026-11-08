import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MemoryTestResult, MemoryRoundItem } from '../types';
import { soundFx } from '../utils/sound';
import { Brain, Timer, Check, ArrowRight, Delete, RotateCcw } from 'lucide-react';

interface MemoryTestProps {
  phaseTitle: string;
  onComplete: (result: MemoryTestResult) => void;
}

type MemoryPhase = 'intro' | 'present' | 'recall' | 'round_result' | 'final_result';

const TOTAL_ROUNDS = 3;
const DIGITS_PER_ROUND = 7;
const MEMORIZE_SECONDS = 7;

function generateRandomDigits(length: number = DIGITS_PER_ROUND): string {
  const digits: number[] = [];
  for (let i = 0; i < length; i++) {
    let d = Math.floor(Math.random() * 10);
    if (i > 0 && d === digits[i - 1]) {
      d = (d + 1) % 10;
    }
    digits.push(d);
  }
  return digits.join('');
}

export const MemoryTest: React.FC<MemoryTestProps> = ({
  phaseTitle,
  onComplete,
}) => {
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [completedRounds, setCompletedRounds] = useState<MemoryRoundItem[]>([]);
  const [phase, setPhase] = useState<MemoryPhase>('intro');
  const [targetDigits, setTargetDigits] = useState<string>(() => generateRandomDigits(DIGITS_PER_ROUND));
  const [userDigits, setUserDigits] = useState<string>('');
  const [countdown7s, setCountdown7s] = useState<number>(MEMORIZE_SECONDS);

  const countdownTimerRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Start presenting all 7 digits simultaneously for exactly 7 seconds
  const startPresentation = useCallback(() => {
    setPhase('present');
    setUserDigits('');
    setCountdown7s(MEMORIZE_SECONDS);
    soundFx.playBeep(520, 0.1, 'sine');

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown7s((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          soundFx.playAlarmChime();
          setPhase('recall');
          return 0;
        }
        soundFx.playTick();
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Keypad inputs
  const handleDigitPress = (digit: string) => {
    if (phase !== 'recall') return;
    if (userDigits.length < DIGITS_PER_ROUND) {
      soundFx.playBeep(520, 0.05, 'triangle');
      setUserDigits((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (phase !== 'recall') return;
    setUserDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (phase !== 'recall') return;
    setUserDigits('');
  };

  // Keyboard typing support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'recall') return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, userDigits]);

  // Evaluate current round
  const evaluateCurrentRound = (): MemoryRoundItem => {
    const targetArr = targetDigits.split('');
    const userArr = userDigits.padEnd(DIGITS_PER_ROUND, ' ').split('');

    let correctCount = 0;
    for (let i = 0; i < DIGITS_PER_ROUND; i++) {
      if (userArr[i] === targetArr[i]) {
        correctCount++;
      }
    }

    const accuracy = Math.round((correctCount / DIGITS_PER_ROUND) * 100);
    return {
      roundNumber: currentRound,
      targetSequence: targetDigits,
      userSequence: userDigits,
      correctDigitsCount: correctCount,
      totalDigits: DIGITS_PER_ROUND,
      accuracyPercentage: accuracy,
      isExactMatch: userDigits === targetDigits,
    };
  };

  const handleSubmitRecall = () => {
    soundFx.playSuccess();
    const roundItem = evaluateCurrentRound();
    const updated = [...completedRounds, roundItem];
    setCompletedRounds(updated);

    if (currentRound < TOTAL_ROUNDS) {
      setPhase('round_result');
    } else {
      setPhase('final_result');
    }
  };

  // Move to next round
  const handleNextRound = () => {
    setCurrentRound((prev) => prev + 1);
    setTargetDigits(generateRandomDigits(DIGITS_PER_ROUND));
    setUserDigits('');
    setPhase('intro');
  };

  // Compile final aggregate result
  const buildFinalResult = (): MemoryTestResult => {
    const totalCorrect = completedRounds.reduce((acc, r) => acc + r.correctDigitsCount, 0);
    const totalDigits = completedRounds.length * DIGITS_PER_ROUND;
    const avgAccuracy = totalDigits > 0 ? Math.round((totalCorrect / totalDigits) * 100) : 0;
    const allExact = completedRounds.every((r) => r.isExactMatch);

    return {
      targetSequence: completedRounds.map((r) => r.targetSequence).join(' | '),
      userSequence: completedRounds.map((r) => r.userSequence || 'Trống').join(' | '),
      correctDigitsCount: totalCorrect,
      totalDigits,
      accuracyPercentage: avgAccuracy,
      isExactMatch: allExact,
      rounds: completedRounds,
    };
  };

  const handleFinishAllRounds = () => {
    onComplete(buildFinalResult());
  };

  const currentRoundItem = completedRounds[currentRound - 1] || evaluateCurrentRound();
  const finalResultData = phase === 'final_result' ? buildFinalResult() : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bài 3: Trí Nhớ Ngắn Hạn ({phaseTitle})
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                Bài {currentRound}/{TOTAL_ROUNDS}
              </span>
              <span className="text-xs text-slate-500">
                Ghi nhớ đồng thời 7 số trong 7 giây · Nhập lại
              </span>
            </div>
          </div>
        </div>

        {phase === 'present' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700">
            <Timer className="w-4 h-4 animate-pulse text-violet-600" />
            <span className="font-mono font-bold text-sm tabular-nums">
              {countdown7s}s
            </span>
          </div>
        )}
      </div>

      {/* Round progress indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((r) => {
          const isDone = r < currentRound || (r === currentRound && (phase === 'round_result' || phase === 'final_result'));
          const isCurrent = r === currentRound && phase !== 'round_result' && phase !== 'final_result';
          return (
            <div
              key={r}
              className={`h-2 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-violet-600'
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center">
            <Brain className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Bài Kiểm Tra {currentRound} / {TOTAL_ROUNDS}
            </h3>
            <p className="text-xs text-slate-500">
              Kiểm tra khả năng lưu trữ thông tin tức thời của não bộ qua 3 bài test độc lập.
            </p>

            <div className="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-4 rounded-xl">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>Hệ thống hiển thị <strong>đồng thời cả 7 chữ số</strong> trên màn hình.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>Bạn có đúng <strong>7 giây</strong> để quan sát và ghi nhớ dãy 7 số đó.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>Hết 7 giây, các số sẽ ẩn đi và bạn dùng bàn phím để <strong>nhập lại chính xác 7 chữ số</strong> theo thứ tự.</span>
              </div>
            </div>
          </div>

          <button
            onClick={startPresentation}
            className="w-full sm:w-auto px-8 h-12 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-2 mx-auto shadow-md shadow-violet-600/20 active:scale-95 hover:bg-violet-700 transition"
          >
            <span>Bắt đầu bài kiểm tra {currentRound} / {TOTAL_ROUNDS} (7 giây)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Present Phase: All 7 digits displayed simultaneously for 7 seconds */}
      {phase === 'present' && (
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white text-center space-y-6 shadow-xl">
          <div className="flex items-center justify-between px-2">
            <span className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
              Bài {currentRound} / {TOTAL_ROUNDS}: Ghi nhớ dãy số
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300">
              <Timer className="w-3.5 h-3.5 animate-pulse text-violet-400" />
              <span className="font-mono font-bold text-sm tabular-nums">
                {countdown7s}s
              </span>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                countdown7s <= 2 ? 'bg-rose-500' : 'bg-violet-500'
              }`}
              style={{ width: `${(countdown7s / MEMORIZE_SECONDS) * 100}%` }}
            />
          </div>

          {/* All 7 Digits presented simultaneously */}
          <div className="flex justify-center flex-wrap gap-2 sm:gap-3 my-4">
            {targetDigits.split('').map((digit, idx) => (
              <div
                key={idx}
                className="w-10 h-14 sm:w-14 sm:h-20 rounded-2xl bg-violet-600 text-white border-2 border-violet-400 flex items-center justify-center text-3xl sm:text-5xl font-mono font-black shadow-lg shadow-violet-500/30 transition-transform scale-105"
              >
                {digit}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Tập trung quan sát và ghi nhớ đồng thời toàn bộ 7 chữ số trước khi hết 7 giây!
          </p>
        </div>
      )}

      {/* Recall Input Phase */}
      {phase === 'recall' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Nhập Lại Dãy 7 Chữ Số (Bài {currentRound}/{TOTAL_ROUNDS})
            </h3>
            <p className="text-xs text-slate-500">
              Chạm vào bàn phím số bên dưới hoặc gõ trực tiếp từ bàn phím máy tính
            </p>
          </div>

          {/* User Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 py-2">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
              const char = userDigits[idx] || '';
              const isCurrent = userDigits.length === idx;

              return (
                <div
                  key={idx}
                  className={`w-10 h-13 sm:w-13 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-mono font-bold transition-all border-2 ${
                    isCurrent
                      ? 'border-violet-600 bg-violet-50 text-violet-900 ring-2 ring-violet-500/20'
                      : char
                      ? 'border-slate-300 bg-white text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {char || '·'}
                </div>
              );
            })}
          </div>

          {/* On-screen Keypad */}
          <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitPress(String(num))}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold font-mono flex items-center justify-center active:scale-90 transition-transform shadow-xs"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center active:scale-90 transition-transform"
            >
              Xóa hết
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold font-mono flex items-center justify-center active:scale-90 transition-transform shadow-xs"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-rose-600 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit recall button */}
          <div className="pt-2">
            <button
              disabled={userDigits.length === 0}
              onClick={handleSubmitRecall}
              className="w-full h-12 rounded-xl bg-violet-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-600/20 active:scale-98 hover:bg-violet-700 transition"
            >
              <Check className="w-4 h-4" />
              <span>
                Xác nhận bài {currentRound} ({userDigits.length}/7 số)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Intermediate Round Result (between round 1 and round 2, or round 2 and round 3) */}
      {phase === 'round_result' && currentRoundItem && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div
              className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                currentRoundItem.isExactMatch
                  ? 'bg-emerald-50 text-emerald-600'
                  : currentRoundItem.correctDigitsCount >= 4
                  ? 'bg-violet-50 text-violet-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Kết Quả Bài {currentRound} / {TOTAL_ROUNDS}
            </h3>
            <p className="text-xs text-slate-500">
              {currentRoundItem.isExactMatch
                ? 'Xuất sắc! Bạn đã nhớ chính xác toàn bộ 7 chữ số bài này!'
                : `Bạn đã nhớ đúng ${currentRoundItem.correctDigitsCount} trên 7 chữ số.`}
            </p>
          </div>

          {/* Comparison */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Dãy số gốc đã phát:
              </span>
              <div className="flex gap-2">
                {currentRoundItem.targetSequence.split('').map((char, i) => (
                  <div
                    key={i}
                    className="flex-1 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-sm text-slate-900"
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Dãy số bạn nhập:
              </span>
              <div className="flex gap-2">
                {currentRoundItem.targetSequence.split('').map((char, i) => {
                  const userChar = currentRoundItem.userSequence[i];
                  const isCorrect = userChar === char;

                  return (
                    <div
                      key={i}
                      className={`flex-1 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-rose-50 border-rose-300 text-rose-700 line-through'
                      }`}
                    >
                      {userChar || '—'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-100">
              <span className="text-[11px] text-violet-700 font-semibold block">Đúng bài {currentRound}</span>
              <span className="text-2xl font-black text-violet-700 font-mono">
                {currentRoundItem.correctDigitsCount} / 7
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-[11px] text-indigo-700 font-semibold block">Độ chính xác</span>
              <span className="text-2xl font-black text-indigo-700 font-mono">
                {currentRoundItem.accuracyPercentage}%
              </span>
            </div>
          </div>

          <button
            onClick={handleNextRound}
            className="w-full h-12 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-600/20 active:scale-98 hover:bg-violet-700 transition"
          >
            <span>Tiếp tục sang Bài {currentRound + 1} / {TOTAL_ROUNDS}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Final 3-Round Summary Result */}
      {phase === 'final_result' && finalResultData && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-violet-50 text-violet-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Hoàn Thành 3 Bài Kiểm Tra Trí Nhớ Ngắn Hạn
            </h3>
            <p className="text-xs text-slate-500">
              Tổng kết kết quả kiểm tra trí nhớ ngắn hạn qua 3 lượt thử độc lập
            </p>
          </div>

          {/* 3-Round Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Chi tiết từng bài kiểm tra:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {completedRounds.map((r) => (
                <div
                  key={r.roundNumber}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1"
                >
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Bài {r.roundNumber}
                  </span>
                  <div className="text-lg font-mono font-bold text-violet-700">
                    {r.correctDigitsCount}/7 số
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {r.accuracyPercentage}% chính xác
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary scores */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-100">
              <span className="text-[11px] text-violet-700 font-semibold block">Tổng số lượng đúng</span>
              <span className="text-3xl font-black text-violet-700 font-mono tabular-nums">
                {finalResultData.correctDigitsCount}{' '}
                <span className="text-sm font-normal text-violet-600">
                  / {finalResultData.totalDigits}
                </span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-[11px] text-indigo-700 font-semibold block">Độ chính xác trung bình</span>
              <span className="text-3xl font-black text-indigo-700 font-mono tabular-nums">
                {finalResultData.accuracyPercentage}%
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentRound(1);
                setCompletedRounds([]);
                setTargetDigits(generateRandomDigits(DIGITS_PER_ROUND));
                setPhase('intro');
              }}
              className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại từ bài 1</span>
            </button>

            <button
              onClick={handleFinishAllRounds}
              className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-600/20 active:scale-98 hover:bg-violet-700 transition"
            >
              <span>Xác nhận & Chuyển sang bước tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
