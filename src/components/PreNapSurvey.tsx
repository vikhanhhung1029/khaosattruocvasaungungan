import React, { useState, useId, useEffect } from 'react';
import { PreNapInfo, AlertnessLevel, FatigueLevel } from '../types';
import { User, Clock, Coffee, Smile, Moon, ArrowRight, AlertCircle, ShieldCheck, GlassWater } from 'lucide-react';

interface PreNapSurveyProps {
  initialInfo?: PreNapInfo;
  initialAlertness?: AlertnessLevel;
  initialFatigue?: FatigueLevel;
  onSubmit: (info: PreNapInfo, alertness: AlertnessLevel, fatigue: FatigueLevel) => void;
}

export const ALERTNESS_OPTIONS: { level: AlertnessLevel; title: string; desc: string }[] = [
  { level: 1, title: 'Điểm 1 - Rất buồn ngủ', desc: 'Khó mở mắt, mí mắt sụp xuống' },
  { level: 2, title: 'Điểm 2 - Buồn ngủ', desc: 'Khó tập trung, suy nghĩ chậm' },
  { level: 3, title: 'Điểm 3 - Bình thường', desc: 'Tỉnh táo vừa phải, đủ tỉnh để hoạt động' },
  { level: 4, title: 'Điểm 4 - Tỉnh táo', desc: 'Tập trung tốt, phản xạ nhanh nhạy' },
  { level: 5, title: 'Điểm 5 - Rất tỉnh táo', desc: 'Tràn đầy năng lượng, sảng khoái tối đa' },
];

export const FATIGUE_OPTIONS: { level: FatigueLevel; title: string; desc: string }[] = [
  { level: 1, title: 'Điểm 1 - Rất mệt', desc: 'Không muốn làm gì, kiệt sức' },
  { level: 2, title: 'Điểm 2 - Mệt mỏi', desc: 'Khó duy trì hoạt động, uể oải' },
  { level: 3, title: 'Điểm 3 - Bình thường', desc: 'Có thể làm việc và học tập ổn định' },
  { level: 4, title: 'Điểm 4 - Ít mệt', desc: 'Hoạt động thoải mái, cơ thể nhẹ nhàng' },
  { level: 5, title: 'Điểm 5 - Hoàn toàn khỏe', desc: 'Không mệt, cơ thể đạt phong độ tốt nhất' },
];

export const MOOD_OPTIONS: { id: 'thoai_mai' | 'binh_thuong' | 'cang_thang' | 'lo_lang'; label: string; desc: string }[] = [
  { id: 'thoai_mai', label: 'Thoải mái', desc: 'Tâm lý thư giãn, dễ chịu' },
  { id: 'binh_thuong', label: 'Bình thường', desc: 'Tâm trạng ổn định, cân bằng' },
  { id: 'cang_thang', label: 'Căng thẳng', desc: 'Áp lực học tập hoặc công việc' },
  { id: 'lo_lang', label: 'Lo lắng', desc: 'Bồn chồn, khó tĩnh tâm' },
];

const GRADE_LEVELS = ['10', '11', '12'] as const;
const CLASS_SECTIONS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'] as const;

