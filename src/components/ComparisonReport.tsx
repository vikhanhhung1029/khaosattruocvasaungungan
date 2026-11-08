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

interface ComparisonReportProps {
  session: FullNapSession;
  onRestart: () => void;
  userEmail?: string | null;
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

  // 1. Alertness Calculation (Scale 1-5)
  const alertnessDelta = postNap.alertness - preNap.alertness;
  const alertnessPercentChange = Math.round(
    ((postNap.alertness - preNap.alertness) / (preNap.alertness || 1)) * 100
  );

  // 2. Fatigue Level Calculation (Scale 1-5: 1=Rất mệt, 2=Mệt mỏi, 3=Bình thường, 4=Ít mệt, 5=Hoàn toàn khỏe)
  // Higher score = more energetic / reduced fatigue
  const fatigueDelta = postNap.fatigue - preNap.fatigue;
  const fatiguePercentChange = Math.round(
    ((postNap.fatigue - preNap.fatigue) / (preNap.fatigue || 1)) * 100
  );

  // 3. Reaction Time Calculation (Milliseconds - faster reaction time is positive speed gain)
  const preReactionTime = preNap.reactionTest.averageTime;
  const postReactionTime = postNap.reactionTest.averageTime;
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

  const preNetAccuracy = Math.max(0, Math.round(((preAttnCorrect - preAttnErrors) / 10) * 100));
  const postNetAccuracy = Math.max(0, Math.round(((postAttnCorrect - postAttnErrors) / 10) * 100));
  const attentionAccuracyDelta = postNetAccuracy - preNetAccuracy;
  const attentionPercentChange = attentionAccuracyDelta;

  // 5. Short-term Memory Calculation (3 rounds of 7 simultaneous digits in 7 seconds = 21 digits)
  const preMemoryCorrect = preNap.memoryTest.correctDigitsCount;
  const postMemoryCorrect = postNap.memoryTest.correctDigitsCount;
  const preTotalDigits = preNap.memoryTest.totalDigits || 21;
  const postTotalDigits = postNap.memoryTest.totalDigits || 21;
  const preMemoryPercent = preNap.memoryTest.accuracyPercentage;
  const postMemoryPercent = postNap.memoryTest.accuracyPercentage;
  const memoryPercentDelta = postMemoryPercent - preMemoryPercent;
  const memoryPercentChange = memoryPercentDelta;

  // 6. Comprehensive Scientific Average Improvement Percentage across all 5 indicators:
  // Average % change = (Alertness% + Fatigue% + ReactionSpeed% + Attention% + Memory%) / 5
  const averageImprovementPercent = parseFloat(
    (
      (alertnessPercentChange +
        fatiguePercentChange +
        reactionSpeedGainPercent +
        attentionPercentChange +
        memoryPercentChange) /
      5
    ).toFixed(1)
  );

  const handleShare = () => {
    const text = `Báo cáo đánh giá giấc ngủ ngắn: ${studentInfo.studentName} (Lớp ${studentInfo.className}, ngủ ${napDurationMinutes} phút). Chỉ số tổng hợp sau ngủ ngắn: ${averageImprovementPercent >= 0 ? `Tăng +${averageImprovementPercent}%` : `Giảm -${Math.abs(averageImprovementPercent)}%`}. Tốc độ phản xạ: ${reactionSpeedGainPercent > 0 ? `+${reactionSpeedGainPercent}%` : `${reactionSpeedGainPercent}%`}, mức tỉnh táo: ${postNap.alertness}/5 điểm.`;
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

      const cleanName = (studentInfo.studentName || 'hoc_sinh')
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

      const cleanName = (studentInfo.studentName || 'hoc_sinh')
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
            className="h-9 px-3 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 disabled:cursor-wait"
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
            className="h-9 px-3 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 disabled:cursor-wait"
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
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copyNotice ? 'Đã sao chép' : 'Chia sẻ tóm tắt'}</span>
          </button>

