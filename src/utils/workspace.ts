import { FullNapSession } from '../types';

export const TARGET_GMAIL = 'vikhanhhung1029@gmail.com';

export function formatEmailBodyText(session: FullNapSession): string {
  const student = session.studentInfo;
  const deltaAlertness = session.postNap.alertness - session.preNap.alertness;
  const deltaFatigue = session.postNap.fatigue - session.preNap.fatigue;
  const deltaReaction = session.preNap.reactionTest.averageTime - session.postNap.reactionTest.averageTime;
  const reactionImprovementPct = session.preNap.reactionTest.averageTime > 0
    ? (((session.preNap.reactionTest.averageTime - session.postNap.reactionTest.averageTime) / session.preNap.reactionTest.averageTime) * 100).toFixed(1)
    : '0';

  const preMemDigits = session.preNap.memoryTest.totalDigits || 21;
  const postMemDigits = session.postNap.memoryTest.totalDigits || 21;

  const lines = [
    `BÁO CÁO KẾT QUẢ KHẢO SÁT & ĐÁNH GIÁ GIẤC NGỦ NGẮN`,
    `======================================================`,
    `Thời gian thực hiện: ${new Date(session.createdAt).toLocaleString('vi-VN')}`,
    `Mã phiên: ${session.id}`,
    ``,
    `I. THÔNG TIN HỌC SINH & ĐIỀU KIỆN SINH HOẠT:`,
    `- Họ và tên: ${student.studentName || 'Không cung cấp'}`,
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
    `   Trước khi ngủ: ${session.preNap.reactionTest.averageTime}ms  ==>  Sau khi ngủ: ${session.postNap.reactionTest.averageTime}ms`,
    `   (Rút ngắn: ${deltaReaction >= 0 ? `+${deltaReaction}ms (${reactionImprovementPct}% tốc độ)` : `${deltaReaction}ms`})`,
    ``,
    `4. Chú ý chọn lọc (chuẩn 10 chữ A / 10 giây):`,
    `   Trước khi ngủ: Đúng ${session.preNap.attentionTest.foundCorrect}/10 (lỗi: ${session.preNap.attentionTest.errors})  ==>  Sau khi ngủ: Đúng ${session.postNap.attentionTest.foundCorrect}/10 (lỗi: ${session.postNap.attentionTest.errors})`,
    ``,
    `5. Trí nhớ ngắn hạn (3 bài kiểm tra - nhớ đồng thời 7 số trong 7 giây):`,
    `   Trước khi ngủ: Nhớ đúng ${session.preNap.memoryTest.correctDigitsCount}/${preMemDigits} số (${session.preNap.memoryTest.accuracyPercentage}%)  ==>  Sau khi ngủ: Nhớ đúng ${session.postNap.memoryTest.correctDigitsCount}/${postMemDigits} số (${session.postNap.memoryTest.accuracyPercentage}%)`,
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
  const postData = {
    _subject: `[Khảo sát giấc ngủ ngắn] Kết quả: ${student.studentName || 'Không ghi tên'} - ${student.school || student.className}`,
    _template: 'table',
    _captcha: 'false',
    'Họ và tên học sinh': student.studentName || 'Không cung cấp',
    'Khối': student.className,
    'Giới tính': student.gender || 'Chưa cung cấp',
    'Trường': student.school || 'Chưa cung cấp',
    'Thời lượng giấc ngủ ngắn': `${session.napDurationMinutes} phút`,
    'Giờ ngủ đêm qua': `${student.bedTime} - ${student.wakeTime} (${student.sleepHours} giờ)`,
    'Uống cà phê trước ngủ': student.hadCoffee ? `Có (${student.coffeeDetails || 'Đã dùng'})` : 'Không',
    'Nước ngọt / có ga': student.hadSoda ? `Có (${student.sodaDetails || 'Đã dùng'})` : 'Không',
    'Mức tỉnh táo (1-5)': `Trước: ${session.preNap.alertness}/5  ==>  Sau: ${session.postNap.alertness}/5`,
    'Mức độ mệt mỏi (1-5)': `Trước: ${session.preNap.fatigue}/5  ==>  Sau: ${session.postNap.fatigue}/5`,
    'Thời gian phản xạ': `Trước: ${session.preNap.reactionTest.averageTime}ms  ==>  Sau: ${session.postNap.reactionTest.averageTime}ms`,
    'Chú ý chọn lọc': `Trước: ${session.preNap.attentionTest.foundCorrect}/10 (lỗi: ${session.preNap.attentionTest.errors}) ==> Sau: ${session.postNap.attentionTest.foundCorrect}/10 (lỗi: ${session.postNap.attentionTest.errors})`,
    'Trí nhớ ngắn hạn (3 bài)': `Trước: Đúng ${session.preNap.memoryTest.correctDigitsCount}/${session.preNap.memoryTest.totalDigits || 21} (${session.preNap.memoryTest.accuracyPercentage}%) ==> Sau: Đúng ${session.postNap.memoryTest.correctDigitsCount}/${session.postNap.memoryTest.totalDigits || 21} (${session.postNap.memoryTest.accuracyPercentage}%)`,
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi gửi email (${response.status})`);
    }

    return { success: true, method: 'direct_email' };
  } catch (error) {
    console.warn('Direct email service notice:', error);
    return { success: false, method: 'none' };
  }
}
