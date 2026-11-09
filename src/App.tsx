/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import {
  SurveyPhase,
  PreNapInfo,
  AlertnessLevel,
  FatigueLevel,
  ReactionTestResult,
  SelectiveAttentionResult,
  MemoryTestResult,
  AssessmentData,
  FullNapSession,
} from './types';
import { Header } from './components/Header';
import { StepProgress } from './components/StepProgress';
import { PreNapSurvey } from './components/PreNapSurvey';
import { ReactionTimeTest } from './components/ReactionTimeTest';
import { SelectiveAttentionTest } from './components/SelectiveAttentionTest';
import { MemoryTest } from './components/MemoryTest';
import { NapIntervalScreen } from './components/NapIntervalScreen';
import { PostNapSurvey } from './components/PostNapSurvey';
import { ComparisonReport } from './components/ComparisonReport';
import { saveNapSession } from './utils/storage';
import { saveSurveyToGlobal } from './firebase';
import { sendSurveyImmediately } from './utils/workspace';
import { soundFx } from './utils/sound';

const DRAFT_STORAGE_KEY = 'nap_study_active_draft_v1';

function readSurveyDraft(): any | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validPhases: SurveyPhase[] = [
      'pre_reaction', 'pre_attention', 'pre_memory', 'nap_interval',
      'post_survey', 'post_reaction', 'post_attention', 'post_memory',
    ];
    return parsed && validPhases.includes(parsed.phase) ? parsed : null;
  } catch {
    return null;
  }
}

