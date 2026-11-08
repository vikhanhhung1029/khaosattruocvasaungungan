import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, X, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

const GRADE_LEVELS = ['10', '11', '12'] as const;
const CLASS_SECTIONS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'] as const;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('11');
  const [selectedSection, setSelectedSection] = useState<string>('A1');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const combinedClassName = `${selectedGrade}${selectedSection}`;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      const errString = err instanceof Error ? err.message : String(err);
      if (errString.includes('popup-closed-by-user')) {
        setErrorMsg('Cửa sổ đăng nhập đã bị đóng.');
      } else {
        setErrorMsg('Đăng nhập Google thất bại: ' + errString);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        setSuccessMsg('Đăng nhập thành công!');
        setTimeout(() => onClose(), 600);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Vui lòng nhập họ và tên của bạn.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
          setIsLoading(false);
          return;
        }
        await registerWithEmail(
          email.trim(),
          password,
          fullName.trim(),
          undefined,
          combinedClassName
        );
        setSuccessMsg('Đăng ký tài khoản thành công!');
        setTimeout(() => onClose(), 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        setErrorMsg('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập.');
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('Mật khẩu quá ngắn, vui lòng chọn mật khẩu từ 6 ký tự trở lên.');
      } else if (msg.includes('operation-not-allowed')) {
        setErrorMsg('Phương thức Email/Mật khẩu chưa kích hoạt trên console, bạn có thể Đăng nhập nhanh bằng Google phía trên!');
      } else {
        setErrorMsg('Lỗi: ' + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Lưu trữ hồ sơ & kết quả khảo sát cá nhân
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-5 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-xs active:scale-98 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập nhanh bằng tài khoản Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase font-medium">
              hoặc sử dụng email
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên học sinh <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Trần Minh Quân"
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Chọn Khối (10-12) và Chọn Lớp (A1-A10) */}
                <div className="space-y-2 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chọn lớp:
                  </label>

                  {/* Khối 10, 11, 12 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {GRADE_LEVELS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGrade(g)}
                        className={`h-8 rounded-lg text-xs font-bold transition-all ${
                          selectedGrade === g
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-500 font-black'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Đang xử lý...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Hồ Sơ</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo Tài Khoản & Lưu Hồ Sơ</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info with data privacy guarantee */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-[11px] leading-snug">
            Cam kết bảo mật: Toàn bộ thông tin đối tượng và kết quả khảo sát được bảo vệ riêng tư.
          </p>
        </div>
      </div>
    </div>
  );
};
