import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  User,
  Plus,
  KeyRound,
  Bell,
  Check,
  X
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, ClassLevel, SCHOOL_CLASSES } from '../types';

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
    addTestResult,
    tests,
    submitLeave,
    settings,
    setTeacherPassword,
    notices
  } = useSchool();

  const teacher = teachers.find(t => t.id === currentTeacherId) || teachers[0];

  const [activeTab, setActiveTab] = useState<'attendance' | 'tarbiyat' | 'tests' | 'leave' | 'notices'>('attendance');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('Class 5');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusMap, setStatusMap] = useState<Record<string, 'Present' | 'Absent' | 'Leave' | 'Late'>>({});

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Daily report state
  const [repStudentId, setRepStudentId] = useState(students[0]?.id || '');
  const [repHomework, setRepHomework] = useState<'Completed' | 'Incomplete' | 'Not Done'>('Completed');
  const [repBehavior, setRepBehavior] = useState<'Disciplined' | 'Good' | 'Mischievous'>('Disciplined');
  const [repRemarks, setRepRemarks] = useState('Showed keen interest in class and Nazra Quran.');

  // Test marks state
  const [selectedTestId, setSelectedTestId] = useState(tests[0]?.id || '');
  const [testStudentId, setTestStudentId] = useState(students[0]?.id || '');
  const [marksObtained, setMarksObtained] = useState<number>(45);

  // Leave state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);

  const classStudents = students.filter(s => s.className === selectedClass);

  const handleSaveAttendance = () => {
    const list = classStudents.map(s => ({
      studentId: s.id,
      status: statusMap[s.id] || 'Present'
    }));

    markClassAttendance(selectedClass, attDate, list);
    alert(`Attendance for ${selectedClass} recorded successfully!`);
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

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 border border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { id: 'attendance', label: 'Mark Class Attendance', icon: <Calendar className="w-4 h-4" /> },
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
                onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white font-medium"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
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

          {/* Class Summary Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#0D285F] text-amber-300 font-bold px-2.5 py-0.5 rounded text-xs">
                  {selectedClass}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  کل طلباء: {classStudents.length} بچے (Total: {classStudents.length} Students)
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
                  classStudents.forEach(s => { map[s.id] = 'Present'; });
                  setStatusMap(map);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
              >
                ✓ Mark All Present (سب کو حاضر کریں)
              </button>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-300">
              اس کلاس ({selectedClass}) میں ابھی کوئی بچہ داخل نہیں ہے۔ ایڈمن پورٹل سے بچوں کو ایڈ کیا جا سکتا ہے۔
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07193B] text-white">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Student & Father Name</th>
                    <th className="p-3 text-center">Mark Attendance (حاضری لگائیں)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {classStudents.map(st => {
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
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                          <div className="text-[11px] text-slate-500">
                            ولدیت: {st.fatherName} • Adm #{st.admissionNo}
                          </div>
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
        <form onSubmit={handleSaveTestResult} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900">Enter Student Examination Marks</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Test</label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
            >
              {tests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.className} - {t.totalMarks} Marks)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
            <select
              value={testStudentId}
              onChange={(e) => setTestStudentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Obtained</label>
            <input
              type="number"
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="bg-[#0D285F] text-white px-6 py-2 rounded-xl text-xs font-bold"
          >
            Submit Marks
          </button>
        </form>
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
