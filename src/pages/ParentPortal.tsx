import React, { useState } from 'react';
import {
  User,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  MessageCircle,
  Clock
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';

interface ParentPortalProps {
  onSelectStudent: (student: Student) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ onSelectStudent }) => {
  const {
    students,
    currentParentStudentId,
    getStudentFullReport,
    submitLeave,
    openWhatsApp,
    settings
  } = useSchool();

  const student = students.find(s => s.id === currentParentStudentId) || students[0];
  const report = student ? getStudentFullReport(student.id) : null;

  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  if (!student || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Student record not loaded. Please login again.</p>
      </div>
    );
  }

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    submitLeave({
      applicantId: student.id,
      applicantName: student.name,
      role: 'student',
      className: student.className,
      fromDate: leaveFrom,
      toDate: leaveTo,
      numberOfDays: Number(leaveDays),
      reason: leaveReason.trim(),
      status: 'Pending'
    });

    setLeaveSubmitted(true);
    setLeaveReason('');
  };

  const handleWhatsAppPaymentProof = () => {
    const text = `Assalam-o-Alaikum! Maine apne bachay ki fee jama karwa di hai.
Student: ${student.name}
Class: ${student.className} | Roll: ${student.rollNo}
Admission No: ${student.admissionNo}
Amount: Rs. ${report.balanceRemaining || report.monthlyFee}
Kindly issue official receipt.`;

    openWhatsApp(settings.schoolWhatsApp, text);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Student Banner */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-[#07193B] font-bold font-serif-crest text-xl flex items-center justify-center flex-shrink-0">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{student.name}</h1>
              <span className="bg-amber-400 text-[#07193B] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {student.className}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              S/O {student.fatherName} • Roll No: {student.rollNo} • Admission No: {student.admissionNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectStudent(student)}
            className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Open Printable Report Card
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Attendance</span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">
            {report.attendancePercentage}%
          </span>
          <span className="text-[11px] text-slate-500">
            {report.presentDays} Present / {report.totalWorkingDays} Days
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Absence Fine</span>
          <span className="text-2xl font-black text-red-900 mt-1 block">
            Rs. {report.totalFineAmount}
          </span>
          <span className="text-[11px] text-red-600">
            {report.absentDays} Absents (Rs. 30/day)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Monthly Tuition</span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            Rs. {report.monthlyFee.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">{student.className}</span>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm text-center ${
          report.balanceRemaining === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <span className="text-xs font-semibold block uppercase">Fee Status</span>
          <span className="text-2xl font-black mt-1 block">
            Rs. {report.balanceRemaining.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold">
            {report.balanceRemaining === 0 ? '✓ Paid & Cleared' : 'Payment Due'}
          </span>
        </div>
      </div>

      {/* Absence Fine notice for parent */}
      {report.absentDays > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Attention regarding absence fine: </span>
            A fine of Rs. {settings.finePerAbsentDay} per unapproved absence has been applied. Current fine balance is <strong>Rs. {report.totalFineAmount}</strong> ({report.absentDays} days).
            Please submit future leave applications through the form below in advance to avoid fines.
          </div>
        </div>
      )}

      {/* Two columns: Examination results & Daily Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exams */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Examination & Test Marks</span>
          </h3>
          {report.testScores.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tests graded yet.</p>
          ) : (
            <div className="space-y-2">
              {report.testScores.map(t => (
                <div key={t.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{t.testTitle}</div>
                    <div className="text-slate-500">{t.subject}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm">{t.marksObtained}/{t.totalMarks}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-200 font-bold text-slate-900">
                      Grade: {t.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Remarks & Tarbiyat */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Tarbiyat & Daily Homework Observation</span>
          </h3>
          {report.recentDailyReports.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No teacher observations logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {report.recentDailyReports.map(dr => (
                <div key={dr.id} className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span className="font-bold text-[#0D285F]">{dr.date}</span>
                    <span>Homework: <strong>{dr.homework}</strong></span>
                  </div>
                  <p className="text-slate-700 italic">“{dr.teacherRemarks}”</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Leave Application Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Submit Student Leave Application Online</span>
        </h3>
        <p className="text-xs text-slate-500">
          Submitting leave in advance prevents the daily unapproved absence fine of Rs. {settings.finePerAbsentDay}.
        </p>

        {leaveSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Leave application submitted to School Administration!</span>
          </div>
        ) : (
          <form onSubmit={handleApplyLeave} className="space-y-3 max-w-xl">
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
                rows={2}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Sickness / family function in Chak 47 GB"
                className="w-full px-3 py-2 text-xs border rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="bg-[#0D285F] text-white px-5 py-2 rounded-xl text-xs font-bold"
            >
              Submit Leave to Principal
            </button>
          </form>
        )}
      </div>

      {/* School Notices for Parents */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <FileText className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-slate-900">School Notices & Circulars (اسکول کے اہم اعلانات)</h3>
        </div>

        <div className="space-y-3">
          {useSchool().notices.length === 0 ? (
            <p className="text-xs text-slate-500">No active notices at this moment.</p>
          ) : (
            useSchool().notices.map(n => (
              <div key={n.id} className="p-3.5 rounded-xl border border-slate-200 bg-amber-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    {n.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{n.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600">{n.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fee Payment CTA */}
      <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs text-slate-900">Need Fee Assistance or Want to Share Payment Slip?</h4>
          <p className="text-xs text-slate-500">
            Submit bank/easypaisa receipt directly on the official school WhatsApp.
          </p>
        </div>
        <button
          onClick={handleWhatsAppPaymentProof}
          className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Send Fee Receipt via WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
