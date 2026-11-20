import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  StudentAttendance,
  TeacherAttendance,
  LeaveRequest,
  FeeRecord,
  DailyReport,
  Test,
  TestResult,
  Notice,
  OnlineAdmission,
  SystemSettings,
  PortalType,
  ClassLevel,
  getDefaultMonthlyFee,
  SCHOOL_CLASSES,
  StudentExamReport,
  SalaryTransaction,
  TeacherSalaryPayment
} from '../types';
import {
  initialStudents,
  initialTeachers,
  initialAttendance,
  initialTeacherAttendance,
  initialLeaves,
  initialFeeRecords,
  initialDailyReports,
  initialTests,
  initialTestResults,
  initialNotices,
  initialAdmissions,
  initialSettings,
  initialSalaryTransactions,
  initialStudentExamReports
} from '../data/initialData';
import {
  extractCleanJson,
  normalizeDigits,
  getCurrentMonthLabel,
  monthLabelToYearMonth,
  isDateCoveredByApprovedLeave,
  deduplicateAttendance,
  reconcileFeesWithAttendance
} from '../utils/schoolSync';
import { deduplicateAndCleanFeeRecords } from '../utils/feeCalculations';

export interface StudentFullReport {
  student: Student;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  attendancePercentage: number;
  finePerAbsentDay: number;
  totalFineAmount: number;
  monthlyFee: number;
  totalPayable: number;
  paidAmount: number;
  balanceRemaining: number;
  feeStatus: string;
  testScores: TestResult[];
  recentDailyReports: DailyReport[];
  leaves: LeaveRequest[];
  attendanceHistory: StudentAttendance[];
  feeHistory: FeeRecord[];
}

interface SchoolContextType {
  // State
  students: Student[];
  teachers: Teacher[];
  attendance: StudentAttendance[];
  teacherAttendance: TeacherAttendance[];
  leaves: LeaveRequest[];
  feeRecords: FeeRecord[];
  dailyReports: DailyReport[];
  tests: Test[];
  testResults: TestResult[];
  notices: Notice[];
  onlineAdmissions: OnlineAdmission[];
  settings: SystemSettings;
  salaryTransactions: SalaryTransaction[];

  // Portal & Auth State
  currentPortal: PortalType;
  isAdminLoggedIn: boolean;
  currentTeacherId: string | null;
  currentParentStudentId: string | null;
  selectedStudentForModal: Student | null;

  // Navigation & Auth actions
  setPortal: (portal: PortalType) => void;
  setCurrentParentStudentId: (id: string | null) => void;
  loginAdmin: (password: string) => boolean;
  loginTeacher: (teacherId: string, password: string) => boolean;
  loginOrCreateTeacherByName: (name: string, password: string) => boolean;
  loginParent: (identifier: string, className?: string) => Student | null;
  logout: () => void;
  setSelectedStudentForModal: (student: Student | null) => void;

  // CRUD & Operations
  addStudent: (student: Omit<Student, 'id'>) => Student;
  addStudentAsync: (student: Omit<Student, 'id'>) => Promise<{ success: boolean; student?: Student; error?: string }>;
  updateStudent: (student: Student) => void;
  updateStudentAsync: (student: Student) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (id: string) => void;
  toggleStudentActive: (id: string) => void;
  purgePlaceholderStudents: () => number;

  addTeacher: (teacher: Omit<Teacher, 'id' | 'allowances' | 'deductions'>) => Teacher;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  adjustTeacherSalary: (teacherId: string, amount: number, type: 'Addition' | 'Deduction', reason: string, month?: string) => void;
  setTeacherPassword: (teacherId: string, newPassword: string) => void;
  teacherSalaryPayments: TeacherSalaryPayment[];
  toggleTeacherSalaryPayment: (teacherId: string, month: string, amount: number) => void;

  markStudentAttendance: (record: Omit<StudentAttendance, 'id'>) => void;
  markClassAttendance: (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[],
    markedBy?: { teacherId?: string; teacherName?: string }
  ) => void;
  markClassAttendanceAsync: (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[],
    markedBy?: { teacherId?: string; teacherName?: string }
  ) => Promise<{ success: boolean; syncedOnline: boolean }>;
  markTeacherAttendance: (record: Omit<TeacherAttendance, 'id'>) => void;
  markTeacherAttendanceAsync: (
    record: Omit<TeacherAttendance, 'id'>
  ) => Promise<{ success: boolean; syncedOnline: boolean }>;

  submitLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedDate'>) => void;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected') => void;

  addFeeRecord: (record: Omit<FeeRecord, 'id'>) => void;
  updateFeeRecord: (updated: FeeRecord) => void;
  deleteFeeRecord: (feeRecordId: string) => void;
  recordFeePayment: (feeRecordId: string, amount: number, receiptNo: string) => void;
  generateMonthlyFeeVouchers: (monthName: string) => number;
  recalculateAllFeeFines: () => void;

  addTest: (test: Omit<Test, 'id'>) => Test;
  addTestResult: (result: Omit<TestResult, 'id'>) => void;
  saveDailyTestWithResultsAsync: (
    test: Test,
    results: Array<Omit<TestResult, 'id' | 'testId' | 'testTitle' | 'testDate' | 'className' | 'subject' | 'totalMarks'>>
  ) => Promise<{ success: boolean; test: Test; error?: string }>;
  deleteTestAsync: (testId: string) => Promise<boolean>;
  addDailyReport: (report: Omit<DailyReport, 'id'>) => void;

  // Official Student Exam Reports (Tests & Results Section)
  studentExamReports: StudentExamReport[];
  saveStudentExamReport: (report: StudentExamReport) => void;
  saveStudentExamReportAsync: (report: StudentExamReport) => Promise<boolean>;
  deleteStudentExamReport: (reportId: string) => void;
  togglePublishExamReport: (reportId: string) => void;

  addNotice: (notice: Omit<Notice, 'id'>) => void;
  deleteNotice: (id: string) => void;

  submitOnlineAdmission: (admission: Omit<OnlineAdmission, 'id' | 'applyDate' | 'status'>) => void;
  updateAdmissionStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  approveAndEnrollAdmission: (admissionId: string) => Student | null;

  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetAllDataToZero: () => void;

  // Cross-Device Sync & Backup
  exportAllSchoolData: () => string;
  importSchoolData: (jsonString: string) => { success: boolean; studentCount: number; message: string };

  // Real-Time Cloud Database Status
  isOnline: boolean;
  isCloudConnected: boolean;
  isCloudSyncing: boolean;
  hasPendingOfflineSync: boolean;
  pendingOfflineCount: number;
  lastCloudSyncTime: string | null;
  syncNowWithCloud: () => Promise<Student[]>;
  forceSyncAllToCloud: () => Promise<{ success: boolean; studentCount: number; message: string }>;

  // Reporting
  getStudentFullReport: (studentId: string) => StudentFullReport | null;
  openWhatsApp: (phone?: string, message?: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Strict filter to eliminate ONLY legacy fake/dummy seed records by known seed IDs.
// Never match by common student first names (e.g., Maryam, Abdullah) or class names.
const DUMMY_STUDENT_IDS = new Set([
  's-101', 's-102', 's-103', 's-104', 's-105', 's-106', 's-107',
  's-108', 's-109', 's-110', 's-111', 's-112', 's-113'
]);

export function isDummyStudent(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || item.studentId || '');
  if (
    id &&
    (DUMMY_STUDENT_IDS.has(id) ||
      id.startsWith('bss-') ||
      id.startsWith('fee-rec-bss-') ||
      id.startsWith('fee-bss-'))
  ) {
    return true;
  }
  return false;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`bss_v12_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`bss_v12_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save bss_v12_${key}`, e);
  }
}

// Deep recovery function to restore real students previously added in any storage version
function recoverAllLocalStudents(): Student[] {
  return []; // Clean slate requested by administrator
  const recoveredMap = new Map<string, Student>();
  const priorityKeys = [
    'bss_v8_students',
    'bss_v7_students',
    'bss_v6_students',
    'bss_v5_students',
    'bss_v4_students',
    'bss_v3_students',
    'bss_students',
    'school_students',
    'students'
  ];

  try {
    priorityKeys.forEach(k => {
      try {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            parsed.forEach((st: any) => {
              if (st && st.name && !isDummyStudent(st)) {
                const id = st.id || `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                if (!recoveredMap.has(id)) {
                  recoveredMap.set(id, { ...st, id });
                }
              }
            });
          }
        }
      } catch (e) {}
    });
  } catch (err) {
    console.warn('Error recovering local students:', err);
  }

  return Array.from(recoveredMap.values());
}


