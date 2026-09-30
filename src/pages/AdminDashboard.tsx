import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Folder,
  FileText,
  Clock,
  Settings,
  Bell,
  Search,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  TrendingDown,
  KeyRound,
  Eye,
  EyeOff,
  UserMinus,
  RefreshCw,
  Printer,
  X
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  SCHOOL_CLASSES,
  ClassLevel,
  getDefaultMonthlyFee,
  Student,
  Teacher
} from '../types';

interface AdminDashboardProps {
  onSelectStudent: (student: Student) => void;
}

type AdminTab =
  | 'overview'
  | 'classes'
  | 'attendance'
  | 'teachers'
  | 'fees'
  | 'tests'
  | 'tarbiyat'
  | 'leaves'
  | 'admissions'
  | 'notices'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectStudent }) => {
  const {
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
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentActive,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    adjustTeacherSalary,
    setTeacherPassword,
    markClassAttendance,
    markTeacherAttendance,
    updateLeaveStatus,
    recordFeePayment,
    generateMonthlyFeeVouchers,
    addTest,
    addTestResult,
    addDailyReport,
    addNotice,
    deleteNotice,
    updateAdmissionStatus,
    approveAndEnrollAdmission,
    updateSettings,
    resetAllDataToZero,
    getStudentFullReport
  } = useSchool();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedClassFolder, setSelectedClassFolder] = useState<ClassLevel>('Class 5');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Student Add / Edit state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [stFormName, setStFormName] = useState('');
  const [stFormFather, setStFormFather] = useState('');
  const [stFormClass, setStFormClass] = useState<ClassLevel>('Class 5');
  const [stFormRoll, setStFormRoll] = useState('');
  const [stFormFee, setStFormFee] = useState<number>(3000);
  const [stFormPhone, setStFormPhone] = useState('0302-5053993');
  const [stFormAddress, setStFormAddress] = useState('Chak No. 47 GB, Samundri');

  // Teacher Add / Salary / Password state
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const [tName, setTName] = useState('');
  const [tQualification, setTQualification] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tClasses, setTClasses] = useState('Class 1, Class 2, Class 3');
  const [tPhone, setTPhone] = useState('0302-5053993');
  const [tSalary, setTSalary] = useState<number>(25000);
  const [tPassword, setTPassword] = useState('teacher123');

  // Salary adjustment modal
  const [salaryAdjTeacher, setSalaryAdjTeacher] = useState<Teacher | null>(null);
  const [adjAmount, setAdjAmount] = useState<number>(1000);
  const [adjType, setAdjType] = useState<'Addition' | 'Deduction'>('Addition');
  const [adjReason, setAdjReason] = useState('');
  const [adjMonth, setAdjMonth] = useState('September 2026');

  // Teacher password modal
  const [passTeacher, setPassTeacher] = useState<Teacher | null>(null);
  const [newTeacherPassInput, setNewTeacherPassInput] = useState('');

  // Class-wise Attendance Marker state
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attClass, setAttClass] = useState<ClassLevel>('Class 5');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'monthlyRegister'>('daily');
  const [tempStatusMap, setTempStatusMap] = useState<Record<string, 'Present' | 'Absent' | 'Leave' | 'Late'>>({});

  // Fee payment modal
  const [paymentFeeId, setPaymentFeeId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receiptNo, setReceiptNo] = useState('');

  // New Notice state
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'Announcement' | 'Holiday' | 'Exam' | 'Fee Notice' | 'Parent Meeting'>('Announcement');

  // New Test state
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestClass, setNewTestClass] = useState<ClassLevel>('Class 5');
  const [newTestSubject, setNewTestSubject] = useState('Mathematics');
  const [newTestMarks, setNewTestMarks] = useState(50);

  // Settings state
  const [fineInput, setFineInput] = useState(settings.finePerAbsentDay);
  const [adminPassInput, setAdminPassInput] = useState(settings.adminPassword);
  const [teacherGeneralPassInput, setTeacherGeneralPassInput] = useState(settings.teacherPassword);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // KPI Calculations
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.isActive).length;
  const totalTeachers = teachers.length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const pendingAdmissionsCount = onlineAdmissions.filter(a => a.status === 'Pending').length;
  const totalFeesCollected = students.length === 0 ? 0 : feeRecords.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalFeesPending = students.length === 0 ? 0 : feeRecords.reduce((acc, curr) => acc + curr.balanceRemaining, 0);

  // Class students for folder view
  const classStudents = students.filter(s => s.className === selectedClassFolder);

  // Class attendance metrics for selected class and date
  const classStudentsForAtt = students.filter(s => s.className === attClass && s.isActive);
  const dayRecords = attendance.filter(a => a.className === attClass && a.date === attDate);
  const presentCount = classStudentsForAtt.filter(s => {
    const st = tempStatusMap[s.id] || dayRecords.find(a => a.studentId === s.id)?.status || 'Present';
    return st === 'Present';
  }).length;
  const absentCount = classStudentsForAtt.filter(s => {
    const st = tempStatusMap[s.id] || dayRecords.find(a => a.studentId === s.id)?.status;
    return st === 'Absent';
  }).length;
  const leaveCount = classStudentsForAtt.filter(s => {
    const st = tempStatusMap[s.id] || dayRecords.find(a => a.studentId === s.id)?.status;
    return st === 'Leave';
  }).length;

  // Handlers for Students
  const openAddStudentModal = (cls?: ClassLevel) => {
    setEditingStudent(null);
    setStFormName('');
    setStFormFather('');
    setStFormClass(cls || selectedClassFolder);
    setStFormRoll('');
    setStFormFee(getDefaultMonthlyFee(cls || selectedClassFolder));
    setStFormPhone('0302-5053993');
    setStFormAddress('Chak No. 47 GB, Samundri');
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (st: Student) => {
    setEditingStudent(st);
    setStFormName(st.name);
    setStFormFather(st.fatherName);
    setStFormClass(st.className);
    setStFormRoll(st.rollNo);
    setStFormFee(st.monthlyFee);
    setStFormPhone(st.contactNo);
    setStFormAddress(st.address);
    setShowAddStudentModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stFormName.trim() || !stFormFather.trim()) return;

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        name: stFormName.trim(),
        fatherName: stFormFather.trim(),
        className: stFormClass,
        rollNo: stFormRoll.trim() || editingStudent.rollNo,
        monthlyFee: Number(stFormFee),
        contactNo: stFormPhone.trim(),
        address: stFormAddress.trim(),
      });
      alert(`Student ${stFormName} updated successfully!`);
    } else {
      const count = students.filter(s => s.className === stFormClass).length + 1;
      const rollNo = stFormRoll.trim() || (count < 10 ? `0${count}` : `${count}`);
      const admNo = `BSS-${Date.now().toString().slice(-4)}`;

      addStudent({
        admissionNo: admNo,
        rollNo,
        name: stFormName.trim(),
        fatherName: stFormFather.trim(),
        className: stFormClass,
        dob: '2016-04-10',
        contactNo: stFormPhone.trim(),
        whatsappNo: stFormPhone.trim(),
        address: stFormAddress.trim(),
        admissionDate: new Date().toISOString().split('T')[0],
        gender: 'Male',
        monthlyFee: Number(stFormFee),
        isActive: true,
      });
      alert(`Student ${stFormName} enrolled in ${stFormClass} with Roll No: ${rollNo}!`);
    }

    setShowAddStudentModal(false);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      alert(`Student ${studentToDelete.name} has been removed from records.`);
      setStudentToDelete(null);
    }
  };

  // Handlers for Teachers & Salary
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tSubject.trim()) return;

    if (editingTeacher) {
      updateTeacher({
        ...editingTeacher,
        name: tName.trim(),
        qualification: tQualification.trim(),
        subject: tSubject.trim(),
        assignedClasses: tClasses.trim(),
        contactNo: tPhone.trim(),
        salary: Number(tSalary),
        personalPassword: tPassword.trim() || editingTeacher.personalPassword
      });
      alert(`Teacher ${tName} updated!`);
    } else {
      addTeacher({
        name: tName.trim(),
        qualification: tQualification.trim() || 'Graduate',
        subject: tSubject.trim(),
        assignedClasses: tClasses.trim() || 'All Classes',
        contactNo: tPhone.trim(),
        whatsappNo: tPhone.trim(),
        joiningDate: new Date().toISOString().split('T')[0],
        salary: Number(tSalary),
        personalPassword: tPassword.trim() || 'teacher123'
      });
      alert(`New teacher ${tName} added to faculty!`);
    }

    setShowAddTeacherModal(false);
  };

  const handleApplySalaryAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryAdjTeacher || adjAmount <= 0) return;

    adjustTeacherSalary(
      salaryAdjTeacher.id,
      Number(adjAmount),
      adjType,
      adjReason.trim() || (adjType === 'Addition' ? 'Bonus / Incentive' : 'Salary Deduction / Advance'),
      adjMonth
    );

    alert(`Salary ${adjType} of Rs. ${adjAmount.toLocaleString()} recorded for ${salaryAdjTeacher.name}!`);
    setSalaryAdjTeacher(null);
    setAdjAmount(1000);
    setAdjReason('');
  };

  const handleSaveTeacherPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passTeacher || !newTeacherPassInput.trim()) return;

    setTeacherPassword(passTeacher.id, newTeacherPassInput.trim());
    alert(`Password for ${passTeacher.name} set to "${newTeacherPassInput.trim()}"!`);
    setPassTeacher(null);
    setNewTeacherPassInput('');
  };

  // Handlers for Attendance
  const handleSaveAttendance = () => {
    const list = classStudentsForAtt.map(s => ({
      studentId: s.id,
      status: tempStatusMap[s.id] ||
        attendance.find(a => a.studentId === s.id && a.date === attDate)?.status ||
        'Present'
    }));

    markClassAttendance(attClass, attDate, list);
    alert(`Class ${attClass} attendance on ${attDate} successfully recorded! Absence fine (Rs. ${settings.finePerAbsentDay}/day) calculated.`);
  };

  const handleMarkAll = (status: 'Present' | 'Absent' | 'Leave') => {
    const map: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
    classStudentsForAtt.forEach(s => {
      map[s.id] = status;
    });
    setTempStatusMap(map);
  };

  // Handlers for Fees & Notices
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentFeeId && paymentAmount > 0) {
      recordFeePayment(paymentFeeId, paymentAmount, receiptNo);
      setPaymentFeeId(null);
      setPaymentAmount(0);
      setReceiptNo('');
    }
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    addNotice({
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      date: new Date().toISOString().split('T')[0],
      targetAudience: 'All'
    });

    setNewNoticeTitle('');
    setNewNoticeContent('');
    alert('Notice published to school website!');
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    addTest({
      title: newTestTitle.trim(),
      className: newTestClass,
      subject: newTestSubject,
      totalMarks: Number(newTestMarks),
      testDate: new Date().toISOString().split('T')[0],
      description: 'Regular Assessment'
    });

    setNewTestTitle('');
    alert('Test scheduled successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner / Role Title */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Master Administrator Control • Chak 47 GB, Samundri</span>
          </div>
          <h1 className="text-2xl font-bold font-serif-crest">
            Bright Scholar School Management
          </h1>
          <p className="text-xs text-slate-300">
            Student records, faculty salaries, class attendance register, fee ledgers, and access control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddStudentModal()}
            className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setTName('');
              setTQualification('');
              setTSubject('');
              setTClasses('Class 1, Class 2');
              setTPhone('0302-5053993');
              setTSalary(25000);
              setTPassword('teacher123');
              setShowAddTeacherModal(true);
            }}
            className="bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow border border-blue-400/40 transition"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex overflow-x-auto gap-1 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'classes', label: 'Students & Classes' },
          { id: 'attendance', label: 'Class Attendance Register' },
          { id: 'teachers', label: 'Faculty & Salaries' },
          { id: 'fees', label: 'Fee & Fine Ledger' },
          { id: 'tests', label: 'Tests & Marks' },
          { id: 'tarbiyat', label: 'Daily Tarbiyat' },
          { id: 'leaves', label: `Leaves (${pendingLeavesCount})` },
          { id: 'admissions', label: `Online Admissions (${pendingAdmissionsCount})` },
          { id: 'notices', label: 'Notices' },
          { id: 'settings', label: '🔑 Passwords & Control' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as AdminTab)}
            className={`px-3.5 py-2.5 rounded-lg whitespace-nowrap transition ${
              activeTab === t.id
                ? 'bg-[#0D285F] text-amber-300 font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Total Enrolled</span>
              <span className="text-2xl font-black text-[#0D285F] mt-1 block">{totalStudents}</span>
              <span className="text-[11px] text-emerald-600 font-medium">{activeStudents} Active Students</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Teaching Faculty</span>
              <span className="text-2xl font-black text-[#0D285F] mt-1 block">{totalTeachers}</span>
              <span className="text-[11px] text-slate-400">Total Staff</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Fees Collected (وصول شدہ فیس)</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                Rs. {totalFeesCollected.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalFeesCollected === 0 ? 'کوئی فیس وصول نہیں ہوئی (0 روپے)' : 'Recorded Receipts'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold block">Unpaid Fees Balance (بقایا فیس)</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                Rs. {totalFeesPending.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalFeesPending === 0 ? 'کوئی بقایا نہیں (0 روپے)' : 'Includes absent fines'}
              </span>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('attendance')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl cursor-pointer hover:shadow-md transition"
            >
              <h3 className="font-bold text-blue-900 text-sm mb-1 flex items-center justify-between">
                <span>Class-Wise Attendance Register</span>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </h3>
              <p className="text-xs text-blue-700">
                Mark class attendance or view monthly class registers with auto fine calculation (Rs. {settings.finePerAbsentDay}/day).
              </p>
            </div>

            <div
              onClick={() => setActiveTab('teachers')}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-xl cursor-pointer hover:shadow-md transition"
            >
              <h3 className="font-bold text-emerald-900 text-sm mb-1 flex items-center justify-between">
                <span>Teacher Salaries & Add/Subtract</span>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
              </h3>
              <p className="text-xs text-emerald-700">
                Add teachers, set personal passwords, and add bonus / subtract salary advances.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('settings')}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5 rounded-xl cursor-pointer hover:shadow-md transition"
            >
              <h3 className="font-bold text-amber-900 text-sm mb-1 flex items-center justify-between">
                <span>Access Control & Passwords</span>
                <ChevronRight className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-amber-700">
                Change admin master password, teacher passwords, and adjust default school fines and fees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS FOLDERS & STUDENT MANAGEMENT (ADD / EDIT / DELETE) */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Search Bar Across Entire School */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search student by name, father name, Roll No (e.g. 01), or Admission ID..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none"
              />
            </div>
            {studentSearchQuery && (
              <button
                type="button"
                onClick={() => setStudentSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => openAddStudentModal(selectedClassFolder)}
              className="bg-[#0D285F] text-amber-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
          </div>

          {!studentSearchQuery && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Class to Manage Students:
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {SCHOOL_CLASSES.map(cls => {
                  const count = students.filter(s => s.className === cls).length;
                  const isSelected = selectedClassFolder === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassFolder(cls)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-[#0D285F] text-amber-300 border-[#0D285F] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Folder className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-amber-500'}`} />
                      <span>{cls}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-amber-400 text-[#07193B]' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Folder Content Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-500" />
                  <span>
                    {studentSearchQuery ? `Search Results for "${studentSearchQuery}"` : `${selectedClassFolder} Student Roster`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {studentSearchQuery
                    ? `Showing matching students across all classes`
                    : `${classStudents.length} students enrolled • Monthly Tuition: Rs. ${getDefaultMonthlyFee(selectedClassFolder)}`}
                </p>
              </div>
            </div>

            {(() => {
              const listToDisplay = studentSearchQuery.trim()
                ? students.filter(s =>
                    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.fatherName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.rollNo.includes(studentSearchQuery) ||
                    s.admissionNo.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.className.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  )
                : classStudents;

              if (listToDisplay.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500 text-xs italic bg-slate-50 rounded-xl">
                    No students match your criteria.
                    <div className="mt-2">
                      <button
                        onClick={() => openAddStudentModal(selectedClassFolder)}
                        className="bg-[#0D285F] text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        + Enroll Student
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07193B] text-white">
                      <tr>
                        <th className="p-3">Roll & Class</th>
                        <th className="p-3">Student & Father Name</th>
                        <th className="p-3">Attendance & Fines</th>
                        <th className="p-3">Monthly Tuition</th>
                        <th className="p-3">Paid / Remaining</th>
                        <th className="p-3">Fee Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {listToDisplay.map(st => {
                        const report = getStudentFullReport(st.id);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 font-mono">Roll: {st.rollNo}</span>
                              <div className="text-[10px] text-slate-500">{st.className}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{st.admissionNo}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-slate-500 text-[11px]">S/O {st.fatherName}</div>
                              <div className="text-slate-400 text-[10px]">{st.contactNo}</div>
                            </td>
                            <td className="p-3">
                              {report ? (
                                <div>
                                  <span className="font-bold text-blue-900">{report.attendancePercentage}% Attendance</span>
                                  <div className="text-[11px] text-slate-500">
                                    {report.presentDays} Present / {report.absentDays} Absents
                                  </div>
                                  {report.totalFineAmount > 0 ? (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                      Fine: Rs. {report.totalFineAmount}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-600 font-semibold">No Fine</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              Rs. {st.monthlyFee.toLocaleString()}
                            </td>
                            <td className="p-3">
                              {report ? (
                                <div>
                                  <div className="text-emerald-700 font-bold">Paid: Rs. {report.paidAmount.toLocaleString()}</div>
                                  <div className={`text-[11px] font-bold ${report.balanceRemaining > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    Due: Rs. {report.balanceRemaining.toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              {report ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  report.feeStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : report.feeStatus === 'Partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {report.feeStatus}
                                </span>
                              ) : null}
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => onSelectStudent(st)}
                                className="bg-[#0D285F] text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#07193B] transition shadow-sm"
                                title="View complete 360 student dossier"
                              >
                                Dossier (مکمل ریکارڈ)
                              </button>
                              <button
                                onClick={() => openEditStudentModal(st)}
                                className="bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-100 transition"
                                title="Edit details"
                              >
                                <Edit className="w-3.5 h-3.5 inline mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => setStudentToDelete(st)}
                                className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                                title="Delete student"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: COMPLETE CLASS-WISE ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Class-Wise Attendance Register</h3>
              <p className="text-xs text-slate-500">
                Complete class attendance sheet with unapproved absence fines (Rs. {settings.finePerAbsentDay}/day).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAttendanceViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  attendanceViewMode === 'daily'
                    ? 'bg-[#0D285F] text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Daily Marking Sheet
              </button>
              <button
                onClick={() => setAttendanceViewMode('monthlyRegister')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  attendanceViewMode === 'monthlyRegister'
                    ? 'bg-[#0D285F] text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Monthly Register View
              </button>
            </div>
          </div>

          {/* Controls: Class Picker & Date Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class</label>
              <select
                value={attClass}
                onChange={(e) => setAttClass(e.target.value as ClassLevel)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white font-medium outline-none"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-2 rounded-lg transition"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-2 rounded-lg transition"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Metrics summary banner for this class & date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
              <span className="text-[11px] text-blue-700 font-bold block">Class Strength</span>
              <span className="text-xl font-black text-blue-900">{classStudentsForAtt.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <span className="text-[11px] text-emerald-700 font-bold block">Present</span>
              <span className="text-xl font-black text-emerald-900">{presentCount}</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center">
              <span className="text-[11px] text-red-700 font-bold block">Absent</span>
              <span className="text-xl font-black text-red-900">{absentCount}</span>
              <span className="text-[10px] text-red-600 block">(Fine: Rs. {absentCount * settings.finePerAbsentDay})</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
              <span className="text-[11px] text-amber-700 font-bold block">On Leave</span>
              <span className="text-xl font-black text-amber-900">{leaveCount}</span>
            </div>
          </div>

          {/* View 1: Daily Sheet */}
          {attendanceViewMode === 'daily' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Father Name</th>
                      <th className="p-3 text-center">Attendance Status</th>
                      <th className="p-3 text-right">Absence Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudentsForAtt.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                          No active students found in {attClass}.
                        </td>
                      </tr>
                    ) : (
                      classStudentsForAtt.map(st => {
                        const currentStatus = tempStatusMap[st.id] ||
                          attendance.find(a => a.studentId === st.id && a.date === attDate)?.status ||
                          'Present';

                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{st.rollNo}</td>
                            <td className="p-3 font-semibold text-slate-900">{st.name}</td>
                            <td className="p-3 text-slate-600">{st.fatherName}</td>
                            <td className="p-3">
                              <div className="flex justify-center gap-1.5">
                                {(['Present', 'Absent', 'Leave', 'Late'] as const).map(status => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => setTempStatusMap(prev => ({ ...prev, [st.id]: status }))}
                                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                                      currentStatus === status
                                        ? status === 'Present'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : status === 'Absent'
                                          ? 'bg-red-600 text-white shadow-sm'
                                          : status === 'Leave'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-red-600">
                              {currentStatus === 'Absent' ? `Rs. ${settings.finePerAbsentDay}` : 'Rs. 0'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveAttendance}
                  className="bg-[#0D285F] hover:bg-[#07193B] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition"
                >
                  Save Class Attendance & Record Fines
                </button>
              </div>
            </div>
          )}

          {/* View 2: Monthly Register Matrix */}
          {attendanceViewMode === 'monthlyRegister' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Monthly Register for <strong>{attClass}</strong> (Month: {attDate.substring(0, 7)}):
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-2.5">Roll</th>
                      <th className="p-2.5">Name</th>
                      {Array.from({ length: 15 }, (_, i) => i + 16).map(d => (
                        <th key={d} className="p-1 text-center font-mono text-[10px] w-6">{d}</th>
                      ))}
                      <th className="p-2.5 text-center">Presents</th>
                      <th className="p-2.5 text-center">Absents</th>
                      <th className="p-2.5 text-right">Fine Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudentsForAtt.map(st => {
                      const stAtt = attendance.filter(a => a.studentId === st.id);
                      const pCount = stAtt.filter(a => a.status === 'Present').length;
                      const aCount = stAtt.filter(a => a.status === 'Absent').length;
                      const fine = aCount * settings.finePerAbsentDay;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold">{st.rollNo}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{st.name}</td>
                          {Array.from({ length: 15 }, (_, i) => i + 16).map(d => {
                            const dateStr = `2026-09-${d < 10 ? '0' + d : d}`;
                            const rec = attendance.find(a => a.studentId === st.id && a.date === dateStr);
                            const stLetter = rec ? rec.status.charAt(0) : 'P';
                            const badgeColor = stLetter === 'P' ? 'text-emerald-700 bg-emerald-50' : stLetter === 'A' ? 'text-red-700 bg-red-100 font-bold' : 'text-amber-700 bg-amber-50';

                            return (
                              <td key={d} className="p-1 text-center">
                                <span className={`inline-block w-5 h-5 rounded text-[10px] leading-5 ${badgeColor}`}>
                                  {stLetter}
                                </span>
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-center font-bold text-emerald-700">{pCount}</td>
                          <td className="p-2.5 text-center font-bold text-red-700">{aCount}</td>
                          <td className="p-2.5 text-right font-black text-red-800">Rs. {fine}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEACHERS & SALARY MANAGEMENT (ADD / SUBTRACT SALARY & PASSWORDS) */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Faculty Directory & Salary Management</h3>
              <p className="text-xs text-slate-500">
                Add teachers, increase/subtract salaries (allowances/deductions), and assign login passwords.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setTName('');
                setTQualification('');
                setTSubject('');
                setTClasses('Class 1, Class 2');
                setTPhone('0302-5053993');
                setTSalary(25000);
                setTPassword('teacher123');
                setShowAddTeacherModal(true);
              }}
              className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Teacher</span>
            </button>
          </div>

          {/* Teachers Cards / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map(t => {
              const allowances = t.allowances || 0;
              const deductions = t.deductions || 0;
              const netPayable = t.salary + allowances - deductions;

              return (
                <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-[#0D285F]">{t.name}</h4>
                      <p className="text-slate-500">{t.qualification} • {t.subject}</p>
                      <p className="text-[11px] text-slate-400">Classes: {t.assignedClasses}</p>
                      <p className="text-[11px] text-slate-400">Phone: {t.contactNo}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTeacher(t);
                          setTName(t.name);
                          setTQualification(t.qualification);
                          setTSubject(t.subject);
                          setTClasses(t.assignedClasses);
                          setTPhone(t.contactNo);
                          setTSalary(t.salary);
                          setTPassword(t.personalPassword || 'teacher123');
                          setShowAddTeacherModal(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-700"
                        title="Edit Teacher"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTeacherToDelete(t)}
                        className="p-1 text-slate-500 hover:text-red-600"
                        title="Delete Teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Salary Breakdown Box */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Monthly Salary:</span>
                      <span className="font-bold text-slate-900">Rs. {t.salary.toLocaleString()}</span>
                    </div>

                    {allowances > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>+ Allowances / Bonus:</span>
                        <span>+ Rs. {allowances.toLocaleString()}</span>
                      </div>
                    )}

                    {deductions > 0 && (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>- Deductions / Advance:</span>
                        <span>- Rs. {deductions.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-bold text-sm">
                      <span>Net Payable Salary:</span>
                      <span className="text-emerald-800 font-black">Rs. {netPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Teacher Login Password Badge */}
                  <div className="flex items-center justify-between text-[11px] bg-slate-200/60 p-2 rounded-lg">
                    <span>
                      Login Password: <code className="font-mono font-bold text-blue-900">{t.personalPassword || settings.teacherPassword}</code>
                    </span>
                    <button
                      onClick={() => {
                        setPassTeacher(t);
                        setNewTeacherPassInput(t.personalPassword || settings.teacherPassword);
                      }}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Actions: Add / Subtract Salary */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSalaryAdjTeacher(t);
                        setAdjType('Addition');
                        setAdjAmount(1000);
                        setAdjReason('Performance Bonus');
                      }}
                      className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Add Allowance/Bonus</span>
                    </button>

                    <button
                      onClick={() => {
                        setSalaryAdjTeacher(t);
                        setAdjType('Deduction');
                        setAdjAmount(500);
                        setAdjReason('Advance Salary / Deduction');
                      }}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-900 font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-red-700" />
                      <span>- Subtract / Advance</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Salary Adjustment History Table */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Salary Additions & Subtractions History
            </h4>
            {salaryTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No salary additions or deductions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Teacher</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Reason / Details</th>
                      <th className="p-3">Month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-500">{tx.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{tx.teacherName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'Addition' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type === 'Addition' ? '+ Addition' : '- Subtraction'}
                          </span>
                        </td>
                        <td className={`p-3 font-bold ${tx.type === 'Addition' ? 'text-emerald-700' : 'text-red-600'}`}>
                          {tx.type === 'Addition' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-700">{tx.reason}</td>
                        <td className="p-3 text-slate-500">{tx.month}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FEES */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fee Management & Absence Fine Ledger</h3>
              <p className="text-xs text-slate-500">
                Track tuition fees, absent fines (Rs. {settings.finePerAbsentDay}/day), and issue receipts.
              </p>
            </div>

            <button
              onClick={() => {
                const count = generateMonthlyFeeVouchers('September 2026');
                alert(`Generated ${count} monthly vouchers for September 2026!`);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              + Generate September Fee Vouchers
            </button>
          </div>

          {feeRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-300">
              ابھی کوئی فیس واؤچر یا ریکارڈ موجود نہیں ہے۔ جیسے ہی آپ نئے طلباء داخل کریں گے، ان کا فیس ریکارڈ یہاں خود بخود آ جائے گا۔
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07193B] text-white">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Tuition</th>
                    <th className="p-3">Absents (Fine)</th>
                    <th className="p-3">Total Payable</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Collect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeRecords.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{f.studentName}</td>
                      <td className="p-3">{f.className}</td>
                      <td className="p-3 text-slate-500">{f.month}</td>
                      <td className="p-3">Rs. {f.tuitionFee}</td>
                      <td className="p-3 text-red-600 font-bold">
                        {f.absentDays} days (Rs. {f.fineAmount})
                      </td>
                      <td className="p-3 font-bold text-slate-900">Rs. {f.totalPayable}</td>
                      <td className="p-3 text-emerald-600 font-bold">Rs. {f.paidAmount}</td>
                      <td className="p-3 font-bold">Rs. {f.balanceRemaining}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {f.balanceRemaining > 0 && (
                          <button
                            onClick={() => {
                              setPaymentFeeId(f.id);
                              setPaymentAmount(f.balanceRemaining);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paymentFeeId && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <h4 className="font-bold text-xs text-emerald-900 mb-2">Record Fee Payment</h4>
              <form onSubmit={handleRecordPayment} className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Amount"
                  className="px-3 py-1.5 text-xs border rounded-lg bg-white"
                />
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="Receipt # (Optional)"
                  className="px-3 py-1.5 text-xs border rounded-lg bg-white"
                />
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                >
                  Save Payment Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFeeId(null)}
                  className="text-slate-600 text-xs hover:underline"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TESTS */}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Assessment & Test Management</h3>
              <p className="text-xs text-slate-500">Create scheduled tests and upload marks.</p>
            </div>
          </div>

          <form onSubmit={handleAddTest} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-xs text-slate-700 block">Schedule New Assessment</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newTestTitle}
                onChange={(e) => setNewTestTitle(e.target.value)}
                placeholder="Test Title (e.g. Science Monthly Test)"
                className="px-3 py-2 text-xs border rounded-lg bg-white"
              />
              <select
                value={newTestClass}
                onChange={(e) => setNewTestClass(e.target.value as ClassLevel)}
                className="px-3 py-2 text-xs border rounded-lg bg-white font-medium"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newTestSubject}
                onChange={(e) => setNewTestSubject(e.target.value)}
                placeholder="Subject"
                className="px-3 py-2 text-xs border rounded-lg bg-white"
              />
              <button
                type="submit"
                className="bg-[#0D285F] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#07193B]"
              >
                Create Test
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-700">Scheduled Tests</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tests.map(t => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {t.className}
                    </span>
                    <span className="text-[11px] text-slate-400">{t.testDate}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                  <p className="text-xs text-slate-500 mb-2">{t.subject} • Total: {t.totalMarks} Marks</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: TARBIYAT */}
      {activeTab === 'tarbiyat' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">“Pehle Tarbiyat, Phir Taleem” Conduct Log</h3>
            <p className="text-xs text-slate-500">Record daily homework, Akhlaqiat, and teacher observations.</p>
          </div>

          <div className="space-y-3">
            {dailyReports.map(dr => (
              <div key={dr.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0D285F]">{dr.studentName} ({dr.className})</span>
                  <span className="text-slate-400">{dr.date}</span>
                </div>
                <p className="text-slate-700 italic my-1">“{dr.teacherRemarks}”</p>
                <div className="flex gap-2 mt-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                    Homework: {dr.homework}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                    Behavior: {dr.behaviour}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: LEAVES */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Leave Applications</h3>
            <p className="text-xs text-slate-500">
              Approved leaves do not incur the daily absence fine (Rs. {settings.finePerAbsentDay}).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07193B] text-white">
                <tr>
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{l.applicantName}</td>
                    <td className="p-3 capitalize">{l.role}</td>
                    <td className="p-3">{l.fromDate} to {l.toDate}</td>
                    <td className="p-3 font-bold">{l.numberOfDays}</td>
                    <td className="p-3 text-slate-600">{l.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {l.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: ADMISSIONS */}
      {activeTab === 'admissions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Website Online Admission Applications</h3>
            <p className="text-xs text-slate-500">
              Applications submitted by parents on the public website. Click "Approve & Enroll" to automatically register them as a student.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07193B] text-white">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Father Name</th>
                  <th className="p-3">Applying Class</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Date Applied</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onlineAdmissions.map(adm => (
                  <tr key={adm.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{adm.studentName}</td>
                    <td className="p-3 text-slate-600">{adm.fatherName}</td>
                    <td className="p-3 font-bold text-blue-900">{adm.applyingClass}</td>
                    <td className="p-3">{adm.contactNo}</td>
                    <td className="p-3 text-slate-400">{adm.applyDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adm.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : adm.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {adm.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            const newSt = approveAndEnrollAdmission(adm.id);
                            if (newSt) {
                              alert(`Enrolled ${newSt.name} in ${newSt.className} with Roll No ${newSt.rollNo}!`);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          Approve & Enroll
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Enrolled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: NOTICES */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">School Notice Board</h3>
            <p className="text-xs text-slate-500">Notices published here appear immediately on the website homepage.</p>
          </div>

          <form onSubmit={handleAddNotice} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-xs text-slate-700 block">Publish New Announcement</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                placeholder="Notice Title"
                className="px-3 py-2 text-xs border rounded-lg bg-white"
              />
              <select
                value={newNoticeCategory}
                onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                className="px-3 py-2 text-xs border rounded-lg bg-white font-medium"
              >
                <option value="Announcement">Announcement</option>
                <option value="Holiday">Holiday</option>
                <option value="Exam">Exam</option>
                <option value="Fee Notice">Fee Notice</option>
                <option value="Parent Meeting">Parent Meeting</option>
              </select>
              <button
                type="submit"
                className="bg-[#0D285F] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#07193B]"
              >
                Publish Notice
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={newNoticeContent}
              onChange={(e) => setNewNoticeContent(e.target.value)}
              placeholder="Announcement details..."
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
            />
          </form>

          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-4 text-xs flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                      {n.category}
                    </span>
                    <span className="text-slate-400">{n.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  <p className="text-slate-600 mt-1">{n.content}</p>
                </div>
                <button
                  onClick={() => deleteNotice(n.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 11: SETTINGS, PASSWORDS & MASTER ACCESS CONTROL */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-3xl">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Master Access Control & Password Management</span>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Website & Portal Access Security</h3>
            <p className="text-xs text-slate-500">
              Only you have master control. Teachers and parents will login with the passwords you configure below.
            </p>
          </div>

          <div className="space-y-5">
            {/* Master Admin Password */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Master Administrator Password (Your Secret Key)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-xs text-amber-800 flex items-center gap-1 hover:underline"
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAdminPass ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showAdminPass ? 'text' : 'password'}
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg font-mono bg-white"
              />
              <p className="text-[11px] text-amber-800">
                Nobody can access this Admin Management Portal without this password.
              </p>
            </div>

            {/* Default Faculty Password */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
              <label className="text-xs font-bold text-blue-950 block">
                General Default Teacher Password
              </label>
              <input
                type="text"
                value={teacherGeneralPassInput}
                onChange={(e) => setTeacherGeneralPassInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg font-mono bg-white"
              />
              <p className="text-[11px] text-blue-800">
                Teachers who do not have an individual custom password will use this default password.
              </p>
            </div>

            {/* Individual Teacher Passwords Overview */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Active Faculty Passwords (Set by Admin):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teachers.map(t => (
                  <div key={t.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{t.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Password: <strong>{t.personalPassword || teacherGeneralPassInput}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setPassTeacher(t);
                        setNewTeacherPassInput(t.personalPassword || teacherGeneralPassInput);
                      }}
                      className="text-blue-700 font-bold hover:underline text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Absence Fine Rule Settings */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-red-950">
                Absence Fine Policy (Rs. per unapproved day)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fineInput}
                  onChange={(e) => setFineInput(Number(e.target.value))}
                  className="w-32 px-3 py-2 text-sm border border-red-300 rounded-lg font-bold bg-white text-red-900"
                />
                <span className="text-xs text-red-800">
                  Current rate: <strong>Rs. {fineInput} per chuti</strong>. Automatically added to fee vouchers.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                updateSettings({
                  finePerAbsentDay: fineInput,
                  adminPassword: adminPassInput,
                  teacherPassword: teacherGeneralPassInput
                });
                alert('Master security settings and passwords updated successfully!');
              }}
              className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 px-6 py-3 rounded-xl font-bold text-sm shadow transition"
            >
              Save Security & Fine Settings
            </button>

            {/* Danger Zone: Reset All Student & Fee Data to Zero */}
            <div className="bg-red-50/60 border border-red-200 p-4 rounded-xl space-y-2 mt-4">
              <span className="text-xs font-bold text-red-950 block">
                Reset All Student & Fee Data to Zero (تمام ڈیٹا صفر / ری سیٹ کریں)
              </span>
              <p className="text-[11px] text-red-800">
                اگر آپ تمام سابقہ ریکارڈز صاف کر کے نئے سرے سے طلباء اور فیس درج کرنا چاہتے ہیں تو یہ بٹن دبائیں۔ اس سے تمام طالب علم اور فیس کے اعداد و شمار فوری طور پر 0 ہو جائیں گے۔
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('کیا آپ واقعی تمام طلباء اور فیس کا ڈیٹا صفر (Zero) کرنا چاہتے ہیں؟ اس کے بعد آپ نئے طلباء خود شامل کر سکیں گے۔')) {
                    resetAllDataToZero();
                    alert('تمام طلباء اور فیس کا ڈیٹا کامیابی سے صفر (0) کر دیا گیا ہے!');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Reset All Data to Zero (ڈیٹا صفر کریں)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={stFormName}
                  onChange={(e) => setStFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  placeholder="e.g. Muhammad Abdullah"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Father / Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={stFormFather}
                  onChange={(e) => setStFormFather(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  placeholder="e.g. Tariq Mehmood"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Class</label>
                  <select
                    value={stFormClass}
                    onChange={(e) => {
                      const newCls = e.target.value as ClassLevel;
                      setStFormClass(newCls);
                      if (!editingStudent) {
                        setStFormFee(getDefaultMonthlyFee(newCls));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                  >
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Roll Number</label>
                  <input
                    type="text"
                    value={stFormRoll}
                    onChange={(e) => setStFormRoll(e.target.value)}
                    placeholder="e.g. 01 (or auto)"
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Monthly Tuition Fee (Rs.)</label>
                  <input
                    type="number"
                    value={stFormFee}
                    onChange={(e) => setStFormFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Contact Phone</label>
                  <input
                    type="tel"
                    value={stFormPhone}
                    onChange={(e) => setStFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Home Address</label>
                <input
                  type="text"
                  value={stFormAddress}
                  onChange={(e) => setStFormAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#07193B]"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE STUDENT */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Student Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kya aap waqai <strong>{studentToDelete.name}</strong> (Roll {studentToDelete.rollNo} - {studentToDelete.className}) ko delete karna chahte hain?
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Nahi, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Haan, Delete Karein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT TEACHER MODAL */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Add New Faculty Member'}
              </h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                  placeholder="e.g. Sir Muhammad Ali"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Qualification</label>
                  <input
                    type="text"
                    value={tQualification}
                    onChange={(e) => setTQualification(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="e.g. M.Sc. Math / M.A."
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Main Subject *</label>
                  <input
                    type="text"
                    required
                    value={tSubject}
                    onChange={(e) => setTSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="e.g. Mathematics"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Assigned Classes</label>
                <input
                  type="text"
                  value={tClasses}
                  onChange={(e) => setTClasses(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                  placeholder="e.g. Class 5, Class 6, Class 7"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Base Salary (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={tSalary}
                    onChange={(e) => setTSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Contact Number</label>
                  <input
                    type="tel"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Assign Teacher Login Password</label>
                <input
                  type="text"
                  value={tPassword}
                  onChange={(e) => setTPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-mono"
                  placeholder="e.g. teacher123"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#07193B]"
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SALARY ADDITION / SUBTRACTION MODAL */}
      {salaryAdjTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Adjust Salary: {salaryAdjTeacher.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Current Base: Rs. {salaryAdjTeacher.salary.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSalaryAdjTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySalaryAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('Addition')}
                    className={`py-2 px-3 rounded-lg font-bold border transition ${
                      adjType === 'Addition'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Add Bonus / Allowance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('Deduction')}
                    className={`py-2 px-3 rounded-lg font-bold border transition ${
                      adjType === 'Deduction'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Subtract Advance / Fine
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-lg font-black"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">For Month</label>
                <input
                  type="text"
                  value={adjMonth}
                  onChange={(e) => setAdjMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Reason / Remark *</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Evening coaching bonus, or Advance payment installment"
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSalaryAdjTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${
                    adjType === 'Addition' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {adjType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CHANGE TEACHER PASSWORD */}
      {passTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">
              Set Password for {passTeacher.name}
            </h3>
            <p className="text-xs text-slate-500">
              Teacher will use this password to enter the Teacher Portal.
            </p>

            <form onSubmit={handleSaveTeacherPassword} className="space-y-3">
              <input
                type="text"
                required
                value={newTeacherPassInput}
                onChange={(e) => setNewTeacherPassInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg font-mono font-bold"
                placeholder="New password"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPassTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIRM DELETE TEACHER */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Faculty Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{teacherToDelete.name}</strong> from faculty records?
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTeacher(teacherToDelete.id);
                  setTeacherToDelete(null);
                  alert(`Teacher removed from records.`);
                }}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
