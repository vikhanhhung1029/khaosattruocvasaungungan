import React, { useState, useEffect, useRef } from 'react';
import { FullNapSession } from '../types';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  RotateCcw,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Smile,
  Moon,
  Clock,
  Share2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Award,
  Image as ImageIcon,
  FileDown,
  X,
} from 'lucide-react';

function formatElapsedDuration(startValue: string, endValue: string): string {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'Không xác định';
  const totalSeconds = Math.floor((end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} phút ${seconds} giây` : `${seconds} giây`;
}

interface ComparisonReportProps {
  session: FullNapSession;
  onRestart: () => void;
}

export const ComparisonReport: React.FC<ComparisonReportProps> = ({
  session,
  onRestart,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [copyNotice, setCopyNotice] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(true);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const { studentInfo, preNap, postNap, napDurationMinutes } = session;
  const moodLabel = studentInfo.preNapMood === 'thoai_mai' ? 'Thoải mái' : studentInfo.preNapMood === 'cang_thang' ? 'Căng thẳng' : studentInfo.preNapMood === 'lo_lang' ? 'Lo lắng' : 'Bình thường';

  // 1. Alertness Calculation (Scale 1-5)
  const alertnessDelta = postNap.alertness - preNap.alertness;
  // 2. Fatigue Level Calculation (Scale 1-5: 1=Rất mệt, 2=Mệt mỏi, 3=Bình thường, 4=Ít mệt, 5=Hoàn toàn khỏe)
  // Higher score = more energetic / reduced fatigue
  const fatigueDelta = postNap.fatigue - preNap.fatigue;
  // 3. Reaction Time Calculation (Milliseconds - faster reaction time is positive speed gain)
  const getAverageReactionTime = (trials: number[], fallback: number) => {
    const validTrials = trials.filter((value) => Number.isFinite(value) && value > 0);
    return validTrials.length > 0
      ? Math.round(validTrials.reduce((sum, value) => sum + value, 0) / validTrials.length)
      : fallback;
  };
  const preReactionTime = getAverageReactionTime(preNap.reactionTest.trials, preNap.reactionTest.averageTime);
  const postReactionTime = getAverageReactionTime(postNap.reactionTest.trials, postNap.reactionTest.averageTime);
  const reactionTimeSavedMs = preReactionTime - postReactionTime;
  const reactionSpeedGainPercent =
    preReactionTime > 0
      ? parseFloat((((preReactionTime - postReactionTime) / preReactionTime) * 100).toFixed(1))
      : 0;

  const preSpeedIndex = preReactionTime > 0 ? Math.round(100000 / preReactionTime) : 0;
  const postSpeedIndex = postReactionTime > 0 ? Math.round(100000 / postReactionTime) : 0;
  const maxSpeedIndex = Math.max(preSpeedIndex, postSpeedIndex, 400);

  // 4. Selective Attention Calculation (Standard 10 target 'A's in 10 seconds)
  const preAttnCorrect = preNap.attentionTest.foundCorrect;
  const postAttnCorrect = postNap.attentionTest.foundCorrect;
  const preAttnErrors = preNap.attentionTest.errors;
  const postAttnErrors = postNap.attentionTest.errors;

  const preAttentionTargets = Math.max(1, preNap.attentionTest.totalTargetA || 10);
  const postAttentionTargets = Math.max(1, postNap.attentionTest.totalTargetA || 10);
  const preNetAccuracy = Math.min(100, Math.max(0, Math.round(((preAttnCorrect - preAttnErrors) / preAttentionTargets) * 100)));
  const postNetAccuracy = Math.min(100, Math.max(0, Math.round(((postAttnCorrect - postAttnErrors) / postAttentionTargets) * 100)));
  const attentionAccuracyDelta = postNetAccuracy - preNetAccuracy;
  const attentionPercentChange = attentionAccuracyDelta;

  // 5. Short-term Memory Calculation (3 rounds of 7 simultaneous digits in 7 seconds = 21 digits)
  const preMemoryCorrect = preNap.memoryTest.correctDigitsCount;
  const postMemoryCorrect = postNap.memoryTest.correctDigitsCount;
  const preTotalDigits = Math.max(1, preNap.memoryTest.totalDigits || 21);
  const postTotalDigits = Math.max(1, postNap.memoryTest.totalDigits || 21);
  const preMemoryPercent = Math.min(100, Math.max(0, Math.round((preMemoryCorrect / preTotalDigits) * 100)));
  const postMemoryPercent = Math.min(100, Math.max(0, Math.round((postMemoryCorrect / postTotalDigits) * 100)));
  const memoryPercentDelta = postMemoryPercent - preMemoryPercent;
  const memoryPercentChange = memoryPercentDelta;

  // 6. Arithmetic: compare accuracy first, then completion time when accuracy is equal.
  const preCalculation = preNap.calculationTest;
  const postCalculation = postNap.calculationTest;
  const preCalculationCorrect = preCalculation?.correctCount ?? 0;
  const postCalculationCorrect = postCalculation?.correctCount ?? 0;
  const preCalculationAccuracy = preCalculation?.accuracyPercentage ?? 0;
  const postCalculationAccuracy = postCalculation?.accuracyPercentage ?? 0;
  const preCalculationTimeMs = preCalculation?.totalTimeMs ?? 0;
  const postCalculationTimeMs = postCalculation?.totalTimeMs ?? 0;
  const calculationTimeSavedMs = preCalculationTimeMs - postCalculationTimeMs;
  const calculationAccuracyDelta = postCalculationAccuracy - preCalculationAccuracy;
  const calculationImproved = calculationAccuracyDelta > 0
    || (calculationAccuracyDelta === 0 && preCalculationTimeMs > 0 && postCalculationTimeMs > 0 && calculationTimeSavedMs > 0);
  const calculationDeclined = calculationAccuracyDelta < 0
    || (calculationAccuracyDelta === 0 && preCalculationTimeMs > 0 && postCalculationTimeMs > 0 && calculationTimeSavedMs < 0);

  // The six measures use different scales/units; summarize direction by counting improved domains.
  const improvedIndicatorsCount = [
    alertnessDelta > 0,
    fatigueDelta > 0,
    reactionTimeSavedMs > 0,
    attentionAccuracyDelta > 0,
    memoryPercentDelta > 0,
    calculationImproved,
  ].filter(Boolean).length;
  const declinedIndicatorsCount = [
    alertnessDelta < 0,
    fatigueDelta < 0,
    reactionTimeSavedMs < 0,
    attentionAccuracyDelta < 0,
    memoryPercentDelta < 0,
    calculationDeclined,
  ].filter(Boolean).length;
  const unchangedIndicatorsCount = 6 - improvedIndicatorsCount - declinedIndicatorsCount;
  const formatSigned = (value: number, suffix = '') => `${value > 0 ? '+' : ''}${value}${suffix}`;

  const handleShare = () => {
    const text = `Báo cáo khảo sát [${studentInfo.studentId || 'Chưa có mã'}]: ${studentInfo.school || 'Chưa chọn trường'}, ${studentInfo.className}, thời lượng ngủ ngắn ${napDurationMinutes} phút. Lĩnh vực cải thiện: ${improvedIndicatorsCount}/6; không đổi: ${unchangedIndicatorsCount}/6; giảm: ${declinedIndicatorsCount}/6.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 2500);
    }
  };

  // Export to PNG using html-to-image (immune to OKLCH CSS color parser bugs)
  const handleExportPNG = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting('png');
    setExportMessage('Đang xử lý kết xuất ảnh PNG độ nét cao...');
    try {
      const element = reportRef.current;
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const cleanName = (studentInfo.studentId || session.id)
        .trim()
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');

      const link = document.createElement('a');
      link.download = `Bao_cao_khao_sat_${cleanName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess('Đã tải xuống file ảnh PNG thành công!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error('Lỗi xuất PNG:', err);
      setExportError('Không thể tạo file ảnh PNG. Vui lòng thử lại.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
      setExportMessage(null);
    }
  };

  // Export to PDF using html-to-image + jsPDF (immune to OKLCH CSS color parser bugs)
  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting('pdf');
    setExportMessage('Đang xử lý kết xuất tài liệu PDF...');
    try {
      const element = reportRef.current;
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Load image to compute exact aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for PDF'));
      });

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanName = (studentInfo.studentId || session.id)
        .trim()
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');

      pdf.save(`Bao_cao_khao_sat_${cleanName}.pdf`);
      setExportSuccess('Đã tải xuống file PDF thành công!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      setExportError('Không thể tạo file PDF. Vui lòng thử lại.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
      setExportMessage(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900">
            Báo Cáo Đánh Giá Nhận Thức Giấc Ngủ Ngắn
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PNG Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting !== null}
            className="min-h-11 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 disabled:cursor-wait"
            title="Tải báo cáo về máy dạng ảnh PNG"
          >
            {isExporting === 'png' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
            <span>{isExporting === 'png' ? 'Đang xuất PNG...' : 'Xuất PNG'}</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            className="min-h-11 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 disabled:cursor-wait"
            title="Tải báo cáo về máy dạng tài liệu PDF"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExporting === 'pdf' ? 'Đang xuất PDF...' : 'Xuất PDF'}</span>
          </button>

          {/* Share summary */}
          <button
            onClick={handleShare}
            className="min-h-11 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copyNotice ? 'Đã sao chép' : 'Chia sẻ tóm tắt'}</span>
          </button>

          {/* Làm lại bài khảo sát mới */}
          <button
            onClick={onRestart}
            className="min-h-11 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            title="Bắt đầu làm bài khảo sát mới từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Làm lại từ đầu</span>
          </button>
        </div>
      </div>

      {/* Export status alerts */}
      {exportSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}
      {exportMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Main Report Body for Export & View */}
      <div ref={reportRef} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
        {/* Report Header */}
        <div className="border-b border-slate-200 pb-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-indigo-700 tracking-wider uppercase block">
                Nghiên Cứu & Đánh Giá Khoa Học
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Báo Cáo So Sánh Hiệu Quả Giấc Ngủ Ngắn
              </h2>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500">
              <span className="block font-medium">
                Ngày: {new Date(session.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <span className="block text-[11px] font-mono text-slate-400">
                Mã phiên: {session.id}
              </span>
            </div>
          </div>

          {/* Student Profile Info Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold font-mono">
              Mã người thực hiện: {studentInfo.studentId || 'Chưa có mã'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold font-mono">
              {studentInfo.className}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              Giới tính: {studentInfo.gender || 'Chưa cung cấp'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-200 font-bold">
              Trường: {studentInfo.school || 'Chưa cung cấp'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-200 font-bold">
              Giấc ngủ ngắn: {napDurationMinutes} phút
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Giấc ngủ đêm qua: {studentInfo.bedTime} - {studentInfo.wakeTime} ({studentInfo.sleepHours}h)
            </span>

            {studentInfo.hadCoffee ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                Cà phê trước khi ngủ: Có ({studentInfo.coffeeDetails || 'Đã dùng'})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                Cà phê: Không
              </span>
            )}

            {studentInfo.hadSoda ? (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-semibold">
                Nước ngọt / có ga: Có ({studentInfo.sodaDetails || 'Đã dùng'})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                Nước ngọt / có ga: Không
              </span>
            )}

            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Tâm trạng trước ngủ: {moodLabel}
            </span>
          </div>
        </div>

        {/* Summary of directional changes across five distinct metrics */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-emerald-50 border border-indigo-200/80 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Tổng quan thay đổi 6 lĩnh vực</span>
            </div>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              Không gộp thành một tỷ lệ phần trăm vì các bài đo dùng thang điểm và đơn vị khác nhau. Báo cáo đếm số lĩnh vực cải thiện, không đổi hoặc giảm.
            </p>

            {/* Individual Breakdown */}
            <div className="text-[11px] text-slate-600 pt-1 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
              <span>• Tỉnh táo: <strong className={alertnessDelta >= 0 ? 'text-indigo-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{formatSigned(alertnessDelta, ' điểm')}</strong></span>
              <span>• Mệt mỏi: <strong className={fatigueDelta >= 0 ? 'text-amber-800 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{formatSigned(fatigueDelta, ' điểm')}</strong></span>
              <span>• Giảm thời gian phản xạ: <strong className={reactionSpeedGainPercent >= 0 ? 'text-emerald-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{formatSigned(reactionSpeedGainPercent, '%')}</strong></span>
              <span>• Chú ý: <strong className={attentionPercentChange >= 0 ? 'text-emerald-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{formatSigned(attentionPercentChange, ' điểm %')}</strong></span>
              <span>• Trí nhớ: <strong className={memoryPercentChange >= 0 ? 'text-violet-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{formatSigned(memoryPercentChange, ' điểm %')}</strong></span>
              <span>• Tính toán: <strong className={calculationImproved ? 'text-emerald-700 font-mono font-bold' : calculationDeclined ? 'text-rose-600 font-mono font-bold' : 'text-slate-600 font-mono font-bold'}>{formatSigned(calculationAccuracyDelta, ' điểm %')} độ chính xác</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-4 bg-white rounded-2xl text-center border-2 border-indigo-200/80 shadow-sm min-w-[200px]">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                Số lĩnh vực cải thiện
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-emerald-700">
                {improvedIndicatorsCount}/5
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Không đổi: {unchangedIndicatorsCount} · Giảm: {declinedIndicatorsCount}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Cách tính và diễn giải kết quả</h3>
          <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
            <p><strong>1. Tỉnh táo:</strong> {postNap.alertness} − {preNap.alertness} = <strong>{formatSigned(alertnessDelta, ' điểm')}</strong> (thang 1–5; số dương là tăng tỉnh táo).</p>
            <p><strong>2. Mức độ mệt mỏi:</strong> {postNap.fatigue} − {preNap.fatigue} = <strong>{formatSigned(fatigueDelta, ' điểm')}</strong> (thang 1–5; điểm cao hơn nghĩa là ít mệt hơn).</p>
            <p><strong>3. Phản xạ:</strong> Thời gian trung bình = tổng thời gian các lần bấm hợp lệ ÷ số lần hợp lệ. Trước: {preReactionTime} ms ({preNap.reactionTest.trials.length} lần); sau: {postReactionTime} ms ({postNap.reactionTest.trials.length} lần). Mức rút ngắn = {preReactionTime} − {postReactionTime} = <strong>{formatSigned(reactionTimeSavedMs, ' ms')}</strong>; tỷ lệ giảm thời gian = ({preReactionTime} − {postReactionTime}) ÷ {preReactionTime || 1} × 100 = <strong>{reactionSpeedGainPercent}%</strong>. Bấm sớm: {preNap.reactionTest.faults} → {postNap.reactionTest.faults} lần (ghi riêng, không cộng vào thời gian trung bình).</p>
            <p><strong>4. Chú ý:</strong> Trước: max(0, min(100, ({preAttnCorrect} − {preAttnErrors}) ÷ {preAttentionTargets} × 100)) = <strong>{preNetAccuracy}%</strong>. Sau: max(0, min(100, ({postAttnCorrect} − {postAttnErrors}) ÷ {postAttentionTargets} × 100)) = <strong>{postNetAccuracy}%</strong>. Chênh lệch = <strong>{formatSigned(attentionAccuracyDelta, ' điểm %')}</strong>.</p>
            <p><strong>5. Trí nhớ:</strong> Trước: {preMemoryCorrect}/{preTotalDigits} × 100 = <strong>{preMemoryPercent}%</strong>. Sau: {postMemoryCorrect}/{postTotalDigits} × 100 = <strong>{postMemoryPercent}%</strong>. Chênh lệch = <strong>{formatSigned(memoryPercentDelta, ' điểm %')}</strong>.</p>
            <p className="text-slate-500"><strong>Tổng hợp:</strong> Đếm số trong 6 lĩnh vực có kết quả tốt hơn, không lấy trung bình các tỷ lệ khác đơn vị. Đây là so sánh mô tả trong bài khảo sát, không phải chẩn đoán y khoa.</p>
          </div>
          <div className="border-t border-slate-100 pt-2 text-xs text-slate-600 space-y-1">
            <p>Thời điểm bắt đầu: {new Date(session.startedAt || session.createdAt).toLocaleString('vi-VN')}</p>
            <p>Thời điểm kết thúc: {new Date(session.completedAt || session.createdAt).toLocaleString('vi-VN')}</p>
            <p>Tổng thời gian thực hiện: {formatElapsedDuration(session.startedAt || session.createdAt, session.completedAt || session.createdAt)}</p>
          </div>
        </div>

        {/* Section: Comparative Visual Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Bảng So Sánh Chi Tiết Từng Chỉ Số
            </h3>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-slate-300" />
                <span>Trước khi ngủ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-indigo-600" />
                <span>Sau khi ngủ</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* 1. Mức độ tỉnh táo */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-indigo-600" />
                  1. Mức độ tỉnh táo (Thang điểm 1 - 5)
                </span>
                <span className="font-mono font-bold text-xs">
                  {preNap.alertness}/5 → <strong className="text-indigo-700">{postNap.alertness}/5</strong>{' '}
                  <span
                    className={`text-[11px] font-semibold ${
                      alertnessDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ({alertnessDelta >= 0 ? `+${alertnessDelta}` : alertnessDelta} điểm)
                  </span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Trước:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(preNap.alertness / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 w-8 text-right">{preNap.alertness}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Sau:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(postNap.alertness / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-indigo-700 font-bold w-8 text-right">{postNap.alertness}/5</span>
                </div>
              </div>
            </div>

            {/* 2. Mức độ mệt mỏi */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-700" />
                  2. Mức độ mệt mỏi (Thang điểm 1 - 5)
                </span>
                <span className="font-mono font-bold text-xs">
                  {preNap.fatigue}/5 → <strong className="text-amber-800">{postNap.fatigue}/5</strong>{' '}
                  <span
                    className={`text-[11px] font-semibold ${
                      fatigueDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ({fatigueDelta >= 0 ? `+${fatigueDelta}` : fatigueDelta} điểm)
                  </span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Trước:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(preNap.fatigue / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 w-8 text-right">{preNap.fatigue}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Sau:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${(postNap.fatigue / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 font-bold w-8 text-right">{postNap.fatigue}/5</span>
                </div>
              </div>
            </div>

            {/* 3. Thời gian phản ứng trung bình */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-rose-600" />
                  3. Thời gian phản ứng trung bình (ms - rút ngắn thời gian là tăng tốc độ)
                </span>
                <span className="font-mono font-bold text-xs">
                  {preReactionTime}ms → <strong className="text-rose-700">{postReactionTime}ms</strong>{' '}
                  <span
                    className={`text-[11px] font-semibold ${
                      reactionTimeSavedMs >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ({reactionTimeSavedMs >= 0 ? `Rút ngắn ${reactionTimeSavedMs}ms` : `Chậm hơn ${Math.abs(reactionTimeSavedMs)}ms`} ·{' '}
                    {formatSigned(reactionSpeedGainPercent, '%')} giảm thời gian)
                  </span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Trước:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${Math.min(100, (preSpeedIndex / maxSpeedIndex) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-700 w-16 text-right font-medium">
                    {preReactionTime} ms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12 font-medium">Sau:</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${Math.min(100, (postSpeedIndex / maxSpeedIndex) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-rose-700 font-bold w-16 text-right">
                    {postReactionTime} ms
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Bài kiểm tra chú ý chọn lọc (chuẩn 10 chữ A / 10 giây) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  4. Chú ý chọn lọc: Điểm chú ý ròng (10 chữ A / 10 giây)
                </span>
                <span className="font-mono font-bold text-xs">
                  {preNetAccuracy}% → <strong className="text-emerald-700">{postNetAccuracy}%</strong>{' '}
                  <span
                    className={`text-[11px] font-semibold ${
                      attentionAccuracyDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ({attentionAccuracyDelta >= 0 ? `+${attentionAccuracyDelta}%` : `${attentionAccuracyDelta}%`})
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold">Trước khi ngủ</span>
                  <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                    {preAttnCorrect}/10 chữ A · {preAttnErrors} lỗi
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Thời gian: {preNap.attentionTest.timeSpentSeconds}s · Điểm chú ý ròng: {preNetAccuracy}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 block font-semibold">Sau khi ngủ</span>
                  <div className="font-bold text-emerald-900 font-mono text-sm mt-0.5">
                    {postAttnCorrect}/10 chữ A · {postAttnErrors} lỗi
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Thời gian: {postNap.attentionTest.timeSpentSeconds}s · Điểm chú ý ròng: {postNetAccuracy}%
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Trí nhớ ngắn hạn (3 bài kiểm tra - hiện đồng thời 7 số trong 7 giây) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-violet-600" />
                  5. Trí nhớ ngắn hạn: Tái hiện 7 chữ số sau 7 giây ghi nhớ đồng thời (3 bài kiểm tra)
                </span>
                <span className="font-mono font-bold text-xs">
                  {preMemoryPercent}% → <strong className="text-violet-700">{postMemoryPercent}%</strong>{' '}
                  <span
                    className={`text-[11px] font-semibold ${
                      memoryPercentDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    ({memoryPercentDelta >= 0 ? `+${memoryPercentDelta}%` : `${memoryPercentDelta}%`})
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 block font-semibold">Trước khi ngủ</span>
                  <div className="font-mono font-bold text-slate-800 text-sm">
                    Đúng {preMemoryCorrect}/{preTotalDigits} số
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Độ chính xác: {preMemoryPercent}%
                  </span>
                  {preNap.memoryTest.rounds && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-center gap-1.5">
                      {preNap.memoryTest.rounds.map((r, i) => (
                        <span key={i}>B{r.roundNumber}: {r.correctDigitsCount}/7</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-violet-50/80 border border-violet-200 text-center space-y-1">
                  <span className="text-[10px] text-violet-800 block font-semibold">Sau khi ngủ</span>
                  <div className="font-mono font-bold text-violet-900 text-sm">
                    Đúng {postMemoryCorrect}/{postTotalDigits} số
                  </div>
                  <span className="text-[10px] text-violet-700 block">
                    Độ chính xác: {postMemoryPercent}%
                  </span>
                  {postNap.memoryTest.rounds && (
                    <div className="text-[10px] text-violet-600 pt-1 border-t border-violet-100 flex justify-center gap-1.5">
                      {postNap.memoryTest.rounds.map((r, i) => (
                        <span key={i}>B{r.roundNumber}: {r.correctDigitsCount}/7</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 6. Bài kiểm tra tính toán */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5"><Brain className="w-4 h-4 text-amber-600" />6. Tính toán: 3 phép nhân hai chữ số</span>
                <span className="font-mono font-bold">{preCalculationAccuracy}% → <strong className="text-amber-700">{postCalculationAccuracy}%</strong> ({formatSigned(calculationAccuracyDelta, ' điểm %')})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[{label:'Trước khi ngủ',data:preCalculation,accent:'text-slate-800',panel:'bg-white'},{label:'Sau khi ngủ',data:postCalculation,accent:'text-amber-800',panel:'bg-amber-50/70'}].map((entry) => (
                  <div key={entry.label} className={`rounded-lg border border-slate-200 p-3 text-center space-y-1 ${entry.panel}`}>
                    <strong className={`block text-[10px] ${entry.accent}`}>{entry.label}</strong>
                    <div className={`font-mono font-bold text-sm ${entry.accent}`}>{entry.data ? `${entry.data.correctCount}/3 câu đúng` : 'Không có dữ liệu'}</div>
                    <div className="text-[10px] text-slate-500">Thời gian: {entry.data ? (entry.data.totalTimeMs / 1000).toFixed(2) + ' giây' : '—'}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[{label:'Trước',data:preCalculation},{label:'Sau',data:postCalculation}].map((entry) => entry.data ? (
                  <div key={entry.label} className="rounded-lg bg-white border border-slate-200 p-3 space-y-1">
                    <strong className="text-[10px] text-slate-500">{entry.label} khi ngủ</strong>
                    {entry.data.items.map((item) => <div key={item.questionNumber} className="flex justify-between gap-2 text-xs"><span className="font-mono">{item.operandA} × {item.operandB} = {item.correctAnswer}</span><span className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>Nhập {item.userAnswer} · {item.isCorrect ? 'Đúng' : 'Sai'}</span></div>)}
                  </div>
                ) : null)}
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Evaluation Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase">
            <Clock className="w-4 h-4 text-indigo-700" />
            <span>Phân Tích & Đánh Giá Khoa Học</span>
          </div>

          <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
            <p>
              • <strong>Thời lượng ngủ ngắn ({napDurationMinutes} phút):</strong>{' '}
              {napDurationMinutes <= 20
                ? 'Thời lượng 5–20 phút là khoảng nghỉ ngắn. Một giấc ngủ ngắn có thể giúp giảm buồn ngủ, nhưng mức độ tỉnh táo sau khi thức dậy khác nhau giữa từng người; không thể kết luận hiệu quả chỉ dựa trên thời lượng.'
                : napDurationMinutes <= 30
                ? 'Thời lượng 21–30 phút vẫn thuộc nhóm ngủ ngắn. Một số người có thể cảm thấy tỉnh táo hơn, nhưng cũng có thể xuất hiện cảm giác uể oải tạm thời sau khi thức dậy.'
                : 'Thời lượng trên 30 phút có thể làm tăng khả năng thức dậy trong giai đoạn ngủ sâu và gặp quán tính giấc ngủ. Mức độ ảnh hưởng tùy thời điểm ngủ và tình trạng thiếu ngủ trước đó.'}
            </p>
            <p>
              • <strong>Tương quan giấc ngủ ban đêm ({studentInfo.sleepHours} giờ):</strong>{' '}
              {studentInfo.sleepHours < 8
                ? 'Thời lượng ngủ đêm dưới khoảng khuyến nghị 8–10 giờ cho thanh thiếu niên 13–18 tuổi. Giấc ngủ ngắn không thay thế được việc ngủ đủ và đều đặn vào ban đêm.'
                : studentInfo.sleepHours <= 10
                ? 'Thời lượng ngủ đêm nằm trong khoảng khuyến nghị 8–10 giờ cho thanh thiếu niên 13–18 tuổi. Đây là dữ liệu tự khai báo, không tự xác nhận chất lượng giấc ngủ.'
                : 'Thời lượng ngủ đêm cao hơn khoảng tham khảo 8–10 giờ. Nhu cầu ngủ có thể khác nhau; cần xem xét lịch sinh hoạt và cảm giác nghỉ ngơi thực tế.'}
            </p>
            {studentInfo.hadCoffee ? (
              <p>
                • <strong>Tác động của Cà phê:</strong> Có ghi nhận sử dụng cà phê trước khi ngủ ngắn{studentInfo.coffeeDetails ? ` (${studentInfo.coffeeDetails})` : ''}. Caffeine có thể ảnh hưởng đến mức độ tỉnh táo, nhưng báo cáo này chỉ ghi nhận việc sử dụng; không thể xác định caffeine có gây ra thay đổi trong kết quả hay không.
              </p>
            ) : (
              <p>
                • <strong>Cà phê:</strong> Không sử dụng cà phê trước giấc ngủ ngắn, kết quả kiểm tra phản ánh sự hồi phục sinh học tự nhiên của hệ thần kinh.
              </p>
            )}
            {studentInfo.hadSoda ? (
              <p>
                • <strong>Tác động của Nước ngọt / Nước có ga:</strong> Có ghi nhận sử dụng nước ngọt/nước có ga trước khi ngủ ngắn{studentInfo.sodaDetails ? ` (${studentInfo.sodaDetails})` : ''}. Thông tin này chỉ được ghi nhận để đối chiếu với kết quả; không thể kết luận đồ uống là nguyên nhân làm thay đổi khả năng chú ý hoặc phản xạ.
              </p>
            ) : (
              <p>
                • <strong>Nước ngọt / có ga:</strong> Không sử dụng nước ngọt hoặc nước có ga trước khi ngủ ngắn.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer with Export buttons & Reset button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleExportPNG}
          disabled={isExporting !== null}
          className="w-full sm:w-auto flex-1 h-12 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs sm:text-sm font-bold text-indigo-700 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60"
        >
          {isExporting === 'png' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <span>Xuất Báo Cáo PNG</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting !== null}
          className="w-full sm:w-auto flex-1 h-12 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs sm:text-sm font-bold text-rose-700 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60"
        >
          {isExporting === 'pdf' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>Xuất Báo Cáo PDF</span>
        </button>

        <button
          onClick={onRestart}
          className="w-full sm:w-auto flex-1 h-12 rounded-xl border-2 border-slate-300 text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-98 transition bg-white shadow-xs"
        >
          <RotateCcw className="w-4 h-4 text-indigo-600" />
          <span>Làm lại bài khảo sát mới từ đầu</span>
        </button>
      </div>

      {/* Full-Screen Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8 text-center space-y-6">
            {/* Close X button */}
            <button
              onClick={() => setShowCompletionModal(false)}
              className="absolute top-3 right-3 min-w-11 min-h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <Award className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full inline-block">
                Ghi nhận thành công
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bạn Đã Hoàn Thành Khảo Sát!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Cảm ơn bạn đã tham gia nghiên cứu khoa học đánh giá hiệu quả giấc ngủ ngắn. Kết quả khảo sát đã được ghi nhận.
              </p>
            </div>

            {/* Quick summary box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mã người thực hiện:</span>
                <strong className="text-slate-900 font-bold">{studentInfo.studentId || 'Chưa có mã'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Lớp:</span>
                <strong className="text-slate-900 font-mono font-bold">{studentInfo.className}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Thời gian ngủ ngắn:</span>
                <strong className="text-indigo-700 font-bold">{napDurationMinutes} phút</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nhận thức sau ngủ:</span>
                <strong className="font-mono font-bold text-emerald-700">{improvedIndicatorsCount}/6 chỉ số cải thiện</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Trí nhớ ngắn hạn sau ngủ:</span>
                <strong className="text-violet-700 font-mono font-bold">{postMemoryPercent}%</strong>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition"
              >
                <Check className="w-4 h-4" />
                <span>Xem Chi Tiết & Tải Báo Cáo (PNG / PDF)</span>
              </button>

              <button
                onClick={onRestart}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>Làm lại bài khảo sát mới từ đầu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
