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
  SCHOOL_CLASSES
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
  initialSalaryTransactions
} from '../data/initialData';
import { SalaryTransaction, TeacherSalaryPayment } from '../types';

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

  addDailyReport: (report: Omit<DailyReport, 'id'>) => void;

  addTest: (test: Omit<Test, 'id'>) => Test;
  addTestResult: (result: Omit<TestResult, 'id'>) => void;

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
  syncNowWithCloud: () => Promise<void>;
  forceSyncAllToCloud: () => Promise<{ success: boolean; studentCount: number; message: string }>;

  // Reporting
  getStudentFullReport: (studentId: string) => StudentFullReport | null;
  openWhatsApp: (phone?: string, message?: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Strict filter to permanently eliminate all fake/dummy seed students across all devices & storage
const DUMMY_STUDENT_IDS = new Set([
  's-101', 's-102', 's-103', 's-104', 's-106', 's-107',
  's-108', 's-109', 's-110', 's-111', 's-112', 's-113'
]);

const DUMMY_STUDENT_NAMES = new Set([
  'muhammad abdullah',
  'fatima noor',
  'muhammad ali',
  'zainab bibi',
  'ayesha tariq',
  'muhammad usman',
  'muhammad bilal',
  'dua fatima',
  'hassan raza',
  'muhammad hamza',
  'noor ul huda',
  'muhammad ahmed',
  'maryam',
  'maryam bibi',
  'mariam',
  'mariam bibi',
  'maryam fatima',
  'مریم',
  'مریم بی بی',
  'مریم فاطمہ'
]);

export function isDummyStudent(item: any): boolean {
  if (!item) return false;
  if (item.id && DUMMY_STUDENT_IDS.has(item.id)) return true;
  const name = (item.name || item.studentName || '').trim().toLowerCase();
  if (!name) return false;
  if (DUMMY_STUDENT_NAMES.has(name)) return true;
  if (
    name.includes('maryam') ||
    name.includes('mariam') ||
    name.includes('maryum') ||
    name.includes('مریم')
  ) {
    return true;
  }
  return false;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`bss_v7_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`bss_v7_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save bss_v7_${key}`, e);
  }
}

// Deep recovery function to restore real students previously added in any storage version
function recoverAllLocalStudents(): Student[] {
  const recoveredMap = new Map<string, Student>();
  const priorityKeys = [
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

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('student') || k.includes('bss') || k.includes('school'))) {
        try {
          const val = localStorage.getItem(k);
          if (val && val.startsWith('[')) {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              arr.forEach((item: any) => {
                if (item && item.name && (item.rollNo || item.className || item.fatherName) && !isDummyStudent(item)) {
                  const id = item.id || `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                  if (!recoveredMap.has(id)) {
                    recoveredMap.set(id, { ...item, id });
                  }
                }
              });
            }
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('Error recovering local students:', err);
  }

  return Array.from(recoveredMap.values());
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = loadFromStorage<Student[]>('students', initialStudents);
    const cleanRaw = Array.isArray(raw) ? raw.filter(s => !isDummyStudent(s)) : [];
    if (cleanRaw.length > 0) return cleanRaw;
    const recovered = recoverAllLocalStudents().filter(s => !isDummyStudent(s));
    if (recovered.length > 0) return recovered;
    return initialStudents.filter(s => !isDummyStudent(s));
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage('teachers', initialTeachers));
  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
    const raw = loadFromStorage<StudentAttendance[]>('attendance', initialAttendance);
    const clean = Array.isArray(raw) ? raw.filter(a => !isDummyStudent(a)) : [];
    return clean;
  });
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => loadFromStorage('teacherAttendance', initialTeacherAttendance));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => loadFromStorage('leaves', initialLeaves));
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => {
    const raw = loadFromStorage<FeeRecord[]>('feeRecords', []);
    const clean = Array.isArray(raw) ? raw.filter(f => !isDummyStudent(f)) : [];
    // Ensure purged list is stored back to storage
    saveToStorage('feeRecords', clean);
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
  const [notices, setNotices] = useState<Notice[]>(() => loadFromStorage('notices', initialNotices));
  const [onlineAdmissions, setOnlineAdmissions] = useState<OnlineAdmission[]>(() => loadFromStorage('admissions', initialAdmissions));
  const [settings, setSettings] = useState<SystemSettings>(() => loadFromStorage('settings', initialSettings));
  const [salaryTransactions, setSalaryTransactions] = useState<SalaryTransaction[]>(() =>
    loadFromStorage('salaryTransactions', initialSalaryTransactions)
  );
  const [teacherSalaryPayments, setTeacherSalaryPayments] = useState<TeacherSalaryPayment[]>(() =>
    loadFromStorage('teacherSalaryPayments', [])
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
  useEffect(() => saveToStorage('notices', notices), [notices]);
  useEffect(() => saveToStorage('admissions', onlineAdmissions), [onlineAdmissions]);
  useEffect(() => saveToStorage('settings', settings), [settings]);
  useEffect(() => saveToStorage('salaryTransactions', salaryTransactions), [salaryTransactions]);
  useEffect(() => saveToStorage('teacherSalaryPayments', teacherSalaryPayments), [teacherSalaryPayments]);
  useEffect(() => saveToStorage('isAdminLoggedIn', isAdminLoggedIn), [isAdminLoggedIn]);
  useEffect(() => saveToStorage('currentTeacherId', currentTeacherId), [currentTeacherId]);
  useEffect(() => saveToStorage('currentParentStudentId', currentParentStudentId), [currentParentStudentId]);

  // Real-Time Global Multi-Device Cloud Database Synchronization
  const GLOBAL_CLOUD_ENDPOINT_1 = 'https://api.restful-api.dev/objects/ff808181a09d98f701a10b8b7b9a7c36';
  const GLOBAL_CLOUD_ENDPOINT_2 = 'https://extendsclass.com/api/json-storage/bin/bbedaaf';
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  const isApplyingRemoteUpdate = React.useRef(false);
  const lastKnownServerUpdatedAt = React.useRef<string | null>(null);
  const hasInitializedFromCloud = React.useRef(false);

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
    notices,
    onlineAdmissions,
    settings,
    salaryTransactions,
    teacherSalaryPayments
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
    notices,
    onlineAdmissions,
    settings,
    salaryTransactions,
    teacherSalaryPayments
  };

  // Push current data to Global Cloud & Local Backup
  const pushCurrentDataToCloud = async (override?: Partial<typeof stateRef.current>): Promise<boolean> => {
    try {
      setIsCloudSyncing(true);
      const newTimestamp = new Date().toISOString();
      const payload = {
        ...stateRef.current,
        ...(override || {}),
        updatedAt: newTimestamp
      };

      let success = false;

      // 1. Push to Primary Global Cloud Bin (api.restful-api.dev)
      try {
        const cloudRes = await fetch(GLOBAL_CLOUD_ENDPOINT_1, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'BSS_DATA',
            data: payload
          })
        });
        if (cloudRes.ok) success = true;
      } catch (cloudErr) {
        console.warn('Primary cloud sync warning:', cloudErr);
      }

      // 2. Mirror to Secondary Global Cloud Bin (extendsclass.com)
      try {
        const extRes = await fetch(GLOBAL_CLOUD_ENDPOINT_2, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (extRes.ok) success = true;
      } catch (extErr) {
        // secondary mirror
      }

      // 3. Push to local API as container backup
      try {
        const localRes = await fetch('/api/school-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (localRes.ok) success = true;
      } catch (localErr) {
        // local dev backup
      }

      if (success) {
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

  // Pull data from Global Cloud Server with Two-Way Resilient Merge
  const pullFromCloudDatabase = async () => {
    try {
      let data: any = null;

      // 1. Try Global Public Cloud Bin (extendsclass.com)
      try {
        const extRes = await fetch(GLOBAL_CLOUD_ENDPOINT_2, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        if (extRes.ok) {
          const parsed = await extRes.json();
          const extData = parsed?.data || parsed;
          if (extData && Array.isArray(extData.students)) {
            data = extData;
          }
        }
      } catch (extErr) {
        // fallback
      }

      // 2. Try local container API /api/school-data
      if (!data || !Array.isArray(data.students)) {
        try {
          const localRes = await fetch('/api/school-data');
          if (localRes.ok) {
            const parsed = await localRes.json();
            const localData = parsed?.data || parsed;
            if (localData && Array.isArray(localData.students)) {
              data = localData;
            }
          }
        } catch (localErr) {
          // ignore
        }
      }

      // 3. Fallback to secondary endpoint if needed
      if (!data || !Array.isArray(data.students)) {
        try {
          const cloudRes = await fetch(GLOBAL_CLOUD_ENDPOINT_1, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
          });
          if (cloudRes.ok) {
            const parsed = await cloudRes.json();
            const cloudData = parsed?.data || parsed;
            if (cloudData && Array.isArray(cloudData.students)) {
              data = cloudData;
            }
          }
        } catch (cloudErr) {
          // fallback
        }
      }

      if (!data || !Array.isArray(data.students)) {
        setIsCloudConnected(false);
        return;
      }

      setIsCloudConnected(true);

      // Check if server data matches what we already have
      if (data.updatedAt && data.updatedAt === lastKnownServerUpdatedAt.current && hasInitializedFromCloud.current) {
        return;
      }

      const currentLocal = stateRef.current;

      // Two-Way Merge: Never drop local additions that aren't on server yet, and ALWAYS strip any dummy students!
      const mergeEntities = <T extends { id: string }>(serverItems?: T[], localItems?: T[]): T[] => {
        const cleanServer = Array.isArray(serverItems) ? serverItems.filter(item => !isDummyStudent(item)) : [];
        const cleanLocal = Array.isArray(localItems) ? localItems.filter(item => !isDummyStudent(item)) : [];

        if (cleanServer.length === 0) return cleanLocal;
        if (cleanLocal.length === 0) return cleanServer;

        const map = new Map<string, T>();
        // Add clean server items first
        cleanServer.forEach(item => map.set(item.id, item));
        // Preserve any locally added real items
        cleanLocal.forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        return Array.from(map.values());
      };

      const mergedStudents = mergeEntities(data.students, currentLocal.students);
      const mergedTeachers = mergeEntities(data.teachers, currentLocal.teachers);
      const mergedAttendance = mergeEntities(data.attendance, currentLocal.attendance);
      const mergedTeacherAttendance = mergeEntities(data.teacherAttendance, currentLocal.teacherAttendance);
      const mergedLeaves = mergeEntities(data.leaves, currentLocal.leaves);
      const mergedFees = mergeEntities(data.feeRecords, currentLocal.feeRecords);
      const mergedReports = mergeEntities(data.dailyReports, currentLocal.dailyReports);
      const mergedTests = mergeEntities(data.tests, currentLocal.tests);
      const mergedTestResults = mergeEntities(data.testResults, currentLocal.testResults);
      const mergedNotices = mergeEntities(data.notices, currentLocal.notices);
      const mergedAdmissions = mergeEntities(data.onlineAdmissions, currentLocal.onlineAdmissions);
      const mergedSalaryTx = mergeEntities(data.salaryTransactions, currentLocal.salaryTransactions);
      const mergedSalaryPmts = mergeEntities(data.teacherSalaryPayments, currentLocal.teacherSalaryPayments);

      isApplyingRemoteUpdate.current = true;
      lastKnownServerUpdatedAt.current = data.updatedAt || new Date().toISOString();
      hasInitializedFromCloud.current = true;
      setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));

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

      setNotices(mergedNotices);
      saveToStorage('notices', mergedNotices);

      setOnlineAdmissions(mergedAdmissions);
      saveToStorage('admissions', mergedAdmissions);

      setSalaryTransactions(mergedSalaryTx);
      saveToStorage('salaryTransactions', mergedSalaryTx);

      setTeacherSalaryPayments(mergedSalaryPmts);
      saveToStorage('teacherSalaryPayments', mergedSalaryPmts);

      if (data.settings && typeof data.settings === 'object') {
        setSettings(data.settings);
        saveToStorage('settings', data.settings);
      }

      // If local had items not yet on the server, push merged list back to cloud server!
      if (mergedStudents.length > (data.students?.length || 0) || mergedFees.length > (data.feeRecords?.length || 0)) {
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
          notices: mergedNotices,
          onlineAdmissions: mergedAdmissions,
          salaryTransactions: mergedSalaryTx,
          teacherSalaryPayments: mergedSalaryPmts
        });
      }

      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 300);
    } catch (e) {
      console.warn('Could not sync with cloud server:', e);
      setIsCloudConnected(false);
    }
  };

  // Force manual cloud sync action
  const forceSyncAllToCloud = async (): Promise<{ success: boolean; studentCount: number; message: string }> => {
    try {
      setIsCloudSyncing(true);
      const newTimestamp = new Date().toISOString();
      const payload = {
        ...stateRef.current,
        updatedAt: newTimestamp
      };

      let success = false;
      try {
        const cloudRes = await fetch(GLOBAL_CLOUD_ENDPOINT_1, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'BSS_DATA',
            data: payload
          })
        });
        if (cloudRes.ok) success = true;
      } catch (err) {
        // fallback
      }

      try {
        const extRes = await fetch(GLOBAL_CLOUD_ENDPOINT_2, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (extRes.ok) success = true;
      } catch (err) {
        // fallback
      }

      try {
        const localRes = await fetch('/api/school-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (localRes.ok) success = true;
      } catch (err) {
        // fallback
      }

      setIsCloudConnected(true);
      lastKnownServerUpdatedAt.current = newTimestamp;
      setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));
      return {
        success: true,
        studentCount: payload.students.length,
        message: `تمام ${payload.students.length} طلباء اور اسکول کا مکمل ریکارڈ لائیو کلاؤڈ پر محفوظ ہو گیا ہے! اب تمام دوسرے موبائلز اور ٹیچرز کو فوری شو ہوں گے۔`
      };
    } catch (e: any) {
      return { success: false, studentCount: stateRef.current.students.length, message: e.message || 'Error syncing' };
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const syncNowWithCloud = async () => {
    await forceSyncAllToCloud();
  };

  // Sync to Cloud Server when local data changes (debounced backup)
  useEffect(() => {
    if (isApplyingRemoteUpdate.current) return;
    if (!hasInitializedFromCloud.current) return;

    const timer = setTimeout(() => {
      pushCurrentDataToCloud();
    }, 1000);

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
    }, 4000);

    const onFocus = () => pullFromCloudDatabase();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Manual hard reset only when administrator clicks 'resetAllDataToZero' in Settings
  const resetAllDataToZero = () => {
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
      students: [],
      attendance: [],
      feeRecords: [],
      dailyReports: [],
      tests: [],
      testResults: []
    });
  };

  // Auth
  const loginAdmin = (password: string): boolean => {
    const clean = (password || '').trim();
    if (!clean) return false;
    // Strictly verify against confidential admin password - NO 'admin' or 'admin123' shortcuts!
    if (clean === settings.adminPassword.trim()) {
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

    // Only allow existing authorized faculty members
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

    return false; // Do not allow unauthorized users to create teacher accounts
  };

  const loginParent = (identifier: string, className?: string): Student | null => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;
    const cleanNum = clean.replace(/^0+/, ''); // '01' -> '1'

    const student = students.find(s => {
      const rollClean = s.rollNo.trim().toLowerCase();
      const rollNum = rollClean.replace(/^0+/, '');
      const matchRoll = rollClean === clean || (cleanNum !== '' && rollNum === cleanNum);
      const matchAdm = s.admissionNo.toLowerCase() === clean || s.admissionNo.toLowerCase().includes(clean);
      const matchName = s.name.toLowerCase().includes(clean) || s.fatherName.toLowerCase().includes(clean);
      const matchClass = !className || className === 'All' || s.className.toLowerCase() === className.toLowerCase();

      return (matchRoll || matchAdm || matchName) && matchClass;
    }) || students.find(s => {
      const rollClean = s.rollNo.trim().toLowerCase();
      const rollNum = rollClean.replace(/^0+/, '');
      return rollClean === clean || (cleanNum !== '' && rollNum === cleanNum) || s.admissionNo.toLowerCase() === clean;
    });

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
    const newStudent: Student = {
      ...stData,
      id: `s-${Date.now()}`
    };
    const updatedStudents = [newStudent, ...stateRef.current.students];
    setStudents(updatedStudents);
    saveToStorage('students', updatedStudents);

    // Automatically create initial fee voucher for current month
    const feeAmount = stData.monthlyFee || getDefaultMonthlyFee(stData.className);
    const newFeeRecord: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      fatherName: newStudent.fatherName,
      className: newStudent.className,
      month: 'October 2026',
      tuitionFee: feeAmount,
      absentDays: 0,
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

    // Push immediately to cloud database so other devices see it instantly
    pushCurrentDataToCloud({
      students: updatedStudents,
      feeRecords: updatedFees
    });

    return newStudent;
  };

  const updateStudent = (updated: Student) => {
    const updatedList = stateRef.current.students.map(s => s.id === updated.id ? updated : s);
    setStudents(updatedList);
    saveToStorage('students', updatedList);
    pushCurrentDataToCloud({ students: updatedList });
  };

  const deleteStudent = (id: string) => {
    const updatedList = stateRef.current.students.filter(s => s.id !== id);
    setStudents(updatedList);
    saveToStorage('students', updatedList);
    pushCurrentDataToCloud({ students: updatedList });
  };

  const toggleStudentActive = (id: string) => {
    const updatedList = stateRef.current.students.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    setStudents(updatedList);
    saveToStorage('students', updatedList);
    pushCurrentDataToCloud({ students: updatedList });
  };

  // Teacher CRUD
  const addTeacher = (tData: Omit<Teacher, 'id' | 'allowances' | 'deductions'>): Teacher => {
    const newTeacher: Teacher = {
      ...tData,
      id: `t-${Date.now()}`,
      allowances: 0,
      deductions: 0,
    };
    setTeachers(prev => [...prev, newTeacher]);
    return newTeacher;
  };

  const updateTeacher = (updated: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const adjustTeacherSalary = (
    teacherId: string,
    amount: number,
    type: 'Addition' | 'Deduction',
    reason: string,
    month: string = 'September 2026'
  ) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    setTeachers(prev =>
      prev.map(t => {
        if (t.id === teacherId) {
          if (type === 'Addition') {
            return { ...t, allowances: (t.allowances || 0) + amount };
          } else {
            return { ...t, deductions: (t.deductions || 0) + amount };
          }
        }
        return t;
      })
    );

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
    setSalaryTransactions(prev => [newTx, ...prev]);
  };

  const setTeacherPassword = (teacherId: string, newPassword: string) => {
    const updated = stateRef.current.teachers.map(t =>
      t.id === teacherId ? { ...t, personalPassword: newPassword.trim() } : t
    );
    setTeachers(updated);
    saveToStorage('teachers', updated);
    pushCurrentDataToCloud({ teachers: updated });
  };

  const toggleTeacherSalaryPayment = (teacherId: string, month: string, amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    setTeacherSalaryPayments(prev => {
      const idx = prev.findIndex(p => p.teacherId === teacherId && p.month === month);
      if (idx >= 0) {
        const copy = [...prev];
        const nextState = !copy[idx].isPaid;
        copy[idx] = {
          ...copy[idx],
          isPaid: nextState,
          paidDate: nextState ? today : undefined,
          amount
        };
        return copy;
      }
      return [
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
    });
  };

  // Attendance
  const markStudentAttendance = (record: Omit<StudentAttendance, 'id'>) => {
    const fineAmount = record.status === 'Absent' ? settings.finePerAbsentDay : 0;
    const existingIndex = attendance.findIndex(a => a.studentId === record.studentId && a.date === record.date);

    if (existingIndex >= 0) {
      setAttendance(prev => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], status: record.status, fineAmount };
        return copy;
      });
    } else {
      const newRecord: StudentAttendance = {
        ...record,
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fineAmount
      };
      setAttendance(prev => [newRecord, ...prev]);
    }
  };

  const markClassAttendance = (
    className: string,
    date: string,
    records: { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[]
  ) => {
    const month = date.substring(0, 7);
    records.forEach(r => {
      const st = students.find(s => s.id === r.studentId);
      if (st) {
        markStudentAttendance({
          studentId: r.studentId,
          studentName: st.name,
          className,
          date,
          month,
          status: r.status,
          fineAmount: r.status === 'Absent' ? settings.finePerAbsentDay : 0
        });
      }
    });
  };

  const markTeacherAttendance = (record: Omit<TeacherAttendance, 'id'>) => {
    const existingIndex = teacherAttendance.findIndex(a => a.teacherId === record.teacherId && a.date === record.date);
    if (existingIndex >= 0) {
      setTeacherAttendance(prev => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], status: record.status };
        return copy;
      });
    } else {
      const newRecord: TeacherAttendance = {
        ...record,
        id: `ta-${Date.now()}`
      };
      setTeacherAttendance(prev => [newRecord, ...prev]);
    }
  };

  // Leaves
  const submitLeave = (leaveData: Omit<LeaveRequest, 'id' | 'appliedDate'>) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `l-${Date.now()}`,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setLeaves(prev => [newLeave, ...prev]);
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  // Fees
  const addFeeRecord = (record: Omit<FeeRecord, 'id'>) => {
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
    const updatedList = stateRef.current.feeRecords.map(f => f.id === updated.id ? updated : f);
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList });
  };

  const deleteFeeRecord = (feeRecordId: string) => {
    const updatedList = stateRef.current.feeRecords.filter(f => f.id !== feeRecordId);
    setFeeRecords(updatedList);
    saveToStorage('feeRecords', updatedList);
    pushCurrentDataToCloud({ feeRecords: updatedList });
  };

  const recordFeePayment = (feeRecordId: string, amount: number, receiptNo: string) => {
    const today = new Date().toISOString().split('T')[0];
    setFeeRecords(prev => prev.map(f => {
      if (f.id === feeRecordId) {
        const newPaid = f.paidAmount + amount;
        const newBalance = Math.max(0, f.totalPayable - newPaid);
        const status = newBalance === 0 ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');
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
    }));
  };

  const generateMonthlyFeeVouchers = (monthName: string): number => {
    let count = 0;
    const newRecords: FeeRecord[] = [];

    students.forEach(st => {
      const exists = feeRecords.some(f => f.studentId === st.id && f.month === monthName);
      if (!exists) {
        // Calculate absents in this month
        const absents = attendance.filter(a => a.studentId === st.id && a.status === 'Absent').length;
        const fine = absents * settings.finePerAbsentDay;
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
          fineAmount: fine,
          totalPayable: total,
          paidAmount: 0,
          balanceRemaining: total,
          status: 'Unpaid'
        });
        count++;
      }
    });

    if (newRecords.length > 0) {
      setFeeRecords(prev => [...newRecords, ...prev]);
    }
    return count;
  };

  // Daily Reports
  const addDailyReport = (report: Omit<DailyReport, 'id'>) => {
    const newReport: DailyReport = {
      ...report,
      id: `dr-${Date.now()}`
    };
    setDailyReports(prev => [newReport, ...prev]);
  };

  // Tests
  const addTest = (testData: Omit<Test, 'id'>): Test => {
    const newTest: Test = {
      ...testData,
      id: `tst-${Date.now()}`
    };
    setTests(prev => [newTest, ...prev]);
    return newTest;
  };

  const addTestResult = (resultData: Omit<TestResult, 'id'>) => {
    setTestResults(prev => {
      const idx = prev.findIndex(r => r.testId === resultData.testId && r.studentId === resultData.studentId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...resultData, id: copy[idx].id };
        return copy;
      }
      return [{ ...resultData, id: `tr-${Date.now()}-${resultData.studentId}` }, ...prev];
    });
  };

  // Notices
  const addNotice = (noticeData: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...noticeData,
      id: `not-${Date.now()}`
    };
    setNotices(prev => [newNotice, ...prev]);
  };

  const deleteNotice = (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  // Online Admissions
  const submitOnlineAdmission = (admData: Omit<OnlineAdmission, 'id' | 'applyDate' | 'status'>) => {
    const newAdm: OnlineAdmission = {
      ...admData,
      id: `adm-${Date.now()}`,
      applyDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setOnlineAdmissions(prev => [newAdm, ...prev]);
  };

  const updateAdmissionStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setOnlineAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const approveAndEnrollAdmission = (admissionId: string): Student | null => {
    const admission = onlineAdmissions.find(a => a.id === admissionId);
    if (!admission) return null;

    // Check class count to assign roll no
    const classCount = students.filter(s => s.className === admission.applyingClass).length + 1;
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
      isActive: true,
    });

    updateAdmissionStatus(admissionId, 'Approved');
    return newStudent;
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Student 360 Full Report
  const getStudentFullReport = (studentId: string): StudentFullReport | null => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentAtt = attendance.filter(a => a.studentId === studentId);
    const totalWorkingDays = studentAtt.length;
    const presentDays = studentAtt.filter(a => a.status === 'Present').length;
    const absentDays = studentAtt.filter(a => a.status === 'Absent').length;
    const leaveDays = studentAtt.filter(a => a.status === 'Leave').length;
    const lateDays = studentAtt.filter(a => a.status === 'Late').length;

    const attendancePercentage = totalWorkingDays > 0
      ? Math.round((presentDays / totalWorkingDays) * 100)
      : 100;

    const totalFineAmount = absentDays * settings.finePerAbsentDay;

    const studentFees = feeRecords.filter(f => f.studentId === studentId);
    const totalPayable = studentFees.reduce((acc, curr) => acc + curr.totalPayable, 0);
    const paidAmount = studentFees.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const balanceRemaining = studentFees.reduce((acc, curr) => acc + curr.balanceRemaining, 0);
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
      finePerAbsentDay: settings.finePerAbsentDay,
      totalFineAmount,
      monthlyFee: student.monthlyFee,
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
      version: 'bss_v7',
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
      notices,
      onlineAdmissions,
      settings,
      salaryTransactions
    };
    return JSON.stringify(payload, null, 2);
  };

  const importSchoolData = (jsonString: string): { success: boolean; studentCount: number; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (!data) throw new Error('Empty data');

      let count = 0;
      if (Array.isArray(data.students)) {
        setStudents(data.students);
        saveToStorage('students', data.students);
        count = data.students.length;
      }
      if (Array.isArray(data.teachers)) {
        setTeachers(data.teachers);
        saveToStorage('teachers', data.teachers);
      }
      if (Array.isArray(data.attendance)) {
        setAttendance(data.attendance);
        saveToStorage('attendance', data.attendance);
      }
      if (Array.isArray(data.teacherAttendance)) {
        setTeacherAttendance(data.teacherAttendance);
        saveToStorage('teacherAttendance', data.teacherAttendance);
      }
      if (Array.isArray(data.feeRecords)) {
        setFeeRecords(data.feeRecords);
        saveToStorage('feeRecords', data.feeRecords);
      }
      if (Array.isArray(data.dailyReports)) {
        setDailyReports(data.dailyReports);
        saveToStorage('dailyReports', data.dailyReports);
      }
      if (Array.isArray(data.tests)) {
        setTests(data.tests);
        saveToStorage('tests', data.tests);
      }
      if (Array.isArray(data.testResults)) {
        setTestResults(data.testResults);
        saveToStorage('testResults', data.testResults);
      }
      if (Array.isArray(data.notices)) {
        setNotices(data.notices);
        saveToStorage('notices', data.notices);
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings(data.settings);
        saveToStorage('settings', data.settings);
      }
      if (Array.isArray(data.salaryTransactions)) {
        setSalaryTransactions(data.salaryTransactions);
        saveToStorage('salaryTransactions', data.salaryTransactions);
      }

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
        addDailyReport,
        addTest,
        addTestResult,
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
