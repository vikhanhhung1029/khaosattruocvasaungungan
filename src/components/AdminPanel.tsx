import { useEffect, useMemo, useState } from 'react';
import { X, LogIn, LogOut, RefreshCw, Search, Download, Trash2, ShieldCheck, Database } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { FullNapSession } from '../types';
import {
  ADMIN_EMAIL,
  deleteSurveyFromGlobal,
  getAllSurveysFromGlobal,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeToAuth,
} from '../firebase';

interface AdminPanelProps {
  onClose: () => void;
}

const dateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const csvCell = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessions, setSessions] = useState<FullNapSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selected, setSelected] = useState<FullNapSession | null>(null);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      if (currentUser && currentUser.email?.toLowerCase() !== ADMIN_EMAIL) {
        setError('Tài khoản này không có quyền quản trị.');
        await signOutAdmin();
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getAllSurveysFromGlobal();
      setSessions(rows);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu. Kiểm tra quyền Firestore Rules và tài khoản Google đang đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL) void loadSessions();
  }, [user]);

  const classes = useMemo(
    () => [...new Set(sessions.map((s) => s.studentInfo?.className).filter(Boolean))].sort(),
    [sessions],
  );
  const schools = useMemo(
    () => [...new Set(sessions.map((s) => s.studentInfo?.school).filter(Boolean))].sort(),
    [sessions],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const info = s.studentInfo || ({} as FullNapSession['studentInfo']);
      const matchesTerm = !term || [
        s.id, info.studentId, info.school, info.className,
      ].some((v) => String(v || '').toLowerCase().includes(term));
      return matchesTerm
        && (classFilter === 'all' || info.className === classFilter)
        && (schoolFilter === 'all' || info.school === schoolFilter);
    });
  }, [sessions, search, classFilter, schoolFilter]);

  const handleDelete = async (session: FullNapSession) => {
    if (!window.confirm('Xóa vĩnh viễn bản ghi khảo sát ' + session.id + ' khỏi Firestore?')) return;
    setBusyId(session.id);
    setError('');
    try {
      await deleteSurveyFromGlobal(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      if (selected?.id === session.id) setSelected(null);
    } catch (err) {
      console.error(err);
      setError('Không thể xóa bản ghi. Firestore đã từ chối thao tác hoặc xảy ra lỗi kết nối.');
    } finally {
      setBusyId('');
    }
  };

  const exportCsv = () => {
    const headers = [
      'Ma phien', 'Ma nguoi thuc hien', 'Truong', 'Lop', 'Gioi tinh',
      'Thoi luong ngu (phut)', 'Tinh tao truoc', 'Tinh tao sau',
      'Met moi truoc', 'Met moi sau', 'Phan xa TB truoc (ms)',
      'Phan xa TB sau (ms)', 'Chu y truoc (%)', 'Chu y sau (%)',
      'Tri nho truoc (%)', 'Tri nho sau (%)', 'Bat dau', 'Hoan tat',
    ];
    const rows = filtered.map((s) => [
      s.id, s.studentInfo?.studentId, s.studentInfo?.school, s.studentInfo?.className,
      s.studentInfo?.gender, s.napDurationMinutes,
      s.preNap?.alertness, s.postNap?.alertness, s.preNap?.fatigue, s.postNap?.fatigue,
      s.preNap?.reactionTest?.averageTime, s.postNap?.reactionTest?.averageTime,
      s.preNap?.attentionTest?.accuracyPercentage, s.postNap?.attentionTest?.accuracyPercentage,
      s.preNap?.memoryTest?.accuracyPercentage, s.postNap?.memoryTest?.accuracyPercentage,
      s.startedAt, s.completedAt || s.createdAt,
    ]);
    const content = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'du_lieu_khao_sat_giac_ngu.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-3 sm:p-6">
        <section className="max-w-7xl mx-auto bg-slate-50 rounded-2xl shadow-2xl min-h-[90vh] overflow-hidden">
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center"><ShieldCheck /></div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Quản trị dữ liệu khảo sát</h2>
                <p className="text-xs text-slate-500">Kho dữ liệu Firestore · quyền quản trị riêng</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Đóng" className="p-2 rounded-lg hover:bg-slate-100"><X /></button>
          </header>

          <div className="p-4 sm:p-6">
            {!authReady ? (
              <div className="py-16 text-center text-slate-500">Đang kiểm tra trạng thái đăng nhập…</div>
            ) : !user ? (
              <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-7 text-center shadow-sm">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><ShieldCheck size={28} /></div>
                <h3 className="text-xl font-bold text-slate-900">Đăng nhập quản trị</h3>
                <p className="mt-2 text-sm text-slate-500">Chỉ tài khoản được cấp quyền mới có thể xem dữ liệu khảo sát.</p>
                <p className="mt-3 text-sm font-semibold text-slate-700 break-all">{ADMIN_EMAIL}</p>
                <button onClick={async () => { setError(''); try { await signInAdminWithGoogle(); } catch (e) { setError(e instanceof Error ? e.message : 'Đăng nhập thất bại.'); } }} className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3">
                  <LogIn size={18} /> Đăng nhập bằng Google
                </button>
                {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-sm text-slate-500">Đang đăng nhập</p>
                    <p className="font-semibold text-slate-800 break-all">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void loadSessions()} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm font-medium disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới</button>
                    <button onClick={() => void signOutAdmin()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm font-medium"><LogOut size={16} /> Đăng xuất</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">Tổng bản ghi</p><p className="text-2xl font-bold text-slate-900">{sessions.length}</p></div>
                  <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">Kết quả sau lọc</p><p className="text-2xl font-bold text-indigo-700">{filtered.length}</p></div>
                  <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">Trường có dữ liệu</p><p className="text-2xl font-bold text-slate-900">{schools.length}</p></div>
                </div>

                <div className="bg-white border rounded-xl p-3 mb-4 flex flex-col lg:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiên, mã người thực hiện, trường, lớp…" className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                  <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white"><option value="all">Tất cả trường</option>{schools.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white"><option value="all">Tất cả khối/lớp</option>{classes.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                  <button onClick={exportCsv} disabled={!filtered.length} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-40"><Download size={16} /> Xuất CSV</button>
                </div>

                {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
                {loading ? <div className="py-12 text-center text-slate-500">Đang tải dữ liệu từ Firestore…</div> : (
                  <div className="bg-white border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm min-w-[850px]">
                      <thead className="bg-slate-100 text-slate-600"><tr>
                        <th className="text-left p-3 font-semibold">Mã người thực hiện</th>
                        <th className="text-left p-3 font-semibold">Trường / Khối</th>
                        <th className="text-left p-3 font-semibold">Thời lượng ngủ</th>
                        <th className="text-left p-3 font-semibold">Thời gian hoàn tất</th>
                        <th className="text-right p-3 font-semibold">Thao tác</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((s) => <tr key={s.id} className="border-t hover:bg-slate-50">
                          <td className="p-3"><div className="font-semibold text-slate-800">{s.studentInfo?.studentId || 'Chưa có mã'}</div><div className="text-xs text-slate-400">{s.id}</div></td>
                          <td className="p-3"><div>{s.studentInfo?.school || '—'}</div><div className="text-xs text-slate-500">{s.studentInfo?.className || '—'}</div></td>
                          <td className="p-3">{s.napDurationMinutes} phút</td>
                          <td className="p-3">{dateTime(s.completedAt || s.createdAt)}</td>
                          <td className="p-3"><div className="flex justify-end gap-2">
                            <button onClick={() => setSelected(s)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100">Chi tiết</button>
                            <button onClick={() => void handleDelete(s)} disabled={busyId === s.id} title="Xóa bản ghi" className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 size={16} /></button>
                          </div></td>
                        </tr>)}
                        {!filtered.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500"><Database className="mx-auto mb-2 opacity-40" />Không tìm thấy bản ghi phù hợp.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">Dữ liệu được đọc trực tiếp từ Firestore. Xuất CSV chỉ bao gồm các bản ghi đang hiển thị sau khi lọc.</p>
              </>
            )}
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[110] bg-slate-950/60 p-3 sm:p-8 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3 mb-5"><div><h3 className="text-lg font-bold">Chi tiết phiên khảo sát</h3><p className="text-xs text-slate-500 break-all">{selected.id}</p></div><button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-slate-100"><X /></button></div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><b>Mã người thực hiện:</b> {selected.studentInfo?.studentId || '—'}</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Trường:</b> {selected.studentInfo?.school || '—'}</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Khối/lớp:</b> {selected.studentInfo?.className || '—'}</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Giới tính:</b> {selected.studentInfo?.gender || '—'}</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Thời lượng ngủ:</b> {selected.napDurationMinutes} phút</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Giờ ngủ đêm:</b> {selected.studentInfo?.sleepHours ?? '—'} giờ</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Bắt đầu khảo sát:</b> {dateTime(selected.startedAt)}</div>
              <div className="rounded-lg bg-slate-50 p-3"><b>Hoàn tất khảo sát:</b> {dateTime(selected.completedAt || selected.createdAt)}</div>
            </div>
            <h4 className="font-bold mt-6 mb-2">So sánh kết quả trước và sau khi ngủ</h4>
            <div className="overflow-x-auto border rounded-lg"><table className="w-full text-sm min-w-[480px]"><thead className="bg-slate-100"><tr><th className="p-3 text-left">Chỉ số</th><th className="p-3">Trước</th><th className="p-3">Sau</th></tr></thead><tbody>
              <tr className="border-t"><td className="p-3">Mức tỉnh táo</td><td className="p-3 text-center">{selected.preNap?.alertness}/5</td><td className="p-3 text-center">{selected.postNap?.alertness}/5</td></tr>
              <tr className="border-t"><td className="p-3">Mức mệt mỏi</td><td className="p-3 text-center">{selected.preNap?.fatigue}/5</td><td className="p-3 text-center">{selected.postNap?.fatigue}/5</td></tr>
              <tr className="border-t"><td className="p-3">Thời gian phản xạ trung bình</td><td className="p-3 text-center">{selected.preNap?.reactionTest?.averageTime ?? '—'} ms</td><td className="p-3 text-center">{selected.postNap?.reactionTest?.averageTime ?? '—'} ms</td></tr>
              <tr className="border-t"><td className="p-3">Điểm chú ý ròng</td><td className="p-3 text-center">{selected.preNap?.attentionTest?.accuracyPercentage ?? '—'}%</td><td className="p-3 text-center">{selected.postNap?.attentionTest?.accuracyPercentage ?? '—'}%</td></tr>
              <tr className="border-t"><td className="p-3">Độ chính xác trí nhớ</td><td className="p-3 text-center">{selected.preNap?.memoryTest?.accuracyPercentage ?? '—'}%</td><td className="p-3 text-center">{selected.postNap?.memoryTest?.accuracyPercentage ?? '—'}%</td></tr>
            </tbody></table></div>
            <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-indigo-700">Xem dữ liệu JSON đầy đủ</summary><pre className="mt-3 p-3 rounded-lg bg-slate-950 text-slate-100 text-xs overflow-auto max-h-96">{JSON.stringify(selected, null, 2)}</pre></details>
          </div>
        </div>
      )}
    </div>
  );
}
