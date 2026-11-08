import React, { useState, useEffect } from 'react';
import { FullNapSession } from '../types';
import { getSavedSessions, deleteSavedSession } from '../utils/storage';
import { History, X, Trash2, ArrowRight, FileText } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: FullNapSession) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [localSessions, setLocalSessions] = useState<FullNapSession[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalSessions(getSavedSessions());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteLocal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedSession(id);
    setLocalSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch Sử Khảo Sát Thiết Bị Này
              </h3>
              <p className="text-[11px] text-slate-500">
                Xem lại kết quả các bài khảo sát đã thực hiện trên trình duyệt
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

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-2.5">
          {localSessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-600 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <p>Chưa có dữ liệu khảo sát nào được lưu trên máy này.</p>
              <p className="text-[11px] text-slate-500">
                Hãy tiến hành làm bài khảo sát để xem kết quả so sánh cụ thể!
              </p>
            </div>
          ) : (
            localSessions.map((session) => {
              const dateStr = new Date(session.createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const deltaMs =
                session.preNap.reactionTest.averageTime -
                session.postNap.reactionTest.averageTime;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{session.studentInfo.studentName}</span>
                        <span className="text-[10px] text-slate-500">
                          (Lớp {session.studentInfo.className} · Ngủ {session.napDurationMinutes}p)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span
                          className={
                            deltaMs > 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-slate-700'
                          }
                        >
                          Phản xạ: {deltaMs > 0 ? `+${deltaMs}ms` : `${deltaMs}ms`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteLocal(session.id, e)}
                      title="Xóa bản ghi trên máy này"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-1.5 text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
