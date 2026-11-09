import React, { useEffect, useRef, useState } from 'react';
import { Calculator, Timer, ArrowRight, CheckCircle2, RotateCcw, Delete, Check } from 'lucide-react';
import type { CalculationTestResult, CalculationItemResult } from '../types';

interface CalculationTestProps {
  phaseTitle: string;
  onComplete: (result: CalculationTestResult) => void;
}

type Stage = 'intro' | 'test' | 'result';

function makeQuestions(): Array<{ a: number; b: number; answer: number }> {
  return Array.from({ length: 3 }, () => {
    const a = 12 + Math.floor(Math.random() * 88);
    const b = 2 + Math.floor(Math.random() * 8);
    return { a, b, answer: a * b };
  });
}

export const CalculationTest: React.FC<CalculationTestProps> = ({ phaseTitle, onComplete }) => {
  const [questions, setQuestions] = useState(makeQuestions);
  const [stage, setStage] = useState<Stage>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [items, setItems] = useState<CalculationItemResult[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const start = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setCurrentIndex(0);
    setCurrentAnswer('');
    setItems([]);
    setElapsedMs(0);
    startedAtRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedMs(Math.floor(performance.now() - startedAtRef.current));
      }
    }, 100);
    setStage('test');
  };

  const pressDigit = (digit: string) => {
    if (stage !== 'test') return;
    setCurrentAnswer((value) => value.length < 3 ? value + digit : value);
  };

  const deleteDigit = () => {
    if (stage === 'test') setCurrentAnswer((value) => value.slice(0, -1));
  };

  const clearAnswer = () => {
    if (stage === 'test') setCurrentAnswer('');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (stage !== 'test') return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        pressDigit(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        deleteDigit();
      } else if (event.key === 'Enter' && currentAnswer.length > 0) {
        event.preventDefault();
        submitCurrent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentAnswer, currentIndex, items]);

  const stopTimer = () => {
    const finishedAt = performance.now();
    const totalTimeMs = startedAtRef.current === null
      ? elapsedMs
      : Math.max(0, Math.round(finishedAt - startedAtRef.current));
    startedAtRef.current = null;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMs(totalTimeMs);
  };

  const submitCurrent = () => {
    if (stage !== 'test' || currentAnswer.trim() === '' || !/^\d+$/.test(currentAnswer)) return;

    const question = questions[currentIndex];
    const userAnswer = Number(currentAnswer);
    const item: CalculationItemResult = {
      questionNumber: currentIndex + 1,
      operandA: question.a,
      operandB: question.b,
      correctAnswer: question.answer,
      userAnswer,
      isCorrect: userAnswer === question.answer,
    };
    const updatedItems = [...items, item];
    setItems(updatedItems);
    setCurrentAnswer('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      stopTimer();
      setStage('result');
    }
  };

  const handleReset = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    startedAtRef.current = null;
    setQuestions(makeQuestions());
    setCurrentIndex(0);
    setCurrentAnswer('');
    setItems([]);
    setElapsedMs(0);
    setStage('intro');
  };

  const finish = () => {
    const correctCount = items.filter((item) => item.isCorrect).length;
    onComplete({
      items,
      correctCount,
      totalQuestions: 3,
      accuracyPercentage: Math.round((correctCount / 3) * 100),
      totalTimeMs: elapsedMs,
    });
  };

  const question = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700"><Calculator className="w-5 h-5" /></div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Bài 4: Đánh giá khả năng tính toán ({phaseTitle})</h2>
            <p className="text-xs text-slate-500 mt-0.5">3 phép nhân · Hai chữ số nhân một chữ số</p>
          </div>
        </div>
        {stage === 'test' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800">
            <Timer className="w-4 h-4" /><span className="font-mono font-bold text-sm tabular-nums">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className={`h-2 rounded-full ${index < currentIndex || stage === 'result' ? 'bg-emerald-500' : index === currentIndex && stage === 'test' ? 'bg-amber-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      {stage === 'intro' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center"><Calculator className="w-8 h-8" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Hướng dẫn bài tính toán</h3>
            <p className="text-sm text-slate-600">Có 3 phép nhân. Mỗi lần chỉ hiển thị một phép tính. Nhập đáp án bằng bàn phím số trên màn hình rồi nhấn xác nhận để chuyển sang câu tiếp theo.</p>
            <p className="text-xs text-slate-500">Đồng hồ bắt đầu khi nhấn bắt đầu và dừng sau khi xác nhận câu thứ 3. Bạn cũng có thể dùng các phím số trên máy tính.</p>
          </div>
          <button onClick={start} className="w-full sm:w-auto px-8 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2"><span>Bắt đầu bài tính toán</span><ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {stage === 'test' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Phép tính {currentIndex + 1}/3</h3>
            <p className="text-xs text-slate-500">Nhập kết quả của phép nhân dưới đây</p>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-100 py-7 px-3 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">{question.a} × {question.b} = ?</div>
          </div>

          <div className="flex justify-center gap-2 py-1">
            {[0, 1, 2].map((index) => {
              const char = currentAnswer[index] || '';
              const isCurrent = currentAnswer.length === index;
              return (
                <div key={index} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-mono font-bold border-2 ${isCurrent ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20' : char ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                  {char || '·'}
                </div>
              );
            })}
          </div>

          <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} type="button" onClick={() => pressDigit(String(num))} className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold font-mono flex items-center justify-center active:scale-90 transition-transform">
                {num}
              </button>
            ))}
            <button type="button" onClick={clearAnswer} className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center active:scale-90 transition-transform">Xóa hết</button>
            <button type="button" onClick={() => pressDigit('0')} className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold font-mono flex items-center justify-center active:scale-90 transition-transform">0</button>
            <button type="button" onClick={deleteDigit} className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-rose-600 flex items-center justify-center active:scale-90 transition-transform"><Delete className="w-5 h-5" /></button>
          </div>

          <button type="button" disabled={currentAnswer.length === 0} onClick={submitCurrent} className="w-full h-12 rounded-xl bg-amber-600 disabled:opacity-40 text-white text-sm font-bold inline-flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {currentIndex === 2 ? 'Xác nhận câu 3 và hoàn thành' : 'Xác nhận và chuyển câu tiếp theo'}
          </button>
        </div>
      )}

      {stage === 'result' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full mx-auto bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-900">Hoàn thành bài tính toán</h3>
            <p className="text-xs text-slate-500">Kết quả được đối chiếu sau khi hoàn thành cả 3 câu.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-amber-800">Số câu đúng</div><div className="text-2xl font-black text-amber-800">{items.filter((item) => item.isCorrect).length}/3</div></div>
            <div className="rounded-xl bg-indigo-50 p-4"><div className="text-xs text-indigo-800">Thời gian hoàn thành</div><div className="text-2xl font-black text-indigo-800">{(elapsedMs / 1000).toFixed(2)}s</div></div>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.questionNumber} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm">
                <span className="font-mono">{item.operandA} × {item.operandB} = {item.correctAnswer}</span>
                <span className={item.isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>Bạn nhập {item.userAnswer} · {item.isCorrect ? 'Đúng' : 'Sai'}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="h-11 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Làm lại</button>
            <button onClick={finish} className="flex-1 h-12 rounded-xl bg-amber-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2">Xác nhận & tiếp tục <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};