export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = loadFromStorage<Student[]>("students", []);
    const cleanRaw = Array.isArray(raw) ? raw.filter(s => !isDummyStudent(s)) : [];
    saveToStorage("students", cleanRaw);
    return cleanRaw;
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const raw = loadFromStorage<Teacher[]>('teachers', initialTeachers);
    return Array.isArray(raw) && raw.length > 0 ? raw : initialTeachers;
  });
  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
    const raw = loadFromStorage<StudentAttendance[]>('attendance', initialAttendance);
    const clean = Array.isArray(raw) ? raw.filter(a => !isDummyStudent(a)) : [];
    return clean;
  });
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => loadFromStorage('teacherAttendance', initialTeacherAttendance));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => loadFromStorage('leaves', initialLeaves));
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => {
    const raw = loadFromStorage<FeeRecord[]>("feeRecords", []);
    const clean = Array.isArray(raw) ? raw.filter(f => !isDummyStudent(f)) : [];
    const deduped = students.length > 0 ? deduplicateAndCleanFeeRecords(clean, students) : clean;
    saveToStorage("feeRecords", deduped);
    return deduped;
  });
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const raw = loadFromStorage<DailyReport[]>('dailyReports', initialDailyReports);
    return Array.isArray(raw) ? raw.filter(r => !isDummyStudent(r)) : [];
  });
  const [tests, setTests] = useState<Test[]>(() => {
    const raw = loadFromStorage<Test[]>('tests', initialTests);
    return Array.isArray(raw) && raw.length > 0 ? raw : initialTests;
  });
  const [testResults, setTestResults] = useState<TestResult[]>(() => {
    const raw = loadFromStorage<TestResult[]>('testResults', initialTestResults);
    return Array.isArray(raw) ? raw.filter(tr => !isDummyStudent(tr)) : [];
  });
  const [studentExamReports, setStudentExamReports] = useState<StudentExamReport[]>(() =>
    loadFromStorage('studentExamReports', initialStudentExamReports)
  );
  const [notices, setNotices] = useState<Notice[]>(() => {
    const raw = loadFromStorage<Notice[]>('notices', initialNotices);
    return Array.isArray(raw) && raw.length > 0 ? raw : initialNotices;
  });
  const [onlineAdmissions, setOnlineAdmissions] = useState<OnlineAdmission[]>(() => loadFromStorage('admissions', initialAdmissions));
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const raw = loadFromStorage<Partial<SystemSettings>>('settings', initialSettings);
    return {
      ...initialSettings,
      ...raw,
      adminPassword: raw?.adminPassword || initialSettings.adminPassword || 'Ahmad@1'
    };
  });
  const [salaryTransactions, setSalaryTransactions] = useState<SalaryTransaction[]>(() =>
    loadFromStorage('salaryTransactions', initialSalaryTransactions)
  );
  const [teacherSalaryPayments, setTeacherSalaryPayments] = useState<TeacherSalaryPayment[]>(() =>
    loadFromStorage('teacherSalaryPayments', [])
  );
  const [deletedIds, setDeletedIds] = useState<string[]>(() =>
    loadFromStorage<string[]>('deletedIds', [])
  );

  // Portal & Auth State
  const [currentPortal, setCurrentPortal] = useState<PortalType>('PUBLIC_WEBSITE');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => loadFromStorage('isAdminLoggedIn', false));
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(() => loadFromStorage('currentTeacherId', null));
  const [currentParentStudentId, setCurrentParentStudentId] = useState<string | null>(() => {
    return loadFromStorage<string | null>('currentParentStudentId', null);
  });
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Sync to localStorage
  useEffect(() => saveToStorage('students', students), [students]);
  useEffect(() => saveToStorage('teachers', teachers), [teachers]);
  useEffect(() => saveToStorage('attendance', attendance), [attendance]);
  useEffect(() => saveToStorage('teacherAttendance', teacherAttendance), [teacherAttendance]);
  useEffect(() => saveToStorage('leaves', leaves), [leaves]);
  useEffect(() => saveToStorage('feeRecords', feeRecords), [feeRecords]);
  useEffect(() => saveToStorage('dailyReports', dailyReports), [dailyReports]);
  useEffect(() => saveToStorage('tests', tests), [tests]);
  useEffect(() => saveToStorage('testResults', testResults), [testResults]);
  useEffect(() => saveToStorage('studentExamReports', studentExamReports), [studentExamReports]);
  useEffect(() => saveToStorage('notices', notices), [notices]);
  useEffect(() => saveToStorage('admissions', onlineAdmissions), [onlineAdmissions]);
  useEffect(() => saveToStorage('settings', settings), [settings]);
  useEffect(() => saveToStorage('salaryTransactions', salaryTransactions), [salaryTransactions]);
  useEffect(() => saveToStorage('teacherSalaryPayments', teacherSalaryPayments), [teacherSalaryPayments]);
  useEffect(() => saveToStorage('deletedIds', deletedIds), [deletedIds]);
  useEffect(() => saveToStorage('isAdminLoggedIn', isAdminLoggedIn), [isAdminLoggedIn]);
  useEffect(() => saveToStorage('currentTeacherId', currentTeacherId), [currentTeacherId]);
  useEffect(() => saveToStorage('currentParentStudentId', currentParentStudentId), [currentParentStudentId]);

  // Real-Time Global Multi-Device Cloud Database Synchronization
  const GLOBAL_CLOUD_ENDPOINT_1 = 'https://extendsclass.com/api/json-storage/bin/bbedaaf';
  const GLOBAL_CLOUD_ENDPOINT_2 = 'https://extendsclass.com/api/json-storage/bin/dbabccb';
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  // Persistent Offline Queue (survives browser reloads/logouts if connectivity drops mid-marking)
  const [pendingAttQueue, setPendingAttQueue] = useState<StudentAttendance[]>(() =>
    loadFromStorage<StudentAttendance[]>('pending_att_queue', [])
  );
  const [pendingTeacherAttQueue, setPendingTeacherAttQueue] = useState<TeacherAttendance[]>(() =>
    loadFromStorage<TeacherAttendance[]>('pending_teacher_att_queue', [])
  );
  const [pendingExamReportsQueue, setPendingExamReportsQueue] = useState<StudentExamReport[]>(() =>
    loadFromStorage<StudentExamReport[]>('pending_exam_reports_queue', [])
  );
  const [pendingGeneralSync, setPendingGeneralSync] = useState<boolean>(() =>
    loadFromStorage<boolean>('pending_sync', false)
  );

  const pendingAttQueueRef = React.useRef<StudentAttendance[]>(pendingAttQueue);
  const pendingTeacherAttQueueRef = React.useRef<TeacherAttendance[]>(pendingTeacherAttQueue);
  const pendingExamReportsQueueRef = React.useRef<StudentExamReport[]>(pendingExamReportsQueue);
  const pendingGeneralSyncRef = React.useRef<boolean>(pendingGeneralSync);
  pendingAttQueueRef.current = pendingAttQueue;
  pendingTeacherAttQueueRef.current = pendingTeacherAttQueue;
  pendingExamReportsQueueRef.current = pendingExamReportsQueue;
  pendingGeneralSyncRef.current = pendingGeneralSync;

  const hasPendingOfflineSync =
    pendingGeneralSync ||
    pendingAttQueue.length > 0 ||
    pendingTeacherAttQueue.length > 0 ||
    pendingExamReportsQueue.length > 0;
  const pendingOfflineCount =
    pendingAttQueue.length + pendingTeacherAttQueue.length + pendingExamReportsQueue.length;

  const isApplyingRemoteUpdate = React.useRef(false);
  const lastKnownServerUpdatedAt = React.useRef<string | null>(null);
  const hasInitializedFromCloud = React.useRef(false);
  const hasPendingLocalMutation = React.useRef(
    pendingGeneralSync ||
      pendingAttQueue.length > 0 ||
      pendingTeacherAttQueue.length > 0 ||
      pendingExamReportsQueue.length > 0
  );
  const isFlushingOfflineRef = React.useRef(false);

  const persistPendingQueues = (
    nextAttQ: StudentAttendance[],
    nextTeacherAttQ: TeacherAttendance[],
    nextGenSync: boolean,
    nextExamReportsQ: StudentExamReport[] = pendingExamReportsQueueRef.current
  ) => {
    pendingAttQueueRef.current = nextAttQ;
    pendingTeacherAttQueueRef.current = nextTeacherAttQ;
    pendingExamReportsQueueRef.current = nextExamReportsQ;
    pendingGeneralSyncRef.current = nextGenSync;
    setPendingAttQueue(nextAttQ);
    setPendingTeacherAttQueue(nextTeacherAttQ);
    setPendingExamReportsQueue(nextExamReportsQ);
    setPendingGeneralSync(nextGenSync);
    saveToStorage('pending_att_queue', nextAttQ);
    saveToStorage('pending_teacher_att_queue', nextTeacherAttQ);
    saveToStorage('pending_exam_reports_queue', nextExamReportsQ);
    saveToStorage('pending_sync', nextGenSync);
  };

  // Synchronous State Reference to avoid stale closure issues
  const stateRef = React.useRef({
    students,
    teachers,
    attendance,
    teacherAttendance,
    leaves,
    feeRecords,
    dailyReports,
    tests,
    testResults,
    studentExamReports,
    notices,
    onlineAdmissions,
    settings,
    salaryTransactions,
    teacherSalaryPayments,
    deletedIds
  });

  // Always keep stateRef strictly in sync with latest render state
  stateRef.current = {
    students,
    teachers,
    attendance,
    teacherAttendance,
    leaves,
    feeRecords,
    dailyReports,
    tests,
    testResults,
    studentExamReports,
    notices,
    onlineAdmissions,
    settings,
    salaryTransactions,
    teacherSalaryPayments,
    deletedIds
  };

  const recordDeletedIds = (ids: string[]): string[] => {
    const merged = Array.from(new Set([...stateRef.current.deletedIds, ...ids])).slice(-500);
    setDeletedIds(merged);
    saveToStorage('deletedIds', merged);
    return merged;
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchFreshestCloudSnapshot = async (
    timeoutMs = 3500
  ): Promise<{ best: any | null; reachable: boolean }> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { best: null, reachable: false };
    }
    const cacheBust = `t=${Date.now()}`;
    const fetchCandidate = async (url: string) => {
      const res = await fetchWithTimeout(
        url,
        { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store' } },
        timeoutMs
      );
      if (!res.ok) return null;
      const rawText = await res.text();
      const parsed = extractCleanJson<any>(rawText);
      const d = parsed?.data || parsed;
      if (d && Array.isArray(d.students)) {
        return d;
      }
      return null;
    };

    const results = await Promise.allSettled([
      fetchCandidate(`/api/school-data?${cacheBust}`),
      fetchCandidate(`${GLOBAL_CLOUD_ENDPOINT_1}?${cacheBust}`),
      fetchCandidate(`${GLOBAL_CLOUD_ENDPOINT_2}?${cacheBust}`)
    ]);

    const candidates: any[] = [];
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        candidates.push(r.value);
      }
    });

    if (candidates.length === 0) {
      return { best: null, reachable: false };
    }

    candidates.sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.students?.length || 0) - (a.students?.length || 0);
    });

    const best = { ...candidates[0] };
    best.students = Array.isArray(best.students) ? best.students.filter((s: any) => !isDummyStudent(s)) : [];
    return { best, reachable: true };
  };

  // Push current data to Global Cloud & Local Backup
  const pushCurrentDataToCloud = async (
    override?: Partial<typeof stateRef.current> & { forceReset?: boolean }
  ): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOnline(false);
        setIsCloudConnected(false);
        return false;
      }

      const isForceReset = override?.forceReset === true;
      const cleanOverride = { ...(override || {}) };
      delete cleanOverride.forceReset;

      const newTimestamp = new Date().toISOString();
      const cloudPayload = {
        ...stateRef.current,
        ...cleanOverride,
        updatedAt: newTimestamp
      };

      // Guard against uninitialized empty clients overwriting cloud data
      if (!isForceReset && cloudPayload.students.length === 0 && !hasPendingLocalMutation.current) {
        return false;
      }

      setIsCloudSyncing(true);
      let success = false;
      let serverUpdatedAt = newTimestamp;

      // 1. Primary: Server API (/api/school-data) — verify JSON response (ignore static SPA HTML fallback)
      try {
        const serverBody = isForceReset ? { ...cloudPayload, forceReset: true } : cloudPayload;
        const localRes = await fetchWithTimeout(
          '/api/school-data',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverBody)
          },
          5500
        );
        if (localRes.ok) {
          const text = await localRes.text();
          const parsedLocal = extractCleanJson<any>(text);
          if (parsedLocal?.success === true && !parsedLocal?.preservedExisting) {
            success = true;
            if (parsedLocal.updatedAt) {
              serverUpdatedAt = parsedLocal.updatedAt;
            }
          }
        }
      } catch (localErr) {
        console.warn('Server API sync error:', localErr);
      }

      // 2. Global Cloud Bins (must save permanently online so all devices receive updates)
      const cloudResults = await Promise.allSettled([
        fetchWithTimeout(
          GLOBAL_CLOUD_ENDPOINT_1,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudPayload)
          },
          5000
        ),
        fetchWithTimeout(
          GLOBAL_CLOUD_ENDPOINT_2,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudPayload)
          },
          5000
        )
      ]);

      cloudResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.ok) {
          success = true;
        }
      });

      if (success) {
        hasPendingLocalMutation.current = false;
        setIsOnline(true);
        setIsCloudConnected(true);
        lastKnownServerUpdatedAt.current = serverUpdatedAt;
        setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));
        return true;
      } else {
        setIsCloudConnected(false);
        return false;
      }
    } catch (e) {
      console.warn('Failed to push update to cloud server:', e);
      setIsCloudConnected(false);
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Overlay queued attendance records onto a base attendance list cleanly by (studentId, date)
  const overlayStudentAttendance = (
    baseList: StudentAttendance[],
    incomingRecords: StudentAttendance[]
  ): StudentAttendance[] => {
    const map = new Map<string, StudentAttendance>();
    deduplicateAttendance(baseList).forEach(rec => {
      if (rec && rec.studentId && rec.date) {
        map.set(`${rec.studentId}__${rec.date}`, rec);
      }
    });
    incomingRecords.forEach(rec => {
      if (rec && rec.studentId && rec.date) {
        const key = `${rec.studentId}__${rec.date}`;
        const existing = map.get(key);
        map.set(key, {
          ...rec,
          id: existing?.id || rec.id
        });
      }
    });
    return Array.from(map.values());
  };

  const overlayTeacherAttendance = (
    baseList: TeacherAttendance[],
    incomingRecords: TeacherAttendance[]
  ): TeacherAttendance[] => {
    const map = new Map<string, TeacherAttendance>();
    (Array.isArray(baseList) ? baseList : []).forEach(rec => {
      if (rec && rec.teacherId && rec.date) {
        map.set(`${rec.teacherId}__${rec.date}`, rec);
      }
    });
    incomingRecords.forEach(rec => {
      if (rec && rec.teacherId && rec.date) {
        const key = `${rec.teacherId}__${rec.date}`;
        const existing = map.get(key);
        map.set(key, {
          ...rec,
          id: existing?.id || rec.id
        });
      }
    });
    return Array.from(map.values());
  };

  const overlayExamReports = (
    baseList: StudentExamReport[],
    incomingReports: StudentExamReport[],
    deletedSet?: Set<string>
  ): StudentExamReport[] => {
    const map = new Map<string, StudentExamReport>();
    (Array.isArray(baseList) ? baseList : []).forEach(rep => {
      if (rep && rep.id && (!deletedSet || !deletedSet.has(rep.id))) {
        map.set(rep.id, rep);
      }
    });
    incomingReports.forEach(rep => {
      if (rep && rep.id && (!deletedSet || !deletedSet.has(rep.id))) {
        const existing = map.get(rep.id);
        if (!existing) {
          map.set(rep.id, rep);
        } else {
          const existingTime = new Date(existing.updatedAt || 0).getTime();
          const incomingTime = new Date(rep.updatedAt || 0).getTime();
          map.set(rep.id, incomingTime >= existingTime ? rep : existing);
        }
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  };

  // Flush offline queued attendance & exam reports cleanly onto freshest cloud state without overwriting other teachers
  const flushPendingOfflineSync = async (): Promise<boolean> => {
    const queuedAtt = pendingAttQueueRef.current;
    const queuedTeacherAtt = pendingTeacherAttQueueRef.current;
    const queuedExamReports = pendingExamReportsQueueRef.current;
    const hasGen = pendingGeneralSyncRef.current;
    if (
      queuedAtt.length === 0 &&
      queuedTeacherAtt.length === 0 &&
      queuedExamReports.length === 0 &&
      !hasGen
    ) {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }
    if (isFlushingOfflineRef.current) return false;
    isFlushingOfflineRef.current = true;
    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(3500);
      if (!reachable) {
        setIsCloudConnected(false);
        return false;
      }

      const mergedDeletedIds = Array.from(
        new Set<string>([
          ...(Array.isArray(best?.deletedIds) ? best.deletedIds : []),
          ...stateRef.current.deletedIds
        ])
      ).slice(-500);
      const deletedSet = new Set(mergedDeletedIds);

      const baseStudents =
        best && Array.isArray(best.students) && best.students.length > 0
          ? best.students.filter((s: any) => !isDummyStudent(s) && !deletedSet.has(s.id))
          : stateRef.current.students;
      const baseTeachers =
        best && Array.isArray(best.teachers) && best.teachers.length > 0
          ? best.teachers.filter((t: any) => !deletedSet.has(t.id))
          : stateRef.current.teachers;
      const baseLeaves =
        best && Array.isArray(best.leaves)
          ? best.leaves.filter((l: any) => !deletedSet.has(l.id))
          : stateRef.current.leaves;
      const baseSettings: SystemSettings =
        best && best.settings && typeof best.settings === 'object'
          ? { ...initialSettings, ...best.settings }
          : stateRef.current.settings;
      const baseAtt =
        best && Array.isArray(best.attendance)
          ? best.attendance.filter((a: any) => !isDummyStudent(a) && !deletedSet.has(a.id))
          : stateRef.current.attendance;
      const baseTeacherAtt =
        best && Array.isArray(best.teacherAttendance)
          ? best.teacherAttendance.filter((a: any) => !deletedSet.has(a.id))
          : stateRef.current.teacherAttendance;
      const baseFees =
        best && Array.isArray(best.feeRecords)
          ? best.feeRecords.filter((f: any) => !isDummyStudent(f) && !deletedSet.has(f.id))
          : stateRef.current.feeRecords;
      const baseExamReports =
        best && Array.isArray(best.studentExamReports)
          ? best.studentExamReports.filter((r: any) => !deletedSet.has(r.id))
          : stateRef.current.studentExamReports.filter(r => !deletedSet.has(r.id));

      const mergedAtt = overlayStudentAttendance(baseAtt, queuedAtt);
      const mergedTeacherAtt = overlayTeacherAttendance(baseTeacherAtt, queuedTeacherAtt);
      const mergedExamReports = overlayExamReports(
        baseExamReports,
        [...stateRef.current.studentExamReports, ...queuedExamReports],
        deletedSet
      );
      const reconciledFees = reconcileFeesWithAttendance({
        students: baseStudents,
        feeRecords: baseFees,
        attendance: mergedAtt,
        leaves: baseLeaves,
        settings: baseSettings
      });

      const pushed = await pushCurrentDataToCloud({
        students: baseStudents,
        teachers: baseTeachers,
        leaves: baseLeaves,
        settings: baseSettings,
        attendance: mergedAtt,
        teacherAttendance: mergedTeacherAtt,
        feeRecords: reconciledFees,
        studentExamReports: mergedExamReports,
        deletedIds: mergedDeletedIds
      });

      if (pushed) {
        isApplyingRemoteUpdate.current = true;
        stateRef.current = {
          ...stateRef.current,
          deletedIds: mergedDeletedIds,
          attendance: mergedAtt,
          teacherAttendance: mergedTeacherAtt,
          feeRecords: reconciledFees,
          studentExamReports: mergedExamReports
        };
        setDeletedIds(mergedDeletedIds);
        saveToStorage('deletedIds', mergedDeletedIds);
        setAttendance(mergedAtt);
        saveToStorage('attendance', mergedAtt);
        setTeacherAttendance(mergedTeacherAtt);
        saveToStorage('teacherAttendance', mergedTeacherAtt);
        setFeeRecords(reconciledFees);
        saveToStorage('feeRecords', reconciledFees);
        setStudentExamReports(mergedExamReports);
        saveToStorage('studentExamReports', mergedExamReports);
        persistPendingQueues([], [], false, []);
        setTimeout(() => {
          isApplyingRemoteUpdate.current = false;
        }, 200);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Offline queue flush failed:', err);
      return false;
    } finally {
      isFlushingOfflineRef.current = false;
    }
  };

  // Pull data from Global Cloud Server with HTML-safe JSON extraction and tombstone-aware merge
  const pullFromCloudDatabase = async (): Promise<Student[]> => {
    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(4000);
      if (!reachable || !best) {
        setIsCloudConnected(false);
        return stateRef.current.students.filter(s => !isDummyStudent(s));
      }

      setIsOnline(true);
      setIsCloudConnected(true);
      const data = best;

      const currentLocal = stateRef.current;
      const sameServerTimestamp =
        Boolean(data.updatedAt) &&
        Boolean(lastKnownServerUpdatedAt.current) &&
        data.updatedAt === lastKnownServerUpdatedAt.current;
      const countsMatch =
        data.students.length === currentLocal.students.length &&
        (Array.isArray(data.feeRecords) ? data.feeRecords.length : 0) === currentLocal.feeRecords.length &&
        (Array.isArray(data.attendance) ? data.attendance.length : 0) === currentLocal.attendance.length &&
        (Array.isArray(data.teacherAttendance) ? data.teacherAttendance.length : 0) === currentLocal.teacherAttendance.length &&
        (Array.isArray(data.studentExamReports) ? data.studentExamReports.length : 0) === currentLocal.studentExamReports.length &&
        (Array.isArray(data.leaves) ? data.leaves.length : 0) === currentLocal.leaves.length &&
        (Array.isArray(data.dailyReports) ? data.dailyReports.length : 0) === currentLocal.dailyReports.length &&
        (Array.isArray(data.tests) ? data.tests.length : 0) === currentLocal.tests.length &&
        (Array.isArray(data.testResults) ? data.testResults.length : 0) === currentLocal.testResults.length &&
        (Array.isArray(data.notices) ? data.notices.length : 0) === currentLocal.notices.length &&
        (Array.isArray(data.onlineAdmissions) ? data.onlineAdmissions.length : 0) === currentLocal.onlineAdmissions.length;

      if (
        sameServerTimestamp &&
        countsMatch &&
        hasInitializedFromCloud.current &&
        !hasPendingLocalMutation.current &&
        pendingAttQueueRef.current.length === 0 &&
        pendingTeacherAttQueueRef.current.length === 0 &&
        pendingExamReportsQueueRef.current.length === 0
      ) {
        return stateRef.current.students.filter(s => !isDummyStudent(s));
      }
      const mergedDeletedIds = Array.from(
        new Set<string>([
          ...(Array.isArray(data.deletedIds) ? data.deletedIds : []),
          ...(Array.isArray(currentLocal.deletedIds) ? currentLocal.deletedIds : [])
        ])
      ).slice(-500);
      const deletedSet = new Set(mergedDeletedIds);

      const mergeEntities = <T extends { id: string }>(
        serverItems?: T[],
        localItems?: T[],
        filterFn?: (item: T) => boolean
      ): T[] => {
        const cleanServer = Array.isArray(serverItems)
          ? serverItems.filter(item => item && item.id && !deletedSet.has(item.id) && !isDummyStudent(item) && (!filterFn || filterFn(item)))
          : [];
        const cleanLocal = Array.isArray(localItems)
          ? localItems.filter(item => item && item.id && !deletedSet.has(item.id) && !isDummyStudent(item) && (!filterFn || filterFn(item)))
          : [];

        const map = new Map<string, T>();
        cleanServer.forEach(item => map.set(item.id, item));
        // Keep local-only items when there is a pending local mutation or server didn't have them yet
        cleanLocal.forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          } else if (hasPendingLocalMutation.current) {
            map.set(item.id, item);
          }
        });
        return Array.from(map.values());
      };

      const mergeTeachers = (serverTeachers?: Teacher[], localTeachers?: Teacher[]): Teacher[] => {
        const cleanServer = Array.isArray(serverTeachers) ? serverTeachers.filter(t => t && t.id && !deletedSet.has(t.id)) : [];
        const cleanLocal = Array.isArray(localTeachers) ? localTeachers.filter(t => t && t.id && !deletedSet.has(t.id)) : [];
        const map = new Map<string, Teacher>();
        if (cleanServer.length === 0 && cleanLocal.length === 0) {
          initialTeachers.forEach(t => { if (!deletedSet.has(t.id)) map.set(t.id, t); });
        }
        cleanServer.forEach(t => map.set(t.id, t));
        cleanLocal.forEach(t => {
          if (!map.has(t.id) || hasPendingLocalMutation.current) map.set(t.id, t);
        });
        return Array.from(map.values());
      };

      const mergeNotices = (serverNotices?: Notice[], localNotices?: Notice[]): Notice[] => {
        const cleanServer = Array.isArray(serverNotices) ? serverNotices.filter(n => n && n.id && !deletedSet.has(n.id)) : [];
        const cleanLocal = Array.isArray(localNotices) ? localNotices.filter(n => n && n.id && !deletedSet.has(n.id)) : [];
        const map = new Map<string, Notice>();
        if (cleanServer.length === 0 && cleanLocal.length === 0) {
          initialNotices.forEach(n => { if (!deletedSet.has(n.id)) map.set(n.id, n); });
        }
        cleanServer.forEach(n => map.set(n.id, n));
        cleanLocal.forEach(n => {
          if (!map.has(n.id) || hasPendingLocalMutation.current) map.set(n.id, n);
        });
        return Array.from(map.values());
      };

      const mergedStudents = mergeEntities<Student>(data.students, currentLocal.students);
      const mergedTeachers = mergeTeachers(data.teachers, currentLocal.teachers);
      let mergedAttendance = deduplicateAttendance(mergeEntities<StudentAttendance>(data.attendance, currentLocal.attendance));
      let mergedTeacherAttendance = mergeEntities<TeacherAttendance>(data.teacherAttendance, currentLocal.teacherAttendance);

      if (pendingAttQueueRef.current.length > 0) {
        mergedAttendance = overlayStudentAttendance(mergedAttendance, pendingAttQueueRef.current);
      }
      if (pendingTeacherAttQueueRef.current.length > 0) {
        mergedTeacherAttendance = overlayTeacherAttendance(mergedTeacherAttendance, pendingTeacherAttQueueRef.current);
      }

      const mergedLeaves = mergeEntities<LeaveRequest>(data.leaves, currentLocal.leaves);
      const rawMergedFees = mergeEntities<FeeRecord>(data.feeRecords, currentLocal.feeRecords);
      const mergedReports = mergeEntities<DailyReport>(data.dailyReports, currentLocal.dailyReports);
      const mergedTests = mergeEntities<Test>(data.tests, currentLocal.tests);
      const mergedTestResults = mergeEntities<TestResult>(data.testResults, currentLocal.testResults);
      let mergedExamReports = overlayExamReports(
        Array.isArray(data.studentExamReports) ? data.studentExamReports : [],
        currentLocal.studentExamReports,
        deletedSet
      );
      if (pendingExamReportsQueueRef.current.length > 0) {
        mergedExamReports = overlayExamReports(
          mergedExamReports,
          pendingExamReportsQueueRef.current,
          deletedSet
        );
      }
      const mergedNotices = mergeNotices(data.notices, currentLocal.notices);
      const mergedAdmissions = mergeEntities<OnlineAdmission>(data.onlineAdmissions, currentLocal.onlineAdmissions);
      const mergedSalaryTx = mergeEntities<SalaryTransaction>(data.salaryTransactions, currentLocal.salaryTransactions);
      const mergedSalaryPmts = mergeEntities<TeacherSalaryPayment>(data.teacherSalaryPayments, currentLocal.teacherSalaryPayments);

      const mergedSettings: SystemSettings =
        data.settings && typeof data.settings === 'object'
          ? {
              ...initialSettings,
              ...(hasPendingLocalMutation.current ? data.settings : {}),
              ...(!hasPendingLocalMutation.current ? data.settings : currentLocal.settings)
            }
          : currentLocal.settings;

      const mergedFees = reconcileFeesWithAttendance({
        students: mergedStudents,
        feeRecords: rawMergedFees,
        attendance: mergedAttendance,
        leaves: mergedLeaves,
        settings: mergedSettings
      });

      isApplyingRemoteUpdate.current = true;
      lastKnownServerUpdatedAt.current = data.updatedAt || new Date().toISOString();
      hasInitializedFromCloud.current = true;
      setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));

      stateRef.current = {
        ...stateRef.current,
        deletedIds: mergedDeletedIds,
        students: mergedStudents,
        teachers: mergedTeachers,
        attendance: mergedAttendance,
        teacherAttendance: mergedTeacherAttendance,
        leaves: mergedLeaves,
        feeRecords: mergedFees,
        dailyReports: mergedReports,
        tests: mergedTests,
        testResults: mergedTestResults,
        studentExamReports: mergedExamReports,
        notices: mergedNotices,
        onlineAdmissions: mergedAdmissions,
        salaryTransactions: mergedSalaryTx,
        teacherSalaryPayments: mergedSalaryPmts,
        settings: mergedSettings
      };

      setDeletedIds(mergedDeletedIds);
      saveToStorage('deletedIds', mergedDeletedIds);

      setStudents(mergedStudents);
      saveToStorage('students', mergedStudents);

      setTeachers(mergedTeachers);
      saveToStorage('teachers', mergedTeachers);

      setAttendance(mergedAttendance);
      saveToStorage('attendance', mergedAttendance);

      setTeacherAttendance(mergedTeacherAttendance);
      saveToStorage('teacherAttendance', mergedTeacherAttendance);

      setLeaves(mergedLeaves);
      saveToStorage('leaves', mergedLeaves);

      setFeeRecords(mergedFees);
      saveToStorage('feeRecords', mergedFees);

      setDailyReports(mergedReports);
      saveToStorage('dailyReports', mergedReports);

      setTests(mergedTests);
      saveToStorage('tests', mergedTests);

      setTestResults(mergedTestResults);
      saveToStorage('testResults', mergedTestResults);

      setStudentExamReports(mergedExamReports);
      saveToStorage('studentExamReports', mergedExamReports);

      setNotices(mergedNotices);
      saveToStorage('notices', mergedNotices);

      setOnlineAdmissions(mergedAdmissions);
      saveToStorage('admissions', mergedAdmissions);

      setSalaryTransactions(mergedSalaryTx);
      saveToStorage('salaryTransactions', mergedSalaryTx);

      setTeacherSalaryPayments(mergedSalaryPmts);
      saveToStorage('teacherSalaryPayments', mergedSalaryPmts);

      setSettings(mergedSettings);
      saveToStorage('settings', mergedSettings);

      if (mergedStudents.length > (data.students?.length || 0) || hasPendingLocalMutation.current) {
        pushCurrentDataToCloud({
          students: mergedStudents,
          teachers: mergedTeachers,
          attendance: mergedAttendance,
          teacherAttendance: mergedTeacherAttendance,
          leaves: mergedLeaves,
          feeRecords: mergedFees,
          dailyReports: mergedReports,
          tests: mergedTests,
          testResults: mergedTestResults,
          studentExamReports: mergedExamReports,
          notices: mergedNotices,
          onlineAdmissions: mergedAdmissions,
          salaryTransactions: mergedSalaryTx,
          teacherSalaryPayments: mergedSalaryPmts,
          settings: mergedSettings,
          deletedIds: mergedDeletedIds
        });
      }

      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 300);

      return mergedStudents;
    } catch (e) {
      console.warn('Could not sync with cloud server:', e);
      setIsCloudConnected(false);
      return stateRef.current.students.filter(s => !isDummyStudent(s));
    }
  };

  // Force manual cloud sync action
  const forceSyncAllToCloud = async (): Promise<{ success: boolean; studentCount: number; message: string }> => {
    hasPendingLocalMutation.current = true;
    const ok = await pushCurrentDataToCloud();
    const count = stateRef.current.students.length;
    if (ok) {
      return {
        success: true,
        studentCount: count,
        message: `تمام ${count} طلباء اور اسکول کا مکمل ریکارڈ لائیو کلاؤڈ پر محفوظ ہو گیا ہے! اب تمام دوسرے موبائلز اور ٹیچرز کو فوری شو ہوں گے۔`
      };
    }
    return {
      success: false,
      studentCount: count,
      message: 'کلاؤڈ سرور سے رابطہ نہیں ہو سکا، براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔'
    };
  };

  const syncNowWithCloud = async (): Promise<Student[]> => {
    if (
      pendingAttQueueRef.current.length > 0 ||
      pendingTeacherAttQueueRef.current.length > 0 ||
      pendingExamReportsQueueRef.current.length > 0 ||
      pendingGeneralSyncRef.current
    ) {
      await flushPendingOfflineSync();
    } else if (hasPendingLocalMutation.current) {
      await pushCurrentDataToCloud();
    }
    return await pullFromCloudDatabase();
  };

  // Sync to Cloud Server only after initial cloud pull and when an actual local mutation occurred
  useEffect(() => {
    if (isApplyingRemoteUpdate.current) return;
    if (!hasInitializedFromCloud.current || !hasPendingLocalMutation.current) return;

    const timer = setTimeout(() => {
      pushCurrentDataToCloud();
    }, 800);

    return () => clearTimeout(timer);
  }, [
    students,
    teachers,
    attendance,
    teacherAttendance,
    leaves,
    feeRecords,
    dailyReports,
    tests,
    testResults,
    studentExamReports,
    notices,
    onlineAdmissions,
    settings,
    salaryTransactions,
    teacherSalaryPayments
  ]);

  // Periodic real-time polling, focus pull & automatic offline-to-online recovery sync
  useEffect(() => {
    const runCycle = async () => {
      if (
        pendingAttQueueRef.current.length > 0 ||
        pendingTeacherAttQueueRef.current.length > 0 ||
        pendingExamReportsQueueRef.current.length > 0 ||
        pendingGeneralSyncRef.current
      ) {
        await flushPendingOfflineSync();
      }
      await pullFromCloudDatabase();
    };

    runCycle();

    const interval = setInterval(() => {
      runCycle();
    }, 3000);

    const onOnline = () => {
      setIsOnline(true);
      flushPendingOfflineSync().then(() => pullFromCloudDatabase());
    };
    const onOffline = () => {
      setIsOnline(false);
      setIsCloudConnected(false);
    };
    const onFocus = () => runCycle();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runCycle();
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Manual hard reset only when administrator clicks 'resetAllDataToZero' in Settings
  const resetAllDataToZero = () => {
    hasPendingLocalMutation.current = true;
    setStudents([]);
    setAttendance([]);
    setFeeRecords([]);
    setDailyReports([]);
    setTests([]);
    setTestResults([]);
    setLeaves([]);
    setOnlineAdmissions([]);
    setSalaryTransactions([]);
    try {
      const keys = ['students', 'attendance', 'feeRecords', 'dailyReports', 'tests', 'testResults', 'leaves', 'admissions', 'salaryTransactions'];
      keys.forEach(k => {
        localStorage.removeItem(`bss_v7_${k}`);
        localStorage.removeItem(`bss_v6_${k}`);
        localStorage.removeItem(`bss_v5_${k}`);
        localStorage.removeItem(`bss_v4_${k}`);
      });
    } catch (e) {
      console.error(e);
    }
    pushCurrentDataToCloud({
      forceReset: true,
      students: [],
      attendance: [],
      feeRecords: [],
      dailyReports: [],
      tests: [],
      testResults: [],
      leaves: [],
      onlineAdmissions: [],
      salaryTransactions: []
    });
  };

  // Auth
  const loginAdmin = (password: string): boolean => {
    const clean = (password || '').trim();
    if (!clean) return false;
    const configured = (stateRef.current.settings.adminPassword || '').trim();
    if (clean === configured || (!configured && clean === 'Ahmad@1')) {
      setIsAdminLoggedIn(true);
      setCurrentTeacherId(null);
      setCurrentParentStudentId(null);
      setCurrentPortal('ADMIN_PORTAL');
      return true;
    }
    return false;
  };

  const loginTeacher = (teacherId: string, password: string): boolean => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return false;

    const cleanPass = (password || '').trim();
    if (!cleanPass) return false;

    const personal = (teacher.personalPassword || '').trim();
    const globalPass = (settings.teacherPassword || '').trim();

    const matchesPersonal = personal ? cleanPass === personal : false;
    const matchesGlobal = globalPass ? cleanPass === globalPass : false;

    if (!matchesPersonal && !matchesGlobal) {
      return false; // REJECT invalid password!
    }

    setCurrentTeacherId(teacherId);
    setIsAdminLoggedIn(false);
    setCurrentParentStudentId(null);
    setCurrentPortal('TEACHER_PORTAL');
    return true;
  };

  const loginOrCreateTeacherByName = (name: string, password: string): boolean => {
    const cleanName = name.trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!cleanName || !cleanPass) return false;

    const existing = teachers.find(t => t.name.toLowerCase() === cleanName);
    if (existing) {
      const personal = (existing.personalPassword || '').trim();
      const globalPass = (settings.teacherPassword || '').trim();
      const matchesPersonal = personal ? cleanPass === personal : false;
      const matchesGlobal = globalPass ? cleanPass === globalPass : false;

      if (matchesPersonal || matchesGlobal) {
        setCurrentTeacherId(existing.id);
        setIsAdminLoggedIn(false);
        setCurrentParentStudentId(null);
        setCurrentPortal('TEACHER_PORTAL');
        return true;
      }
      return false;
    }

    return false;
  };

  const loginParent = (identifier: string, className?: string): Student | null => {
    const clean = normalizeDigits(identifier).trim().toLowerCase();
    if (!clean) return null;
    const cleanNum = clean.replace(/^0+/, '');

    const valid = stateRef.current.students.filter(s => !isDummyStudent(s));
    const isNumeric = /^\d+$/.test(clean);

    let student: Student | undefined;

    if (className && className !== 'All') {
      student = valid.find(s => {
        if (s.className.toLowerCase().trim() !== className.toLowerCase().trim()) return false;
        const rollClean = normalizeDigits(s.rollNo || '').trim().toLowerCase();
        const rollNum = rollClean.replace(/^0+/, '');
        const admClean = normalizeDigits(s.admissionNo || '').trim().toLowerCase();
        if (isNumeric) {
          return rollClean === clean || (cleanNum !== '' && rollNum === cleanNum) || admClean === clean;
        } else {
          return admClean === clean || s.name.toLowerCase().trim() === clean;
        }
      });
    } else {
      student = valid.find(s => {
        const rollClean = normalizeDigits(s.rollNo || '').trim().toLowerCase();
        const rollNum = rollClean.replace(/^0+/, '');
        const admClean = normalizeDigits(s.admissionNo || '').trim().toLowerCase();
        if (isNumeric) {
          return rollClean === clean || (cleanNum !== '' && rollNum === cleanNum) || admClean === clean;
        } else {
          return admClean === clean || s.name.toLowerCase().trim() === clean;
        }
      });
    }

    if (student) {
      setCurrentParentStudentId(student.id);
      setIsAdminLoggedIn(false);
      setCurrentTeacherId(null);
      setCurrentPortal('PARENT_PORTAL');
      return student;
    }
    return null;
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    setCurrentTeacherId(null);
    setCurrentParentStudentId(null);
    setCurrentPortal('PUBLIC_WEBSITE');
  };

  // Student CRUD with Immediate Verified Cloud Sync & Duplicate Prevention
  const buildNewStudentState = (stData: Omit<Student, 'id'>) => {
    const cleanRoll = normalizeDigits(stData.rollNo).trim();
    const cleanRollNum = cleanRoll.replace(/^0+/, '');
    const duplicate = stateRef.current.students.find(s => {
      if (s.className.toLowerCase().trim() !== stData.className.toLowerCase().trim()) return false;
      const existingRoll = normalizeDigits(s.rollNo || '').trim().replace(/^0+/, '');
      if (cleanRollNum && existingRoll && existingRoll === cleanRollNum) return true;
      return (
        s.name.toLowerCase().trim() === stData.name.toLowerCase().trim() &&
        s.fatherName.toLowerCase().trim() === stData.fatherName.toLowerCase().trim()
      );
    });
    if (duplicate) {
      return { duplicate, newStudent: null as Student | null, updatedStudents: stateRef.current.students, updatedFees: stateRef.current.feeRecords };
    }

    const nowTs = Date.now();
    const feeAmount = stData.monthlyFee || getDefaultMonthlyFee(stData.className);
    const newStudent: Student = {
      ...stData,
      rollNo: cleanRoll,
      monthlyFee: feeAmount,
      id: `s-${nowTs}-${Math.random().toString(36).substring(2, 6)}`
    };
    const updatedStudents = [newStudent, ...stateRef.current.students];

    const activeMonth = stateRef.current.feeRecords[0]?.month || getCurrentMonthLabel();
    const newFeeRecord: FeeRecord = {
      id: `fee-${nowTs}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      fatherName: newStudent.fatherName,
      className: newStudent.className,
      month: activeMonth,
      tuitionFee: feeAmount,
      absentDays: 0,
      leaveDays: 0,
      fineAmount: 0,
      totalPayable: feeAmount,
      paidAmount: 0,
      balanceRemaining: feeAmount,
      status: 'Unpaid',
      receiptNo: `REC-BSS-${String(nowTs).slice(-4)}`
    };
    const updatedFees = [newFeeRecord, ...stateRef.current.feeRecords];
    return { duplicate: null, newStudent, updatedStudents, updatedFees };
  };

  const addStudent = (stData: Omit<Student, 'id'>): Student => {
    hasPendingLocalMutation.current = true;
    const { duplicate, newStudent, updatedStudents, updatedFees } = buildNewStudentState(stData);
    if (duplicate || !newStudent) {
      return duplicate!;
    }

    stateRef.current = { ...stateRef.current, students: updatedStudents, feeRecords: updatedFees };
    setStudents(updatedStudents);
    saveToStorage('students', updatedStudents);
    setFeeRecords(updatedFees);
    saveToStorage('feeRecords', updatedFees);

    pushCurrentDataToCloud({
      students: updatedStudents,
      feeRecords: updatedFees
    });

    return newStudent;
  };

  const addStudentAsync = async (
    stData: Omit<Student, 'id'>
  ): Promise<{ success: boolean; student?: Student; error?: string }> => {
    const prevStudents = stateRef.current.students;
    const prevFees = stateRef.current.feeRecords;
    const { duplicate, newStudent, updatedStudents, updatedFees } = buildNewStudentState(stData);
    if (duplicate || !newStudent) {
      return {
        success: false,
        error: `کلاس ${stData.className} میں رول نمبر ${stData.rollNo} یا یہی طالب علم (${duplicate?.name}) پہلے سے موجود ہے۔`
      };
    }

    hasPendingLocalMutation.current = true;
    stateRef.current = { ...stateRef.current, students: updatedStudents, feeRecords: updatedFees };
    setStudents(updatedStudents);
    saveToStorage('students', updatedStudents);
    setFeeRecords(updatedFees);
    saveToStorage('feeRecords', updatedFees);

    const saved = await pushCurrentDataToCloud({
      students: updatedStudents,
      feeRecords: updatedFees
    });

    if (!saved) {
      hasPendingLocalMutation.current = false;
      stateRef.current = { ...stateRef.current, students: prevStudents, feeRecords: prevFees };
      setStudents(prevStudents);
      saveToStorage('students', prevStudents);
      setFeeRecords(prevFees);
      saveToStorage('feeRecords', prevFees);
      return {
        success: false,
        error: 'آن لائن کلاؤڈ سرور سے رابطہ نہیں ہو سکا اور طالب علم سرور پر محفوظ نہیں ہوا۔ براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔'
      };
    }

    return { success: true, student: newStudent };
  };

  const applyUpdateStudent = (updated: Student) => {
    hasPendingLocalMutation.current = true;
    const prev = stateRef.current.students.find(s => s.id === updated.id);
    const normalizedRoll = normalizeDigits(updated.rollNo).trim();
    const finalStudent: Student = { ...updated, rollNo: normalizedRoll };
    let updatedFees = [...stateRef.current.feeRecords];

    const classChanged = prev && prev.className !== updated.className;
    if (classChanged) {
      const newClassFee = getDefaultMonthlyFee(updated.className);
      finalStudent.monthlyFee = newClassFee;
    }

    const effectiveTuition = finalStudent.monthlyFee || getDefaultMonthlyFee(finalStudent.className);

    updatedFees = updatedFees.map(f => {
      if (f.studentId !== updated.id) return f;
      if (f.paidAmount === 0) {
        const fine = f.fineAmount || 0;
        const newTuition = classChanged || updated.monthlyFee !== prev?.monthlyFee ? effectiveTuition : f.tuitionFee;
        const total = newTuition + fine;
        return {
          ...f,
          studentName: finalStudent.name,
          fatherName: finalStudent.fatherName,
          className: finalStudent.className,
          tuitionFee: newTuition,
          totalPayable: total,
          balanceRemaining: Math.max(0, total - f.paidAmount)
        };
      } else {
        // Strictly preserve existing fee payment history & settled amounts
        return {
          ...f,
          studentName: finalStudent.name,
          fatherName: finalStudent.fatherName,
          className: finalStudent.className
        };
      }
    });

    const updatedList = stateRef.current.students.map(s => (s.id === finalStudent.id ? finalStudent : s));
    const updatedAttendance = stateRef.current.attendance.map(a =>
      a.studentId === finalStudent.id
        ? { ...a, studentName: finalStudent.name, className: finalStudent.className }
        : a
    );
    const updatedExamReports = stateRef.current.studentExamReports.map(r =>
      r.studentId === finalStudent.id
        ? {
            ...r,
            studentName: finalStudent.name,
            fatherName: finalStudent.fatherName,
            className: finalStudent.className,
            rollNo: finalStudent.rollNo,
            admissionNo: finalStudent.admissionNo,
            updatedAt: new Date().toISOString()
          }
        : r
    );
    const updatedTestResults = stateRef.current.testResults.map(tr =>
      tr.studentId === finalStudent.id
        ? { ...tr, studentName: finalStudent.name, className: finalStudent.className }
        : tr
    );
    const updatedDailyReports = stateRef.current.dailyReports.map(dr =>
      dr.studentId === finalStudent.id
        ? { ...dr, studentName: finalStudent.name, className: finalStudent.className }
        : dr
    );

    const reconciledFees = reconcileFeesWithAttendance({
      students: updatedList,
      feeRecords: updatedFees,
      attendance: updatedAttendance,
      leaves: stateRef.current.leaves,
      settings: stateRef.current.settings
    });

    stateRef.current = {
      ...stateRef.current,
      students: updatedList,
      feeRecords: reconciledFees,
      attendance: updatedAttendance,
      studentExamReports: updatedExamReports,
      testResults: updatedTestResults,
      dailyReports: updatedDailyReports
    };
    setStudents(updatedList);
    saveToStorage('students', updatedList);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);
    setAttendance(updatedAttendance);
    saveToStorage('attendance', updatedAttendance);
    setStudentExamReports(updatedExamReports);
    saveToStorage('studentExamReports', updatedExamReports);
    setTestResults(updatedTestResults);
    saveToStorage('testResults', updatedTestResults);
    setDailyReports(updatedDailyReports);
    saveToStorage('dailyReports', updatedDailyReports);

    return {
      finalStudent,
      updatedList,
      reconciledFees,
      updatedAttendance,
      updatedExamReports,
      updatedTestResults,
      updatedDailyReports
    };
  };

  const updateStudent = (updated: Student) => {
    const {
      updatedList,
      reconciledFees,
      updatedAttendance,
      updatedExamReports,
      updatedTestResults,
      updatedDailyReports
    } = applyUpdateStudent(updated);
    pushCurrentDataToCloud({
      students: updatedList,
      feeRecords: reconciledFees,
      attendance: updatedAttendance,
      studentExamReports: updatedExamReports,
      testResults: updatedTestResults,
      dailyReports: updatedDailyReports
    });
  };

  const updateStudentAsync = async (updated: Student): Promise<{ success: boolean; error?: string }> => {
    const prevSnapshot = { ...stateRef.current };
    const {
      finalStudent,
      updatedList,
      reconciledFees,
      updatedAttendance,
      updatedExamReports,
      updatedTestResults,
      updatedDailyReports
    } = applyUpdateStudent(updated);

    // Merge onto freshest cloud snapshot so concurrent teacher updates are never lost
    let payloadToPush: Partial<typeof stateRef.current> = {
      students: updatedList,
      feeRecords: reconciledFees,
      attendance: updatedAttendance,
      studentExamReports: updatedExamReports,
      testResults: updatedTestResults,
      dailyReports: updatedDailyReports
    };

    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(2800);
      if (reachable && best && Array.isArray(best.students) && best.students.length > 0) {
        const mergedStudents = best.students
          .filter((s: any) => !isDummyStudent(s))
          .map((s: Student) => (s.id === finalStudent.id ? finalStudent : s));
        if (!mergedStudents.some((s: Student) => s.id === finalStudent.id)) {
          mergedStudents.unshift(finalStudent);
        }
        const mergedAtt = (Array.isArray(best.attendance) ? best.attendance : updatedAttendance).map(
          (a: StudentAttendance) =>
            a.studentId === finalStudent.id
              ? { ...a, studentName: finalStudent.name, className: finalStudent.className }
              : a
        );
        const mergedExamReps = (Array.isArray(best.studentExamReports) ? best.studentExamReports : updatedExamReports).map(
          (r: StudentExamReport) =>
            r.studentId === finalStudent.id
              ? {
                  ...r,
                  studentName: finalStudent.name,
                  fatherName: finalStudent.fatherName,
                  className: finalStudent.className,
                  rollNo: finalStudent.rollNo,
                  admissionNo: finalStudent.admissionNo,
                  updatedAt: new Date().toISOString()
                }
              : r
        );
        const mergedTestRes = (Array.isArray(best.testResults) ? best.testResults : updatedTestResults).map(
          (tr: TestResult) =>
            tr.studentId === finalStudent.id
              ? { ...tr, studentName: finalStudent.name, className: finalStudent.className }
              : tr
        );
        const mergedDailyReps = (Array.isArray(best.dailyReports) ? best.dailyReports : updatedDailyReports).map(
          (dr: DailyReport) =>
            dr.studentId === finalStudent.id
              ? { ...dr, studentName: finalStudent.name, className: finalStudent.className }
              : dr
        );
        const mergedFees = reconcileFeesWithAttendance({
          students: mergedStudents,
          feeRecords: Array.isArray(best.feeRecords) ? best.feeRecords : reconciledFees,
          attendance: mergedAtt,
          leaves: Array.isArray(best.leaves) ? best.leaves : stateRef.current.leaves,
          settings: best.settings ? { ...initialSettings, ...best.settings } : stateRef.current.settings
        });

        payloadToPush = {
          students: mergedStudents,
          feeRecords: mergedFees,
          attendance: mergedAtt,
          studentExamReports: mergedExamReps,
          testResults: mergedTestRes,
          dailyReports: mergedDailyReps
        };
      }
    } catch {
      // Fall back to local merged state
    }

    const saved = await pushCurrentDataToCloud(payloadToPush);
    if (!saved) {
      hasPendingLocalMutation.current = false;
      stateRef.current = prevSnapshot;
      setStudents(prevSnapshot.students);
      saveToStorage('students', prevSnapshot.students);
      setFeeRecords(prevSnapshot.feeRecords);
      saveToStorage('feeRecords', prevSnapshot.feeRecords);
      setAttendance(prevSnapshot.attendance);
      saveToStorage('attendance', prevSnapshot.attendance);
      setStudentExamReports(prevSnapshot.studentExamReports);
      saveToStorage('studentExamReports', prevSnapshot.studentExamReports);
      setTestResults(prevSnapshot.testResults);
      saveToStorage('testResults', prevSnapshot.testResults);
      setDailyReports(prevSnapshot.dailyReports);
      saveToStorage('dailyReports', prevSnapshot.dailyReports);
      return {
        success: false,
        error: 'تبدیلیاں آن لائن سرور پر محفوظ نہیں ہو سکیں۔ براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔'
      };
    }

    stateRef.current = { ...stateRef.current, ...payloadToPush };
    if (payloadToPush.students) { setStudents(payloadToPush.students); saveToStorage('students', payloadToPush.students); }
    if (payloadToPush.feeRecords) { setFeeRecords(payloadToPush.feeRecords); saveToStorage('feeRecords', payloadToPush.feeRecords); }
    if (payloadToPush.attendance) { setAttendance(payloadToPush.attendance); saveToStorage('attendance', payloadToPush.attendance); }
    if (payloadToPush.studentExamReports) { setStudentExamReports(payloadToPush.studentExamReports); saveToStorage('studentExamReports', payloadToPush.studentExamReports); }
    if (payloadToPush.testResults) { setTestResults(payloadToPush.testResults); saveToStorage('testResults', payloadToPush.testResults); }
    if (payloadToPush.dailyReports) { setDailyReports(payloadToPush.dailyReports); saveToStorage('dailyReports', payloadToPush.dailyReports); }

    return { success: true };
  };

  const deleteStudent = (id: string) => {
    hasPendingLocalMutation.current = true;
    const removedFeeIds = stateRef.current.feeRecords.filter(f => f.studentId === id).map(f => f.id);
    const removedAttIds = stateRef.current.attendance.filter(a => a.studentId === id).map(a => a.id);
    const nextDeleted = recordDeletedIds([id, ...removedFeeIds, ...removedAttIds]);

    const updatedList = stateRef.current.students.filter(s => s.id !== id);
    const updatedFees = stateRef.current.feeRecords.filter(f => f.studentId !== id);
    const updatedAtt = stateRef.current.attendance.filter(a => a.studentId !== id);

    setStudents(updatedList);
    saveToStorage('students', updatedList);
    setFeeRecords(updatedFees);
    saveToStorage('feeRecords', updatedFees);
    setAttendance(updatedAtt);
    saveToStorage('attendance', updatedAtt);

    pushCurrentDataToCloud({
      students: updatedList,
      feeRecords: updatedFees,
      attendance: updatedAtt,
      deletedIds: nextDeleted
    });
  };

  const toggleStudentActive = (id: string) => {
    hasPendingLocalMutation.current = true;
    const updatedList = stateRef.current.students.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setStudents(updatedList);
    saveToStorage('students', updatedList);
    pushCurrentDataToCloud({ students: updatedList });
  };

  const purgePlaceholderStudents = (): number => {
    const realOnly = stateRef.current.students.filter(s => !isDummyStudent(s));
    setStudents(realOnly);
    saveToStorage('students', realOnly);

    const realFees = stateRef.current.feeRecords.filter(f => !isDummyStudent(f));
    setFeeRecords(realFees);
    saveToStorage('feeRecords', realFees);

    const realAtt = stateRef.current.attendance.filter(a => !isDummyStudent(a));
    setAttendance(realAtt);
    saveToStorage('attendance', realAtt);

    pushCurrentDataToCloud({
      students: realOnly,
      feeRecords: realFees,
      attendance: realAtt
    });

    return realOnly.length;
  };

  // Teacher CRUD with immediate storage and cloud sync
  const addTeacher = (tData: Omit<Teacher, 'id' | 'allowances' | 'deductions'>): Teacher => {
    hasPendingLocalMutation.current = true;
    const newTeacher: Teacher = {
      ...tData,
      id: `t-${Date.now()}`,
      allowances: 0,
      deductions: 0
    };
    const updated = [...stateRef.current.teachers, newTeacher];
    setTeachers(updated);
    saveToStorage('teachers', updated);
    pushCurrentDataToCloud({ teachers: updated });
    return newTeacher;
  };

  const updateTeacher = (updated: Teacher) => {
    hasPendingLocalMutation.current = true;
    const updatedList = stateRef.current.teachers.map(t => (t.id === updated.id ? updated : t));
    setTeachers(updatedList);
    saveToStorage('teachers', updatedList);
    pushCurrentDataToCloud({ teachers: updatedList });
  };

  const deleteTeacher = (id: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([id]);
    const updatedList = stateRef.current.teachers.filter(t => t.id !== id);
    setTeachers(updatedList);
    saveToStorage('teachers', updatedList);
    pushCurrentDataToCloud({ teachers: updatedList, deletedIds: nextDeleted });
  };

  const adjustTeacherSalary = (
    teacherId: string,
    amount: number,
    type: 'Addition' | 'Deduction',
    reason: string,
    month: string = getCurrentMonthLabel()
  ) => {
    hasPendingLocalMutation.current = true;
    const teacher = stateRef.current.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const updatedTeachers = stateRef.current.teachers.map(t => {
      if (t.id === teacherId) {
        if (type === 'Addition') {
          return { ...t, allowances: (t.allowances || 0) + amount };
        } else {
          return { ...t, deductions: (t.deductions || 0) + amount };
        }
      }
      return t;
    });

    const newTx: SalaryTransaction = {
      id: `sal-${Date.now()}`,
      teacherId,
      teacherName: teacher.name,
      month,
      amount,
      type,
      reason,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedTx = [newTx, ...stateRef.current.salaryTransactions];

    setTeachers(updatedTeachers);
    setSalaryTransactions(updatedTx);
    saveToStorage('teachers', updatedTeachers);
    saveToStorage('salaryTransactions', updatedTx);
    pushCurrentDataToCloud({ teachers: updatedTeachers, salaryTransactions: updatedTx });
  };

  const setTeacherPassword = (teacherId: string, newPassword: string) => {
    hasPendingLocalMutation.current = true;
    const updated = stateRef.current.teachers.map(t =>
      t.id === teacherId ? { ...t, personalPassword: newPassword.trim() } : t
    );
    setTeachers(updated);
    saveToStorage('teachers', updated);
    pushCurrentDataToCloud({ teachers: updated });
  };

  const toggleTeacherSalaryPayment = (teacherId: string, month: string, amount: number) => {
    hasPendingLocalMutation.current = true;
    const today = new Date().toISOString().split('T')[0];
    const prev = [...stateRef.current.teacherSalaryPayments];
    const idx = prev.findIndex(p => p.teacherId === teacherId && p.month === month);
    let updated: TeacherSalaryPayment[];
    if (idx >= 0) {
      const nextState = !prev[idx].isPaid;
      prev[idx] = {
        ...prev[idx],
        isPaid: nextState,
        paidDate: nextState ? today : undefined,
        amount
      };
      updated = prev;
    } else {
      updated = [
        ...prev,
        {
          id: `tsp-${Date.now()}-${teacherId}`,
          teacherId,
          month,
          isPaid: true,
          paidDate: today,
          amount
        }
      ];
    }
    setTeacherSalaryPayments(updated);
    saveToStorage('teacherSalaryPayments', updated);
    pushCurrentDataToCloud({ teacherSalaryPayments: updated });
  };

  // Attendance + automatic fee reconciliation
  const markStudentAttendance = (record: Omit<StudentAttendance, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const currentSettings = stateRef.current.settings;
    const currentLeaves = stateRef.current.leaves;
    const onApprovedLeave = isDateCoveredByApprovedLeave(record.studentId, record.date, currentLeaves);
    const effectiveStatus = record.status === 'Absent' && onApprovedLeave ? 'Leave' : record.status;
    const fineRate = Number(currentSettings.finePerAbsentDay ?? 50) || 0;
    const chargeLeaveFine = Boolean(currentSettings.chargeFineOnApprovedLeave);
    const fineAmount =
      effectiveStatus === 'Absent' || (effectiveStatus === 'Leave' && chargeLeaveFine) ? fineRate : 0;

    const deduped = deduplicateAttendance(stateRef.current.attendance);
    const existingIndex = deduped.findIndex(a => a.studentId === record.studentId && a.date === record.date);
    let updatedAtt: StudentAttendance[];

    if (existingIndex >= 0) {
      updatedAtt = [...deduped];
      updatedAtt[existingIndex] = { ...updatedAtt[existingIndex], status: effectiveStatus, fineAmount };
    } else {
      updatedAtt = [
        {
          ...record,
          status: effectiveStatus,
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fineAmount
        },
        ...deduped
      ];
    }

    const reconciledFees = reconcileFeesWithAttendance({
      students: stateRef.current.students,
      feeRecords: stateRef.current.feeRecords,
      attendance: updatedAtt,
      leaves: currentLeaves,
      settings: currentSettings
    });

    setAttendance(updatedAtt);
    saveToStorage('attendance', updatedAtt);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);
    pushCurrentDataToCloud({ attendance: updatedAtt, feeRecords: reconciledFees });
  };

  const buildClassAttendanceChange = (
    baseAttendance: StudentAttendance[],
    baseFees: FeeRecord[],
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[],
    markedBy?: { teacherId?: string; teacherName?: string }
  ) => {
    const nowIso = new Date().toISOString();
    const month = date.substring(0, 7);
    const currentSettings = stateRef.current.settings;
    const currentLeaves = stateRef.current.leaves;
    const fineRate = Number(currentSettings.finePerAbsentDay ?? 50) || 0;
    const chargeLeaveFine = Boolean(currentSettings.chargeFineOnApprovedLeave);
    const updated = deduplicateAttendance(baseAttendance);
    const changedRecords: StudentAttendance[] = [];

    records.forEach(r => {
      const st = stateRef.current.students.find(s => s.id === r.studentId);
      if (st) {
        const onApprovedLeave = isDateCoveredByApprovedLeave(r.studentId, date, currentLeaves);
        const effectiveStatus = r.status === 'Absent' && onApprovedLeave ? 'Leave' : r.status;
        const fineAmount =
          effectiveStatus === 'Absent' || (effectiveStatus === 'Leave' && chargeLeaveFine) ? fineRate : 0;
        const existingIndex = updated.findIndex(a => a.studentId === r.studentId && a.date === date);
        if (existingIndex >= 0) {
          const updatedRec: StudentAttendance = {
            ...updated[existingIndex],
            studentName: st.name,
            className,
            month,
            status: effectiveStatus,
            fineAmount,
            markedBy: markedBy?.teacherName || updated[existingIndex].markedBy,
            markedByTeacherId: markedBy?.teacherId || updated[existingIndex].markedByTeacherId,
            markedAt: nowIso
          };
          updated[existingIndex] = updatedRec;
          changedRecords.push(updatedRec);
        } else {
          const createdRec: StudentAttendance = {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            studentId: r.studentId,
            studentName: st.name,
            className,
            date,
            month,
            status: effectiveStatus,
            fineAmount,
            markedBy: markedBy?.teacherName || 'Staff',
            markedByTeacherId: markedBy?.teacherId,
            markedAt: nowIso
          };
          updated.unshift(createdRec);
          changedRecords.push(createdRec);
        }
      }
    });

    const reconciledFees = reconcileFeesWithAttendance({
      students: stateRef.current.students,
      feeRecords: baseFees,
      attendance: updated,
      leaves: currentLeaves,
      settings: currentSettings
    });

    return { updated, reconciledFees, changedRecords };
  };

  const markClassAttendanceAsync = async (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[],
    markedBy?: { teacherId?: string; teacherName?: string }
  ): Promise<{ success: boolean; syncedOnline: boolean }> => {
    hasPendingLocalMutation.current = true;
    const { updated, reconciledFees, changedRecords } = buildClassAttendanceChange(
      stateRef.current.attendance,
      stateRef.current.feeRecords,
      className,
      date,
      records,
      markedBy
    );

    // Update UI, stateRef, and localStorage + offline queue immediately
    stateRef.current = { ...stateRef.current, attendance: updated, feeRecords: reconciledFees };
    setAttendance(updated);
    saveToStorage('attendance', updated);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);

    const nextQueuedAtt = overlayStudentAttendance(pendingAttQueueRef.current, changedRecords);
    persistPendingQueues(nextQueuedAtt, pendingTeacherAttQueueRef.current, true);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOnline(false);
      setIsCloudConnected(false);
      return { success: true, syncedOnline: false };
    }

    try {
      // Merge onto freshest cloud snapshot so concurrent marking by multiple teachers never overwrites another class
      const { best, reachable } = await fetchFreshestCloudSnapshot(2800);
      const baseAtt =
        reachable && best && Array.isArray(best.attendance)
          ? best.attendance.filter((a: any) => !isDummyStudent(a))
          : updated;
      const baseFees =
        reachable && best && Array.isArray(best.feeRecords)
          ? best.feeRecords.filter((f: any) => !isDummyStudent(f))
          : reconciledFees;
      const baseStudents =
        reachable && best && Array.isArray(best.students) && best.students.length > 0
          ? best.students.filter((s: any) => !isDummyStudent(s))
          : stateRef.current.students;
      const baseLeaves =
        reachable && best && Array.isArray(best.leaves) ? best.leaves : stateRef.current.leaves;
      const baseSettings: SystemSettings =
        reachable && best?.settings ? { ...initialSettings, ...best.settings } : stateRef.current.settings;

      const mergedAtt = overlayStudentAttendance(baseAtt, nextQueuedAtt);
      const mergedFees = reconcileFeesWithAttendance({
        students: baseStudents,
        feeRecords: baseFees,
        attendance: mergedAtt,
        leaves: baseLeaves,
        settings: baseSettings
      });

      const synced = await pushCurrentDataToCloud({
        students: baseStudents,
        leaves: baseLeaves,
        settings: baseSettings,
        attendance: mergedAtt,
        feeRecords: mergedFees
      });

      if (synced) {
        stateRef.current = { ...stateRef.current, attendance: mergedAtt, feeRecords: mergedFees };
        setAttendance(mergedAtt);
        saveToStorage('attendance', mergedAtt);
        setFeeRecords(mergedFees);
        saveToStorage('feeRecords', mergedFees);

        // If a teacher attendance queue still exists, keep only teacher queue; otherwise clear all pending flags
        const syncedKeys = new Set(changedRecords.map(r => `${r.studentId}__${r.date}`));
        const remainingAttQ = pendingAttQueueRef.current.filter(
          q => !syncedKeys.has(`${q.studentId}__${q.date}`)
        );
        persistPendingQueues(remainingAttQ, pendingTeacherAttQueueRef.current, remainingAttQ.length > 0 || pendingTeacherAttQueueRef.current.length > 0);
        return { success: true, syncedOnline: true };
      }
      return { success: true, syncedOnline: false };
    } catch (err) {
      console.warn('Online attendance push failed, queued offline:', err);
      return { success: true, syncedOnline: false };
    }
  };

  const markClassAttendance = (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[],
    markedBy?: { teacherId?: string; teacherName?: string }
  ) => {
    void markClassAttendanceAsync(className, date, records, markedBy);
  };

  const markTeacherAttendanceAsync = async (
    record: Omit<TeacherAttendance, 'id'>
  ): Promise<{ success: boolean; syncedOnline: boolean }> => {
    hasPendingLocalMutation.current = true;
    const nowIso = new Date().toISOString();
    const existing = stateRef.current.teacherAttendance.find(
      a => a.teacherId === record.teacherId && a.date === record.date
    );
    const savedRecord: TeacherAttendance = {
      ...record,
      id: existing?.id || `ta-${Date.now()}-${record.teacherId}`,
      markedAt: nowIso
    };
    const updated = overlayTeacherAttendance(stateRef.current.teacherAttendance, [savedRecord]);

    stateRef.current = { ...stateRef.current, teacherAttendance: updated };
    setTeacherAttendance(updated);
    saveToStorage('teacherAttendance', updated);

    const nextTeacherQ = overlayTeacherAttendance(pendingTeacherAttQueueRef.current, [savedRecord]);
    persistPendingQueues(pendingAttQueueRef.current, nextTeacherQ, true);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOnline(false);
      setIsCloudConnected(false);
      return { success: true, syncedOnline: false };
    }

    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(2800);
      const baseTeacherAtt =
        reachable && best && Array.isArray(best.teacherAttendance)
          ? best.teacherAttendance
          : updated;
      const mergedTeacherAtt = overlayTeacherAttendance(baseTeacherAtt, nextTeacherQ);

      const synced = await pushCurrentDataToCloud({
        teacherAttendance: mergedTeacherAtt
      });

      if (synced) {
        stateRef.current = { ...stateRef.current, teacherAttendance: mergedTeacherAtt };
        setTeacherAttendance(mergedTeacherAtt);
        saveToStorage('teacherAttendance', mergedTeacherAtt);
        const remainingTQ = pendingTeacherAttQueueRef.current.filter(
          q => !(q.teacherId === record.teacherId && q.date === record.date)
        );
        persistPendingQueues(pendingAttQueueRef.current, remainingTQ, pendingAttQueueRef.current.length > 0 || remainingTQ.length > 0);
        return { success: true, syncedOnline: true };
      }
      return { success: true, syncedOnline: false };
    } catch (err) {
      console.warn('Teacher attendance push failed, queued offline:', err);
      return { success: true, syncedOnline: false };
    }
  };

  const markTeacherAttendance = (record: Omit<TeacherAttendance, 'id'>) => {
    void markTeacherAttendanceAsync(record);
  };

  // Leaves + automatic waiver reconciliation
  const submitLeave = (leaveData: Omit<LeaveRequest, 'id' | 'appliedDate'>) => {
    hasPendingLocalMutation.current = true;
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `l-${Date.now()}`,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newLeave, ...stateRef.current.leaves];
    setLeaves(updated);
    saveToStorage('leaves', updated);
    pushCurrentDataToCloud({ leaves: updated });
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected') => {
    hasPendingLocalMutation.current = true;
    const updatedLeaves = stateRef.current.leaves.map(l => (l.id === id ? { ...l, status } : l));
    const targetLeave = updatedLeaves.find(l => l.id === id);

    let updatedAtt = deduplicateAttendance(stateRef.current.attendance);
    if (targetLeave && targetLeave.role === 'student' && status === 'Approved') {
      const chargeLeaveFine = Boolean(stateRef.current.settings.chargeFineOnApprovedLeave);
      const fineRate = Number(stateRef.current.settings.finePerAbsentDay ?? 50) || 0;
      updatedAtt = updatedAtt.map(a => {
        if (
          a.studentId === targetLeave.applicantId &&
          a.status === 'Absent' &&
          a.date >= targetLeave.fromDate &&
          a.date <= targetLeave.toDate
        ) {
          return {
            ...a,
            status: 'Leave',
            fineAmount: chargeLeaveFine ? fineRate : 0
          };
        }
        return a;
      });
    }

    const reconciledFees = reconcileFeesWithAttendance({
      students: stateRef.current.students,
      feeRecords: stateRef.current.feeRecords,
      attendance: updatedAtt,
      leaves: updatedLeaves,
      settings: stateRef.current.settings
    });

    setLeaves(updatedLeaves);
    saveToStorage('leaves', updatedLeaves);
    setAttendance(updatedAtt);
    saveToStorage('attendance', updatedAtt);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);
    pushCurrentDataToCloud({ leaves: updatedLeaves, attendance: updatedAtt, feeRecords: reconciledFees });
  };

  // Fees
  const addFeeRecord = (record: Omit<FeeRecord, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const newRecord: FeeRecord = {
      ...record,
      id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    const combined = [newRecord, ...stateRef.current.feeRecords];
    const updated = deduplicateAndCleanFeeRecords(combined, stateRef.current.students);
    stateRef.current = { ...stateRef.current, feeRecords: updated };
    setFeeRecords(updated);
    saveToStorage('feeRecords', updated);
    pushCurrentDataToCloud({ feeRecords: updated });
  };

  const updateFeeRecord = (updated: FeeRecord) => {
    hasPendingLocalMutation.current = true;
    const updatedList = deduplicateAndCleanFeeRecords(
      stateRef.current.feeRecords.map(f => (f.id === updated.id ? updated : f)),
      stateRef.current.students
    );
    stateRef.current = { ...stateRef.current, feeRecords: updatedList };
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList });
  };

  const deleteFeeRecord = (feeRecordId: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([feeRecordId]);
    const updatedList = stateRef.current.feeRecords.filter(f => f.id !== feeRecordId);
    stateRef.current = { ...stateRef.current, feeRecords: updatedList };
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList, deletedIds: nextDeleted });
  };

  const recordFeePayment = (feeRecordId: string, amount: number, receiptNo: string) => {
    const cleanAmount = Math.max(0, Number(amount) || 0);
    if (cleanAmount <= 0) return;
    hasPendingLocalMutation.current = true;
    const today = new Date().toISOString().split('T')[0];
    const updated = stateRef.current.feeRecords.map(f => {
      if (f.id === feeRecordId) {
        const currentPaid = Math.max(0, Number(f.paidAmount) || 0);
        const totalPayable = Math.max(0, Number(f.totalPayable) || 0);
        const newPaid = Math.min(totalPayable, currentPaid + cleanAmount);
        const newBalance = Math.max(0, totalPayable - newPaid);
        const status: 'Paid' | 'Partial' | 'Unpaid' =
          newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...f,
          paidAmount: newPaid,
          balanceRemaining: newBalance,
          status,
          paymentDate: today,
          receiptNo: receiptNo || f.receiptNo || `REC-BSS-${Date.now().toString().slice(-4)}`
        };
      }
      return f;
    });
    stateRef.current = { ...stateRef.current, feeRecords: updated };
    setFeeRecords(updated);
    saveToStorage('feeRecords', updated);
    pushCurrentDataToCloud({ feeRecords: updated });
  };

  const generateMonthlyFeeVouchers = (monthName: string): number => {
    hasPendingLocalMutation.current = true;
    let count = 0;
    const newRecords: FeeRecord[] = [];
    const targetYm = monthLabelToYearMonth(monthName);
    const fineRate = Number(stateRef.current.settings.finePerAbsentDay ?? 50) || 0;
    const chargeLeaveFine = Boolean(stateRef.current.settings.chargeFineOnApprovedLeave);
    const cleanAtt = deduplicateAttendance(stateRef.current.attendance);

    stateRef.current.students.forEach(st => {
      const exists = stateRef.current.feeRecords.some(
        f => f.studentId === st.id && f.month.trim().toLowerCase() === monthName.trim().toLowerCase()
      );
      if (!exists) {
        const relevantAtt = cleanAtt.filter(a => {
          if (a.studentId !== st.id) return false;
          if (targetYm) return (a.month || a.date.substring(0, 7)) === targetYm;
          return true;
        });
        let absents = 0;
        let leaveCount = 0;
        relevantAtt.forEach(a => {
          const onApprovedLeave = isDateCoveredByApprovedLeave(st.id, a.date, stateRef.current.leaves);
          if (a.status === 'Leave' || (a.status === 'Absent' && onApprovedLeave)) {
            leaveCount++;
          } else if (a.status === 'Absent') {
            absents++;
          }
        });
        const billableDays = chargeLeaveFine ? absents + leaveCount : absents;
        const fine = billableDays * fineRate;
        const tuition = st.monthlyFee || getDefaultMonthlyFee(st.className);
        const total = tuition + fine;

        newRecords.push({
          id: `fee-${Date.now()}-${st.id}`,
          studentId: st.id,
          studentName: st.name,
          fatherName: st.fatherName,
          className: st.className,
          month: monthName,
          tuitionFee: tuition,
          absentDays: absents,
          leaveDays: leaveCount,
          fineAmount: fine,
          totalPayable: total,
          paidAmount: 0,
          balanceRemaining: total,
          status: 'Unpaid',
          receiptNo: `REC-BSS-${st.id.slice(-4)}`
        });
        count++;
      }
    });

    if (newRecords.length > 0) {
      const updated = reconcileFeesWithAttendance({
        students: stateRef.current.students,
        feeRecords: [...newRecords, ...stateRef.current.feeRecords],
        attendance: stateRef.current.attendance,
        leaves: stateRef.current.leaves,
        settings: stateRef.current.settings
      });
      stateRef.current = { ...stateRef.current, feeRecords: updated };
      setFeeRecords(updated);
      saveToStorage('feeRecords', updated);
      pushCurrentDataToCloud({ feeRecords: updated });
    }
    return count;
  };

  const recalculateAllFeeFines = () => {
    hasPendingLocalMutation.current = true;
    const reconciled = reconcileFeesWithAttendance({
      students: stateRef.current.students,
      feeRecords: stateRef.current.feeRecords,
      attendance: stateRef.current.attendance,
      leaves: stateRef.current.leaves,
      settings: stateRef.current.settings
    });
    stateRef.current = { ...stateRef.current, feeRecords: reconciled };
    setFeeRecords(reconciled);
    saveToStorage('feeRecords', reconciled);
    pushCurrentDataToCloud({ feeRecords: reconciled });
  };

  // Daily Reports
  const addDailyReport = (report: Omit<DailyReport, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const newReport: DailyReport = {
      ...report,
      id: `dr-${Date.now()}`
    };
    const updated = [newReport, ...stateRef.current.dailyReports];
    setDailyReports(updated);
    saveToStorage('dailyReports', updated);
    pushCurrentDataToCloud({ dailyReports: updated });
  };

  // Tests & Daily Class Tests (Cloud-Confirmed)
  const addTest = (testData: Omit<Test, 'id'>): Test => {
    hasPendingLocalMutation.current = true;
    const newTest: Test = {
      ...testData,
      id: `tst-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    const updated = [newTest, ...stateRef.current.tests];
    stateRef.current = { ...stateRef.current, tests: updated };
    setTests(updated);
    saveToStorage('tests', updated);
    pushCurrentDataToCloud({ tests: updated });
    return newTest;
  };

  const addTestResult = (resultData: Omit<TestResult, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const updated = [...stateRef.current.testResults];
    const idx = updated.findIndex(r => r.testId === resultData.testId && r.studentId === resultData.studentId);
    if (idx >= 0) {
      updated[idx] = { ...resultData, id: updated[idx].id };
    } else {
      updated.unshift({ ...resultData, id: `tr-${Date.now()}-${resultData.studentId}` });
    }
    stateRef.current = { ...stateRef.current, testResults: updated };
    setTestResults(updated);
    saveToStorage('testResults', updated);
    pushCurrentDataToCloud({ testResults: updated });
  };

  const saveDailyTestWithResultsAsync = async (
    test: Test,
    results: Array<Omit<TestResult, 'id' | 'testId' | 'testTitle' | 'testDate' | 'className' | 'subject' | 'totalMarks'>>
  ): Promise<{ success: boolean; test: Test; error?: string }> => {
    const prevTests = stateRef.current.tests;
    const prevTestResults = stateRef.current.testResults;
    const nowIso = new Date().toISOString();
    const enrichedTest: Test = {
      ...test,
      id: test.id || `tst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: nowIso
    };

    const buildMergedTestsAndResults = (baseTests: Test[], baseResults: TestResult[]) => {
      const nextTests = [
        enrichedTest,
        ...baseTests.filter(t => t.id !== enrichedTest.id)
      ];
      const existingForTest = new Map(
        baseResults
          .filter(r => r.testId === enrichedTest.id)
          .map(r => [r.studentId, r.id])
      );
      const otherResults = baseResults.filter(r => r.testId !== enrichedTest.id);
      const newTestResults: TestResult[] = results.map(r => {
        const pct =
          enrichedTest.totalMarks > 0
            ? Math.round((r.marksObtained / enrichedTest.totalMarks) * 1000) / 10
            : 0;
        return {
          id: existingForTest.get(r.studentId) || `tr-${Date.now()}-${r.studentId}-${Math.random().toString(36).substring(2, 5)}`,
          testId: enrichedTest.id,
          testTitle: enrichedTest.title,
          testDate: enrichedTest.testDate,
          studentId: r.studentId,
          studentName: r.studentName,
          className: enrichedTest.className,
          subject: enrichedTest.subject,
          marksObtained: r.marksObtained,
          totalMarks: enrichedTest.totalMarks,
          percentage: pct,
          grade: r.grade,
          remarks: r.remarks
        };
      });
      return {
        nextTests,
        nextResults: [...newTestResults, ...otherResults]
      };
    };

    hasPendingLocalMutation.current = true;
    const localMerged = buildMergedTestsAndResults(prevTests, prevTestResults);
    stateRef.current = {
      ...stateRef.current,
      tests: localMerged.nextTests,
      testResults: localMerged.nextResults
    };
    setTests(localMerged.nextTests);
    saveToStorage('tests', localMerged.nextTests);
    setTestResults(localMerged.nextResults);
    saveToStorage('testResults', localMerged.nextResults);

    let payloadTests = localMerged.nextTests;
    let payloadResults = localMerged.nextResults;

    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(2800);
      if (reachable && best) {
        const baseT = Array.isArray(best.tests) ? best.tests : prevTests;
        const baseR = Array.isArray(best.testResults) ? best.testResults : prevTestResults;
        const cloudMerged = buildMergedTestsAndResults(baseT, baseR);
        payloadTests = cloudMerged.nextTests;
        payloadResults = cloudMerged.nextResults;
      }
    } catch {
      // Use local merged
    }

    const saved = await pushCurrentDataToCloud({
      tests: payloadTests,
      testResults: payloadResults
    });

    if (!saved) {
      hasPendingLocalMutation.current = false;
      stateRef.current = {
        ...stateRef.current,
        tests: prevTests,
        testResults: prevTestResults
      };
      setTests(prevTests);
      saveToStorage('tests', prevTests);
      setTestResults(prevTestResults);
      saveToStorage('testResults', prevTestResults);
      return {
        success: false,
        test: enrichedTest,
        error: 'ڈیلی ٹیسٹ آن لائن سرور پر محفوظ نہیں ہو سکا۔ براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔'
      };
    }

    stateRef.current = {
      ...stateRef.current,
      tests: payloadTests,
      testResults: payloadResults
    };
    setTests(payloadTests);
    saveToStorage('tests', payloadTests);
    setTestResults(payloadResults);
    saveToStorage('testResults', payloadResults);
    return { success: true, test: enrichedTest };
  };

  const deleteTestAsync = async (testId: string): Promise<boolean> => {
    const prevTests = stateRef.current.tests;
    const prevTestResults = stateRef.current.testResults;
    const removedResultIds = prevTestResults.filter(r => r.testId === testId).map(r => r.id);
    const nextDeleted = recordDeletedIds([testId, ...removedResultIds]);

    const nextTests = prevTests.filter(t => t.id !== testId);
    const nextResults = prevTestResults.filter(r => r.testId !== testId);

    hasPendingLocalMutation.current = true;
    stateRef.current = { ...stateRef.current, tests: nextTests, testResults: nextResults };
    setTests(nextTests);
    saveToStorage('tests', nextTests);
    setTestResults(nextResults);
    saveToStorage('testResults', nextResults);

    const saved = await pushCurrentDataToCloud({
      tests: nextTests,
      testResults: nextResults,
      deletedIds: nextDeleted
    });

    if (!saved) {
      hasPendingLocalMutation.current = false;
      stateRef.current = { ...stateRef.current, tests: prevTests, testResults: prevTestResults };
      setTests(prevTests);
      saveToStorage('tests', prevTests);
      setTestResults(prevTestResults);
      saveToStorage('testResults', prevTestResults);
      return false;
    }
    return true;
  };

  // Official Student Exam Reports (Tests & Results Section)
  const sanitizeExamReport = (report: StudentExamReport): StudentExamReport => {
    const rawEnteredBy = (report.enteredByName || '').trim();
    const safeEnteredBy =
      /tasawar|principal/i.test(rawEnteredBy) ? 'Class Teacher' : rawEnteredBy || 'Class Teacher';
    return {
      ...report,
      enteredByName: safeEnteredBy,
      updatedAt: new Date().toISOString()
    };
  };

  const applySaveStudentExamReport = (report: StudentExamReport) => {
    hasPendingLocalMutation.current = true;
    const enriched = sanitizeExamReport(report);
    const updated = overlayExamReports(stateRef.current.studentExamReports, [enriched]);
    stateRef.current = { ...stateRef.current, studentExamReports: updated };
    setStudentExamReports(updated);
    saveToStorage('studentExamReports', updated);
    return { updated, enriched };
  };

  const saveStudentExamReport = (report: StudentExamReport) => {
    void saveStudentExamReportAsync(report);
  };

  const saveStudentExamReportAsync = async (report: StudentExamReport): Promise<boolean> => {
    const { updated: localUpdated, enriched } = applySaveStudentExamReport(report);

    try {
      const { best, reachable } = await fetchFreshestCloudSnapshot(2800);
      if (reachable && best) {
        const mergedDeleted = Array.from(
          new Set<string>([
            ...(Array.isArray(best.deletedIds) ? best.deletedIds : []),
            ...stateRef.current.deletedIds
          ].filter(id => id !== enriched.id))
        ).slice(-500);
        const deletedSet = new Set(mergedDeleted);

        const baseStudents =
          Array.isArray(best.students) && best.students.length > 0
            ? best.students.filter((s: any) => !isDummyStudent(s) && !deletedSet.has(s.id))
            : stateRef.current.students;
        const baseTeachers =
          Array.isArray(best.teachers) && best.teachers.length > 0
            ? best.teachers.filter((t: any) => !deletedSet.has(t.id))
            : stateRef.current.teachers;
        const baseAtt = Array.isArray(best.attendance)
          ? deduplicateAttendance(best.attendance.filter((a: any) => !isDummyStudent(a) && !deletedSet.has(a.id)))
          : stateRef.current.attendance;
        const baseFees = Array.isArray(best.feeRecords)
          ? best.feeRecords.filter((f: any) => !isDummyStudent(f) && !deletedSet.has(f.id))
          : stateRef.current.feeRecords;
        const baseExamReports = Array.isArray(best.studentExamReports)
          ? best.studentExamReports.filter((r: any) => !deletedSet.has(r.id))
          : [];

        const mergedReports = overlayExamReports(
          baseExamReports,
          [...pendingExamReportsQueueRef.current, enriched],
          deletedSet
        );

        stateRef.current = {
          ...stateRef.current,
          deletedIds: mergedDeleted,
          studentExamReports: mergedReports
        };
        setDeletedIds(mergedDeleted);
        saveToStorage('deletedIds', mergedDeleted);
        setStudentExamReports(mergedReports);
        saveToStorage('studentExamReports', mergedReports);

        const pushed = await pushCurrentDataToCloud({
          students: baseStudents,
          teachers: baseTeachers,
          attendance: baseAtt,
          feeRecords: baseFees,
          studentExamReports: mergedReports,
          deletedIds: mergedDeleted
        });

        if (pushed) {
          const remainingQueue = pendingExamReportsQueueRef.current.filter(r => r.id !== enriched.id);
          persistPendingQueues(
            pendingAttQueueRef.current,
            pendingTeacherAttQueueRef.current,
            pendingGeneralSyncRef.current,
            remainingQueue
          );
          return true;
        }
      } else {
        const directPushed = await pushCurrentDataToCloud({ studentExamReports: localUpdated });
        if (directPushed) {
          const remainingQueue = pendingExamReportsQueueRef.current.filter(r => r.id !== enriched.id);
          persistPendingQueues(
            pendingAttQueueRef.current,
            pendingTeacherAttQueueRef.current,
            pendingGeneralSyncRef.current,
            remainingQueue
          );
          return true;
        }
      }
    } catch (err) {
      console.warn('Exam report cloud save queued for retry:', err);
    }

    // Never lose entered marks when offline: keep locally and enqueue for automatic sync when online
    const nextQueue = overlayExamReports(pendingExamReportsQueueRef.current, [enriched]);
    persistPendingQueues(
      pendingAttQueueRef.current,
      pendingTeacherAttQueueRef.current,
      true,
      nextQueue
    );
    return false;
  };

  const deleteStudentExamReport = (reportId: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([reportId]);
    const updated = stateRef.current.studentExamReports.filter(r => r.id !== reportId);
    stateRef.current = { ...stateRef.current, studentExamReports: updated };
    setStudentExamReports(updated);
    saveToStorage('studentExamReports', updated);

    const nextQueue = pendingExamReportsQueueRef.current.filter(r => r.id !== reportId);
    persistPendingQueues(
      pendingAttQueueRef.current,
      pendingTeacherAttQueueRef.current,
      true,
      nextQueue
    );

    void (async () => {
      try {
        const { best, reachable } = await fetchFreshestCloudSnapshot(2500);
        if (reachable && best) {
          const mergedDeleted = Array.from(
            new Set<string>([
              ...(Array.isArray(best.deletedIds) ? best.deletedIds : []),
              ...nextDeleted
            ])
          ).slice(-500);
          const deletedSet = new Set(mergedDeleted);
          const baseReports = Array.isArray(best.studentExamReports)
            ? best.studentExamReports
            : updated;
          const mergedReports = overlayExamReports(baseReports, nextQueue, deletedSet).filter(
            r => r.id !== reportId
          );
          const ok = await pushCurrentDataToCloud({
            students:
              Array.isArray(best.students) && best.students.length > 0
                ? best.students.filter((s: any) => !isDummyStudent(s) && !deletedSet.has(s.id))
                : stateRef.current.students,
            studentExamReports: mergedReports,
            deletedIds: mergedDeleted
          });
          if (ok) {
            persistPendingQueues(
              pendingAttQueueRef.current,
              pendingTeacherAttQueueRef.current,
              false,
              nextQueue
            );
          }
          return;
        }
        const ok = await pushCurrentDataToCloud({
          studentExamReports: updated,
          deletedIds: nextDeleted
        });
        if (ok) {
          persistPendingQueues(
            pendingAttQueueRef.current,
            pendingTeacherAttQueueRef.current,
            false,
            nextQueue
          );
        }
      } catch {
        // Pending queue already marks offline sync needed
      }
    })();
  };

  const togglePublishExamReport = (reportId: string) => {
    const target = stateRef.current.studentExamReports.find(r => r.id === reportId);
    if (!target) return;
    const toggled: StudentExamReport = {
      ...target,
      isPublished: !target.isPublished,
      updatedAt: new Date().toISOString()
    };
    void saveStudentExamReportAsync(toggled);
  };

  // Notices
  const addNotice = (noticeData: Omit<Notice, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const newNotice: Notice = {
      ...noticeData,
      id: `not-${Date.now()}`
    };
    const updated = [newNotice, ...stateRef.current.notices];
    setNotices(updated);
    saveToStorage('notices', updated);
    pushCurrentDataToCloud({ notices: updated });
  };

  const deleteNotice = (id: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([id]);
    const updated = stateRef.current.notices.filter(n => n.id !== id);
    setNotices(updated);
    saveToStorage('notices', updated);
    pushCurrentDataToCloud({ notices: updated, deletedIds: nextDeleted });
  };

  // Online Admissions
  const submitOnlineAdmission = (admData: Omit<OnlineAdmission, 'id' | 'applyDate' | 'status'>) => {
    hasPendingLocalMutation.current = true;
    const newAdm: OnlineAdmission = {
      ...admData,
      id: `adm-${Date.now()}`,
      applyDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    const updated = [newAdm, ...stateRef.current.onlineAdmissions];
    setOnlineAdmissions(updated);
    saveToStorage('admissions', updated);
    pushCurrentDataToCloud({ onlineAdmissions: updated });
  };

  const updateAdmissionStatus = (id: string, status: 'Approved' | 'Rejected') => {
    hasPendingLocalMutation.current = true;
    const updated = stateRef.current.onlineAdmissions.map(a => (a.id === id ? { ...a, status } : a));
    setOnlineAdmissions(updated);
    saveToStorage('admissions', updated);
    pushCurrentDataToCloud({ onlineAdmissions: updated });
  };

  const approveAndEnrollAdmission = (admissionId: string): Student | null => {
    const admission = stateRef.current.onlineAdmissions.find(a => a.id === admissionId);
    if (!admission) return null;

    const classCount = stateRef.current.students.filter(s => s.className === admission.applyingClass).length + 1;
    const rollNo = classCount < 10 ? `0${classCount}` : `${classCount}`;
    const admissionNo = `BSS-${Date.now().toString().slice(-4)}`;

    const newStudent = addStudent({
      admissionNo,
      rollNo,
      name: admission.studentName,
      fatherName: admission.fatherName,
      className: admission.applyingClass,
      dob: admission.dob,
      contactNo: admission.contactNo,
      whatsappNo: admission.whatsappNo || admission.contactNo,
      address: admission.address,
      admissionDate: new Date().toISOString().split('T')[0],
      gender: admission.gender,
      monthlyFee: getDefaultMonthlyFee(admission.applyingClass),
      isActive: true
    });

    updateAdmissionStatus(admissionId, 'Approved');
    return newStudent;
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    hasPendingLocalMutation.current = true;
    const updatedSettings: SystemSettings = { ...stateRef.current.settings, ...newSettings };
    const fineChanged =
      newSettings.finePerAbsentDay !== undefined ||
      newSettings.chargeFineOnApprovedLeave !== undefined;

    let updatedFees = stateRef.current.feeRecords;
    if (fineChanged) {
      updatedFees = reconcileFeesWithAttendance({
        students: stateRef.current.students,
        feeRecords: stateRef.current.feeRecords,
        attendance: stateRef.current.attendance,
        leaves: stateRef.current.leaves,
        settings: updatedSettings
      });
      setFeeRecords(updatedFees);
      saveToStorage('feeRecords', updatedFees);
    }

    setSettings(updatedSettings);
    saveToStorage('settings', updatedSettings);
    pushCurrentDataToCloud({ settings: updatedSettings, feeRecords: updatedFees });
  };

  // Student 360 Full Report
  const getStudentFullReport = (studentId: string): StudentFullReport | null => {
    const student = stateRef.current.students.find(s => s.id === studentId) || students.find(s => s.id === studentId);
    if (!student) return null;

    const studentAtt = deduplicateAttendance(attendance.filter(a => a.studentId === studentId));
    const totalWorkingDays = studentAtt.length;
    const presentDays = studentAtt.filter(a => a.status === 'Present').length;
    const leaveDays = studentAtt.filter(
      a => a.status === 'Leave' || (a.status === 'Absent' && isDateCoveredByApprovedLeave(studentId, a.date, leaves))
    ).length;
    const absentDays = studentAtt.filter(
      a => a.status === 'Absent' && !isDateCoveredByApprovedLeave(studentId, a.date, leaves)
    ).length;
    const lateDays = studentAtt.filter(a => a.status === 'Late').length;

    const attendancePercentage = totalWorkingDays > 0
      ? Math.round((presentDays / totalWorkingDays) * 100)
      : 100;

    const fineRate = Number(settings.finePerAbsentDay ?? 50) || 0;
    const chargeLeaveFine = Boolean(settings.chargeFineOnApprovedLeave);
    const computedFine = (chargeLeaveFine ? absentDays + leaveDays : absentDays) * fineRate;

    const studentFees = deduplicateAndCleanFeeRecords(feeRecords, students).filter(
      f => f.studentId === studentId
    );
    const totalFineAmount = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + (Number(curr.fineAmount) || 0), 0)
      : 0;
    const monthlyFee = student.monthlyFee || getDefaultMonthlyFee(student.className);
    const totalPayable = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + (Number(curr.totalPayable) || 0), 0)
      : monthlyFee;
    const paidAmount = studentFees.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
    const balanceRemaining = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + (Number(curr.balanceRemaining) || 0), 0)
      : Math.max(0, totalPayable - paidAmount);
    const feeStatus =
      balanceRemaining === 0
        ? 'Clear (Paid)'
        : paidAmount > 0
        ? `Partial (Due Rs. ${balanceRemaining.toLocaleString()})`
        : `Unpaid (Due Rs. ${balanceRemaining.toLocaleString()})`;

    const studentTestScores = testResults.filter(t => t.studentId === studentId);
    const studentDailyReports = dailyReports.filter(d => d.studentId === studentId);
    const studentLeaves = leaves.filter(l => l.applicantId === studentId);

    return {
      student,
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      lateDays,
      attendancePercentage,
      finePerAbsentDay: fineRate,
      totalFineAmount,
      monthlyFee,
      totalPayable,
      paidAmount,
      balanceRemaining,
      feeStatus,
      testScores: studentTestScores,
      recentDailyReports: studentDailyReports,
      leaves: studentLeaves,
      attendanceHistory: studentAtt,
      feeHistory: studentFees
    };
  };

  const openWhatsApp = (phone: string = settings.schoolWhatsApp, message: string = 'Assalam-o-Alaikum! I want information regarding Bright Scholar School.') => {
    const cleanPhone = phone.replace(/-/g, '').replace(/\s+/g, '').replace(/^0/, '92');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const exportAllSchoolData = (): string => {
    const payload = {
      version: 'bss_v12',
      exportedAt: new Date().toISOString(),
      schoolName: 'Bright Scholar School',
      students,
      teachers,
      attendance,
      teacherAttendance,
      leaves,
      feeRecords,
      dailyReports,
      tests,
      testResults,
      studentExamReports,
      notices,
      onlineAdmissions,
      settings,
      salaryTransactions,
      teacherSalaryPayments
    };
    return JSON.stringify(payload, null, 2);
  };

  const importSchoolData = (jsonString: string): { success: boolean; studentCount: number; message: string } => {
    try {
      const data = extractCleanJson<any>(jsonString);
      if (!data) throw new Error('Empty data');
      hasPendingLocalMutation.current = true;

      let count = 0;
      const pushOverride: Partial<typeof stateRef.current> = {};
      if (Array.isArray(data.students)) {
        const cleanSt = data.students.filter((s: any) => !isDummyStudent(s));
        setStudents(cleanSt);
        saveToStorage('students', cleanSt);
        count = cleanSt.length;
        pushOverride.students = cleanSt;
      }
      if (Array.isArray(data.teachers)) {
        setTeachers(data.teachers);
        saveToStorage('teachers', data.teachers);
        pushOverride.teachers = data.teachers;
      }
      if (Array.isArray(data.attendance)) {
        const deduped = deduplicateAttendance(data.attendance);
        setAttendance(deduped);
        saveToStorage('attendance', deduped);
        pushOverride.attendance = deduped;
      }
      if (Array.isArray(data.teacherAttendance)) {
        setTeacherAttendance(data.teacherAttendance);
        saveToStorage('teacherAttendance', data.teacherAttendance);
        pushOverride.teacherAttendance = data.teacherAttendance;
      }
      if (Array.isArray(data.leaves)) {
        setLeaves(data.leaves);
        saveToStorage('leaves', data.leaves);
        pushOverride.leaves = data.leaves;
      }
      if (Array.isArray(data.feeRecords)) {
        const cleanFees = data.feeRecords.filter((f: any) => !isDummyStudent(f));
        setFeeRecords(cleanFees);
        saveToStorage('feeRecords', cleanFees);
        pushOverride.feeRecords = cleanFees;
      }
      if (Array.isArray(data.dailyReports)) {
        setDailyReports(data.dailyReports);
        saveToStorage('dailyReports', data.dailyReports);
        pushOverride.dailyReports = data.dailyReports;
      }
      if (Array.isArray(data.tests)) {
        setTests(data.tests);
        saveToStorage('tests', data.tests);
        pushOverride.tests = data.tests;
      }
      if (Array.isArray(data.testResults)) {
        setTestResults(data.testResults);
        saveToStorage('testResults', data.testResults);
        pushOverride.testResults = data.testResults;
      }
      if (Array.isArray(data.studentExamReports)) {
        setStudentExamReports(data.studentExamReports);
        saveToStorage('studentExamReports', data.studentExamReports);
        pushOverride.studentExamReports = data.studentExamReports;
      }
      if (Array.isArray(data.notices)) {
        setNotices(data.notices);
        saveToStorage('notices', data.notices);
        pushOverride.notices = data.notices;
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings(data.settings);
        saveToStorage('settings', data.settings);
        pushOverride.settings = data.settings;
      }
      if (Array.isArray(data.salaryTransactions)) {
        setSalaryTransactions(data.salaryTransactions);
        saveToStorage('salaryTransactions', data.salaryTransactions);
        pushOverride.salaryTransactions = data.salaryTransactions;
      }

      pushCurrentDataToCloud(pushOverride);

      return {
        success: true,
        studentCount: count,
        message: `${count} طلباء اور تمام اسکول ریکارڈز کامیابی سے شامل ہو گئے ہیں!`
      };
    } catch (err: any) {
      return {
        success: false,
        studentCount: 0,
        message: 'ڈیٹا درآمد کرنے میں خرابی: براہ کرم درست فائل یا ٹیکسٹ پیسٹ کریں۔'
      };
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        students,
        teachers,
        attendance,
        teacherAttendance,
        leaves,
        feeRecords,
        dailyReports,
        tests,
        testResults,
        notices,
        onlineAdmissions,
        settings,
        salaryTransactions,
        currentPortal,
        isAdminLoggedIn,
        currentTeacherId,
        currentParentStudentId,
        selectedStudentForModal,
        setPortal: setCurrentPortal,
        setCurrentParentStudentId,
        loginAdmin,
        loginTeacher,
        loginOrCreateTeacherByName,
        loginParent,
        logout,
        setSelectedStudentForModal,
        addStudent,
        addStudentAsync,
        updateStudent,
        updateStudentAsync,
        deleteStudent,
        toggleStudentActive,
        purgePlaceholderStudents,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        adjustTeacherSalary,
        setTeacherPassword,
        teacherSalaryPayments,
        toggleTeacherSalaryPayment,
        markStudentAttendance,
        markClassAttendance,
        markClassAttendanceAsync,
        markTeacherAttendance,
        markTeacherAttendanceAsync,
        submitLeave,
        updateLeaveStatus,
        addFeeRecord,
        updateFeeRecord,
        deleteFeeRecord,
        recordFeePayment,
        generateMonthlyFeeVouchers,
        recalculateAllFeeFines,
        addDailyReport,
        addTest,
        addTestResult,
        saveDailyTestWithResultsAsync,
        deleteTestAsync,
        studentExamReports,
        saveStudentExamReport,
        saveStudentExamReportAsync,
        deleteStudentExamReport,
        togglePublishExamReport,
        addNotice,
        deleteNotice,
        submitOnlineAdmission,
        updateAdmissionStatus,
        approveAndEnrollAdmission,
        updateSettings,
        resetAllDataToZero,
        exportAllSchoolData,
        importSchoolData,
        isOnline,
        isCloudConnected,
        isCloudSyncing,
        hasPendingOfflineSync,
        pendingOfflineCount,
        lastCloudSyncTime,
        syncNowWithCloud,
        forceSyncAllToCloud,
        getStudentFullReport,
        openWhatsApp
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
