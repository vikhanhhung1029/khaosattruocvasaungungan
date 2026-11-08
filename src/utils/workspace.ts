import { FullNapSession } from '../types';

export const TARGET_GMAIL = 'vikhanhhung1029@gmail.com';
export const DRIVE_FILE_NAME = 'Khảo sát giấc ngủ ngắn.csv';

export interface SyncStatus {
  gmailSent: boolean;
  driveSynced: boolean;
  driveFileId?: string;
  driveViewLink?: string;
  error?: string;
}

/**
 * Standard UTF-8 safe Base64 encoder (handles Vietnamese accents without deprecated unescape)
 */
function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert standard base64 to base64url format
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Format full plain-text report for email
 */
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
    `- Họ và tên: ${student.studentName}`,
    `- Lớp: ${student.className}`,
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
 * Format RFC 2822 email and Base64URL encode it for Gmail API
 */
function formatRawEmail(
  session: FullNapSession,
  recipient: string = TARGET_GMAIL
): string {
  const student = session.studentInfo;
  const subject = `[Khảo sát giấc ngủ ngắn] Báo cáo kết quả của ${student.studentName} - Lớp ${student.className}`;
  const utf8Subject = `=?utf-8?B?${encodeBase64Utf8(subject)}?=`;
  const bodyText = formatEmailBodyText(session);

  const emailRaw = [
    `To: ${recipient}`,
    `Subject: ${utf8Subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    bodyText,
  ].join('\r\n');

  return toBase64Url(encodeBase64Utf8(emailRaw));
}

/**
 * Send survey result via Gmail API to vikhanhhung1029@gmail.com
 */
export async function sendSurveyToGmail(
  accessToken: string,
  session: FullNapSession,
  recipient: string = TARGET_GMAIL
): Promise<boolean> {
  const raw = formatRawEmail(session, recipient);
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Lỗi gửi Gmail (${response.status}: ${response.statusText})`
    );
  }

  return true;
}

/**
 * Dispatches survey immediately to vikhanhhung1029@gmail.com
 * Supports both direct email dispatch (no OAuth token required) and Gmail API
 */
