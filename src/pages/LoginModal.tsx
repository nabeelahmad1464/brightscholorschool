import React, { useState, useEffect } from 'react';
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
  initialRole?: 'admin' | 'teacher' | 'parent';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialRole = 'admin' }) => {
  const { loginAdmin, loginTeacher, loginOrCreateTeacherByName, loginParent, teachers, students, setPortal } = useSchool();

  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'parent'>(initialRole);
  const [adminPassword, setAdminPassword] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [parentIdentifier, setParentIdentifier] = useState('');
  const [parentClass, setParentClass] = useState('Class 4');
  const [error, setError] = useState('');

  // Reset fields when modal opens or initialRole changes
  useEffect(() => {
    if (isOpen) {
      setActiveRole(initialRole);
      setAdminPassword('');
      setTeacherPassword('');
      setParentIdentifier('');
      setError('');
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    if (teachers.length > 0 && (!teacherId || !teachers.some(t => t.id === teacherId))) {
      setTeacherId(teachers[0].id);
    }
  }, [teachers, teacherId]);

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginAdmin(adminPassword);
    if (success) {
      onClose();
    } else {
      setError('ایڈمن پاسورڈ غلط ہے۔ براہ کرم درست ایڈمن پاسورڈ درج کریں۔ (Incorrect admin password)');
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedId = teacherId || teachers[0]?.id;
    if (!selectedId) {
      setError('براہ کرم استاد کا نام منتخب کریں۔');
      return;
    }
    if (!teacherPassword.trim()) {
      setError('براہ کرم اپنا پاسورڈ درج کریں۔ (Please enter teacher password)');
      return;
    }

    const success = loginTeacher(selectedId, teacherPassword);
    if (success) {
      onClose();
    } else {
      setError('پاسورڈ غلط ہے! صرف مجاز اساتذہ ہی لاگ ان ہو سکتے ہیں۔ اگر آپ پاسورڈ بھول گئے ہیں تو ایڈمن سے رابطہ کریں۔');
    }
  };

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!parentIdentifier.trim()) {
      setError('Please enter Student Roll Number or Admission ID.');
      return;
    }
    const student = loginParent(parentIdentifier, parentClass) || loginParent(parentIdentifier, undefined);
    if (student) {
      onClose();
    } else {
      setError(`طالب علم رول نمبر "${parentIdentifier}" کلاس "${parentClass}" میں نہیں ملا۔ براہ کرم رول نمبر درست درج کریں یا اسکول واٹس ایپ پر رابطہ کریں۔`);
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
            onClick={() => {
              setActiveRole('admin');
              setError('');
              setAdminPassword('');
              setTeacherPassword('');
            }}
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
            onClick={() => {
              setActiveRole('teacher');
              setError('');
              setAdminPassword('');
              setTeacherPassword('');
            }}
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
            onClick={() => {
              setActiveRole('parent');
              setError('');
              setAdminPassword('');
              setTeacherPassword('');
            }}
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
                  Protected Principal Portal. Enter your confidential admin password to continue.
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
                    placeholder="پاسورڈ درج کریں (Enter password)"
                    autoComplete="new-password"
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
                  اساتذہ اپنا نام منتخب کر کے اسکول کا مقرر کردہ پاسورڈ درج کر کے لاگ ان کریں۔
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Faculty Member (استاد کا نام)
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none bg-white font-medium"
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
                  Teacher Password (پاسورڈ)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="پاسورڈ درج کریں (Enter password)"
                    autoComplete="new-password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  صرف ایڈمن کی جانب سے جاری کردہ درست پاسورڈ سے پورٹل میں داخلہ ممکن ہے۔
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0D285F] hover:bg-[#07193B] text-white py-2.5 rounded-xl font-bold text-sm shadow transition"
              >
                Enter Teacher Portal (پورٹل میں داخل ہوں)
              </button>
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
                  Select Child's Class (کلاس منتخب کریں)
                </label>
                <select
                  value={parentClass}
                  onChange={(e) => setParentClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none bg-white font-bold text-[#0D285F]"
                >
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Roll Number / Admission ID (طالب علم کا رول نمبر درج کریں)
                </label>
                <input
                  type="text"
                  required
                  value={parentIdentifier}
                  onChange={(e) => setParentIdentifier(e.target.value)}
                  placeholder="مثلاً: 01 یا 1 یا داخلہ نمبر..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none font-bold text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0D285F] hover:bg-[#07193B] text-white py-3 rounded-xl font-extrabold text-sm shadow transition"
                >
                  بچے کا پورٹل اور فیس رسید دیکھیں (View Portal & Receipt)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
