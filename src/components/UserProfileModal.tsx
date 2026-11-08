import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserSessionsFromCloud, deleteSessionFromCloud } from '../firebase';
import { FullNapSession } from '../types';
import { LogOut, X, Trash2, FileText, Edit2, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: FullNapSession) => void;
}

const GRADE_LEVELS = ['10', '11', '12'] as const;
const CLASS_SECTIONS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'] as const;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const { user, profile, updateProfileInfo, logout } = useAuth();
  const [sessions, setSessions] = useState<FullNapSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('11');
  const [selectedSection, setSelectedSection] = useState<string>('A1');
  const [schoolName, setSchoolName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setSchoolName(profile.schoolName || '');
      if (profile.className) {
        const match = profile.className.match(/^(10|11|12)(A[1-9]|A10)$/);
        if (match) {
          setSelectedGrade(match[1]);
          setSelectedSection(match[2]);
        }
      }
    }
  }, [profile]);

  const combinedClassName = `${selectedGrade}${selectedSection}`;

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoadingSessions(true);
    getUserSessionsFromCloud(user.uid)
      .then((data) => setSessions(data))
      .catch((err) => console.error('Failed to load cloud sessions:', err))
      .finally(() => setLoadingSessions(false));
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileInfo({
      displayName: name.trim(),
      className: combinedClassName,
      schoolName: schoolName.trim(),
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi khảo sát này khỏi hồ sơ?')) return;
    try {
      await deleteSessionFromCloud(user.uid, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Compute stats across all saved sessions
  const totalSessions = sessions.length;
  const avgNapMinutes = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.napDurationMinutes, 0) / totalSessions)
    : 0;

  const avgReactionPre = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.preNap.reactionTest.averageTime, 0) / totalSessions)
    : 0;

  const avgReactionPost = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.postNap.reactionTest.averageTime, 0) / totalSessions)
    : 0;

  const reactionImprovement = avgReactionPre > 0 ? avgReactionPre - avgReactionPost : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Hồ Sơ Cá Nhân
              </h3>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã cập nhật thông tin hồ sơ thành công!</span>
            </div>
          )}

          {/* User Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thông tin học sinh & lớp học
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Hủy sửa' : 'Chỉnh sửa'}</span>
              </button>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
                  <span className="font-bold text-slate-900">{profile?.displayName || 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Lớp:</span>
                  <span className="font-bold text-slate-900 font-mono">{profile?.className || 'Chưa có'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Trường:</span>
                  <span className="font-bold text-slate-900">{profile?.schoolName || 'Chưa cập nhật'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Ngày tham gia:</span>
                  <span className="font-medium text-slate-700">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Trường học</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="VD: THPT Chuyên"
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Chọn Khối & Lớp */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Chọn lớp:
                  </label>

                  {/* Khối 10, 11, 12 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {GRADE_LEVELS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGrade(g)}
                        className={`h-7 rounded-lg text-xs font-bold transition-all ${
                          selectedGrade === g
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Khối {g}
                      </button>
                    ))}
                  </div>

                  {/* Lớp A1-A10 */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {CLASS_SECTIONS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`h-7 rounded-md text-[11px] font-bold font-mono transition-all ${
                          selectedSection === sec
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-500 font-bold'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>

                  {/* Lớp nhỏ ở bên dưới */}
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Lớp: <span className="font-semibold font-mono text-slate-800">{combinedClassName}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </form>
            )}

            {/* Privacy pledge */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Hồ sơ cá nhân và kết quả bài test được bảo mật tuyệt đối trên hệ thống.</span>
            </div>
          </div>

          {/* Aggregate Stats */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
              Thống kê tổng hợp ({totalSessions} bài khảo sát đã lưu)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
                <span className="text-[10px] text-indigo-700 font-semibold block">Số bài đã làm</span>
                <span className="text-xl font-bold font-mono text-indigo-900 tabular-nums">{totalSessions}</span>
              </div>
              <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100 text-center">
                <span className="text-[10px] text-violet-700 font-semibold block">Thời gian ngủ TB</span>
                <span className="text-xl font-bold font-mono text-violet-900 tabular-nums">
                  {avgNapMinutes} <span className="text-xs font-normal">phút</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-700 font-semibold block">Phản xạ cải thiện TB</span>
                <span className="text-xl font-bold font-mono text-emerald-900 tabular-nums">
                  {reactionImprovement > 0 ? `+${reactionImprovement}` : reactionImprovement}{' '}
                  <span className="text-xs font-normal">ms</span>
                </span>
              </div>
            </div>
          </div>

          {/* Stored Sessions List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase">
              Danh sách kết quả khảo sát cá nhân
            </h4>

            {loadingSessions ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Đang tải dữ liệu hồ sơ từ đám mây...
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                Chưa có bài khảo sát nào được lưu trong hồ sơ. Hãy hoàn thành một bài khảo sát để dữ liệu tự động lưu vào đây!
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const dateStr = new Date(s.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const reactDelta = s.preNap.reactionTest.averageTime - s.postNap.reactionTest.averageTime;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s);
                        onClose();
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Ngủ {s.napDurationMinutes} phút</span>
                            <span className="text-[10px] text-slate-500">· {dateStr}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                            <span>Tỉnh táo: {s.preNap.alertness} → {s.postNap.alertness}/5</span>
                            <span>·</span>
                            <span>
                              Phản xạ:{' '}
                              <strong className={reactDelta > 0 ? 'text-emerald-700' : 'text-slate-700'}>
                                {reactDelta > 0 ? `Nhanh hơn ${reactDelta}ms` : `${reactDelta}ms`}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Xóa bản ghi này"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