          {/* Làm lại bài khảo sát mới */}
          <button
            onClick={onRestart}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
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
      <div ref={reportRef} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
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
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
              Học sinh: {studentInfo.studentName || 'Chưa đặt tên'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold font-mono">
              Lớp: {studentInfo.className}
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
              Tâm trạng trước ngủ:{' '}
              {studentInfo.preNapMood === 'thoai_mai' ? 'Thoải mái' :
               studentInfo.preNapMood === 'cang_thang' ? 'Căng thẳng' :
               studentInfo.preNapMood === 'lo_lang' ? 'Lo lắng' : 'Bình thường'}
            </span>
          </div>
        </div>

        {/* Highlight Score Summary Banner: Scientific Average Percentage Across All 5 Metrics */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-emerald-50 border border-indigo-200/80 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Chỉ số tổng hợp sau ngủ ngắn</span>
            </div>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              Tính toán khoa học trung bình cộng % thay đổi của 5 chỉ số: Tỉnh táo, Mệt mỏi, Tốc độ phản xạ, Chú ý chọn lọc và Trí nhớ ngắn hạn.
            </p>

            {/* Individual Breakdown */}
            <div className="text-[11px] text-slate-600 pt-1 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
              <span>• Tỉnh táo: <strong className={alertnessPercentChange >= 0 ? 'text-indigo-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{alertnessPercentChange >= 0 ? `+${alertnessPercentChange}%` : `${alertnessPercentChange}%`}</strong></span>
              <span>• Mệt mỏi: <strong className={fatiguePercentChange >= 0 ? 'text-amber-800 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{fatiguePercentChange >= 0 ? `+${fatiguePercentChange}%` : `${fatiguePercentChange}%`}</strong></span>
              <span>• Phản xạ: <strong className={reactionSpeedGainPercent >= 0 ? 'text-emerald-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{reactionSpeedGainPercent >= 0 ? `+${reactionSpeedGainPercent}%` : `${reactionSpeedGainPercent}%`}</strong></span>
              <span>• Chú ý: <strong className={attentionPercentChange >= 0 ? 'text-emerald-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{attentionPercentChange >= 0 ? `+${attentionPercentChange}%` : `${attentionPercentChange}%`}</strong></span>
              <span>• Trí nhớ: <strong className={memoryPercentChange >= 0 ? 'text-violet-700 font-mono font-bold' : 'text-rose-600 font-mono font-bold'}>{memoryPercentChange >= 0 ? `+${memoryPercentChange}%` : `${memoryPercentChange}%`}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-4 bg-white rounded-2xl text-center border-2 border-indigo-200/80 shadow-sm min-w-[200px]">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                Trung bình 5 chỉ số
              </span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${
                  averageImprovementPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {averageImprovementPercent >= 0 ? `Tăng +${averageImprovementPercent}%` : `Giảm -${Math.abs(averageImprovementPercent)}%`}
              </div>
            </div>
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
              <div className="flex justify-between items-center text-xs">
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
                    ({alertnessDelta >= 0 ? `+${alertnessDelta}` : alertnessDelta} điểm ·{' '}
                    {alertnessPercentChange >= 0 ? `+${alertnessPercentChange}%` : `${alertnessPercentChange}%`})
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
                    ({fatigueDelta >= 0 ? `+${fatigueDelta}` : fatigueDelta} điểm ·{' '}
                    {fatiguePercentChange >= 0 ? `+${fatiguePercentChange}%` : `${fatiguePercentChange}%`})
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
                    {reactionSpeedGainPercent >= 0 ? `+${reactionSpeedGainPercent}%` : `${reactionSpeedGainPercent}%`} tốc độ)
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
                  4. Chú ý chọn lọc: Tỷ lệ chính xác thực (Chuẩn 10 chữ A / 10 giây)
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
                    Thời gian: {preNap.attentionTest.timeSpentSeconds}s · Độ chính xác thực: {preNetAccuracy}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 block font-semibold">Sau khi ngủ</span>
                  <div className="font-bold text-emerald-900 font-mono text-sm mt-0.5">
                    {postAttnCorrect}/10 chữ A · {postAttnErrors} lỗi
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Thời gian: {postNap.attentionTest.timeSpentSeconds}s · Độ chính xác thực: {postNetAccuracy}%
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
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-100 flex justify-center gap-1.5">
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
                    <div className="text-[9px] text-violet-600 pt-1 border-t border-violet-100 flex justify-center gap-1.5">
                      {postNap.memoryTest.rounds.map((r, i) => (
                        <span key={i}>B{r.roundNumber}: {r.correctDigitsCount}/7</span>
                      ))}
                    </div>
                  )}
                </div>
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
                ? 'Thời lượng 15-20 phút đạt hiệu quả tối ưu theo mô hình Power Nap. Giai đoạn này giúp dọn sạch phân tử Adenosine tích tụ ở synap thần kinh mà chưa kích hoạt giấc ngủ sóng chậm (Slow-Wave Sleep), giúp loại bỏ sự uể oải và cải thiện phản xạ ngay lập tức.'
                : napDurationMinutes <= 35
                ? 'Thời lượng 25-30 phút hỗ trợ phục hồi trương lực cơ và hệ thần kinh giao cảm. Tốc độ xử lý thông tin được cải thiện rõ rệt.'
                : 'Giấc ngủ kéo dài hơn 35 phút có thể kích hoạt hiện tượng quán tính giấc ngủ (Sleep Inertia) trong 10-15 phút đầu, sau đó chuyển sang hỗ trợ củng cố trí nhớ dài hạn.'}
            </p>
            <p>
              • <strong>Tương quan giấc ngủ ban đêm ({studentInfo.sleepHours} giờ):</strong>{' '}
              {studentInfo.sleepHours < 7
                ? 'Thời lượng ngủ đêm chưa đạt mức khuyến nghị (7-8 giờ), giấc ngủ ngắn đóng vai trò bù đắp nợ ngủ (Sleep Debt), giúp duy trì trạng thái nhận thức ổn định cho các hoạt động tiếp theo.'
                : 'Giấc ngủ ban đêm đã được đảm bảo, giấc ngủ ngắn giúp tối ưu hóa hiệu suất làm việc đỉnh cao vào buổi chiều.'}
            </p>
            {studentInfo.hadCoffee ? (
              <p>
                • <strong>Tác động của Cà phê:</strong> Có ghi nhận sử dụng cà phê trước khi ngủ ngắn{studentInfo.coffeeDetails ? ` (${studentInfo.coffeeDetails})` : ''}. Caffein mất khoảng 20-30 phút để bắt đầu phát huy tác dụng sinh học tại thụ thể thần kinh, trùng khớp với thời điểm thức dậy (hiệu ứng Coffee Nap), giúp nhân đôi sự tỉnh táo và cải thiện phản xạ.
              </p>
            ) : (
              <p>
                • <strong>Cà phê:</strong> Không sử dụng cà phê trước giấc ngủ ngắn, kết quả kiểm tra phản ánh sự hồi phục sinh học tự nhiên của hệ thần kinh.
              </p>
            )}
            {studentInfo.hadSoda ? (
              <p>
                • <strong>Tác động của Nước ngọt / Nước có ga:</strong> Có ghi nhận sử dụng nước ngọt/nước có ga trước khi ngủ ngắn{studentInfo.sodaDetails ? ` (${studentInfo.sodaDetails})` : ''}. Năng lượng từ đường đơn cung cấp glucose tạm thời cho não bộ, nên kết hợp uống nước lọc để giữ cân bằng điện giải.
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
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
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
                Cảm ơn bạn đã tham gia nghiên cứu khoa học đánh giá hiệu quả giấc ngủ ngắn. Dữ liệu khảo sát đã được tự động lưu trữ và gửi tới hệ thống thành công.
              </p>
            </div>

            {/* Quick summary box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Học sinh:</span>
                <strong className="text-slate-900 font-bold">{studentInfo.studentName || 'Chưa đặt tên'}</strong>
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
                <strong className={`font-mono font-bold ${averageImprovementPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {averageImprovementPercent >= 0 ? `Tăng +${averageImprovementPercent}%` : `Giảm -${Math.abs(averageImprovementPercent)}%`}
                </strong>
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
