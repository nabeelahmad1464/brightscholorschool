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
  SystemSettings
} from '../types';

export const initialSettings: SystemSettings = {
  adminPassword: 'admin',
  teacherPassword: 'teacher',
  finePerAbsentDay: 30, // Rs. 30 per unapproved absent day
  schoolName: 'Bright Scholar School',
  schoolSlogan: 'Pehle Tarbiyat, Phir Taleem',
  schoolAddress: 'Chak No. 47 GB, Samundri, Faisalabad, Punjab, Pakistan',
  schoolPhone: '0302-5053993',
  schoolWhatsApp: '0302-5053993',
};

export const initialTeachers: Teacher[] = [
  {
    id: 't-1',
    name: 'Sir Muhammad Ali',
    qualification: 'M.Sc. Mathematics (UAF)',
    subject: 'Mathematics & Science',
    assignedClasses: 'Class 5, Class 6, Class 7, Class 8 / Middle',
    contactNo: '0302-5053993',
    whatsappNo: '0302-5053993',
    joiningDate: '2022-03-01',
    salary: 32000,
    allowances: 2000,
    deductions: 0,
    personalPassword: 'ali123'
  },
  {
    id: 't-2',
    name: 'Madam Fatima Zahra',
    qualification: 'M.A. English & B.Ed',
    subject: 'English & Urdu',
    assignedClasses: 'Class 1, Class 2, Class 3, Class 4',
    contactNo: '0301-7654321',
    whatsappNo: '0302-5053993',
    joiningDate: '2023-01-15',
    salary: 28000,
    allowances: 0,
    deductions: 500,
    personalPassword: 'fatima123'
  },
  {
    id: 't-3',
    name: 'Madam Ayesha Noor',
    qualification: 'M.A. Islamic Studies, Montessori Certified',
    subject: 'Early Childhood Education & Tarbiyat',
    assignedClasses: 'Play Group, Nursery, Prep',
    contactNo: '0304-1122334',
    whatsappNo: '0302-5053993',
    joiningDate: '2023-08-01',
    salary: 25000,
    allowances: 1000,
    deductions: 0,
    personalPassword: 'ayesha123'
  },
  {
    id: 't-4',
    name: 'Qari Hafiz Abdul Rehman',
    qualification: 'Dars-e-Nizami & Wafaq-ul-Madaris',
    subject: 'Nazra Quran, Tajweed & Islamiat',
    assignedClasses: 'All Classes (Play Group to Middle)',
    contactNo: '0306-9988776',
    whatsappNo: '0302-5053993',
    joiningDate: '2021-09-01',
    salary: 26000,
    allowances: 1500,
    deductions: 0,
    personalPassword: 'rehman123'
  }
];

export const initialSalaryTransactions: import('../types').SalaryTransaction[] = [
  {
    id: 'sal-1',
    teacherId: 't-1',
    teacherName: 'Sir Muhammad Ali',
    month: 'September 2026',
    amount: 2000,
    type: 'Addition',
    reason: 'Exam preparation & extra evening revision classes bonus',
    date: '2026-09-20'
  },
  {
    id: 'sal-2',
    teacherId: 't-2',
    teacherName: 'Madam Fatima Zahra',
    month: 'September 2026',
    amount: 500,
    type: 'Deduction',
    reason: 'Advance salary withdrawal installment',
    date: '2026-09-15'
  }
];

export const initialStudents: Student[] = [];

export const initialAttendance: StudentAttendance[] = [];

export const initialTeacherAttendance: TeacherAttendance[] = [
  { id: 'ta-1', teacherId: 't-1', teacherName: 'Sir Muhammad Ali', date: '2026-09-29', month: '2026-09', status: 'Present' },
  { id: 'ta-2', teacherId: 't-2', teacherName: 'Madam Fatima Zahra', date: '2026-09-29', month: '2026-09', status: 'Present' },
  { id: 'ta-3', teacherId: 't-3', teacherName: 'Madam Ayesha Noor', date: '2026-09-29', month: '2026-09', status: 'Present' },
  { id: 'ta-4', teacherId: 't-4', teacherName: 'Qari Hafiz Abdul Rehman', date: '2026-09-29', month: '2026-09', status: 'Present' },
];

export const initialLeaves: LeaveRequest[] = [
  {
    id: 'l-3',
    applicantId: 't-2',
    applicantName: 'Madam Fatima Zahra',
    role: 'teacher',
    fromDate: '2026-10-05',
    toDate: '2026-10-05',
    numberOfDays: 1,
    reason: 'Medical appointment',
    status: 'Pending',
    appliedDate: '2026-09-28',
  }
];

export const initialFeeRecords: FeeRecord[] = [];

export const initialDailyReports: DailyReport[] = [];

export const initialTests: Test[] = [];

export const initialTestResults: TestResult[] = [];

export const initialNotices: Notice[] = [
  {
    id: 'not-1',
    title: 'Admissions Open Session 2026-2027',
    category: 'Announcement',
    date: '2026-09-28',
    content: 'Admissions are open from Play Group to Class 8 / Middle. Parents can fill the Online Admission Form on our website or visit school office in Chak 47 GB, Samundri.',
    targetAudience: 'All',
  },
  {
    id: 'not-2',
    title: 'Absence Fine Policy & Punctuality',
    category: 'Fee Notice',
    date: '2026-09-20',
    content: 'As per school discipline rules, unapproved absence will incur a fine of Rs. 30 per day. Please submit leave requests in advance through the Parent Portal.',
    targetAudience: 'Parents',
  },
  {
    id: 'not-3',
    title: 'Parent-Teacher Meeting (PTM) Scheduled',
    category: 'Parent Meeting',
    date: '2026-09-15',
    content: 'PTM for September progress reviews and moral tarbiyat discussion will be held on the first Saturday of next month from 9:00 AM to 1:00 PM.',
    targetAudience: 'Parents',
  },
  {
    id: 'not-4',
    title: 'Weekly Nazra Quran & Hadith Competition',
    category: 'Announcement',
    date: '2026-09-10',
    content: 'Under the motto "Pehle Tarbiyat, Phir Taleem", all students will participate in Friday recitation & ethical character building sessions.',
    targetAudience: 'All',
  }
];

export const initialAdmissions: OnlineAdmission[] = [
  {
    id: 'adm-1',
    studentName: 'Bilal Tariq',
    fatherName: 'Tariq Hussain',
    dob: '2019-04-14',
    gender: 'Male',
    applyingClass: 'Class 2',
    previousSchool: 'Govt Primary School Chak 47',
    contactNo: '0308-7654321',
    whatsappNo: '0308-7654321',
    address: 'Chak No. 47 GB, Samundri',
    applyDate: '2026-09-27',
    status: 'Pending',
    notes: 'Called father; scheduled interview for Saturday morning.',
  },
  {
    id: 'adm-2',
    studentName: 'Ayesha Siddiqua',
    fatherName: 'Imran Nazir',
    dob: '2021-08-01',
    gender: 'Female',
    applyingClass: 'Play Group',
    previousSchool: 'None (First time admission)',
    contactNo: '0302-5053993',
    whatsappNo: '0302-5053993',
    address: 'Near Water Filtration Plant, Chak 47 GB',
    applyDate: '2026-09-28',
    status: 'Pending',
  }
];
