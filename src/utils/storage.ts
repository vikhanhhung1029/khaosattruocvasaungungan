import { FullNapSession } from '../types';

const STORAGE_KEY = 'nap_study_sessions_v1';

export function saveNapSession(session: FullNapSession): void {
  try {
    const existing = getSavedSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20))); // Keep last 20
  } catch (err) {
    console.error('Failed to save session to localStorage:', err);
  }
}

export function getSavedSessions(): FullNapSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteSavedSession(id: string): void {
  try {
    const existing = getSavedSessions();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
}

// Generate a realistic, standardized sample session for instant demo preview
export function generateSampleSession(): FullNapSession {
  return {
    id: 'demo_' + Date.now(),
    createdAt: new Date().toISOString(),
    studentInfo: {
      studentName: 'Nguyễn Văn An',
      className: '11A2',
      bedTime: '23:30',
      wakeTime: '06:30',
      sleepHours: 7.0,
      hadCoffee: false,
      coffeeDetails: '',
      hadSoda: false,
      sodaDetails: '',
      hadCaffeine: false,
      caffeineDetails: '',
      preNapMood: 'binh_thuong',
    },
    preNap: {
      alertness: 2, // Điểm 2: Buồn ngủ, khó tập trung
      fatigue: 2, // Điểm 2: Mệt mỏi, khó duy trì hoạt động
      reactionTest: {
        trials: [385, 412, 396, 430, 402],
        averageTime: 405,
        fastestTime: 385,
        faults: 0,
      },
      attentionTest: {
        totalTargetA: 10, // Exactly 10 target 'A's
        foundCorrect: 7,
        errors: 2,
        missed: 3,
        accuracyPercentage: 50, // Net accuracy: (7 - 2) / 10 = 50%
        timeSpentSeconds: 30,
      },
      memoryTest: {
        targetSequence: '7392158',
        userSequence: '7392108',
        correctDigitsCount: 6,
        totalDigits: 7,
        accuracyPercentage: 86,
        isExactMatch: false,
      },
      completedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    napDurationMinutes: 20,
    napNotes: 'Giấc ngủ ngắn 20 phút chuẩn Power Nap, không gian yên tĩnh, thức dậy tỉnh táo.',
    postNap: {
      alertness: 5, // Điểm 5: Rất tỉnh táo, tràn đầy năng lượng
      fatigue: 5, // Điểm 5: Hoàn toàn khỏe, không mệt
      reactionTest: {
        trials: [280, 265, 292, 274, 259],
        averageTime: 274,
        fastestTime: 259,
        faults: 0,
      },
      attentionTest: {
        totalTargetA: 10, // Exactly 10 target 'A's
        foundCorrect: 10,
        errors: 0,
        missed: 0,
        accuracyPercentage: 100, // Net accuracy: (10 - 0) / 10 = 100%
        timeSpentSeconds: 21,
      },
      memoryTest: {
        targetSequence: '5841963',
        userSequence: '5841963',
        correctDigitsCount: 7,
        totalDigits: 7,
        accuracyPercentage: 100,
        isExactMatch: true,
      },
      completedAt: new Date().toISOString(),
    },
  };
}
