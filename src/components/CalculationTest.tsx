import React, { useEffect, useRef, useState } from 'react';
import { Calculator, Timer, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CalculationTestResult, CalculationItemResult } from '../types';

interface CalculationTestProps {
  phaseTitle: string;
  onComplete: (result: CalculationTestResult) => void;
}

type Stage = 'intro' | 'answer' | 'feedback' | 'result';

function makeQuestions(): Array<{ a: number; b: number; answer: number }> {
  // Keep the operands in a comparable difficulty band for the before/after assessment.
  return Array.from({ length: 3 }, () => {
    const a = 12 + Math.floor(Math.random() * 78);
    const b = 12 + Math.floor(Math.random() * 78);
    return { a, b, answer: a * b };
  });
}

export const CalculationTest: React.FC<CalculationTestProps> = ({ phaseTitle, onComplete }) => {
  const [questions, setQuestions] = useState(makeQuestions);
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [items, setItems] = useState<CalculationItemResult[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState<CalculationItemResult | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const current = questions[index];
  const start = () => {
    setIndex(0);
    setAnswer('');
    setItems([]);
    setElapsedMs(0);
    setFeedback(null);
    startedAtRef.current = performance.now();
    accumulatedMsRef.current = 0;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (startedAtRef.current !== null) setElapsedMs(Math.floor(accumulatedMsRef.current + performance.now() - startedAtRef.current));
    }, 100);
    setStage('answer');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\\d{1,5}$/.test(answer.trim()) || stage !== 'answer') return;
    const parsed = Number(answer);
    if (startedAtRef.current !== null) {
      accumulatedMsRef.current += Math.max(0, performance.now() - startedAtRef.current);
      startedAtRef.current = null;
      setElapsedMs(Math.round(accumulatedMsRef.current));
    }
    const item: CalculationItemResult = {
      questionNumber: index + 1,
      operandA: current.a,
      operandB: current.b,
      correctAnswer: current.answer,
      userAnswer: parsed,
      isCorrect: parsed === current.answer,
    };
    const nextItems = [...items, item];
    setItems(nextItems);
    setFeedback(item);
    if (index === 2 && startedAtRef.current !== null) {
      setElapsedMs(finalElapsedRef.current);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setAnswer('');
    setStage('feedback');
  };

  const continueNext = () => {
    if (index < 2) {
      setIndex(index + 1);
      startedAtRef.current = performance.now();
      setStage('answer');
      return;
    }
    setStage('result');
  };

  const finish = () => {
    const correctCount = items.filter(x => x.isCorrect).length;
    onComplete({
      items,
      correctCount,
      totalQuestions: 3,
      accuracyPercentage: Math.round(correctCount / 3 * 100),
      totalTimeMs: elapsedMs,
    });
  };

  const reset = () => {
    setQuestions(makeQuestions());
    setStage('intro');
    setIndex(0);
    setItems([]);
    setAnswer('');
    setElapsedMs(0);
    finalElapsedRef.current = 0;
    accumulatedMsRef.current = 0;
    startedAtRef.current = null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700"><Calculator className="w-5 h-5" /></div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Bài 4: Đánh giá khả năng tính toán ({phaseTitle})</h2>
            <p className="text-xs text-slate-500 mt-0.5">3 phép nhân · Hai số có hai chữ số</p>
          </div>
        </div>
        {stage === 'answer' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800">
            <Timer className="w-4 h-4" /><span className="font-mono font-bold text-sm tabular-nums">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => <div key={i} className={`h-2 rounded-full ${i < items.length ? 'bg-emerald-500' : i === index && stage !== 'intro' && stage !== 'result' ? 'bg-amber-500' : 'bg-slate-200'}`} />)}
      </div>

      {stage === 'intro' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center"><Calculator className="w-8 h-8" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Hướng dẫn bài tính toán</h3>
            <p className="text-sm text-slate-600">Giải liên tiếp 3 phép nhân hai chữ số với hai chữ số. Đồng hồ bắt đầu khi bạn nhấn nút bắt đầu và dừng sau khi xác nhận đáp án thứ ba.</p>
            <p className="text-xs text-slate-500">Hãy tự tính, không sử dụng máy tính. Mỗi câu chỉ được xác nhận một lần; sau khi xác nhận, hệ thống sẽ hiện đáp án để đối chiếu.</p>
          </div>
          <button onClick={start} className="w-full sm:w-auto px-8 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2"><span>Bắt đầu 3 phép tính</span><ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {stage === 'answer' && current && (
        <form onSubmit={submit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold text-amber-700">CÂU {index + 1}/3</span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 mt-3 tabular-nums">{current.a} × {current.b} = ?</div>
          </div>
          <label className="block max-w-xs mx-auto">
            <span className="block text-xs font-semibold text-slate-600 mb-2">Đáp án của bạn</span>
            <input autoFocus inputMode="numeric" pattern="[0-9]*" value={answer} onChange={e => setAnswer(e.target.value.replace(/\\D/g, '').slice(0, 5))} className="w-full h-14 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none text-center text-2xl font-mono font-bold" placeholder="Nhập kết quả" />
          </label>
          <button type="submit" disabled={!/^\\d{1,5}$/.test(answer.trim())} className="w-full h-12 rounded-xl bg-amber-600 disabled:opacity-40 text-white font-bold">Xác nhận đáp án</button>
        </form>
      )}

      {stage === 'feedback' && feedback && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${feedback.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {feedback.isCorrect ? <CheckCircle2 className="w-7 h-7" /> : <Calculator className="w-7 h-7" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{feedback.isCorrect ? 'Đáp án chính xác' : 'Đáp án chưa chính xác'}</h3>
          <div className="rounded-xl bg-slate-50 p-4 space-y-2">
            <p className="text-sm font-mono">{feedback.operandA} × {feedback.operandB} = <strong>{feedback.correctAnswer}</strong></p>
            <p className="text-xs text-slate-600">Bạn nhập: <strong>{feedback.userAnswer}</strong></p>
          </div>
          <button onClick={continueNext} className="w-full h-12 rounded-xl bg-amber-600 text-white font-bold inline-flex items-center justify-center gap-2">{index < 2 ? 'Sang phép tính tiếp theo' : 'Xem tổng kết'} <ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {stage === 'result' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full mx-auto bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-900">Hoàn thành bài tính toán</h3>
            <p className="text-xs text-slate-500">Kết quả của cả 3 phép tính</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-amber-800">Số câu đúng</div><div className="text-2xl font-black text-amber-800">{items.filter(x => x.isCorrect).length}/3</div></div>
            <div className="rounded-xl bg-indigo-50 p-4"><div className="text-xs text-indigo-800">Tổng thời gian</div><div className="text-2xl font-black text-indigo-800">{(elapsedMs / 1000).toFixed(2)}s</div></div>
          </div>
          <div className="space-y-2">
            {items.map(item => <div key={item.questionNumber} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><span className="font-mono">{item.operandA} × {item.operandB} = {item.correctAnswer}</span><span className={item.isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>{item.userAnswer} · {item.isCorrect ? 'Đúng' : 'Sai'}</span></div>)}
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="h-11 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Làm lại</button>
            <button onClick={finish} className="flex-1 h-12 rounded-xl bg-amber-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2">Xác nhận & tiếp tục <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};