function MainAppContent() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [initialDraft] = useState<any | null>(() => readSurveyDraft());
  // Current survey phase
  const [phase, setPhase] = useState<SurveyPhase>(initialDraft?.phase || 'pre_survey');
  const [surveyKey, setSurveyKey] = useState<number>(0);
  const [surveyStartedAt, setSurveyStartedAt] = useState<string>(() => initialDraft?.surveyStartedAt || new Date().toISOString());
  const [preAssessmentCompletedAt, setPreAssessmentCompletedAt] = useState<string | null>(initialDraft?.preAssessmentCompletedAt || null);

  // Pre-nap survey & tests state
  const [studentInfo, setStudentInfo] = useState<PreNapInfo>(initialDraft?.studentInfo || { 
    studentName: '',
    className: 'Khối 11',
    gender: 'Nam',
    school: 'THPT Chi Lăng',
    bedTime: '23:00',
    wakeTime: '06:30',
    sleepHours: 7.5,
    hadCoffee: false,
    hadSoda: false,
    hadCaffeine: false,
    preNapMood: 'binh_thuong',
  });
  const [preAlertness, setPreAlertness] = useState<AlertnessLevel>(initialDraft?.preAlertness ?? 2);
  const [preFatigue, setPreFatigue] = useState<FatigueLevel>(initialDraft?.preFatigue ?? 2);
  const [preReaction, setPreReaction] = useState<ReactionTestResult | null>(initialDraft?.preReaction || null);
  const [preAttention, setPreAttention] = useState<SelectiveAttentionResult | null>(initialDraft?.preAttention || null);
  const [preMemory, setPreMemory] = useState<MemoryTestResult | null>(initialDraft?.preMemory || null);

  // Nap interval state
  const [napMinutes, setNapMinutes] = useState<number>(initialDraft?.napMinutes ?? 20);
  const [napNotes, setNapNotes] = useState<string>(initialDraft?.napNotes || '');

  // Post-nap survey & tests state
  const [postAlertness, setPostAlertness] = useState<AlertnessLevel>(initialDraft?.postAlertness ?? 4);
  const [postFatigue, setPostFatigue] = useState<FatigueLevel>(initialDraft?.postFatigue ?? 4);
  const [postReaction, setPostReaction] = useState<ReactionTestResult | null>(initialDraft?.postReaction || null);
  const [postAttention, setPostAttention] = useState<SelectiveAttentionResult | null>(initialDraft?.postAttention || null);
  const [postMemory, setPostMemory] = useState<MemoryTestResult | null>(initialDraft?.postMemory || null);

  // Final Session Result
  const [finalSession, setFinalSession] = useState<FullNapSession | null>(null);
  // Send results silently in the background; delivery failures are logged for administrators.
  const sendSessionEmail = async (session: FullNapSession) => {
    try {
      await sendSurveyImmediately(session);
    } catch (error) {
      console.error('Không thể gửi email kết quả khảo sát:', error);
    }
  };

  // Persist each completed assessment step. The active draft stays on this browser/device.
  useEffect(() => {
    if (phase === 'pre_survey' || phase === 'report') {
      if (phase === 'report') localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        phase, surveyStartedAt, preAssessmentCompletedAt, studentInfo,
        preAlertness, preFatigue, preReaction, preAttention, preMemory,
        napMinutes, napNotes, postAlertness, postFatigue, postReaction,
        postAttention, postMemory,
      }));
    } catch (error) {
      console.error('Không thể lưu tiến độ khảo sát trên thiết bị:', error);
    }
  }, [
    phase, surveyStartedAt, preAssessmentCompletedAt, studentInfo,
    preAlertness, preFatigue, preReaction, preAttention, preMemory,
    napMinutes, napNotes, postAlertness, postFatigue, postReaction,
    postAttention, postMemory,
  ]);

  // Handle Step 1: Pre-nap Survey
  const handlePreSurveySubmit = (
    info: PreNapInfo,
    alertness: AlertnessLevel,
    fatigue: FatigueLevel
  ) => {
    setSurveyStartedAt(new Date().toISOString());
    setStudentInfo(info);
    setPreAlertness(alertness);
    setPreFatigue(fatigue);
    setPhase('pre_reaction');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 2: Pre-nap Reaction Test
  const handlePreReactionComplete = (result: ReactionTestResult) => {
    setPreReaction(result);
    setPhase('pre_attention');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 3: Pre-nap Selective Attention Test
  const handlePreAttentionComplete = (result: SelectiveAttentionResult) => {
    setPreAttention(result);
    setPhase('pre_memory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 4: Pre-nap Memory Test
  const handlePreMemoryComplete = (result: MemoryTestResult) => {
    setPreMemory(result);
    setPreAssessmentCompletedAt(new Date().toISOString());
    setPhase('nap_interval');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 5: Nap duration confirmation
  const handleConfirmNap = (duration: number, notes?: string) => {
    if (!Number.isInteger(duration) || duration < 5 || duration > 60) {
      console.error('Invalid nap duration. Expected an integer from 5 to 60 minutes.');
      return;
    }
    setNapMinutes(duration);
    setNapNotes(notes || '');
    setPhase('post_survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 6: Post-nap Survey
  const handlePostSurveySubmit = (alertness: AlertnessLevel, fatigue: FatigueLevel) => {
    setPostAlertness(alertness);
    setPostFatigue(fatigue);
    setPhase('post_reaction');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 7: Post-nap Reaction Test
  const handlePostReactionComplete = (result: ReactionTestResult) => {
    setPostReaction(result);
    setPhase('post_attention');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 8: Post-nap Selective Attention Test
  const handlePostAttentionComplete = (result: SelectiveAttentionResult) => {
    setPostAttention(result);
    setPhase('post_memory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 9: Post-nap Memory Test -> Compile Final Report!
  const handlePostMemoryComplete = async (result: MemoryTestResult) => {
    setPostMemory(result);

    if (!preReaction || !preAttention || !preMemory || !postReaction || !postAttention) {
      console.error('Missing pre-nap or post-nap test results; refusing to create an incomplete assessment.');
      return;
    }

    const preData: AssessmentData = {
      alertness: preAlertness,
      fatigue: preFatigue,
      reactionTest: preReaction,
      attentionTest: preAttention,
      memoryTest: preMemory,
      completedAt: preAssessmentCompletedAt || new Date().toISOString(),
    };

    const postData: AssessmentData = {
      alertness: postAlertness,
      fatigue: postFatigue,
      reactionTest: postReaction,
      attentionTest: postAttention,
      memoryTest: result,
      completedAt: new Date().toISOString(),
    };

    const completedAt = new Date().toISOString();
    const session: FullNapSession = {
      id: 'session_' + Date.now(),
      createdAt: completedAt,
      startedAt: surveyStartedAt,
      completedAt,
      studentInfo,
      preNap: preData,
      napDurationMinutes: napMinutes,
      napNotes,
      postNap: postData,
    };

    setFinalSession(session);
    setPhase('report');

    // Save to local storage
    saveNapSession(session);

    // Save to Firebase Firestore global repository
    try {
      await saveSurveyToGlobal(session);
    } catch (err) {
      console.warn('Global survey storage note:', err);
    }

    // Automatically send completed results without showing email details to participants.
    void sendSessionEmail(session);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to initial state: completely clears all student inputs and restarts from phase 1
  const handleReset = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    try {
      soundFx.stopAlarmLoop();
    } catch {
      // ignore
    }

    setSurveyStartedAt(new Date().toISOString());
    setPreAssessmentCompletedAt(null);
    setStudentInfo({
      studentName: '',
      className: 'Khối 11',
    gender: 'Nam',
    school: 'THPT Chi Lăng',
      bedTime: '23:00',
      wakeTime: '06:30',
      sleepHours: 7.5,
      hadCoffee: false,
      coffeeDetails: '',
      hadSoda: false,
      sodaDetails: '',
      hadCaffeine: false,
      preNapMood: 'binh_thuong',
    });
    setPreAlertness(2);
    setPreFatigue(2);
    setPreReaction(null);
    setPreAttention(null);
    setPreMemory(null);
    setNapMinutes(20);
    setNapNotes('');
    setPostAlertness(4);
    setPostFatigue(4);
    setPostReaction(null);
    setPostAttention(null);
    setPostMemory(null);
    setFinalSession(null);
    setSurveyKey((prev) => prev + 1);
    setPhase('pre_survey');

    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        hasActiveSession={phase !== 'pre_survey'}
        onAdminOpen={() => setAdminOpen(true)}
      />

      {/* Step Progress Tracker */}
      <div className="no-print">
        <StepProgress currentPhase={phase} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Phase 1: Pre-Nap Survey with dynamic surveyKey for complete fresh remount */}
        {phase === 'pre_survey' && (
          <PreNapSurvey
            key={surveyKey}
            initialInfo={studentInfo}
            initialAlertness={preAlertness}
            initialFatigue={preFatigue}
            onSubmit={handlePreSurveySubmit}
          />
        )}

        {/* Phase 2: Pre-Nap Reaction Test */}
        {phase === 'pre_reaction' && (
          <ReactionTimeTest
            phaseTitle="Trước khi ngủ"
            onComplete={handlePreReactionComplete}
          />
        )}

        {/* Phase 3: Pre-Nap Selective Attention Test */}
        {phase === 'pre_attention' && (
          <SelectiveAttentionTest
            phaseTitle="Trước khi ngủ"
            onComplete={handlePreAttentionComplete}
          />
        )}

        {/* Phase 4: Pre-Nap Memory Test */}
        {phase === 'pre_memory' && (
          <MemoryTest
            phaseTitle="Trước khi ngủ"
            onComplete={handlePreMemoryComplete}
          />
        )}

        {/* Phase 5: Nap Interval Screen */}
        {phase === 'nap_interval' && (
          <NapIntervalScreen onConfirmNapDuration={handleConfirmNap} />
        )}

        {/* Phase 6: Post-Nap Survey */}
        {phase === 'post_survey' && (
          <PostNapSurvey
            initialAlertness={postAlertness}
            initialFatigue={postFatigue}
            onSubmit={handlePostSurveySubmit}
          />
        )}

        {/* Phase 7: Post-Nap Reaction Test */}
        {phase === 'post_reaction' && (
          <ReactionTimeTest
            phaseTitle="Sau khi ngủ"
            onComplete={handlePostReactionComplete}
          />
        )}

        {/* Phase 8: Post-Nap Selective Attention Test */}
        {phase === 'post_attention' && (
          <SelectiveAttentionTest
            phaseTitle="Sau khi ngủ"
            onComplete={handlePostAttentionComplete}
          />
        )}

        {/* Phase 9: Post-Nap Memory Test */}
        {phase === 'post_memory' && (
          <MemoryTest
            phaseTitle="Sau khi ngủ"
            onComplete={handlePostMemoryComplete}
          />
        )}

        {/* Phase 10: Comparison Report */}
        {phase === 'report' && finalSession && (
          <ComparisonReport
            session={finalSession}
            onRestart={handleReset}
          />
        )}
      </main>
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </div>
  );
}

export default function App() {
  return <MainAppContent />;
}
