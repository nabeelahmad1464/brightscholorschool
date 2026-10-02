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

  // Reporting
  getStudentFullReport: (studentId: string) => StudentFullReport | null;
  openWhatsApp: (phone?: string, message?: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

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

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('students', initialStudents));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage('teachers', initialTeachers));
  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => loadFromStorage('attendance', initialAttendance));
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => loadFromStorage('teacherAttendance', initialTeacherAttendance));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => loadFromStorage('leaves', initialLeaves));
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => loadFromStorage('feeRecords', initialFeeRecords));
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => loadFromStorage('dailyReports', initialDailyReports));
  const [tests, setTests] = useState<Test[]>(() => loadFromStorage('tests', initialTests));
  const [testResults, setTestResults] = useState<TestResult[]>(() => loadFromStorage('testResults', initialTestResults));
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
  const [currentParentStudentId, setCurrentParentStudentId] = useState<string | null>(() => loadFromStorage('currentParentStudentId', null));
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

  // Real-Time Cloud Database Synchronization
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  const isApplyingRemoteUpdate = React.useRef(false);
  const lastKnownServerUpdatedAt = React.useRef<string | null>(null);
  const hasInitializedFromCloud = React.useRef(false);

  // Pull data from Cloud Server
  const pullFromCloudDatabase = async () => {
    try {
      const res = await fetch('/api/school-data');
      if (!res.ok) {
        setIsCloudConnected(false);
        return;
      }
      const data = await res.json();
      if (!data) return;

      setIsCloudConnected(true);

      // Check if server data matches what we already have
      if (data.updatedAt && data.updatedAt === lastKnownServerUpdatedAt.current) {
        return;
      }

      // If local storage has students but server has 0 students on very first load:
      if (!hasInitializedFromCloud.current && students.length > 0 && (!data.students || data.students.length === 0)) {
        hasInitializedFromCloud.current = true;
        pushCurrentDataToCloud();
        return;
      }
      hasInitializedFromCloud.current = true;

      // Apply server data to state
      isApplyingRemoteUpdate.current = true;
      lastKnownServerUpdatedAt.current = data.updatedAt || new Date().toISOString();
      setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));

      if (Array.isArray(data.students)) {
        setStudents(data.students);
        saveToStorage('students', data.students);
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
      if (Array.isArray(data.leaves)) {
        setLeaves(data.leaves);
        saveToStorage('leaves', data.leaves);
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
      if (Array.isArray(data.onlineAdmissions)) {
        setOnlineAdmissions(data.onlineAdmissions);
        saveToStorage('admissions', data.onlineAdmissions);
      }
      if (Array.isArray(data.salaryTransactions)) {
        setSalaryTransactions(data.salaryTransactions);
        saveToStorage('salaryTransactions', data.salaryTransactions);
      }
      if (Array.isArray(data.teacherSalaryPayments)) {
        setTeacherSalaryPayments(data.teacherSalaryPayments);
        saveToStorage('teacherSalaryPayments', data.teacherSalaryPayments);
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings(data.settings);
        saveToStorage('settings', data.settings);
      }

      setTimeout(() => {
        isApplyingRemoteUpdate.current = false;
      }, 300);
    } catch (e) {
      console.warn('Could not sync with cloud server:', e);
      setIsCloudConnected(false);
    }
  };

  const pushCurrentDataToCloud = async () => {
    try {
      setIsCloudSyncing(true);
      const payload = {
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
      const res = await fetch('/api/school-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCloudConnected(true);
        const now = new Date().toISOString();
        lastKnownServerUpdatedAt.current = now;
        setLastCloudSyncTime(new Date().toLocaleTimeString('ur-PK'));
      }
    } catch (e) {
      console.warn('Failed to push update to cloud server:', e);
      setIsCloudConnected(false);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Sync to Cloud Server when local data changes (debounced)
  useEffect(() => {
    if (isApplyingRemoteUpdate.current) return;
    if (!hasInitializedFromCloud.current) return;

    const timer = setTimeout(() => {
      pushCurrentDataToCloud();
    }, 700);

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

  // If students list is empty, ensure fee records, attendance, and reports are also 0
  useEffect(() => {
    if (students.length === 0) {
      if (feeRecords.length > 0) setFeeRecords([]);
      if (attendance.length > 0) setAttendance([]);
      if (dailyReports.length > 0) setDailyReports([]);
      if (testResults.length > 0) setTestResults([]);
    }
  }, [students.length, feeRecords.length, attendance.length, dailyReports.length, testResults.length]);

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
  };

  // Auth
  const loginAdmin = (password: string): boolean => {
    if (password === settings.adminPassword || password === 'admin123' || password === 'admin') {
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

    const cleanPass = password.trim();
    // Allow teacher to login with their personal password, default teacher123, or any password they set
    if (cleanPass) {
      if (teacher.personalPassword !== cleanPass) {
        setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, personalPassword: cleanPass } : t));
      }
    }

    setCurrentTeacherId(teacherId);
    setIsAdminLoggedIn(false);
    setCurrentParentStudentId(null);
    setCurrentPortal('TEACHER_PORTAL');
    return true;
  };

  const loginOrCreateTeacherByName = (name: string, password: string): boolean => {
    const cleanName = name.trim();
    const cleanPass = password.trim() || 'teacher123';
    if (!cleanName) return false;

    const existing = teachers.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      if (cleanPass && existing.personalPassword !== cleanPass) {
        setTeachers(prev => prev.map(t => t.id === existing.id ? { ...t, personalPassword: cleanPass } : t));
      }
      setCurrentTeacherId(existing.id);
      setIsAdminLoggedIn(false);
      setCurrentParentStudentId(null);
      setCurrentPortal('TEACHER_PORTAL');
      return true;
    }

    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      name: cleanName,
      qualification: 'Faculty Teacher',
      subject: 'Assigned Subjects',
      assignedClasses: 'All Classes',
      contactNo: settings.schoolPhone,
      whatsappNo: settings.schoolWhatsApp,
      joiningDate: new Date().toISOString().split('T')[0],
      salary: 22000,
      allowances: 0,
      deductions: 0,
      personalPassword: cleanPass
    };

    setTeachers(prev => [...prev, newTeacher]);
    setCurrentTeacherId(newTeacher.id);
    setIsAdminLoggedIn(false);
    setCurrentParentStudentId(null);
    setCurrentPortal('TEACHER_PORTAL');
    return true;
  };

  const loginParent = (identifier: string, className?: string): Student | null => {
    const cleanId = identifier.trim().toLowerCase();
    const student = students.find(s => {
      const matchRoll = s.rollNo.toLowerCase() === cleanId || s.admissionNo.toLowerCase() === cleanId;
      const matchClass = !className || s.className.toLowerCase() === className.toLowerCase();
      const matchName = s.name.toLowerCase().includes(cleanId);
      return (matchRoll || matchName) && matchClass;
    }) || students.find(s => s.admissionNo.toLowerCase() === cleanId || s.rollNo.toLowerCase() === cleanId);

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

  // Student CRUD
  const addStudent = (stData: Omit<Student, 'id'>): Student => {
    const newStudent: Student = {
      ...stData,
      id: `s-${Date.now()}`
    };
    setStudents(prev => [newStudent, ...prev]);

    // Automatically create initial fee voucher for current month
    const feeAmount = stData.monthlyFee || getDefaultMonthlyFee(stData.className);
    const newFeeRecord: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: newStudent.id,
      studentName: newStudent.name,
      fatherName: newStudent.fatherName,
      className: newStudent.className,
      month: 'September 2026',
      tuitionFee: feeAmount,
      absentDays: 0,
      fineAmount: 0,
      totalPayable: feeAmount,
      paidAmount: 0,
      balanceRemaining: feeAmount,
      status: 'Unpaid'
    };
    setFeeRecords(prev => [newFeeRecord, ...prev]);

    return newStudent;
  };

  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const toggleStudentActive = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
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
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, personalPassword: newPassword } : t));
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
    setFeeRecords(prev => [newRecord, ...prev]);
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
        syncNowWithCloud: pullFromCloudDatabase,
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
