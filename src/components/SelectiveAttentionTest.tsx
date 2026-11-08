import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SelectiveAttentionResult } from '../types';
import { soundFx } from '../utils/sound';
import { Target, Timer, CheckCircle, XCircle, ArrowRight, Play } from 'lucide-react';

interface SelectiveAttentionTestProps {
  phaseTitle: string;
  onComplete: (result: SelectiveAttentionResult) => void;
}

interface LetterCell {
  id: number;
  letter: string;
  isTargetA: boolean;
  isTapped: boolean;
  isIncorrect: boolean;
}

const DISTRACTORS = ['B', 'C', 'D', 'E', 'H', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'X', 'Z'];
const EXACT_TARGET_COUNT = 10; // Exactly 10 target 'A's as specified
const TOTAL_CELLS = 30; // 30 letters total

function generateLettersGrid(): LetterCell[] {
  // Exactly 10 'A' letters, and 20 distractor letters
  const letters: string[] = [];

  for (let i = 0; i < EXACT_TARGET_COUNT; i++) {
    letters.push('A');
  }
  for (let i = EXACT_TARGET_COUNT; i < TOTAL_CELLS; i++) {
    const randomDistractor = DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)];
    letters.push(randomDistractor);
  }

  // Thorough Fisher-Yates shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return letters.map((char, index) => ({
    id: index,
    letter: char,
    isTargetA: char === 'A',
    isTapped: false,
    isIncorrect: false,
  }));
}