export const PreNapSurvey: React.FC<PreNapSurveyProps> = ({
  initialInfo,
  initialAlertness = 2,
  initialFatigue = 2,
  onSubmit,
}) => {
  const [studentName, setStudentName] = useState(initialInfo?.studentName || '');
  
  // Parse initial class (e.g. "11A2" -> grade "11", section "A2")
  const parseGradeAndSection = (raw?: string) => {
    if (!raw) return { grade: '11', section: 'A1' };
    const match = raw.match(/^(10|11|12)(A[1-9]|A10)$/);
    if (match) {
      return { grade: match[1], section: match[2] };
    }
    return { grade: '11', section: 'A1' };
  };

  const initialParsed = parseGradeAndSection(initialInfo?.className);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialParsed.grade);
  const [selectedSection, setSelectedSection] = useState<string>(initialParsed.section);

  const [bedTime, setBedTime] = useState(initialInfo?.bedTime || '23:00');
  const [wakeTime, setWakeTime] = useState(initialInfo?.wakeTime || '06:30');

  // Separated coffee and soda states
  const [hadCoffee, setHadCoffee] = useState<boolean>(initialInfo?.hadCoffee ?? (initialInfo?.hadCaffeine ?? false));
  const [coffeeDetails, setCoffeeDetails] = useState<string>(initialInfo?.coffeeDetails || '');

  const [hadSoda, setHadSoda] = useState<boolean>(initialInfo?.hadSoda ?? false);
  const [sodaDetails, setSodaDetails] = useState<string>(initialInfo?.sodaDetails || '');

  const [preNapMood, setPreNapMood] = useState<'thoai_mai' | 'cang_thang' | 'lo_lang' | 'binh_thuong'>(
    initialInfo?.preNapMood || 'binh_thuong'
  );

  const [alertness, setAlertness] = useState<AlertnessLevel>(initialAlertness);
  const [fatigue, setFatigue] = useState<FatigueLevel>(initialFatigue);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update grade & section if initialInfo changes
  useEffect(() => {
    if (initialInfo?.className) {
      const parsed = parseGradeAndSection(initialInfo.className);
      setSelectedGrade(parsed.grade);
      setSelectedSection(parsed.section);
    }
  }, [initialInfo?.className]);

  // Combined class string: e.g. "11" + "A2" -> "11A2"
  const combinedClassName = `${selectedGrade}${selectedSection}`;

  // Accessible IDs
  const studentNameId = useId();
  const bedTimeId = useId();
  const wakeTimeId = useId();

  // Calculate sleep duration automatically
  const calculateSleepHours = (bed: string, wake: string): number => {
    try {
      const [bH, bM] = bed.split(':').map(Number);
      const [wH, wM] = wake.split(':').map(Number);
      let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
      if (diffMinutes <= 0) {
        diffMinutes += 24 * 60;
      }
      return parseFloat((diffMinutes / 60).toFixed(1));
    } catch {
      return 7.0;
    }
  };

  const calculatedSleepHours = calculateSleepHours(bedTime, wakeTime);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow letters (including Vietnamese accents) and spaces
    const val = e.target.value;
    const sanitized = val.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]/g, '');
    setStudentName(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập họ và tên học sinh để lưu báo cáo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(cleanName)) {
      setErrorMsg('Họ và tên chỉ được nhập chữ, không được nhập số hoặc ký tự đặc biệt.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorMsg(null);
    onSubmit(
      {
        studentName: cleanName,
        className: combinedClassName,
        bedTime,
        wakeTime,
        sleepHours: calculatedSleepHours,
        hadCoffee,
        coffeeDetails: hadCoffee ? coffeeDetails.trim() : '',
        hadSoda,
        sodaDetails: hadSoda ? sodaDetails.trim() : '',
        hadCaffeine: hadCoffee || hadSoda,
        caffeineDetails: hadCoffee ? coffeeDetails.trim() : (hadSoda ? sodaDetails.trim() : ''),
        preNapMood,
      },
      alertness,
      fatigue
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Introduction Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phần 1: Khảo Sát & Đánh Giá Trước Khi Ngủ (Pre-Nap)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Vui lòng cung cấp thông tin khách quan về trạng thái của bạn. Sau bước này, bạn sẽ thực hiện 3 bài kiểm tra phản xạ, chú ý chọn lọc (chuẩn 10 chữ A) và trí nhớ ngắn hạn.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Thông tin học sinh & Lớp chọn */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Header - without the 'Dữ liệu được bảo mật' tag beside title */}
        <div className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Thông Tin Đối Tượng Khảo Sát</h3>
          </div>
        </div>

        {/* Data Privacy & Confidentiality Guarantee Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Cam kết bảo mật thông tin đối tượng:</strong> Toàn bộ họ tên, thông tin sinh hoạt và kết quả các bài kiểm tra được mã hóa và bảo mật nghiêm ngặt. Dữ liệu chỉ dùng cho mục đích thống kê khoa học và hỗ trợ học sinh cải thiện sự tập trung, tuyệt đối không chia sẻ cho bất kỳ bên thứ ba nào.
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* Họ và tên */}
          <div>
            <label htmlFor={studentNameId} className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên học sinh <span className="text-red-500">*</span>
            </label>
            <input
              id={studentNameId}
              type="text"
              required
              value={studentName}
              onChange={handleNameChange}
              placeholder="VD: Nguyễn Văn An"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              * Chỉ nhập chữ cái tiếng Việt, không chứa số hoặc ký tự đặc biệt
            </span>
          </div>

          {/* Chọn Lớp: Khối 10-12 và Lớp A1-A10 */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              Chọn lớp:
            </label>

            {/* Bước 1: Chọn Khối (10, 11, 12) */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Khối:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                      selectedGrade === grade
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Khối {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Bước 2: Chọn Lớp/Phòng (A1 - A10) */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Lớp:
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {CLASS_SECTIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={`h-10 rounded-xl border text-xs font-bold font-mono transition-all ${
                      selectedSection === sec
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Lớp: 11A10 nhỏ nhỏ ở bên dưới */}
            <div className="text-[11px] text-slate-500 pt-0.5">
              Lớp: <span className="font-semibold font-mono text-slate-800">{combinedClassName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Thông tin bổ sung về giấc ngủ đêm & thói quen */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Thông Tin Bổ Sung</h3>
        </div>

        <div className="space-y-4">
          {/* Giờ ngủ & Giờ dậy */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Thời gian ngủ ban đêm hôm trước:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={bedTimeId} className="block text-[11px] text-slate-500 mb-1">Giờ đi ngủ tối qua</label>
                <input
                  id={bedTimeId}
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label htmlFor={wakeTimeId} className="block text-[11px] text-slate-500 mb-1">Giờ thức dậy sáng nay</label>
                <input
                  id={wakeTimeId}
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg flex items-center justify-between">
              <span>Tổng thời lượng ngủ đêm:</span>
              <span className="font-bold text-indigo-600 font-mono tabular-nums">
                {calculatedSleepHours} giờ ({Math.floor(calculatedSleepHours * 60)} phút)
              </span>
            </div>
          </div>

          {/* 1. Tách riêng: Cà phê trước khi ngủ */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-amber-700" />
              <label className="text-xs font-semibold text-slate-700">
                Có uống cà phê trước khi ngủ ngắn không?
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHadCoffee(false)}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  !hadCoffee
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Không uống cà phê
              </button>
              <button
                type="button"
                onClick={() => setHadCoffee(true)}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  hadCoffee
                    ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Có uống cà phê
              </button>
            </div>
            {hadCoffee && (
              <input
                type="text"
                value={coffeeDetails}
                onChange={(e) => setCoffeeDetails(e.target.value)}
                placeholder="Loại cà phê & thời điểm uống (VD: Cà phê đen / sữa lúc 12h30)"
                className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            )}
          </div>

          {/* 2. Tách riêng: Nước ngọt / Nước có ga */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <GlassWater className="w-4 h-4 text-sky-600" />
              <label className="text-xs font-semibold text-slate-700">
                Có uống nước ngọt / nước có ga trước khi ngủ ngắn không?
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHadSoda(false)}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  !hadSoda
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Không uống nước ngọt / có ga
              </button>
              <button
                type="button"
                onClick={() => setHadSoda(true)}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                  hadSoda
                    ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Có uống nước ngọt / có ga
              </button>
            </div>
            {hadSoda && (
              <input
                type="text"
                value={sodaDetails}
                onChange={(e) => setSodaDetails(e.target.value)}
                placeholder="Loại nước ngọt / có ga & thời điểm uống (VD: Coca, bò húc, sting lúc 12h15)"
                className="mt-2 w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            )}
          </div>

          {/* Tâm trạng trước khi ngủ */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Smile className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-semibold text-slate-700">
                Tâm trạng trước khi ngủ:
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOOD_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreNapMood(item.id)}
                  className={`min-h-[50px] p-2.5 rounded-xl border text-left transition-all ${
                    preNapMood === item.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Bảng đánh giá mức độ tỉnh táo (Thang 1-5, no emojis) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              1. Bảng Đánh Giá Mức Độ Tỉnh Táo
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md font-mono">
              {alertness}/5 điểm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn thang điểm phản ánh chính xác nhất trạng thái tỉnh táo của bạn ngay trước khi ngủ:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {ALERTNESS_OPTIONS.map((opt) => {
            const isSelected = alertness === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => setAlertness(opt.level)}
                className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.level}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 4: Bảng đánh giá mức độ mệt mỏi (Thang 1-5, no emojis) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              2. Bảng Đánh Giá Mức Độ Mệt Mỏi
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md font-mono">
              {fatigue}/5 điểm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn mô tả phản ánh mức độ mệt mỏi của bạn trước khi ngủ ngắn:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {FATIGUE_OPTIONS.map((opt) => {
            const isSelected = fatigue === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => setFatigue(opt.level)}
                className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.level}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-amber-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full h-13 rounded-2xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] hover:bg-indigo-700 transition"
        >
          <span>Tiếp tục: Bắt đầu 3 bài kiểm tra nhận thức</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-2">
          (Bài 1: Phản ứng nhanh · Bài 2: Chú ý 10 chữ A (10s) · Bài 3: Trí nhớ 7 số)
        </p>
      </div>
    </form>
  );
};
