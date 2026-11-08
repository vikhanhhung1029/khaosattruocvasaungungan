export type AlertnessLevel = 1 | 2 | 3 | 4 | 5;
export type FatigueLevel = 1 | 2 | 3 | 4 | 5;

export interface PreNapInfo {
  studentName: string;
  studentId?: string;
  className: string;
  bedTime: string; // e.g. "23:00"
  wakeTime: string; // e.g. "06:30"
  sleepHours: number; // calculated hours
  hadCoffee: boolean;
  coffeeDetails?: string;
  hadSoda: boolean; // nước ngọt / nước có ga
  sodaDetails?: string;
  hadCaffeine?: boolean;
  caffeineDetails?: string;
  preNapMood: 'thoai_mai' | 'cang_thang' | 'lo_lang' | 'binh_thuong';
}

export interface ReactionTestResult {
  trials: number[]; // ms for each trial
  averageTime: number; // ms
  fastestTime: number; // ms
  faults: number; // clicked too early
}

export interface SelectiveAttentionResult {
  totalTargetA: number; // total 'A's generated
  foundCorrect: number; // correctly tapped 'A's
  errors: number; // incorrectly tapped other letters
  missed: number; // 'A's left unselected
  accuracyPercentage: number;
  timeSpentSeconds: number; // up to 30s
}

export interface MemoryRoundItem {
  roundNumber: number; // 1, 2, 3
  targetSequence: string;
  userSequence: string;
  correctDigitsCount: number;
  totalDigits: number;
  accuracyPercentage: number;
  isExactMatch: boolean;
}

export interface MemoryTestResult {
  targetSequence: string; // e.g. "7392158"
  userSequence: string;
  correctDigitsCount: number;
  totalDigits: number; // 21 across 3 rounds
  accuracyPercentage: number;
  isExactMatch: boolean;
  rounds?: MemoryRoundItem[];
}

export interface AssessmentData {
  alertness: AlertnessLevel;
  fatigue: FatigueLevel;
  reactionTest: ReactionTestResult;
  attentionTest: SelectiveAttentionResult;
  memoryTest: MemoryTestResult;
  completedAt: string;
}

export interface FullNapSession {
  id: string;
  createdAt: string;
  studentInfo: PreNapInfo;
  preNap: AssessmentData;
  napDurationMinutes: number;
  napNotes?: string;
  postNap: AssessmentData;
  userId?: string;
  submitterEmail?: string;
}

export type SystemRole = 'owner' | 'viewer' | 'student';

export interface AuthorizedViewer {
  email: string;
  role: 'viewer' | 'admin';
  notes?: string;
  grantedBy: string;
  grantedAt: string;
  active: boolean;
}

export type SurveyPhase =
  | 'pre_survey' // Step 1: background & pre-nap alertness/fatigue
  | 'pre_reaction' // Step 2: Reaction test
  | 'pre_attention' // Step 3: Selective attention test
  | 'pre_memory' // Step 4: Memory test
  | 'nap_interval' // Step 5: Input nap duration / power nap timer
  | 'post_survey' // Step 6: Post-nap alertness/fatigue
  | 'post_reaction' // Step 7: Post-nap reaction test
  | 'post_attention' // Step 8: Post-nap selective attention test
  | 'post_memory' // Step 9: Post-nap memory test
  | 'report'; // Step 10: Comparison Report & PDF Export
