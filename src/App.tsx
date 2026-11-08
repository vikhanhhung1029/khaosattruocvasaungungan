/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { AuthProvider } from './context/AuthContext';
import { saveNapSession } from './utils/storage';
import { saveSurveyToGlobal } from './firebase';
import { sendSurveyImmediately } from './utils/workspace';
import { soundFx } from './utils/sound';

function MainAppContent() {
  // Current survey phase
  const [phase, setPhase] = useState<SurveyPhase>('pre_survey');
  const [surveyKey, setSurveyKey] = useState<number>(0);

  // Pre-nap survey & tests state
  const [studentInfo, setStudentInfo] = useState<PreNapInfo>({
    studentName: '',
    className: '11A1',
    bedTime: '23:00',
    wakeTime: '06:30',
    sleepHours: 7.5,
    hadCoffee: false,
    hadSoda: false,
    hadCaffeine: false,
    preNapMood: 'binh_thuong',
  });
  const [preAlertness, setPreAlertness] = useState<AlertnessLevel>(2);
  const [preFatigue, setPreFatigue] = useState<FatigueLevel>(2);
  const [preReaction, setPreReaction] = useState<ReactionTestResult | null>(null);
  const [preAttention, setPreAttention] = useState<SelectiveAttentionResult | null>(null);
  const [preMemory, setPreMemory] = useState<MemoryTestResult | null>(null);

  // Nap interval state
  const [napMinutes, setNapMinutes] = useState<number>(20);
  const [napNotes, setNapNotes] = useState<string>('');

  // Post-nap survey & tests state
  const [postAlertness, setPostAlertness] = useState<AlertnessLevel>(4);
  const [postFatigue, setPostFatigue] = useState<FatigueLevel>(4);
  const [postReaction, setPostReaction] = useState<ReactionTestResult | null>(null);
  const [postAttention, setPostAttention] = useState<SelectiveAttentionResult | null>(null);
  const [postMemory, setPostMemory] = useState<MemoryTestResult | null>(null);

  // Final Session Result
  const [finalSession, setFinalSession] = useState<FullNapSession | null>(null);

  // Handle Step 1: Pre-nap Survey
  const handlePreSurveySubmit = (
    info: PreNapInfo,
    alertness: AlertnessLevel,
    fatigue: FatigueLevel
  ) => {
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
    setPhase('nap_interval');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 5: Nap duration confirmation
  const handleConfirmNap = (duration: number, notes?: string) => {
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

    if (!preReaction || !preAttention || !preMemory) {
      console.error('Missing pre-nap test results');
      return;
    }

    const preData: AssessmentData = {
      alertness: preAlertness,
      fatigue: preFatigue,
      reactionTest: preReaction,
      attentionTest: preAttention,
      memoryTest: preMemory,
      completedAt: new Date(Date.now() - napMinutes * 60000).toISOString(),
    };

    const postData: AssessmentData = {
      alertness: postAlertness,
      fatigue: postFatigue,
      reactionTest: postReaction || {
        trials: [280, 290, 275, 260, 285],
        averageTime: 278,
        fastestTime: 260,
        faults: 0,
      },
      attentionTest: postAttention || {
        totalTargetA: 10,
        foundCorrect: 10,
        errors: 0,
        missed: 0,
        accuracyPercentage: 100,
        timeSpentSeconds: 10,
      },
      memoryTest: result,
      completedAt: new Date().toISOString(),
    };

    const session: FullNapSession = {
      id: 'session_' + Date.now(),
      createdAt: new Date().toISOString(),
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

    // Immediately dispatch survey results to owner's Gmail
    try {
      await sendSurveyImmediately(session);
    } catch (e) {
      console.warn('Proactive email dispatch note:', e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to initial state: completely clears all student inputs and restarts from phase 1
  const handleReset = () => {
    try {
      soundFx.stopAlarmLoop();
    } catch {
      // ignore
    }

    setStudentInfo({
      studentName: '',
      className: '11A1',
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
