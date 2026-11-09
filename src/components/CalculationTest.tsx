import React, { useEffect, useRef, useState } from 'react';
import { Calculator, Timer, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CalculationTestResult, CalculationItemResult } from '../types';

interface CalculationTestProps {
  phaseTitle: string;
  onComplete: (result: CalculationTestResult) => void;
}

type Stage = 'intro' | 'test' | 'result';

function makeQuestions(): Array<{ a: number; b: number; answer: number }> {
  // Use a consistent two-digit operand range in both assessment phases.
  return Array.from({ length: 3 }, () => {
    const a = 12 + Math.floor(Math.random() * 78);
    const b = 12 + Math.floor(Math.random() * 78);
    return { a, b, answer: a * b };
  });
}

export const CalculationTest: React.FC<CalculationTestProps> = ({ phaseTitle, onComplete }) => {
  const [questions, setQuestions] = useState(makeQuestions);
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [items, setItems] = useState<CalculationItemResult[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const start = () => {
    setAnswers(['', '', '']);
    setItems([]);
    setElapsedMs(0);
    startedAtRef.current = performance.now();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedMs(Math.floor(performance.now() - startedAtRef.current));
      }
    }, 100);
    setStage('test');
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((current) => current.map((item, i) => i === index ? value.replace(/\\D/g, '').slice(0, 5) : item));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (stage !== 'test' || answers.some((value) => !/^\\d{1,5}$/.test(value.trim()))) return;

    const finishedAt = performance.now();
    const totalTimeMs = startedAtRef.current === null ? elapsedMs : Math.max(0, Math.round(finishedAt - startedAtRef.current));
    startedAtRef.current = null;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMs(totalTimeMs);

    const resultItems: CalculationItemResult[] = questions.map((question, index) => {
      const userAnswer = Number(answers[index]);
      return {
        questionNumber: index + 1,
        operandA: question.a,
        operandB: question.b,
        correctAnswer: question.answer,
        userAnswer,
        isCorrect: userAnswer === question.answer,
      };
    });
    setItems(resultItems);
    setStage('result');
  };

  const handleReset = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    startedAtRef.current = null;
    setQuestions(makeQuestions());
    setAnswers(['', '', '']);
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
        {stage === 'test' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800">
            <Timer className="w-4 h-4" /><span className="font-mono font-bold text-sm tabular-nums">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className={`h-2 rounded-full ${stage === 'result' || (stage === 'test' && answers[index].trim() !== '') ? 'bg-emerald-500' : stage === 'test' ? 'bg-amber-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      {stage === 'intro' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center"><Calculator className="w-8 h-8" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Hướng dẫn bài tính toán</h3>
            <p className="text-sm text-slate-600">Màn hình sẽ hiển thị đồng thời 3 phép nhân hai chữ số với hai chữ số. Nhập đáp án cho cả 3 câu rồi xác nhận một lần.</p>
            <p className="text-xs text-slate-500">Đồng hồ bắt đầu khi nhấn nút bắt đầu và dừng ngay khi xác nhận đủ 3 đáp án. Hãy tự tính, không sử dụng máy tính.</p>
          </div>
          <button onClick={start} className="w-full sm:w-auto px-8 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2"><span>Bắt đầu 3 phép tính</span><ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {stage === 'test' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900">Giải cả 3 phép tính dưới đây</h3>
            <p className="text-xs text-slate-500">Thời gian được tính liên tục cho đến khi bạn xác nhận.</p>
          </div>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <label key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <span className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                <span className="flex-1 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">{question.a} × {question.b} =</span>
                <input
                  autoFocus={index === 0}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={answers[index]}
                  onChange={(event) => handleAnswerChange(index, event.target.value)}
                  maxLength={5}
                  aria-label={`Đáp án phép tính ${index + 1}`}
                  placeholder="?"
                  className="w-24 sm:w-28 h-12 rounded-lg border-2 border-slate-200 focus:border-amber-500 outline-none bg-white text-center text-lg font-mono font-bold"
                />
              </label>
            ))}
          </div>
          <button type="submit" disabled={answers.some((value) => !/^\\d{1,5}$/.test(value.trim()))} className="w-full h-12 rounded-xl bg-amber-600 disabled:opacity-40 text-white font-bold">Xác nhận 3 đáp án</button>
        </form>
      )}

      {stage === 'result' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full mx-auto bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-900">Hoàn thành bài tính toán</h3>
            <p className="text-xs text-slate-500">Đáp án đúng được đối chiếu ngay sau khi hoàn thành.</p>
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
