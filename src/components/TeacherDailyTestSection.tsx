import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  AlertCircle,
  Users
} from 'lucide-react';
import { useSchool, isDummyStudent } from '../context/SchoolContext';
import { ClassLevel, SCHOOL_CLASSES, SCHOOL_SUBJECTS, Test } from '../types';
import { calculateGrade, parseMarkInput } from '../utils/resultCalculations';

interface TeacherDailyTestSectionProps {
  role: 'admin' | 'teacher';
  teacherId?: string;
  teacherName?: string;
  teacherAssignedClasses?: string;
}

export const TeacherDailyTestSection: React.FC<TeacherDailyTestSectionProps> = ({
  role,
  teacherId,
  teacherName,
  teacherAssignedClasses
}) => {
  const {
    students,
    tests,
    testResults,
    saveDailyTestWithResultsAsync,
    deleteTestAsync
  } = useSchool();

  const validStudents = useMemo(
    () => students.filter(s => !isDummyStudent(s) && s.isActive),
    [students]
  );

  // Determine classes allowed for this user
  const allowedClasses = useMemo<ClassLevel[]>(() => {
    if (role === 'admin' || !teacherAssignedClasses || /all/i.test(teacherAssignedClasses)) {
      return SCHOOL_CLASSES;
    }
    const matched = SCHOOL_CLASSES.filter(cls =>
      teacherAssignedClasses.toLowerCase().includes(cls.toLowerCase())
    );
    return matched.length > 0 ? matched : SCHOOL_CLASSES;
  }, [role, teacherAssignedClasses]);

  const [viewMode, setViewMode] = useState<'history' | 'editor' | 'report'>('history');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [selectedReportTestId, setSelectedReportTestId] = useState<string | null>(null);

  // Form state
  const [formClass, setFormClass] = useState<ClassLevel>(
    allowedClasses.find(c => validStudents.some(s => s.className === c)) || allowedClasses[0] || 'Play Group'
  );
  const [formSubject, setFormSubject] = useState<string>(SCHOOL_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTotalMarks, setFormTotalMarks] = useState<number>(20);
  const [formDescription, setFormDescription] = useState<string>('');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  // Filter & feedback state
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('All');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classStudents = useMemo(
    () =>
      validStudents
        .filter(s => s.className === formClass)
        .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })),
    [validStudents, formClass]
  );

  const visibleTests = useMemo(() => {
    const allowedSet = new Set<string>(allowedClasses);
    return tests
      .filter(t => role === 'admin' || allowedSet.has(t.className))
      .filter(t => historyClassFilter === 'All' || t.className === historyClassFilter)
      .filter(t => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase().trim();
        return (
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.className.toLowerCase().includes(q) ||
          (t.testDate || '').includes(q)
        );
      })
      .sort((a, b) => (b.testDate || '').localeCompare(a.testDate || ''));
  }, [tests, role, allowedClasses, historyClassFilter, historySearch]);

  const startNewTest = () => {
    setStatusBanner(null);
    setEditingTestId(null);
    const defaultCls =
      allowedClasses.find(c => validStudents.some(s => s.className === c)) || allowedClasses[0] || 'Play Group';
    setFormClass(defaultCls);
    setFormSubject(SCHOOL_SUBJECTS[0]);
    setCustomSubject('');
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTotalMarks(20);
    setFormDescription('');
    setMarksMap({});
    setRemarksMap({});
    setViewMode('editor');
  };

  const startEditTest = (test: Test) => {
    setStatusBanner(null);
    setEditingTestId(test.id);
    setFormClass(test.className as ClassLevel);
    if (SCHOOL_SUBJECTS.includes(test.subject)) {
      setFormSubject(test.subject);
      setCustomSubject('');
    } else {
      setFormSubject('Other');
      setCustomSubject(test.subject);
    }
    setFormTitle(test.title);
    setFormDate(test.testDate || new Date().toISOString().split('T')[0]);
    setFormTotalMarks(test.totalMarks || 20);
    setFormDescription(test.description || '');

    const existingResults = testResults.filter(r => r.testId === test.id);
    const nextMarks: Record<string, string> = {};
    const nextRemarks: Record<string, string> = {};
    existingResults.forEach(r => {
      nextMarks[r.studentId] = String(r.marksObtained);
      nextRemarks[r.studentId] = r.remarks || '';
    });
    setMarksMap(nextMarks);
    setRemarksMap(nextRemarks);
    setViewMode('editor');
  };

  const handleSaveDailyTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);

    const resolvedSubject =
      formSubject === 'Other' ? customSubject.trim() || 'General Subject' : formSubject;
    const total = Number(formTotalMarks);
    if (!Number.isFinite(total) || total <= 0) {
      setStatusBanner({ type: 'error', text: 'Total marks must be greater than 0.' });
      return;
    }
    if (classStudents.length === 0) {
      setStatusBanner({ type: 'error', text: `No active students found in ${formClass}.` });
      return;
    }

    const title = formTitle.trim() || `${resolvedSubject} Daily Test (${formDate})`;
    const studentEntries = classStudents
      .filter(st => marksMap[st.id] !== undefined && marksMap[st.id].trim() !== '')
      .map(st => {
        const parsed = parseMarkInput(marksMap[st.id]);
        const rawVal = typeof parsed === 'number' ? parsed : 0;
        const clamped = Math.max(0, Math.min(total, rawVal));
        const pct = Math.round((clamped / total) * 1000) / 10;
        const grade = calculateGrade(pct);
        const remark =
          (remarksMap[st.id] || '').trim() ||
          (pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Satisfactory' : 'Needs Practice');
        return {
          studentId: st.id,
          studentName: st.name,
          marksObtained: clamped,
          grade,
          remarks: remark
        };
      });

    if (studentEntries.length === 0) {
      setStatusBanner({
        type: 'error',
        text: 'Please enter obtained marks for at least one student before saving.'
      });
      return;
    }

    const testPayload: Test = {
      id: editingTestId || `tst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      className: formClass,
      subject: resolvedSubject,
      totalMarks: total,
      testDate: formDate || new Date().toISOString().split('T')[0],
      description: formDescription.trim() || 'Daily Class Test',
      createdByTeacherId: teacherId,
      createdByTeacherName: teacherName || (role === 'admin' ? 'Admin' : 'Teacher'),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    const res = await saveDailyTestWithResultsAsync(testPayload, studentEntries);
    setIsSaving(false);

    if (!res.success) {
      setStatusBanner({
        type: 'error',
        text: res.error || 'Failed to save daily test to online database. Please check internet connection.'
      });
      return;
    }

    setStatusBanner({
      type: 'success',
      text: `Daily Test "${title}" (${studentEntries.length} students) saved permanently to online database and synced to Parent Portal!`
    });
    setSelectedReportTestId(res.test.id);
    setViewMode('report');
  };

  const handleDeleteTest = async (test: Test) => {
    if (!confirm(`Delete daily test "${test.title}" (${test.className}) and all its student marks?`)) {
      return;
    }
    const ok = await deleteTestAsync(test.id);
    if (!ok) {
      setStatusBanner({
        type: 'error',
        text: 'Could not delete test from online server. Please check connection and try again.'
      });
      return;
    }
    setStatusBanner({ type: 'success', text: `Test "${test.title}" deleted from central database.` });
    if (selectedReportTestId === test.id) {
      setSelectedReportTestId(null);
      setViewMode('history');
    }
  };

  const activeReportTest = tests.find(t => t.id === selectedReportTestId) || null;
  const activeReportResults = useMemo(() => {
    if (!activeReportTest) return [];
    return testResults
      .filter(r => r.testId === activeReportTest.id)
      .sort((a, b) => b.marksObtained - a.marksObtained);
  }, [activeReportTest, testResults]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D285F] to-[#1E3A8A] text-white p-5 rounded-2xl shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>DAILY CLASS TEST SYSTEM • روزانہ کلاس ٹیسٹ</span>
          </div>
          <h3 className="text-lg font-extrabold">
            Daily Class Tests &amp; Student Progress Tracking
          </h3>
          <p className="text-xs text-slate-200 mt-0.5">
            Create class tests, record student-wise marks &amp; remarks, edit saved tests, and sync live to Parent Portal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'history'
                ? 'bg-amber-400 text-[#07193B]'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            Test History ({visibleTests.length})
          </button>
          <button
            type="button"
            onClick={startNewTest}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Daily Test</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* VIEW 1: TEST HISTORY */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search test title, subject, class, or date..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:border-[#0D285F]"
              />
            </div>
            <select
              value={historyClassFilter}
              onChange={e => setHistoryClassFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-[#0D285F]"
            >
              <option value="All">All Allowed Classes</option>
              {allowedClasses.map(cls => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {visibleTests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No daily tests recorded yet.</p>
              <p className="text-xs text-slate-500">
                Click &quot;Create Daily Test&quot; to add a class test and enter student marks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {visibleTests.map(t => {
                const resList = testResults.filter(r => r.testId === t.id);
                const avgPct =
                  resList.length > 0 && t.totalMarks > 0
                    ? Math.round(
                        (resList.reduce((acc, r) => acc + r.marksObtained, 0) /
                          (resList.length * t.totalMarks)) *
                          1000
                      ) / 10
                    : 0;
                return (
                  <div
                    key={t.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:bg-white hover:shadow-sm transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block bg-[#0D285F] text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                          {t.className}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">{t.title}</h4>
                        <p className="text-xs text-slate-600 font-semibold">
                          {t.subject} • Total Marks: {t.totalMarks}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{t.testDate}</span>
                          <span>• {resList.length} Students Graded</span>
                          {resList.length > 0 && <span>• Class Avg: {avgPct}%</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReportTestId(t.id);
                          setViewMode('report');
                        }}
                        className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Class Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditTest(t)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Marks</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(t)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CREATE / EDIT DAILY TEST */}
      {viewMode === 'editor' && (
        <form
          onSubmit={handleSaveDailyTest}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="font-extrabold text-sm text-[#0D285F]">
              {editingTestId ? 'Edit Saved Daily Test & Student Marks' : 'Create New Daily Class Test'}
            </h4>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Back to History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class *</label>
              <select
                value={formClass}
                disabled={Boolean(editingTestId)}
                onChange={e => {
                  setFormClass(e.target.value as ClassLevel);
                  setMarksMap({});
                  setRemarksMap({});
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-[#0D285F]"
              >
                {allowedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} ({validStudents.filter(s => s.className === cls).length})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject *</label>
              <select
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                {SCHOOL_SUBJECTS.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="Other">Other (Custom Subject)</option>
              </select>
              {formSubject === 'Other' && (
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder="Enter subject name..."
                  className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Test Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Marks *</label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={formTotalMarks}
                onChange={e => setFormTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-extrabold text-[#0D285F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Test Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Chapter 3 Dictation & Oral Test"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Topic / Notes (Optional)</label>
              <input
                type="text"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="e.g. Unit 2 Questions 1-5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Student-Wise Marks Entry Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0D285F]" />
                <span>
                  Student-Wise Marks Entry — {formClass} ({classStudents.length} Students)
                </span>
              </h5>
              <span className="text-[11px] text-slate-500">
                Leave blank for absent students; percentage &amp; grade calculate automatically.
              </span>
            </div>

            {classStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border">
                No active students found in {formClass}.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-2.5 w-16">Roll #</th>
                      <th className="p-2.5">Student &amp; Father Name</th>
                      <th className="p-2.5 w-32 text-center">Obtained / {formTotalMarks}</th>
                      <th className="p-2.5 w-20 text-center">%</th>
                      <th className="p-2.5 w-16 text-center">Grade</th>
                      <th className="p-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map(st => {
                      const raw = marksMap[st.id] ?? '';
                      const parsed = parseMarkInput(raw);
                      const hasVal = typeof parsed === 'number';
                      const clamped = hasVal ? Math.max(0, Math.min(formTotalMarks || 1, parsed)) : 0;
                      const pct =
                        hasVal && formTotalMarks > 0
                          ? Math.round((clamped / formTotalMarks) * 1000) / 10
                          : null;
                      const grade = pct !== null ? calculateGrade(pct) : '-';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-[#0D285F]">{st.rollNo}</td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{st.name}</span>
                            <span className="text-[10px] text-slate-500">S/O {st.fatherName}</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={formTotalMarks}
                              step="0.5"
                              value={raw}
                              onChange={e =>
                                setMarksMap(prev => ({ ...prev, [st.id]: e.target.value }))
                              }
                              placeholder="0"
                              className="w-24 px-2.5 py-1.5 text-center font-extrabold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0D285F] outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {pct !== null ? `${pct}%` : '-'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[11px]">
                              {grade}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={remarksMap[st.id] ?? ''}
                              onChange={e =>
                                setRemarksMap(prev => ({ ...prev, [st.id]: e.target.value }))
                              }
                              placeholder="Optional remark..."
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow cursor-pointer disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Central Database...' : 'Save Daily Test & Sync Online'}</span>
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: CLASS TEST REPORT */}
      {viewMode === 'report' && activeReportTest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 print:hidden">
            <div>
              <h4 className="font-extrabold text-sm text-[#0D285F]">
                Class Test Report — {activeReportTest.title}
              </h4>
              <p className="text-xs text-slate-500">
                {activeReportTest.className} • {activeReportTest.subject} • Date: {activeReportTest.testDate} • Total Marks: {activeReportTest.totalMarks}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startEditTest(activeReportTest)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Marks</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#0D285F] text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('history')}
                className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07193B] text-white">
                <tr>
                  <th className="p-2.5 text-center w-12">Rank</th>
                  <th className="p-2.5">Student Name</th>
                  <th className="p-2.5 text-center">Obtained / Total</th>
                  <th className="p-2.5 text-center">Percentage</th>
                  <th className="p-2.5 text-center">Grade</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeReportResults.map((r, idx) => {
                  const pct =
                    r.percentage ??
                    (r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 1000) / 10 : 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-black text-[#0D285F]">#{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{r.studentName}</td>
                      <td className="p-2.5 text-center font-extrabold text-[#0D285F]">
                        {r.marksObtained} / {r.totalMarks}
                      </td>
                      <td className="p-2.5 text-center font-bold">{pct}%</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{r.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
