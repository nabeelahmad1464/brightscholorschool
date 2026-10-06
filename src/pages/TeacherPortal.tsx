import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  User,
  Users,
  Plus,
  KeyRound,
  Bell,
  Check,
  X,
  RefreshCw,
  Search,
  Eye,
  Camera
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, ClassLevel, SCHOOL_CLASSES, SCHOOL_SUBJECTS } from '../types';

interface TeacherPortalProps {
  onSelectStudent: (student: Student) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ onSelectStudent }) => {
  const {
    teachers,
    currentTeacherId,
    students,
    attendance,
    markClassAttendance,
    addDailyReport,
    tests,
    addTest,
    testResults,
    addTestResult,
    submitLeave,
    settings,
    setTeacherPassword,
    notices,
    syncNowWithCloud,
    isCloudSyncing
  } = useSchool();

  const teacher = teachers.find(t => t.id === currentTeacherId) || teachers[0];

  const [activeTab, setActiveTab] = useState<'attendance' | 'students_list' | 'tarbiyat' | 'tests' | 'leave' | 'notices'>('attendance');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'ALL'>('ALL');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusMap, setStatusMap] = useState<Record<string, 'Present' | 'Absent' | 'Leave' | 'Late'>>({});
  const [studentFilterQuery, setStudentFilterQuery] = useState('');

  // Auto-sync freshest cloud data when teacher opens the portal
  useEffect(() => {
    syncNowWithCloud();
  }, []);

  // Auto-switch class to ALL or first class with students
  useEffect(() => {
    if (students.length > 0 && selectedClass !== 'ALL' && !students.some(s => s.className === selectedClass)) {
      setSelectedClass('ALL');
    }
  }, [students, selectedClass]);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Daily report state
  const [repStudentId, setRepStudentId] = useState(students[0]?.id || '');
  const [repHomework, setRepHomework] = useState<'Completed' | 'Incomplete' | 'Not Done'>('Completed');
  const [repBehavior, setRepBehavior] = useState<'Disciplined' | 'Good' | 'Mischievous'>('Disciplined');
  const [repRemarks, setRepRemarks] = useState('Showed keen interest in class and Nazra Quran.');

  // Test marks & creation state
  const [selectedTestId, setSelectedTestId] = useState(tests[0]?.id || '');
  const [testStudentId, setTestStudentId] = useState(students[0]?.id || '');
  const [marksObtained, setMarksObtained] = useState<number>(45);
  const [testSubTab, setTestSubTab] = useState<'enter_marks' | 'create_test'>('enter_marks');
  const [newTestClass, setNewTestClass] = useState<ClassLevel>(
    selectedClass === 'ALL' ? (students[0]?.className as ClassLevel || 'Class 5') : selectedClass
  );
  const [newTestSubject, setNewTestSubject] = useState('Mathematics (ریاضی)');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [newTestTotalMarks, setNewTestTotalMarks] = useState<number>(50);
  const [newTestTitle, setNewTestTitle] = useState('Mathematics Monthly Test');
  const [teacherMarksMap, setTeacherMarksMap] = useState<Record<string, number>>({});
  const [teacherRemarksMap, setTeacherRemarksMap] = useState<Record<string, string>>({});

  // Leave state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);

  const classStudents = selectedClass === 'ALL'
    ? students
    : students.filter(s => s.className === selectedClass);

  const filteredClassStudents = classStudents.filter(s => {
    if (!studentFilterQuery.trim()) return true;
    const q = studentFilterQuery.toLowerCase().trim();
    const cleanNum = q.replace(/^0+/, '');
    const rollClean = s.rollNo.trim().toLowerCase();
    const rollNum = rollClean.replace(/^0+/, '');
    return (
      s.name.toLowerCase().includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      rollClean === q ||
      (cleanNum !== '' && rollNum === cleanNum) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  });

  const handleSaveAttendance = () => {
    if (selectedClass === 'ALL') {
      const byClass: Record<string, { studentId: string; status: 'Present' | 'Absent' | 'Leave' | 'Late' }[]> = {};
      classStudents.forEach(s => {
        if (!byClass[s.className]) byClass[s.className] = [];
        byClass[s.className].push({
          studentId: s.id,
          status: statusMap[s.id] || 'Present'
        });
      });
      Object.entries(byClass).forEach(([cls, list]) => {
        markClassAttendance(cls, attDate, list);
      });
      alert(`تمام کلاسز کے کل ${classStudents.length} طلباء کی حاضری کامیابی سے محفوظ ہو گئی!`);
    } else {
      const list = classStudents.map(s => ({
        studentId: s.id,
        status: statusMap[s.id] || 'Present'
      }));
      markClassAttendance(selectedClass, attDate, list);
      alert(`حاضری برائے ${selectedClass} کامیابی سے محفوظ ہو گئی!`);
    }
  };

  const handleSaveDailyReport = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === repStudentId);
    if (!st) return;

    addDailyReport({
      studentId: st.id,
      studentName: st.name,
      className: st.className,
      date: new Date().toISOString().split('T')[0],
      performance: 'Good',
      participation: 'Active',
      homework: repHomework,
      behaviour: repBehavior,
      discipline: 'Good',
      teacherRemarks: repRemarks,
      teacherName: teacher ? teacher.name : 'Teacher'
    });

    alert('Daily Tarbiyat & Homework observation recorded!');
  };

  const handleSaveTestResult = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tests.find(test => test.id === selectedTestId);
    const st = students.find(s => s.id === testStudentId);
    if (!t || !st) return;

    const total = t.totalMarks;
    const pct = Math.round((marksObtained / total) * 100);
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

    addTestResult({
      testId: t.id,
      testTitle: t.title,
      studentId: st.id,
      studentName: st.name,
      className: st.className,
      subject: t.subject,
      marksObtained,
      totalMarks: total,
      grade,
      remarks: pct >= 80 ? 'Well prepared!' : 'Needs improvement in homework practice.'
    });

    alert(`Marks recorded for ${st.name}: ${marksObtained}/${total} (Grade: ${grade})`);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = newTestSubject === 'Other (دیگر مضمون)' ? (customSubjectInput.trim() || 'General') : newTestSubject;
    const testTitle = newTestTitle.trim() || `${finalSubject} Assessment - ${newTestClass}`;

    const created = addTest({
      title: testTitle,
      className: newTestClass,
      subject: finalSubject,
      totalMarks: Number(newTestTotalMarks) || 50,
      testDate: new Date().toISOString().split('T')[0],
      description: 'Class Assessment'
    });

    setSelectedTestId(created.id);
    setTestSubTab('enter_marks');
    alert(`Assessment created: ${testTitle} (${newTestTotalMarks} Marks). Now enter student marks.`);
  };

  const handleSaveAllMarksForClass = () => {
    const t = tests.find(test => test.id === selectedTestId);
    if (!t) {
      alert('Please select or create an assessment first.');
      return;
    }

    const testStudents = students.filter(s => s.className === t.className);
    if (testStudents.length === 0) {
      alert(`No students found in ${t.className}`);
      return;
    }

    const total = t.totalMarks;

    testStudents.forEach(st => {
      const marks = teacherMarksMap[st.id] ?? 0;
      const pct = Math.round((marks / total) * 100);
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
      const remarks = teacherRemarksMap[st.id] || (pct >= 80 ? 'Good work' : 'Practice needed');

      addTestResult({
        testId: t.id,
        testTitle: t.title,
        studentId: st.id,
        studentName: st.name,
        className: st.className,
        subject: t.subject,
        marksObtained: marks,
        totalMarks: total,
        grade,
        remarks
      });
    });

    alert(`Marks successfully recorded for all ${testStudents.length} students in ${t.className}!`);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    submitLeave({
      applicantId: teacher ? teacher.id : 't-1',
      applicantName: teacher ? teacher.name : 'Faculty Member',
      role: 'teacher',
      fromDate: leaveFrom,
      toDate: leaveTo,
      numberOfDays: Number(leaveDays),
      reason: leaveReason.trim(),
      status: 'Pending'
    });

    setLeaveReason('');
    alert('Leave request submitted to School Administration!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Teacher Profile Card */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-[#07193B] font-bold font-serif-crest text-xl flex items-center justify-center flex-shrink-0">
            {teacher ? teacher.name.charAt(0) : 'T'}
          </div>
          <div>
            <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Faculty Member Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">{teacher ? teacher.name : 'Faculty Member'}</h1>
            <p className="text-xs text-slate-300">
              {teacher?.qualification} • Assigned: <strong>{teacher?.assignedClasses}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewPasswordInput(teacher?.personalPassword || 'teacher123');
            setPasswordSuccess('');
            setShowPasswordModal(true);
          }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition border border-white/20"
        >
          <KeyRound className="w-4 h-4 text-amber-300" />
          <span>Change Password (پاس ورڈ بدلیں)</span>
        </button>
      </div>

      {/* Live Cloud Status Banner */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-extrabold text-emerald-900">
            کلاؤڈ لائیو منسلک ہے: اسکول میں کل <strong>{students.length}</strong> طلباء درج ہیں۔ تمام ڈیٹا خودکار سنک ہو رہا ہے۔
          </span>
        </div>
        <button
          type="button"
          onClick={() => syncNowWithCloud()}
          disabled={isCloudSyncing}
          className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95 disabled:opacity-70"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
          <span>{isCloudSyncing ? 'ریفریش ہو رہا ہے...' : 'نیا ڈیٹا ریفریش کریں (Refresh)'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 border border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { id: 'attendance', label: 'Mark Class Attendance', icon: <Calendar className="w-4 h-4" /> },
          { id: 'students_list', label: `رجسٹرڈ بچے (${students.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'tarbiyat', label: 'Tarbiyat & Homework Report', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'tests', label: 'Enter Test Marks', icon: <Award className="w-4 h-4" /> },
          { id: 'leave', label: 'Submit Leave', icon: <FileText className="w-4 h-4" /> },
          { id: 'notices', label: 'School Notices', icon: <Bell className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg transition ${
              activeTab === t.id
                ? 'bg-[#0D285F] text-amber-300 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class (کلاس منتخب کریں)</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white font-medium"
              >
                <option value="ALL">تمام کلاسز (تمام بچے - کل {students.length} طلباء)</option>
                {SCHOOL_CLASSES.map(cls => {
                  const count = students.filter(s => s.className === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} ({count} طلباء)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Date (تاریخ)</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg font-medium"
              />
            </div>
          </div>

          {/* Search & Class Summary Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={studentFilterQuery}
                onChange={(e) => setStudentFilterQuery(e.target.value)}
                placeholder="طالب علم کا نام یا رول نمبر تلاش کریں (مثلاً Maryam, مریم، 02)..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#0D285F] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none transition"
              />
              {studentFilterQuery && (
                <button
                  type="button"
                  onClick={() => setStudentFilterQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕ صاف کریں
                </button>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#0D285F] text-amber-300 font-bold px-2.5 py-0.5 rounded text-xs">
                    {selectedClass}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    کل طلباء: {filteredClassStudents.length} بچے {studentFilterQuery ? `(سرچ رزلٹ)` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  غیر حاضری پر روزانہ {settings.finePerAbsentDay} روپے جرمانہ خود بخود فیس میں شامل ہوتا ہے۔
                </p>
              </div>

              {/* Quick Bulk Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const map: Record<string, 'Present' | 'Absent' | 'Leave' | 'Late'> = {};
                    filteredClassStudents.forEach(s => { map[s.id] = 'Present'; });
                    setStatusMap(map);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                >
                  ✓ Mark All Present (سب کو حاضر کریں)
                </button>
              </div>
            </div>
          </div>

          {filteredClassStudents.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <p className="text-slate-700 text-xs font-bold">
                {studentFilterQuery
                  ? `تلاش کردہ نام یا رول نمبر "${studentFilterQuery}" کا کوئی بچہ نہیں ملا۔`
                  : `اس کلاس (${selectedClass}) میں فی الحال کوئی بچہ داخل نہیں ہے۔`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-semibold">کلاس سوئچ کریں:</span>
                <button
                  type="button"
                  onClick={() => { setSelectedClass('ALL'); setStudentFilterQuery(''); }}
                  className="bg-amber-400 hover:bg-amber-500 text-[#07193B] text-xs font-black px-3 py-1 rounded-lg transition shadow-sm"
                >
                  تمام کلاسز دکھائیں (All Classes)
                </button>
                {SCHOOL_CLASSES.filter(c => students.some(s => s.className === c)).map(c => {
                  const cCount = students.filter(s => s.className === c).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelectedClass(c); setStudentFilterQuery(''); }}
                      className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 text-xs font-extrabold px-3 py-1 rounded-lg transition shadow-sm"
                    >
                      {c} ({cCount} طلباء)
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07193B] text-white">
                  <tr>
                    <th className="p-3">Roll No</th>
                    {selectedClass === 'ALL' && <th className="p-3">Class</th>}
                    <th className="p-3">Student & Father Name</th>
                    <th className="p-3 text-center">Card / Photo</th>
                    <th className="p-3 text-center">Mark Attendance (حاضری لگائیں)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClassStudents.map(st => {
                    const currentStatus = statusMap[st.id] ||
                      attendance.find(a => a.studentId === st.id && a.date === attDate)?.status ||
                      'Present';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">
                          <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 inline-flex items-center justify-center font-mono">
                            {st.rollNo}
                          </span>
                        </td>
                        {selectedClass === 'ALL' && (
                          <td className="p-3 font-semibold text-[#0D285F]">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                              {st.className}
                            </span>
                          </td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {st.photo ? (
                              <img
                                src={st.photo}
                                alt={st.name}
                                className="w-8 h-8 rounded-full object-cover border border-amber-400 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0D285F] text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {st.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-[11px] text-slate-500">
                                ولدیت: {st.fatherName} • Adm #{st.admissionNo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(st)}
                            className="bg-slate-100 hover:bg-amber-100 text-[#0D285F] border border-slate-300 hover:border-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                            title="طالب علم کا کارڈ، تصویر اور مکمل رپورٹ دیکھیں"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            <span>کارڈ و تصویر</span>
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            {[
                              { key: 'Present', label: 'حاضر (Present)', color: 'bg-emerald-600' },
                              { key: 'Absent', label: 'غیر حاضر (Absent)', color: 'bg-red-600' },
                              { key: 'Leave', label: 'رخصت (Leave)', color: 'bg-amber-500' },
                              { key: 'Late', label: 'لیٹ (Late)', color: 'bg-purple-600' }
                            ].map(item => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setStatusMap(prev => ({ ...prev, [st.id]: item.key as any }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                                  currentStatus === item.key
                                    ? `${item.color} text-white ring-2 ring-offset-1 ring-slate-400`
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          {currentStatus === 'Absent' && (
                            <div className="text-center text-[10px] text-red-600 font-bold mt-1">
                              ⚠️ غیر حاضری پر Rs. {settings.finePerAbsentDay} فائن لاگو ہو گا
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500">
              حاضری لگانے کے بعد بٹن پر کلک کرنا لازمی ہے۔
            </span>
            <button
              onClick={handleSaveAttendance}
              className="bg-[#0D285F] hover:bg-[#07193B] text-white px-7 py-2.5 rounded-xl font-bold text-sm shadow transition"
            >
              Save Attendance (حاضری محفوظ کریں)
            </button>
          </div>
        </div>
      )}

      {/* REGISTERED STUDENTS LIST */}
      {activeTab === 'students_list' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                تمام رجسٹرڈ طلباء کی لسٹ (Registered Students: {students.length})
              </h2>
              <p className="text-xs text-slate-500">
                ایڈمن کی جانب سے شامل کیے گئے تمام طلباء یہاں لائیو ظاہر ہوتے ہیں۔
              </p>
            </div>
            <button
              type="button"
              onClick={() => syncNowWithCloud()}
              disabled={isCloudSyncing}
              className="bg-[#0D285F] text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'سنک ہو رہا ہے...' : 'نیا ڈیٹا ریفریش کریں (Refresh)'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={studentFilterQuery}
              onChange={(e) => setStudentFilterQuery(e.target.value)}
              placeholder="تمام طلباء میں تلاش کریں (نام، رول نمبر، کلاس)..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-[#0D285F] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none transition"
            />
            {studentFilterQuery && (
              <button
                type="button"
                onClick={() => setStudentFilterQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ صاف کریں
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                اس وقت کوئی طالب علم رجسٹرڈ نہیں ہے۔
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                جیسے ہی ایڈمن اپنے موبائل سے نیا طالب علم شامل کریں گے، وہ یہاں فوری ظاہر ہوگا۔
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07193B] text-white">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Student & Photo</th>
                    <th className="p-3">Father Name</th>
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Monthly Fee</th>
                    <th className="p-3 text-center">Profile & Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students
                    .filter(s => {
                      if (!studentFilterQuery.trim()) return true;
                      const q = studentFilterQuery.toLowerCase().trim();
                      const cleanNum = q.replace(/^0+/, '');
                      const rollClean = s.rollNo.trim().toLowerCase();
                      const rollNum = rollClean.replace(/^0+/, '');
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.fatherName.toLowerCase().includes(q) ||
                        rollClean === q ||
                        (cleanNum !== '' && rollNum === cleanNum) ||
                        s.admissionNo.toLowerCase().includes(q) ||
                        s.className.toLowerCase().includes(q)
                      );
                    })
                    .map(st => (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 inline-flex items-center justify-center font-mono">
                          {st.rollNo}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#0D285F]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                          {st.className}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {st.photo ? (
                            <img
                              src={st.photo}
                              alt={st.name}
                              className="w-8 h-8 rounded-full object-cover border border-amber-400 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0D285F] text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {st.name.charAt(0)}
                            </div>
                          )}
                          <div className="font-bold text-slate-900 text-sm">
                            {st.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {st.fatherName}
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {st.admissionNo}
                      </td>
                      <td className="p-3 text-slate-600 font-mono">
                        {st.contactNo || st.whatsappNo || '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        Rs. {st.monthlyFee}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(st)}
                          className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>کارڈ و تصویر</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2: TARBIYAT & HOMEWORK */}
      {activeTab === 'tarbiyat' && (
        <form onSubmit={handleSaveDailyReport} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900">Record Daily Tarbiyat & Homework Observation</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
            <select
              value={repStudentId}
              onChange={(e) => setRepStudentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.className} - Roll {s.rollNo})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Homework Status</label>
              <select
                value={repHomework}
                onChange={(e) => setRepHomework(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Not Done">Not Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Conduct / Akhlaqiat</label>
              <select
                value={repBehavior}
                onChange={(e) => setRepBehavior(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="Disciplined">Disciplined</option>
                <option value="Good">Good</option>
                <option value="Mischievous">Mischievous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Remarks for Parent</label>
            <textarea
              required
              rows={3}
              value={repRemarks}
              onChange={(e) => setRepRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
              placeholder="e.g. Needs to recite Nazra Quran at home daily."
            />
          </div>

          <button
            type="submit"
            className="bg-[#0D285F] text-white px-6 py-2 rounded-xl text-xs font-bold"
          >
            Save Tarbiyat Observation
          </button>
        </form>
      )}

      {/* 3: TESTS */}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Student Examinations & Marks Entry</h3>
              <p className="text-xs text-slate-500">
                سبجیکٹ اور ٹوٹل مارکس کے ساتھ ٹیسٹ بنائیں اور کلاس کے تمام طلباء کے نمبر درج کریں۔
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTestSubTab('enter_marks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  testSubTab === 'enter_marks'
                    ? 'bg-[#0D285F] text-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Enter Marks (نمبر درج کریں)
              </button>
              <button
                type="button"
                onClick={() => setTestSubTab('create_test')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                  testSubTab === 'create_test'
                    ? 'bg-[#0D285F] text-amber-300'
                    : 'bg-amber-400 hover:bg-amber-300 text-[#07193B]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Assessment (نیا ٹیسٹ بنائیں)</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: CREATE NEW ASSESSMENT */}
          {testSubTab === 'create_test' && (
            <form onSubmit={handleCreateTest} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 max-w-2xl">
              <h4 className="font-extrabold text-xs text-[#0D285F] uppercase tracking-wider">
                Create Assessment (مضمون اور کل نمبر سلیکٹ کریں)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class (کلاس)</label>
                  <select
                    value={newTestClass}
                    onChange={(e) => {
                      const cls = e.target.value as ClassLevel;
                      setNewTestClass(cls);
                      setNewTestTitle(`${newTestSubject.split(' ')[0]} Assessment - ${cls}`);
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-white font-medium"
                  >
                    {SCHOOL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* Subject List */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject (مضمون کی فہرست)</label>
                  <select
                    value={newTestSubject}
                    onChange={(e) => {
                      const sub = e.target.value;
                      setNewTestSubject(sub);
                      if (sub !== 'Other (دیگر مضمون)') {
                        setNewTestTitle(`${sub.split(' ')[0]} Assessment - ${newTestClass}`);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-white font-medium"
                  >
                    {SCHOOL_SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="Other (دیگر مضمون)">Other (دیگر مضمون - خود لکھیں)</option>
                  </select>
                </div>

                {/* Total Marks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks (کل نمبر)</label>
                  <select
                    value={newTestTotalMarks}
                    onChange={(e) => setNewTestTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-white font-bold text-[#0D285F]"
                  >
                    {[20, 25, 50, 75, 100].map(m => (
                      <option key={m} value={m}>{m} Total Marks</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Test Title (عنوان)</label>
                  <input
                    type="text"
                    required
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    placeholder="e.g. Mathematics Monthly Test"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
                  />
                </div>
              </div>

              {newTestSubject === 'Other (دیگر مضمون)' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter Custom Subject Name</label>
                  <input
                    type="text"
                    required
                    value={customSubjectInput}
                    onChange={(e) => {
                      setCustomSubjectInput(e.target.value);
                      setNewTestTitle(`${e.target.value} Assessment - ${newTestClass}`);
                    }}
                    placeholder="e.g. Arabic Grammar, Qirat, Tarbiyat Viva"
                    className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTestSubTab('enter_marks')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] hover:bg-[#07193B] text-white px-6 py-2 rounded-xl text-xs font-bold transition shadow"
                >
                  Create & Proceed to Marks
                </button>
              </div>
            </form>
          )}

          {/* SUB-VIEW 2: ENTER STUDENT MARKS */}
          {testSubTab === 'enter_marks' && (
            <div className="space-y-6">
              {tests.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-500">
                    ابھی تک کوئی ٹیسٹ شیڈول نہیں کیا گیا۔ پہلے نیا ٹیسٹ بنائیں۔
                  </p>
                  <button
                    onClick={() => setTestSubTab('create_test')}
                    className="bg-[#0D285F] text-amber-300 px-5 py-2.5 rounded-xl font-bold text-xs shadow transition"
                  >
                    + Schedule New Assessment (نیا ٹیسٹ بنائیں)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Test Header */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[260px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Assessment / Test (ٹیسٹ منتخب کریں)
                      </label>
                      <select
                        value={selectedTestId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedTestId(id);
                          // Populate existing marks
                          const map: Record<string, number> = {};
                          const rem: Record<string, string> = {};
                          testResults.filter(r => r.testId === id).forEach(r => {
                            map[r.studentId] = r.marksObtained;
                            rem[r.studentId] = r.remarks;
                          });
                          setTeacherMarksMap(map);
                          setTeacherRemarksMap(rem);
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-xl bg-white font-semibold"
                      >
                        {tests.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title} • {t.className} • {t.subject} (Total: {t.totalMarks} Marks)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTestId && (() => {
                      const t = tests.find(test => test.id === selectedTestId);
                      if (!t) return null;
                      return (
                        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Class & Subject:</span>
                            <span className="font-extrabold text-[#0D285F] text-xs">{t.className} • {t.subject}</span>
                          </div>
                          <div className="border-l pl-3">
                            <span className="text-[10px] text-slate-400 block">Total Marks:</span>
                            <span className="font-extrabold text-amber-700 text-xs">{t.totalMarks} Marks</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Class Student Marks Table */}
                  {selectedTestId && (() => {
                    const currentTest = tests.find(t => t.id === selectedTestId);
                    if (!currentTest) return null;
                    const testClassStudents = students.filter(s => s.className === currentTest.className);

                    if (testClassStudents.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 italic py-6 text-center bg-slate-50 rounded-xl">
                          اس کلاس ({currentTest.className}) میں ابھی کوئی طالب علم داخل نہیں ہے۔
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-[#0D285F] uppercase tracking-wider">
                            Student Marks Sheet ({currentTest.className})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            کل نمبر: <strong className="text-slate-900">{currentTest.totalMarks}</strong>
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#07193B] text-white">
                              <tr>
                                <th className="p-3">Roll No</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Marks Obtained (out of {currentTest.totalMarks})</th>
                                <th className="p-3">Percentage & Grade</th>
                                <th className="p-3">Remarks / تبصرہ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {testClassStudents.map(st => {
                                const existingRes = testResults.find(r => r.testId === currentTest.id && r.studentId === st.id);
                                const marks = teacherMarksMap[st.id] ?? existingRes?.marksObtained ?? 0;
                                const total = currentTest.totalMarks;
                                const pct = Math.round((marks / total) * 100);
                                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

                                return (
                                  <tr key={st.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-mono text-[#0D285F]">
                                      {st.rollNo}
                                    </td>
                                    <td className="p-3">
                                      <div className="font-bold text-slate-900">{st.name}</div>
                                      <div className="text-[10px] text-slate-400">ولدیت: {st.fatherName}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min={0}
                                          max={currentTest.totalMarks}
                                          value={teacherMarksMap[st.id] ?? existingRes?.marksObtained ?? ''}
                                          onChange={(e) => {
                                            const val = Math.min(total, Math.max(0, Number(e.target.value)));
                                            setTeacherMarksMap(prev => ({ ...prev, [st.id]: val }));
                                          }}
                                          placeholder="Marks"
                                          className="w-24 px-3 py-1.5 border rounded-lg font-bold text-center text-sm"
                                        />
                                        <span className="text-slate-400 font-bold">/ {total}</span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                        pct >= 80
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : pct >= 50
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {pct}% • Grade {grade}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        value={teacherRemarksMap[st.id] ?? existingRes?.remarks ?? ''}
                                        onChange={(e) => setTeacherRemarksMap(prev => ({ ...prev, [st.id]: e.target.value }))}
                                        placeholder="e.g. Well prepared"
                                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-slate-500">
                            نمبر درج کرنے کے بعد نیچے والا بٹن دبائیں۔
                          </span>
                          <button
                            type="button"
                            onClick={handleSaveAllMarksForClass}
                            className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold text-xs px-6 py-2.5 rounded-xl shadow transition"
                          >
                            ✓ Save All Marks (تمام بچوں کے نمبر محفوظ کریں)
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Test Results Table */}
          {testResults.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Submitted Student Test Results History (ریکارڈ شدہ ٹیسٹ رزلٹ)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Test Title</th>
                      <th className="p-3">Marks Obtained</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testResults.slice(0, 15).map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{tr.studentName}</td>
                        <td className="p-3">{tr.className}</td>
                        <td className="p-3 text-slate-700">{tr.subject}</td>
                        <td className="p-3 text-slate-500">{tr.testTitle}</td>
                        <td className="p-3 font-bold text-[#0D285F]">
                          {tr.marksObtained} / {tr.totalMarks}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            tr.grade === 'A+' || tr.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tr.grade === 'F'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tr.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic">{tr.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4: LEAVE */}
      {activeTab === 'leave' && (
        <form onSubmit={handleApplyLeave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900">Apply for Faculty Leave</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                value={leaveFrom}
                onChange={(e) => setLeaveFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                value={leaveTo}
                onChange={(e) => setLeaveTo(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Days</label>
            <input
              type="number"
              value={leaveDays}
              onChange={(e) => setLeaveDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Urgent family work in Faisalabad."
              className="w-full px-3 py-2 text-xs border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="bg-[#0D285F] text-white px-6 py-2 rounded-xl text-xs font-bold"
          >
            Submit Leave Request
          </button>
        </form>
      )}

      {/* 5: NOTICES */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>School Notices & Announcements (اسکول کے اعلانات)</span>
            </h3>
            <p className="text-xs text-slate-500">Official circulars issued by School Administration</p>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active notices at this time.</p>
            ) : (
              notices.map(n => (
                <div key={n.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {n.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{n.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Change My Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!teacher) return;
                if (!newPasswordInput.trim()) return;
                setTeacherPassword(teacher.id, newPasswordInput.trim());
                setPasswordSuccess('Password successfully updated!');
                setTimeout(() => {
                  setShowPasswordModal(false);
                }, 1500);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (نیا پاس ورڈ)
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-3 py-2 text-sm border rounded-lg font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  You can set any easy or confidential password for your login.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#07193B]"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
