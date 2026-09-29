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
  teacherPassword: 'teacher123',
  finePerAbsentDay: 30, // Rs. 30 per unapproved absent day
  schoolName: 'Bright Scholar School',
  schoolSlogan: 'Pehle Tarbiyat, Phir Taleem',
  schoolAddress: 'Chak No. 47 GB, Samundri, Faisalabad, Punjab, Pakistan',
  schoolPhone: '0302-5053993',
  schoolWhatsApp: '0302-5053993',
};

export const initialTeachers: Teacher[] = [];

export const initialSalaryTransactions: import('../types').SalaryTransaction[] = [];

export const initialStudents: Student[] = [];

export const initialAttendance: StudentAttendance[] = [];

export const initialTeacherAttendance: TeacherAttendance[] = [];

export const initialLeaves: LeaveRequest[] = [];

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