export const SelectiveAttentionTest: React.FC<SelectiveAttentionTestProps> = ({
  phaseTitle,
  onComplete,
}) => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [grid, setGrid] = useState<LetterCell[]>(() => generateLettersGrid());
  const [timeLeft, setTimeLeft] = useState<number>(10); // 10 seconds
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Statistics
  const foundCorrect = grid.filter((c) => c.isTargetA && c.isTapped).length;
  const errors = grid.filter((c) => c.isIncorrect).length;
  const missed = EXACT_TARGET_COUNT - foundCorrect;

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.min(10, Math.round((performance.now() - startTimeRef.current) / 1000));
    setTimeSpent(elapsed > 0 ? elapsed : 10);
    setIsFinished(true);
    soundFx.playSuccess();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || isFinished) return;

    startTimeRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        if (prev <= 4) {
          soundFx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isFinished, handleFinish]);

  // When all 10 'A's are found, automatically finish early
  useEffect(() => {
    if (hasStarted && !isFinished && foundCorrect === EXACT_TARGET_COUNT) {
      handleFinish();
    }
  }, [foundCorrect, hasStarted, isFinished, handleFinish]);

  const handleCellClick = (cell: LetterCell) => {
    if (!hasStarted || isFinished) return;
    if (cell.isTapped) return; // already tapped

    if (cell.isTargetA) {
      soundFx.playSuccess();
      setGrid((prev) =>
        prev.map((item) =>
          item.id === cell.id ? { ...item, isTapped: true } : item
        )
      );
    } else {
      soundFx.playError();
      setGrid((prev) =>
        prev.map((item) =>
          item.id === cell.id ? { ...item, isTapped: true, isIncorrect: true } : item
        )
      );
    }
  };

  const submitResults = () => {
    // Net accuracy percentage taking errors into account: Math.max(0, (foundCorrect - errors) / 10 * 100)
    const netAccuracy = Math.max(0, Math.round(((foundCorrect - errors) / EXACT_TARGET_COUNT) * 100));
    onComplete({
      totalTargetA: EXACT_TARGET_COUNT,
      foundCorrect,
      errors,
      missed,
      accuracyPercentage: netAccuracy,
      timeSpentSeconds: timeSpent,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bài 2: Chú Ý 10 Chữ A - 10 Giây ({phaseTitle})
            </h2>
            <p className="text-xs text-slate-500">
              Tìm và gạch bỏ chuẩn <strong className="text-indigo-600 font-bold">10 chữ A</strong> trong bảng 30 ký tự (10 giây)
            </p>
          </div>
        </div>

        {hasStarted && !isFinished && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700">
            <Timer className="w-4 h-4 animate-pulse" />
            <span className="font-mono font-bold text-sm tabular-nums">
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {!hasStarted ? (
        /* Intro Card */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
            <Target className="w-8 h-8" />
          </div>

          <div className="space-y-2.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Quy Chuẩn Bài Kiểm Tra Chú Ý 10 Chữ A (10 Giây)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bảng gồm đúng <strong>30 chữ cái</strong> ngẫu nhiên, trong đó có chính xác <strong>10 chữ A</strong>.
              Nhiệm vụ của học sinh là chọn/gạch bỏ toàn bộ 10 chữ A trong vòng <strong>10 giây</strong>.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1">
              <div className="font-semibold text-slate-900">Tiêu chí đánh giá:</div>
              <div>• Số lượng chữ A tìm đúng (trên 10 chữ A).</div>
              <div>• Số lỗi bấm nhầm vào chữ cái khác (mỗi lỗi làm giảm điểm độ chính xác).</div>
              <div>• Thời gian hoàn thành (tối đa 10 giây).</div>
            </div>
          </div>

          <button
            onClick={() => {
              setGrid(generateLettersGrid());
              setTimeLeft(10);
              setHasStarted(true);
            }}
            className="w-full sm:w-auto px-8 h-12 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 mx-auto shadow-md shadow-indigo-600/20 active:scale-95 hover:bg-indigo-700 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt đầu kiểm tra (10 giây)</span>
          </button>
        </div>
      ) : !isFinished ? (
        /* Active 30 Letters Grid */
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          {/* Progress bar & counters */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>
                Tiến độ: <strong className="text-emerald-600 font-bold font-mono">{foundCorrect}</strong> / {EXACT_TARGET_COUNT} chữ A
              </span>
              <span>
                Lỗi bấm nhầm: <strong className="text-rose-600 font-bold font-mono">{errors}</strong>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 3 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* 30 letters Grid (5 cols x 6 rows) */}
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5 select-none pt-2">
            {grid.map((cell) => {
              const isCorrectA = cell.isTargetA && cell.isTapped;
              const isWrong = cell.isIncorrect;

              return (
                <button
                  key={cell.id}
                  type="button"
                  disabled={cell.isTapped}
                  onClick={() => handleCellClick(cell)}
                  className={`min-h-[50px] sm:min-h-[54px] rounded-xl font-mono text-lg sm:text-xl font-bold flex items-center justify-center transition-all active:scale-90 relative ${
                    isCorrectA
                      ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 line-through opacity-80'
                      : isWrong
                      ? 'bg-rose-100 text-rose-800 border-2 border-rose-500 line-through opacity-70'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 active:bg-indigo-50 shadow-sm'
                  }`}
                >
                  <span>{cell.letter}</span>
                  {isCorrectA && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 absolute bottom-1 right-1" />
                  )}
                  {isWrong && (
                    <XCircle className="w-3.5 h-3.5 text-rose-600 absolute bottom-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-600">
              Mục tiêu: Gạch đủ 10 chữ A
            </span>
            <button
              onClick={handleFinish}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Hoàn thành sớm
            </button>
          </div>
        </div>
      ) : (
        /* Results Card */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Kết Quả Bài Kiểm Tra Chú Ý Chọn Lọc
            </h3>
            <p className="text-xs text-slate-500">
              Thời gian thực hiện: <span className="font-bold text-slate-800">{timeSpent} giây</span> (chuẩn 10 chữ A)
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-[11px] text-emerald-700 font-semibold block">Số chữ A đúng</span>
              <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                {foundCorrect}
              </span>
              <span className="text-[10px] text-emerald-600 block">/ 10 chữ A</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-center">
              <span className="text-[11px] text-rose-700 font-semibold block">Số lỗi (bấm nhầm)</span>
              <span className="text-2xl font-black text-rose-700 font-mono tabular-nums">
                {errors}
              </span>
              <span className="text-[10px] text-rose-600 block">lần bấm sai</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="text-[11px] text-amber-700 font-semibold block">Bỏ sót</span>
              <span className="text-2xl font-black text-amber-700 font-mono tabular-nums">
                {missed}
              </span>
              <span className="text-[10px] text-amber-600 block">chưa gạch</span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <span className="text-[11px] text-indigo-700 font-semibold block">Độ chính xác thực</span>
              <span className="text-2xl font-black text-indigo-700 font-mono tabular-nums">
                {Math.max(0, Math.round(((foundCorrect - errors) / EXACT_TARGET_COUNT) * 100))}%
              </span>
              <span className="text-[10px] text-indigo-600 block">đã trừ điểm lỗi</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={submitResults}
              className="w-full h-12 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 hover:bg-indigo-700 transition"
            >
              <span>Tiếp tục: Bài kiểm tra trí nhớ ngắn hạn</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
