import { FullNapSession } from '../types';

export const TARGET_GMAIL = 'khaosatgiacngungan@gmail.com';

function formatElapsedDuration(startValue: string, endValue: string): string {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'Không xác định';
  const totalSeconds = Math.floor((end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} phút ${seconds} giây` : `${seconds} giây`;
}

export function formatEmailBodyText(session: FullNapSession): string {
  const student = session.studentInfo;
  const deltaAlertness = session.postNap.alertness - session.preNap.alertness;
  const deltaFatigue = session.postNap.fatigue - session.preNap.fatigue;
  const getAverageReactionTime = (trials: number[], fallback: number) => {
    const validTrials = trials.filter((value) => Number.isFinite(value) && value > 0);
    return validTrials.length > 0
      ? Math.round(validTrials.reduce((sum, value) => sum + value, 0) / validTrials.length)
      : fallback;
  };
  const preReactionTime = getAverageReactionTime(session.preNap.reactionTest.trials, session.preNap.reactionTest.averageTime);
  const postReactionTime = getAverageReactionTime(session.postNap.reactionTest.trials, session.postNap.reactionTest.averageTime);
  const deltaReaction = preReactionTime - postReactionTime;
  const reactionImprovementPct = preReactionTime > 0
    ? (((preReactionTime - postReactionTime) / preReactionTime) * 100).toFixed(1)
    : '0';

  const preMemDigits = Math.max(1, session.preNap.memoryTest.totalDigits || 21);
  const postMemDigits = Math.max(1, session.postNap.memoryTest.totalDigits || 21);
  const preMemoryPercent = Math.min(100, Math.max(0, Math.round((session.preNap.memoryTest.correctDigitsCount / preMemDigits) * 100)));
  const postMemoryPercent = Math.min(100, Math.max(0, Math.round((session.postNap.memoryTest.correctDigitsCount / postMemDigits) * 100)));
  const preAttentionTargets = Math.max(1, session.preNap.attentionTest.totalTargetA || 10);
  const postAttentionTargets = Math.max(1, session.postNap.attentionTest.totalTargetA || 10);
  const preAttentionPercent = Math.min(100, Math.max(0, Math.round(((session.preNap.attentionTest.foundCorrect - session.preNap.attentionTest.errors) / preAttentionTargets) * 100)));
  const postAttentionPercent = Math.min(100, Math.max(0, Math.round(((session.postNap.attentionTest.foundCorrect - session.postNap.attentionTest.errors) / postAttentionTargets) * 100)));

  const lines = [
    `BÁO CÁO KẾT QUẢ KHẢO SÁT & ĐÁNH GIÁ GIẤC NGỦ NGẮN`,
    `======================================================`,
    `Thời điểm bắt đầu khảo sát: ${new Date(session.startedAt || session.createdAt).toLocaleString('vi-VN')}`,
    `Thời điểm kết thúc khảo sát: ${new Date(session.completedAt || session.createdAt).toLocaleString('vi-VN')}`,
    `Tổng thời gian thực hiện: ${formatElapsedDuration(session.startedAt || session.createdAt, session.completedAt || session.createdAt)}`, 
    `Mã phiên: ${session.id}`,
    `Mã người thực hiện (thiết bị/trình duyệt): ${student.studentId || 'Chưa có'}`,
    ``,
    `I. THÔNG TIN KHẢO SÁT & ĐIỀU KIỆN SINH HOẠT:`,
    `- Khối: ${student.className}`,
    `- Giới tính: ${student.gender || 'Chưa cung cấp'}`,
    `- Trường: ${student.school || 'Chưa cung cấp'}`,
    `- Giờ đi ngủ đêm qua: ${student.bedTime}`,
    `- Giờ thức dậy sáng nay: ${student.wakeTime}`,
    `- Tổng thời lượng ngủ đêm: ${student.sleepHours} giờ`,
    `- Uống cà phê trước khi ngủ: ${student.hadCoffee ? `Có (${student.coffeeDetails || 'Trước khi ngủ'})` : 'Không'}`,
    `- Uống nước ngọt / nước có ga: ${student.hadSoda ? `Có (${student.sodaDetails || 'Trước khi ngủ'})` : 'Không'}`,
    `- Tâm trạng trước khi ngủ: ${
      student.preNapMood === 'thoai_mai' ? 'Thoải mái' :
      student.preNapMood === 'cang_thang' ? 'Căng thẳng' :
      student.preNapMood === 'lo_lang' ? 'Lo lắng' : 'Bình thường'
    }`,
    `- Thời lượng giấc ngủ ngắn: ${session.napDurationMinutes} phút`,
    session.napNotes ? `- Ghi chú giấc ngủ: ${session.napNotes}` : '',
    ``,
    `II. SO SÁNH CHỈ SỐ NHẬN THỨC TRƯỚC VÀ SAU KHI NGỦ:`,
    `1. Mức độ tỉnh táo (1 - 5 điểm):`,
    `   Trước khi ngủ: ${session.preNap.alertness}/5  ==>  Sau khi ngủ: ${session.postNap.alertness}/5  (${deltaAlertness >= 0 ? `+${deltaAlertness}` : deltaAlertness} điểm)`,
    ``,
    `2. Mức độ mệt mỏi (1 - 5 điểm):`,
    `   Trước khi ngủ: ${session.preNap.fatigue}/5  ==>  Sau khi ngủ: ${session.postNap.fatigue}/5  (${deltaFatigue >= 0 ? `+${deltaFatigue}` : deltaFatigue} điểm)`,
    ``,
    `3. Thời gian phản xạ nhanh (ms - 5 lần thử):`,
    `   Trước khi ngủ: ${preReactionTime}ms  ==>  Sau khi ngủ: ${postReactionTime}ms`,
    `   (Thay đổi thời gian phản xạ: ${deltaReaction >= 0 ? `giảm ${deltaReaction}ms (${reactionImprovementPct}% thời gian)` : `tăng ${Math.abs(deltaReaction)}ms`})`,
    ``,
    `4. Chú ý chọn lọc (điểm ròng, 10 chữ A / 10 giây):`,
    `   Trước khi ngủ: ${preAttentionPercent}%  ==>  Sau khi ngủ: ${postAttentionPercent}% (điểm ròng; số chữ A đúng và số lần bấm nhầm được tính trong công thức)`,
    ``,
    `5. Trí nhớ ngắn hạn (3 bài kiểm tra - nhớ đồng thời 7 số trong 7 giây):`,
    `   Trước khi ngủ: Nhớ đúng ${session.preNap.memoryTest.correctDigitsCount}/${preMemDigits} vị trí (${preMemoryPercent}%)  ==>  Sau khi ngủ: Nhớ đúng ${session.postNap.memoryTest.correctDigitsCount}/${postMemDigits} vị trí (${postMemoryPercent}%)`,
    ``,
    `III. CÁCH TÍNH CÁC CHỈ SỐ:`,
    `- Tỉnh táo: điểm sau - điểm trước = ${deltaAlertness} điểm (thang 1-5).`,
    `- Mức độ mệt mỏi: điểm sau - điểm trước = ${deltaFatigue} điểm; điểm cao hơn biểu thị ít mệt hơn.`,
    `- Phản xạ: thời gian trung bình = tổng các lần bấm hợp lệ / số lần hợp lệ; mức rút ngắn = ${deltaReaction} ms; tỷ lệ thay đổi = (${preReactionTime} - ${postReactionTime}) / ${session.preNap.reactionTest.averageTime || 1} x 100 = ${reactionImprovementPct}%.`,
    `  Số lần bấm sớm (ghi riêng): trước ${session.preNap.reactionTest.faults}, sau ${session.postNap.reactionTest.faults}.`,
    `- Chú ý: điểm ròng = giới hạn trong 0-100% của [(chữ A đúng - bấm nhầm) / số chữ A mục tiêu x 100]; trước: max(0, min(100, (${session.preNap.attentionTest.foundCorrect} - ${session.preNap.attentionTest.errors}) / ${preAttentionTargets} x 100)) = ${preAttentionPercent}%; sau: max(0, min(100, (${session.postNap.attentionTest.foundCorrect} - ${session.postNap.attentionTest.errors}) / ${postAttentionTargets} x 100)) = ${postAttentionPercent}%.`,
    `- Trí nhớ: tỷ lệ đúng = số vị trí đúng / tổng số vị trí x 100; trước: ${session.preNap.memoryTest.correctDigitsCount}/${preMemDigits} x 100 = ${preMemoryPercent}%; sau: ${session.postNap.memoryTest.correctDigitsCount}/${postMemDigits} x 100 = ${postMemoryPercent}%. Bài chuẩn gồm 3 lượt x 7 chữ số = 21 vị trí.`, 
    `- Tổng hợp: đếm số lĩnh vực tốt hơn/không đổi/giảm; không lấy trung bình các tỷ lệ khác đơn vị.`,
    ``,
    `======================================================`,
    `Báo cáo được gửi tự động từ Ứng dụng Nghiên Cứu & Đánh Giá Giấc Ngủ Ngắn.`,
  ];

  return lines.filter(Boolean).join('\r\n');
}

/**
 * Send the completed survey directly to the owner's inbox using FormSubmit.
 * This does not require participant login or Google OAuth.
 */
export async function sendSurveyImmediately(
  session: FullNapSession
): Promise<{ success: boolean; method: string }> {
  const student = session.studentInfo;
  const bodyText = formatEmailBodyText(session);
  const preMemDigits = Math.max(1, session.preNap.memoryTest.totalDigits || 21);
  const postMemDigits = Math.max(1, session.postNap.memoryTest.totalDigits || 21);
  const preMemoryPercent = Math.min(100, Math.max(0, Math.round((session.preNap.memoryTest.correctDigitsCount / preMemDigits) * 100)));
  const postMemoryPercent = Math.min(100, Math.max(0, Math.round((session.postNap.memoryTest.correctDigitsCount / postMemDigits) * 100)));
  const preAttentionTargets = Math.max(1, session.preNap.attentionTest.totalTargetA || 10);
  const postAttentionTargets = Math.max(1, session.postNap.attentionTest.totalTargetA || 10);
  const preAttentionPercent = Math.min(100, Math.max(0, Math.round(((session.preNap.attentionTest.foundCorrect - session.preNap.attentionTest.errors) / preAttentionTargets) * 100)));
  const postAttentionPercent = Math.min(100, Math.max(0, Math.round(((session.postNap.attentionTest.foundCorrect - session.postNap.attentionTest.errors) / postAttentionTargets) * 100)));
  const getAverageReactionTime = (trials: number[], fallback: number) => {
    const validTrials = trials.filter((value) => Number.isFinite(value) && value > 0);
    return validTrials.length > 0
      ? Math.round(validTrials.reduce((sum, value) => sum + value, 0) / validTrials.length)
      : fallback;
  };
  const preReactionTime = getAverageReactionTime(session.preNap.reactionTest.trials, session.preNap.reactionTest.averageTime);
  const postReactionTime = getAverageReactionTime(session.postNap.reactionTest.trials, session.postNap.reactionTest.averageTime);
  const postData = {
    _subject: `[Khảo sát giấc ngủ ngắn] ${student.studentId || 'Chưa có mã'} - ${student.school || student.className}`,
    'Mã người thực hiện (thiết bị/trình duyệt)': student.studentId || 'Chưa có',
    _template: 'table',
    _captcha: 'false',
    'Khối': student.className,
    'Giới tính': student.gender || 'Chưa cung cấp',
    'Trường': student.school || 'Chưa cung cấp',
    'Thời điểm bắt đầu khảo sát': new Date(session.startedAt || session.createdAt).toLocaleString('vi-VN'),
    'Thời điểm kết thúc khảo sát': new Date(session.completedAt || session.createdAt).toLocaleString('vi-VN'),
    'Tổng thời gian thực hiện': formatElapsedDuration(session.startedAt || session.createdAt, session.completedAt || session.createdAt),
    'Thời lượng giấc ngủ ngắn': `${session.napDurationMinutes} phút`,
    'Giờ ngủ đêm qua': `${student.bedTime} - ${student.wakeTime} (${student.sleepHours} giờ)`,
    'Uống cà phê trước ngủ': student.hadCoffee ? `Có (${student.coffeeDetails || 'Đã dùng'})` : 'Không',
    'Nước ngọt / có ga': student.hadSoda ? `Có (${student.sodaDetails || 'Đã dùng'})` : 'Không',
    'Mức tỉnh táo (1-5)': `Trước: ${session.preNap.alertness}/5  ==>  Sau: ${session.postNap.alertness}/5`,
    'Mức độ mệt mỏi (1-5)': `Trước: ${session.preNap.fatigue}/5  ==>  Sau: ${session.postNap.fatigue}/5`,
    'Thời gian phản xạ': `Trước: ${preReactionTime}ms  ==>  Sau: ${postReactionTime}ms`,
    'Chú ý chọn lọc': `Điểm ròng trước: ${preAttentionPercent}% (đúng ${session.preNap.attentionTest.foundCorrect}/${preAttentionTargets}, lỗi ${session.preNap.attentionTest.errors}) ==> Sau: ${postAttentionPercent}% (đúng ${session.postNap.attentionTest.foundCorrect}/${postAttentionTargets}, lỗi ${session.postNap.attentionTest.errors})`,
    'Trí nhớ ngắn hạn (3 bài)': `Trước: Đúng ${session.preNap.memoryTest.correctDigitsCount}/${preMemDigits} (${preMemoryPercent}%) ==> Sau: Đúng ${session.postNap.memoryTest.correctDigitsCount}/${postMemDigits} (${postMemoryPercent}%)`,
    'Nội dung chi tiết báo cáo': bodyText,
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${TARGET_GMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const responseData = await response.json().catch(() => ({}));
    // FormSubmit may return HTTP 200 even when the submission was rejected.
    // Its AJAX API reports the actual result in the JSON "success" field.
    if (!response.ok || String(responseData.success) !== 'true') {
      throw new Error(
        responseData.message ||
        `Dịch vụ email từ chối yêu cầu (HTTP ${response.status}).`
      );
    }

    return { success: true, method: 'direct_email' };
  } catch (error) {
    console.error('Direct email delivery failed:', error);
    throw error instanceof Error ? error : new Error('Không thể gửi email do lỗi mạng hoặc dịch vụ.');
  }
}
