import React from 'react';
import { SurveyPhase } from '../types';

interface StepProgressProps {
  currentPhase: SurveyPhase;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentPhase }) => {
  const steps = [
    {
      id: 'pre',
      title: 'Trước khi ngủ',
      sub: 'Khảo sát & 3 bài test',
      phases: ['pre_survey', 'pre_reaction', 'pre_attention', 'pre_memory'],
    },
    {
      id: 'nap',
      title: 'Giấc ngủ ngắn',
      sub: 'Thời gian nghỉ',
      phases: ['nap_interval'],
    },
    {
      id: 'post',
      title: 'Sau khi ngủ',
      sub: 'Đánh giá lại',
      phases: ['post_survey', 'post_reaction', 'post_attention', 'post_memory'],
    },
    {
      id: 'report',
      title: 'Báo cáo',
      sub: 'PNG & PDF',
      phases: ['report'],
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.phases.includes(currentPhase));

  // Determine sub-step for current phase
  let subStepLabel = '';
  if (currentPhase === 'pre_survey') subStepLabel = 'Bước 1/4: Bảng khảo sát & thông tin ban đầu';
  else if (currentPhase === 'pre_reaction') subStepLabel = 'Bước 2/4: Bài kiểm tra phản ứng nhanh';
  else if (currentPhase === 'pre_attention') subStepLabel = 'Bước 3/4: Bài kiểm tra chú ý 10 chữ A (10s)';
  else if (currentPhase === 'pre_memory') subStepLabel = 'Bước 4/4: Bài kiểm tra trí nhớ ngắn hạn (7 số / 7s)';
  else if (currentPhase === 'nap_interval') subStepLabel = 'Nhập số phút đã ngủ hoặc bấm hẹn giờ ngủ';
  else if (currentPhase === 'post_survey') subStepLabel = 'Bước 1/4: Đánh giá tỉnh táo & mệt mỏi sau ngủ';
  else if (currentPhase === 'post_reaction') subStepLabel = 'Bước 2/4: Kiểm tra phản ứng nhanh sau ngủ';
  else if (currentPhase === 'post_attention') subStepLabel = 'Bước 3/4: Kiểm tra chú ý 10 chữ A (10s) sau ngủ';
  else if (currentPhase === 'post_memory') subStepLabel = 'Bước 4/4: Kiểm tra trí nhớ ngắn hạn (7 số / 7s) sau ngủ';
  else if (currentPhase === 'report') subStepLabel = 'Hoàn tất: Báo cáo phân tích so sánh & xuất PNG / PDF';

  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        {/* Step bars */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.id} className="flex flex-col">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600'
                      : isCurrent
                      ? 'bg-indigo-600'
                      : 'bg-slate-200'
                  }`}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      isCurrent
                        ? 'text-indigo-600'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {idx + 1}. {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current micro status banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-medium text-slate-700">{subStepLabel}</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-600">
            {currentPhase === 'report' ? '100%' : `${Math.round(((Math.max(0, currentStepIndex) * 2.5 + 1) / 10) * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
