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
  updateStudent: (student: Student) => void;
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
  markClassAttendance: (className: string, date: string, records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[]) => void;
  markTeacherAttendance: (record: Omit<TeacherAttendance, 'id'>) => void;

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
  addDailyReport: (report: Omit<DailyReport, 'id'>) => void;

  // Official Student Exam Reports (Tests & Results Section)
  studentExamReports: StudentExamReport[];
  saveStudentExamReport: (report: StudentExamReport) => void;
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
  isCloudConnected: boolean;
  isCloudSyncing: boolean;
  lastCloudSyncTime: string | null;
  syncNowWithCloud: () => Promise<Student[]>;
  forceSyncAllToCloud: () => Promise<{ success: boolean; studentCount: number; message: string }>;

  // Reporting
  getStudentFullReport: (studentId: string) => StudentFullReport | null;
  openWhatsApp: (phone?: string, message?: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Strict filter to permanently eliminate all fake/dummy seed students across all devices & storage
const DUMMY_STUDENT_IDS = new Set([
  's-101', 's-102', 's-103', 's-104', 's-105', 's-106', 's-107',
  's-108', 's-109', 's-110', 's-111', 's-112', 's-113'
]);

export function isDummyStudent(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || item.studentId || '');
  if (id && (DUMMY_STUDENT_IDS.has(id) || id.startsWith("bss-") || id.startsWith("fee-rec-bss-") || id.startsWith("fee-bss-"))) return true;
  const name = String(item.name || item.studentName || '').toLowerCase().trim();
  const fName = String(item.fatherName || '').toLowerCase().trim();
  const cName = String(item.className || '').toLowerCase().trim();
  if (
    (id === 'bss-c7-02' && (name.includes('abdullah') || fName.includes('aslam'))) ||
    name.includes('maryam shabbir') ||
    name.includes('مریم شبیر') ||
    (name.includes('maryam') && (cName === 'class 4' || item.rollNo === '02' || fName.includes('shabbir'))) ||
    (name.includes('مریم') && (cName === 'class 4' || item.rollNo === '02' || fName.includes('شبیر'))) ||
    (name.includes('abdullah') && cName.includes('7') && fName.includes('aslam')) ||
    (name.includes('عبداللہ') && cName.includes('7') && fName.includes('اسلم'))
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
    saveToStorage("feeRecords", clean);
    return clean;
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
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  const isApplyingRemoteUpdate = React.useRef(false);
  const lastKnownServerUpdatedAt = React.useRef<string | null>(null);
  const hasInitializedFromCloud = React.useRef(false);
  const hasPendingLocalMutation = React.useRef(false);

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

  // Push current data to Global Cloud & Local Backup
  const pushCurrentDataToCloud = async (
    override?: Partial<typeof stateRef.current> & { forceReset?: boolean }
  ): Promise<boolean> => {
    try {
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

      // 1. Primary: Server API (/api/school-data)
      try {
        const serverBody = isForceReset ? { ...cloudPayload, forceReset: true } : cloudPayload;
        const localRes = await fetch('/api/school-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverBody)
        });
        if (localRes.ok) success = true;
      } catch (localErr) {
        console.warn('Server API sync error:', localErr);
      }

      // 2. Secondary: Global Cloud Bin 1
      try {
        const cloudRes = await fetch(GLOBAL_CLOUD_ENDPOINT_1, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudPayload)
        });
        if (cloudRes.ok) success = true;
      } catch (cloudErr) {
        console.warn('Cloud API 1 sync error:', cloudErr);
      }

      // 3. Tertiary backup: Global Cloud Bin 2
      try {
        const extRes = await fetch(GLOBAL_CLOUD_ENDPOINT_2, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudPayload)
        });
        if (extRes.ok) success = true;
      } catch (extErr) {}

      if (success) {
        hasPendingLocalMutation.current = false;
        setIsCloudConnected(true);
        lastKnownServerUpdatedAt.current = newTimestamp;
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

  // Pull data from Global Cloud Server with HTML-safe JSON extraction and tombstone-aware merge
  const pullFromCloudDatabase = async (): Promise<Student[]> => {
    try {
      const candidates: any[] = [];
      const cacheBust = `t=${Date.now()}`;

      const fetchCandidate = async (url: string) => {
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store' }
        });
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

      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          candidates.push(r.value);
        }
      });

      if (candidates.length === 0) {
        setIsCloudConnected(false);
        return stateRef.current.students.filter(s => !isDummyStudent(s));
      }

      setIsCloudConnected(true);

      // Sort by updatedAt descending, preferring non-empty datasets on tie
      candidates.sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (b.students?.length || 0) - (a.students?.length || 0);
      });

      const best = { ...candidates[0] };
      best.students = Array.isArray(best.students) ? best.students.filter((s: any) => !isDummyStudent(s)) : [];
      const data = best;

      const remoteTime = new Date(data.updatedAt || 0).getTime();
      const localTime = new Date(lastKnownServerUpdatedAt.current || 0).getTime();
      if (remoteTime <= localTime && hasInitializedFromCloud.current) {
        return stateRef.current.students.filter(s => !isDummyStudent(s));
      }

      const currentLocal = stateRef.current;
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
      const mergedAttendance = deduplicateAttendance(mergeEntities<StudentAttendance>(data.attendance, currentLocal.attendance));
      const mergedTeacherAttendance = mergeEntities<TeacherAttendance>(data.teacherAttendance, currentLocal.teacherAttendance);
      const mergedLeaves = mergeEntities<LeaveRequest>(data.leaves, currentLocal.leaves);
      const rawMergedFees = mergeEntities<FeeRecord>(data.feeRecords, currentLocal.feeRecords);
      const mergedReports = mergeEntities<DailyReport>(data.dailyReports, currentLocal.dailyReports);
      const mergedTests = mergeEntities<Test>(data.tests, currentLocal.tests);
      const mergedTestResults = mergeEntities<TestResult>(data.testResults, currentLocal.testResults);
      const mergedExamReports = mergeEntities<StudentExamReport>(data.studentExamReports, currentLocal.studentExamReports);
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
    if (hasPendingLocalMutation.current) {
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

  // Periodic polling & window focus pull
  useEffect(() => {
    pullFromCloudDatabase();

    const interval = setInterval(() => {
      pullFromCloudDatabase();
    }, 3000);

    const onFocus = () => pullFromCloudDatabase();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        pullFromCloudDatabase();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
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

  // Student CRUD with Immediate Cloud Sync
  const addStudent = (stData: Omit<Student, 'id'>): Student => {
    hasPendingLocalMutation.current = true;
    const cleanRoll = normalizeDigits(stData.rollNo).trim();
    const feeAmount = stData.monthlyFee || getDefaultMonthlyFee(stData.className);
    const newStudent: Student = {
      ...stData,
      rollNo: cleanRoll,
      monthlyFee: feeAmount,
      id: `s-${Date.now()}`
    };
    const updatedStudents = [newStudent, ...stateRef.current.students];
    setStudents(updatedStudents);
    saveToStorage('students', updatedStudents);

    const activeMonth = stateRef.current.feeRecords[0]?.month || getCurrentMonthLabel();
    const newFeeRecord: FeeRecord = {
      id: `fee-${Date.now()}`,
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
      receiptNo: `REC-BSS-${Date.now().toString().slice(-4)}`
    };
    const updatedFees = [newFeeRecord, ...stateRef.current.feeRecords];
    setFeeRecords(updatedFees);
    saveToStorage('feeRecords', updatedFees);

    pushCurrentDataToCloud({
      students: updatedStudents,
      feeRecords: updatedFees
    });

    return newStudent;
  };

  const updateStudent = (updated: Student) => {
    hasPendingLocalMutation.current = true;
    const prev = stateRef.current.students.find(s => s.id === updated.id);
    const normalizedRoll = normalizeDigits(updated.rollNo).trim();
    let finalStudent: Student = { ...updated, rollNo: normalizedRoll };
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
    const reconciledFees = reconcileFeesWithAttendance({
      students: updatedList,
      feeRecords: updatedFees,
      attendance: stateRef.current.attendance,
      leaves: stateRef.current.leaves,
      settings: stateRef.current.settings
    });

    setStudents(updatedList);
    saveToStorage('students', updatedList);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);
    pushCurrentDataToCloud({ students: updatedList, feeRecords: reconciledFees });
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

  const markClassAttendance = (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[]
  ) => {
    hasPendingLocalMutation.current = true;
    const month = date.substring(0, 7);
    const currentSettings = stateRef.current.settings;
    const currentLeaves = stateRef.current.leaves;
    const fineRate = Number(currentSettings.finePerAbsentDay ?? 50) || 0;
    const chargeLeaveFine = Boolean(currentSettings.chargeFineOnApprovedLeave);
    const updated = deduplicateAttendance(stateRef.current.attendance);

    records.forEach(r => {
      const st = stateRef.current.students.find(s => s.id === r.studentId);
      if (st) {
        const onApprovedLeave = isDateCoveredByApprovedLeave(r.studentId, date, currentLeaves);
        const effectiveStatus = r.status === 'Absent' && onApprovedLeave ? 'Leave' : r.status;
        const fineAmount =
          effectiveStatus === 'Absent' || (effectiveStatus === 'Leave' && chargeLeaveFine) ? fineRate : 0;
        const existingIndex = updated.findIndex(a => a.studentId === r.studentId && a.date === date);
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], status: effectiveStatus, fineAmount };
        } else {
          updated.unshift({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            studentId: r.studentId,
            studentName: st.name,
            className,
            date,
            month,
            status: effectiveStatus,
            fineAmount
          });
        }
      }
    });

    const reconciledFees = reconcileFeesWithAttendance({
      students: stateRef.current.students,
      feeRecords: stateRef.current.feeRecords,
      attendance: updated,
      leaves: currentLeaves,
      settings: currentSettings
    });

    setAttendance(updated);
    saveToStorage('attendance', updated);
    setFeeRecords(reconciledFees);
    saveToStorage('feeRecords', reconciledFees);
    pushCurrentDataToCloud({ attendance: updated, feeRecords: reconciledFees });
  };

  const markTeacherAttendance = (record: Omit<TeacherAttendance, 'id'>) => {
    hasPendingLocalMutation.current = true;
    const existingIndex = stateRef.current.teacherAttendance.findIndex(a => a.teacherId === record.teacherId && a.date === record.date);
    let updated: TeacherAttendance[];
    if (existingIndex >= 0) {
      updated = [...stateRef.current.teacherAttendance];
      updated[existingIndex] = { ...updated[existingIndex], status: record.status };
    } else {
      const newRecord: TeacherAttendance = {
        ...record,
        id: `ta-${Date.now()}`
      };
      updated = [newRecord, ...stateRef.current.teacherAttendance];
    }
    setTeacherAttendance(updated);
    saveToStorage('teacherAttendance', updated);
    pushCurrentDataToCloud({ teacherAttendance: updated });
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
      id: `fee-${Date.now()}`
    };
    const updated = [newRecord, ...stateRef.current.feeRecords];
    setFeeRecords(updated);
    saveToStorage('feeRecords', updated);
    pushCurrentDataToCloud({ feeRecords: updated });
  };

  const updateFeeRecord = (updated: FeeRecord) => {
    hasPendingLocalMutation.current = true;
    const updatedList = stateRef.current.feeRecords.map(f => (f.id === updated.id ? updated : f));
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList });
  };

  const deleteFeeRecord = (feeRecordId: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([feeRecordId]);
    const updatedList = stateRef.current.feeRecords.filter(f => f.id !== feeRecordId);
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList, deletedIds: nextDeleted });
  };

  const recordFeePayment = (feeRecordId: string, amount: number, receiptNo: string) => {
    hasPendingLocalMutation.current = true;
    const today = new Date().toISOString().split('T')[0];
    const updated = stateRef.current.feeRecords.map(f => {
      if (f.id === feeRecordId) {
        const newPaid = f.paidAmount + amount;
        const newBalance = Math.max(0, f.totalPayable - newPaid);
        const status: 'Paid' | 'Partial' | 'Unpaid' = newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...f,
          paidAmount: newPaid,
          balanceRemaining: newBalance,
          status,
          paymentDate: today,
          receiptNo: receiptNo || `REC-BSS-${Date.now().toString().slice(-4)}`
        };
      }
      return f;
    });
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
      const exists = stateRef.current.feeRecords.some(f => f.studentId === st.id && f.month === monthName);
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
      const updated = [...newRecords, ...stateRef.current.feeRecords];
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

  // Tests
  const addTest = (testData: Omit<Test, 'id'>): Test => {
    hasPendingLocalMutation.current = true;
    const newTest: Test = {
      ...testData,
      id: `tst-${Date.now()}`
    };
    const updated = [newTest, ...stateRef.current.tests];
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
    setTestResults(updated);
    saveToStorage('testResults', updated);
    pushCurrentDataToCloud({ testResults: updated });
  };

  // Official Student Exam Reports (Tests & Results Section)
  const saveStudentExamReport = (report: StudentExamReport) => {
    hasPendingLocalMutation.current = true;
    const updated = [...stateRef.current.studentExamReports];
    const idx = updated.findIndex(r => r.id === report.id);
    const enriched: StudentExamReport = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      updated[idx] = enriched;
    } else {
      updated.unshift(enriched);
    }
    setStudentExamReports(updated);
    saveToStorage('studentExamReports', updated);
    pushCurrentDataToCloud({ studentExamReports: updated });
  };

  const deleteStudentExamReport = (reportId: string) => {
    hasPendingLocalMutation.current = true;
    const nextDeleted = recordDeletedIds([reportId]);
    const updated = stateRef.current.studentExamReports.filter(r => r.id !== reportId);
    setStudentExamReports(updated);
    saveToStorage('studentExamReports', updated);
    pushCurrentDataToCloud({ studentExamReports: updated, deletedIds: nextDeleted });
  };

  const togglePublishExamReport = (reportId: string) => {
    hasPendingLocalMutation.current = true;
    const updated = stateRef.current.studentExamReports.map(r =>
      r.id === reportId ? { ...r, isPublished: !r.isPublished, updatedAt: new Date().toISOString() } : r
    );
    setStudentExamReports(updated);
    saveToStorage('studentExamReports', updated);
    pushCurrentDataToCloud({ studentExamReports: updated });
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

    const studentFees = feeRecords.filter(f => f.studentId === studentId);
    const totalFineAmount = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + curr.fineAmount, 0)
      : computedFine;
    const monthlyFee = studentFees.length > 0 ? studentFees[0].tuitionFee : student.monthlyFee;
    const totalPayable = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + curr.totalPayable, 0)
      : student.monthlyFee + computedFine;
    const paidAmount = studentFees.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const balanceRemaining = studentFees.length > 0
      ? studentFees.reduce((acc, curr) => acc + curr.balanceRemaining, 0)
      : Math.max(0, totalPayable - paidAmount);
    const feeStatus = balanceRemaining === 0 ? 'Clear (Paid)' : `Due Rs. ${balanceRemaining.toLocaleString()}`;

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
        updateStudent,
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
        markTeacherAttendance,
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
        studentExamReports,
        saveStudentExamReport,
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
        isCloudConnected,
        isCloudSyncing,
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