export async function sendSurveyImmediately(
  session: FullNapSession,
  accessToken?: string | null
): Promise<{ success: boolean; method: string }> {
  let emailSent = false;
  let sentMethod = 'none';

  // 1. Direct email dispatch via FormSubmit (delivers directly to TARGET_GMAIL)
  try {
    const student = session.studentInfo;
    const bodyText = formatEmailBodyText(session);
    const postData = {
      _subject: `[Khảo sát giấc ngủ ngắn] Kết quả: ${student.studentName} - Lớp ${student.className}`,
      _template: 'table',
      _captcha: 'false',
      'Họ và tên học sinh': student.studentName,
      'Lớp': student.className,
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

    const res = await fetch(`https://formsubmit.co/ajax/${TARGET_GMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (res.ok) {
      emailSent = true;
      sentMethod = 'direct_email';
    }
  } catch (err) {
    console.warn('Direct email service notice:', err);
  }

  // 2. If OAuth token is present, also send via Gmail API
  if (accessToken) {
    try {
      await sendSurveyToGmail(accessToken, session, TARGET_GMAIL);
      emailSent = true;
      sentMethod = 'gmail_api';
    } catch (gErr) {
      console.warn('Gmail API dispatch notice:', gErr);
    }
  }

  return { success: emailSent, method: sentMethod };
}

/**
 * Escape CSV field to prevent breaking rows or formatting
 */
function escapeCsv(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Format a session into a CSV row
 */
function formatSessionToCsvRow(session: FullNapSession): string {
  const s = session.studentInfo;
  const pPre = session.preNap;
  const pPost = session.postNap;
  const dateFormatted = new Date(session.createdAt).toLocaleString('vi-VN');

  const cols = [
    session.id,
    dateFormatted,
    s.studentName,
    s.className,
    s.bedTime,
    s.wakeTime,
    s.sleepHours,
    s.hadCoffee ? 'Có' : 'Không',
    s.coffeeDetails || '',
    s.hadSoda ? 'Có' : 'Không',
    s.sodaDetails || '',
    s.preNapMood,
    session.napDurationMinutes,
    session.napNotes || '',
    pPre.alertness,
    pPost.alertness,
    pPost.alertness - pPre.alertness,
    pPre.fatigue,
    pPost.fatigue,
    pPost.fatigue - pPre.fatigue,
    pPre.reactionTest.averageTime,
    pPost.reactionTest.averageTime,
    pPre.reactionTest.averageTime - pPost.reactionTest.averageTime,
    pPre.attentionTest.foundCorrect,
    pPre.attentionTest.errors,
    pPost.attentionTest.foundCorrect,
    pPost.attentionTest.errors,
    pPre.memoryTest.correctDigitsCount,
    pPost.memoryTest.correctDigitsCount,
  ];

  return cols.map(escapeCsv).join(',');
}

const CSV_HEADER = [
  'Mã phiên',
  'Thời gian',
  'Họ và tên học sinh',
  'Lớp',
  'Giờ ngủ đêm',
  'Giờ dậy',
  'Tổng giờ ngủ đêm',
  'Uống cà phê',
  'Chi tiết cà phê',
  'Nước ngọt / có ga',
  'Chi tiết nước ngọt / có ga',
  'Tâm trạng trước ngủ',
  'Thời lượng ngủ ngắn (phút)',
  'Ghi chú giấc ngủ',
  'Tỉnh táo trước (1-5)',
  'Tỉnh táo sau (1-5)',
  'Chênh lệch tỉnh táo',
  'Mệt mỏi trước (1-5)',
  'Mệt mỏi sau (1-5)',
  'Chênh lệch mệt mỏi',
  'Phản xạ trước (ms)',
  'Phản xạ sau (ms)',
  'Phản xạ rút ngắn (ms)',
  'Chú ý trước (đúng)',
  'Chú ý trước (lỗi)',
  'Chú ý sau (đúng)',
  'Chú ý sau (lỗi)',
  'Trí nhớ trước (số đúng/21)',
  'Trí nhớ sau (số đúng/21)',
].map(escapeCsv).join(',');

/**
 * Search Google Drive for existing file "Khảo sát giấc ngủ ngắn" (or CSV), and append/create
 */
export async function saveSurveyToGoogleDrive(
  accessToken: string,
  session: FullNapSession
): Promise<{ fileId: string; webViewLink?: string }> {
  const searchQuery = encodeURIComponent(
    `name contains 'Khảo sát giấc ngủ ngắn' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&fields=files(id,name,mimeType,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi truy cập Google Drive (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  const existingFiles = searchData.files || [];
  const targetFile = existingFiles[0];

  const newRow = formatSessionToCsvRow(session);

  if (targetFile && targetFile.id) {
    let existingContent = '';
    try {
      const getMediaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getMediaRes.ok) {
        existingContent = await getMediaRes.text();
      }
    } catch {
      existingContent = '';
    }

    if (!existingContent.includes('Họ và tên học sinh')) {
      existingContent = '\uFEFF' + CSV_HEADER + '\r\n' + existingContent;
    }

    const updatedContent = existingContent.trimEnd() + '\r\n' + newRow + '\r\n';

    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${targetFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/csv; charset=utf-8',
        },
        body: updatedContent,
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Lỗi cập nhật Google Drive (${updateRes.status})`);
    }

    return { fileId: targetFile.id, webViewLink: targetFile.webViewLink };
  } else {
    const fileMetadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'text/csv',
    };

    const initialContent = '\uFEFF' + CSV_HEADER + '\r\n' + newRow + '\r\n';
    const boundary = 'foo_bar_baz_delimiter_12345';
    const multipartRequestBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(fileMetadata) +
      `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/csv; charset=utf-8\r\n\r\n` +
      initialContent +
      `\r\n` +
      `--${boundary}--`;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Lỗi tạo file trên Google Drive (${createRes.status})`);
    }

    const createdData = await createRes.json();
    return { fileId: createdData.id, webViewLink: createdData.webViewLink };
  }
}
