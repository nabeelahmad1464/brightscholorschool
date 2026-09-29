import React, { useState } from 'react';
import {
  X,
  Lock,
  Shield,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle,
  KeyRound
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_CLASSES } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginAdmin, loginTeacher, loginParent, teachers, students } = useSchool();

  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'parent'>('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [teacherPassword, setTeacherPassword] = useState('teacher123');
  const [parentIdentifier, setParentIdentifier] = useState('01');
  const [parentClass, setParentClass] = useState('Class 5');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginAdmin(adminPassword);
    if (success) {
      onClose();
    } else {
      setError('Incorrect admin password. (Default is: admin)');
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!teacherId) {
      setError('Please select a teacher.');
      return;
    }
    const success = loginTeacher(teacherId, teacherPassword);
    if (success) {
      onClose();
    } else {
      setError('Incorrect teacher password. (Default is: teacher)');
    }
  };

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!parentIdentifier.trim()) {
      setError('Please enter Student Roll Number or Admission ID.');
      return;
    }
    const student = loginParent(parentIdentifier, parentClass);
    if (student) {
      onClose();
    } else {
      setError(`Student with Roll No / ID "${parentIdentifier}" not found in ${parentClass}. Try Roll No "01" or Admission "BSS-101".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0D285F] text-white p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#07193B] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">School Portal Access</h2>
              <p className="text-xs text-amber-300">Bright Scholar School Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveRole('admin'); setError(''); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeRole === 'admin'
                ? 'bg-white text-[#0D285F] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveRole('teacher'); setError(''); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeRole === 'teacher'
                ? 'bg-white text-[#0D285F] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveRole('parent'); setError(''); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeRole === 'parent'
                ? 'bg-white text-[#0D285F] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Parent</span>
          </button>
        </div>

        {/* Content / Forms */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin Login Form */}
          {activeRole === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <span className="font-bold">Administrative Dashboard:</span> Manage students, teachers, fee vouchers, absent fines, reports, and settings.
                <div className="mt-1 text-[11px] text-amber-800">
                  Default password: <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono font-bold">admin</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0D285F] hover:bg-[#07193B] text-white py-2.5 rounded-xl font-bold text-sm shadow transition"
              >
                Enter Admin Portal
              </button>
            </form>
          )}

          {/* Teacher Login Form */}
          {activeRole === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                <span className="font-bold">Faculty Portal:</span> Mark attendance, record daily homework & tarbiyat remarks, enter test marks.
                <div className="mt-1 text-[11px] text-blue-800">
                  Default password for all teachers: <code className="bg-blue-200/60 px-1 py-0.5 rounded font-mono font-bold">teacher123</code>
                </div>
              </div>

              {teachers.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Teachers Added Yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please log in as <span className="font-bold text-[#0D285F]">Admin</span> to add your faculty members first.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveRole('admin')}
                    className="mt-3 text-xs font-bold text-[#0D285F] hover:underline"
                  >
                    Go to Admin Login →
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Faculty Member
                    </label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none bg-white"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teacher Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="Enter teacher password (teacher123)"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0D285F] hover:bg-[#07193B] text-white py-2.5 rounded-xl font-bold text-sm shadow transition"
                  >
                    Enter Teacher Portal
                  </button>
                </>
              )}
            </form>
          )}

          {/* Parent Login Form */}
          {activeRole === 'parent' && (
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                <span className="font-bold">Parent & Student Portal:</span> Check child's live attendance, absence fines, fee invoice, test report card, and tarbiyat marks.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Child's Class
                </label>
                <select
                  value={parentClass}
                  onChange={(e) => setParentClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none bg-white font-medium"
                >
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Roll Number or Admission ID
                </label>
                <input
                  type="text"
                  required
                  value={parentIdentifier}
                  onChange={(e) => setParentIdentifier(e.target.value)}
                  placeholder="e.g. 01 or BSS-101"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none font-medium"
                />
              </div>

              {/* Quick sample chips */}
              <div className="text-[11px] text-slate-500">
                <span>Quick demo students: </span>
                <button
                  type="button"
                  onClick={() => { setParentClass('Class 5'); setParentIdentifier('01'); }}
                  className="text-blue-600 font-semibold underline mr-2"
                >
                  Abdullah (Class 5 - Roll 01)
                </button>
                <button
                  type="button"
                  onClick={() => { setParentClass('Class 1'); setParentIdentifier('01'); }}
                  className="text-blue-600 font-semibold underline"
                >
                  Ali (Class 1 - Roll 01)
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0D285F] hover:bg-[#07193B] text-white py-2.5 rounded-xl font-bold text-sm shadow transition"
              >
                View Child's Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
