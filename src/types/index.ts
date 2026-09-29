export type ClassLevel =
  | 'Play Group'
  | 'Nursery'
  | 'Prep'
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8 / Middle';

export const SCHOOL_CLASSES: ClassLevel[] = [
  'Play Group',
  'Nursery',
  'Prep',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8 / Middle'
];

export function getDefaultMonthlyFee(className: string): number {
  switch (className) {
    case 'Play Group':
    case 'Nursery':
    case 'Prep':
    case 'Class 1':
    case 'Class 2':
    case 'Class 3':
    case 'Class 4':
      return 2000;
    default:
      return 3000; // Class 5 to Class 8 / Middle: Rs. 3,000
  }
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  fatherName: string;
  className: ClassLevel;
  dob: string;
  contactNo: string;
  whatsappNo: string;
  address: string;
  admissionDate: string;
  gender: 'Male' | 'Female';
  monthlyFee: number;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  qualification: string;
  subject: string;
  assignedClasses: string;
  contactNo: string;
  whatsappNo: string;
  joiningDate: string;
  salary: number; // Base monthly salary
  allowances: number; // Additions (Bonus, increment, incentives)
  deductions: number; // Subtractions (Deductions, advances, absents)
  personalPassword?: string; // Password assigned by admin
}

export interface SalaryTransaction {
  id: string;
  teacherId: string;
  teacherName: string;
  month: string;
  amount: number;
  type: 'Addition' | 'Deduction'; // Addition (Bonus/Allowance) or Deduction (Advance/Penalty)
  reason: string;
  date: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  status: AttendanceStatus;
  fineAmount: number;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  month: string;
  status: AttendanceStatus;
}

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  role: 'student' | 'teacher';
  className?: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  className: string;
  month: string; // e.g. "September 2026"
  tuitionFee: number;
  absentDays: number;
  fineAmount: number; // absentDays * finePerDay
  totalPayable: number;
  paidAmount: number;
  balanceRemaining: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  paymentDate?: string;
  receiptNo?: string;
}

export interface DailyReport {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  performance: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement';
  participation: 'Active' | 'Normal' | 'Quiet';
  homework: 'Completed' | 'Incomplete' | 'Not Done';
  behaviour: 'Disciplined' | 'Good' | 'Mischievous';
  discipline: 'Good' | 'Fair' | 'Needs Attention';
  teacherRemarks: string;
  teacherName: string;
}

export interface Test {
  id: string;
  title: string;
  className: string;
  subject: string;
  totalMarks: number;
  testDate: string;
  description: string;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks: string;
}

export interface Notice {
  id: string;
  title: string;
  category: 'Announcement' | 'Holiday' | 'Exam' | 'Fee Notice' | 'Parent Meeting';
  date: string;
  content: string;
  targetAudience: 'All' | 'Parents' | 'Teachers' | 'Students';
}

export interface OnlineAdmission {
  id: string;
  studentName: string;
  fatherName: string;
  dob: string;
  gender: 'Male' | 'Female';
  applyingClass: ClassLevel;
  previousSchool: string;
  contactNo: string;
  whatsappNo: string;
  address: string;
  applyDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
}

export interface SystemSettings {
  adminPassword: string;
  teacherPassword: string;
  finePerAbsentDay: number;
  schoolName: string;
  schoolSlogan: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolWhatsApp: string;
}

export type PortalType = 'PUBLIC_WEBSITE' | 'ADMIN_PORTAL' | 'TEACHER_PORTAL' | 'PARENT_PORTAL';

export type WebsiteTab =
  | 'HOME'
  | 'SEARCH'
  | 'ABOUT'
  | 'CLASSES'
  | 'ADMISSIONS'
  | 'FEE_STRUCTURE'
  | 'FACILITIES'
  | 'NOTICES'
  | 'CONTACT';
