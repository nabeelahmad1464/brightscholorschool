import React, { useState } from 'react';
import { X, School, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { ClassLevel, SCHOOL_CLASSES, getDefaultMonthlyFee } from '../types';

interface OnlineAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineAdmissionModal: React.FC<OnlineAdmissionModalProps> = ({ isOpen, onClose }) => {
  const { submitOnlineAdmission, openWhatsApp } = useSchool();

  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('2019-05-15');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [applyingClass, setApplyingClass] = useState<ClassLevel>('Class 1');
  const [previousSchool, setPreviousSchool] = useState('');
  const [contactNo, setContactNo] = useState('0302-5053993');
  const [whatsappNo, setWhatsappNo] = useState('0302-5053993');
  const [address, setAddress] = useState('Chak No. 47 GB, Samundri');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !fatherName.trim() || !contactNo.trim()) {
      setError('براہ کرم طالب علم کا نام، والد کا نام اور رابطہ نمبر درج کریں۔');
      return;
    }

    submitOnlineAdmission({
      studentName: studentName.trim(),
      fatherName: fatherName.trim(),
      dob,
      gender,
      applyingClass,
      previousSchool: previousSchool.trim() || 'First time admission',
      contactNo: contactNo.trim(),
      whatsappNo: whatsappNo.trim() || contactNo.trim(),
      address: address.trim(),
    });

    setSubmitted(true);
    setError('');

    // Automatically trigger WhatsApp notification to the School WhatsApp (0302-5053993)
    const msg = `*نئی آن لائن داخلہ درخواست (Bright Scholar School)*
---------------------------------------------
👤 طالب علم کا نام: ${studentName.trim()}
👨‍👦 والد کا نام: ${fatherName.trim()}
📚 کلاس جس کے لیے داخلہ چاہیے: ${applyingClass}
📅 تاریخ پیدائش: ${dob} (${gender})
📞 رابطہ نمبر: ${contactNo.trim()}
💬 واٹس ایپ نمبر: ${whatsappNo.trim() || contactNo.trim()}
🏠 گھر کا پتہ: ${address.trim() || 'Chak No. 47 GB, Samundri'}
🏫 سابقہ اسکول: ${previousSchool.trim() || 'پہلی بار داخلہ'}
---------------------------------------------
براہ کرم اس داخلہ درخواست کی تصدیق فرمائیں۔`;

    openWhatsApp('03025053993', msg);
  };

  const handleWhatsAppNotify = () => {
    const msg = `*نئی آن لائن داخلہ درخواست (Bright Scholar School)*
---------------------------------------------
👤 طالب علم کا نام: ${studentName.trim()}
👨‍👦 والد کا نام: ${fatherName.trim()}
📚 کلاس جس کے لیے داخلہ چاہیے: ${applyingClass}
📅 تاریخ پیدائش: ${dob} (${gender})
📞 رابطہ نمبر: ${contactNo.trim()}
💬 واٹس ایپ نمبر: ${whatsappNo.trim() || contactNo.trim()}
🏠 گھر کا پتہ: ${address.trim() || 'Chak No. 47 GB, Samundri'}
🏫 سابقہ اسکول: ${previousSchool.trim() || 'پہلی بار داخلہ'}
---------------------------------------------
براہ کرم اس داخلہ درخواست کی تصدیق فرمائیں۔`;

    openWhatsApp('03025053993', msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0D285F] text-white p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#07193B] flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Online Admission Application</h2>
              <p className="text-xs text-amber-300">Bright Scholar School • Session 2026-2027</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Application Submitted Successfully!
              </h3>
              <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                Thank you! Application for <strong>{studentName}</strong> for <strong>{applyingClass}</strong> has been received by Bright Scholar School administration.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 mb-6 text-left space-y-1">
                <p><strong>Next Step:</strong> Our admission coordinator will contact you at <strong>{contactNo}</strong> for test/interview date and document verification.</p>
                <p><strong>Monthly Tuition Fee:</strong> Rs. {getDefaultMonthlyFee(applyingClass).toLocaleString()} / month</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleWhatsAppNotify}
                  className="bg-[#25D366] hover:bg-[#20b858] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send Confirmation on WhatsApp</span>
                </button>
                <button
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] focus:border-[#0D285F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] focus:border-[#0D285F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applying For Class
                  </label>
                  <select
                    value={applyingClass}
                    onChange={(e) => setApplyingClass(e.target.value as ClassLevel)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none bg-white font-medium"
                  >
                    {SCHOOL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} (Rs. {getDefaultMonthlyFee(cls)}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none bg-white"
                  >
                    <option value="Male">Male (Boy)</option>
                    <option value="Female">Female (Girl)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="0302-5053993"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsappNo}
                    onChange={(e) => setWhatsappNo(e.target.value)}
                    placeholder="0302-5053993"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Previous School (if any)
                </label>
                <input
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  placeholder="Leave empty if first time admission"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Chak No. 47 GB, Samundri"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D285F] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0D285F] hover:bg-[#07193B] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
                >
                  Submit Admission Form
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
