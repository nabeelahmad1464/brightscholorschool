import React, { useState } from 'react';
import { X, Printer, MessageCircle, CheckCircle, Clock, AlertCircle, Camera } from 'lucide-react';
import { FeeRecord, Student } from '../types';
import { useSchool } from '../context/SchoolContext';
import { downloadReceiptElementAsImage, generateAndDownloadReceiptCanvas } from '../utils/downloadReceiptImage';

interface FeeReceiptModalProps {
  feeRecord: FeeRecord | null;
  onClose: () => void;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ feeRecord, onClose }) => {
  const { settings, openWhatsApp, students } = useSchool();

  if (!feeRecord) return null;

  const student = students.find(s => s.id === feeRecord.studentId);
  const contactNo = student?.whatsappNo || student?.contactNo || '';
  const finePerDay = settings.finePerAbsentDay || 50;

  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const handleDownloadPicture = async () => {
    if (!feeRecord) return;
    setIsDownloadingImage(true);
    const fileName = `Fee_Receipt_${feeRecord.studentName.replace(/\s+/g, '_')}_${feeRecord.className}`;
    let ok = await downloadReceiptElementAsImage('printable-receipt', fileName);
    if (!ok && student) {
      ok = generateAndDownloadReceiptCanvas(
        student,
        feeRecord,
        finePerDay,
        settings.schoolName,
        settings.schoolAddress
      );
    }
    setIsDownloadingImage(false);
    if (ok) {
      alert(`رسید کی تصویر (Picture) کامیابی سے ڈاؤن لوڈ ہو گئی ہے!`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*BRIGHT SCHOLAR SCHOOL - CHAK 47 GB SAMUNDRI*\n` +
      `*OFFICIAL FEE RECEIPT / واؤچر رسید*\n\n` +
      `طالب علم: *${feeRecord.studentName}*\n` +
      `ولدیت: *${feeRecord.fatherName}*\n` +
      `کلاس: *${feeRecord.className}*\n` +
      `مہینہ: *${feeRecord.month}*\n` +
      `رسید نمبر: *${feeRecord.receiptNo || 'BSS-REC-' + feeRecord.id.slice(-5)}*\n` +
      `--------------------------------\n` +
      `ماہانہ فیس: Rs. ${feeRecord.tuitionFee}\n` +
      `غیر حاضری فائن (${feeRecord.absentDays} چھٹیاں @ Rs. ${finePerDay}): Rs. ${feeRecord.fineAmount}\n` +
      `کل واجب الادا رقم: *Rs. ${feeRecord.totalPayable}*\n` +
      `ادا شدہ رقم: *Rs. ${feeRecord.paidAmount}*\n` +
      `بقیہ واجبات: *Rs. ${feeRecord.balanceRemaining}*\n` +
      `اسٹیٹس: *${feeRecord.status === 'Paid' ? 'ادا شدہ (Paid)' : (feeRecord.status === 'Partial' ? 'جزوی (Partial)' : 'غیر ادا شدہ (Unpaid)')}*\n` +
      `--------------------------------\n` +
      `پہلے تربیت، پھر تعلیم • برائٹ اسکالر اسکول چک 47 گ ب سمندری`;

    openWhatsApp(contactNo || settings.schoolWhatsApp, text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 print:m-0 print:p-4 print:shadow-none print:border-none print:w-full">
        {/* Modal Top Actions */}
        <div className="flex justify-between items-center print:hidden border-b pb-3">
          <span className="font-extrabold text-sm text-[#0D285F] uppercase tracking-wider">
            Fee Voucher & Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPicture}
              disabled={isDownloadingImage}
              className="bg-amber-400 hover:bg-amber-500 text-[#07193B] px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-70"
              title="رسید کی تصویر (Picture / Image) ڈاؤن لوڈ کریں"
            >
              <Camera className="w-4 h-4 text-[#07193B]" />
              <span>{isDownloadingImage ? 'تصویر...' : 'تصویر ڈاؤن لوڈ (Picture)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#20b858] text-white p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div id="printable-receipt" className="border-2 border-slate-800 rounded-xl p-5 space-y-4 bg-white">
          {/* School Header */}
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-white p-0.5 border-2 border-amber-400 overflow-hidden mb-1 flex items-center justify-center">
              <img
                src="/school_logo.jpg"
                alt="Bright Scholar School"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <h2 className="text-xl font-black text-[#0D285F] font-serif-crest tracking-wide uppercase">
              BRIGHT SCHOLAR SCHOOL
            </h2>
            <div className="inline-block bg-amber-400 text-[#07193B] text-[11px] font-extrabold px-3 py-0.5 rounded-full my-0.5">
              “Pehle Tarbiyat, Phir Taleem” • Since 2017 (سنس 2017)
            </div>
            <p className="text-[11px] text-slate-600">
              Chak No. 47 GB, Samundri, Faisalabad • Contact / WhatsApp: 0302-5053993
            </p>
            <div className="mt-2 inline-block bg-[#0D285F] text-white px-4 py-0.5 rounded text-xs font-black uppercase tracking-wider">
              Fee Voucher & Official Receipt (فیس رسید)
            </div>
          </div>

          {/* Receipt Meta & Student Details */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              {student?.photo ? (
                <img
                  src={student.photo}
                  alt={feeRecord.studentName}
                  className="w-14 h-16 object-cover rounded-lg border border-slate-300 shadow-sm bg-white flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-16 rounded-lg bg-amber-100 border border-amber-300 flex flex-col items-center justify-center text-[#0D285F] font-bold text-lg flex-shrink-0">
                  {feeRecord.studentName.charAt(0)}
                  <span className="text-[9px] font-mono text-slate-500">#{student?.rollNo || '01'}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs flex-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">Receipt No / رسید نمبر:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {feeRecord.receiptNo || `REC-BSS-${feeRecord.id.slice(-5)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Billing Month / مہینہ:</span>
                  <span className="font-bold text-[#0D285F]">{feeRecord.month}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Student Name / طالب علم:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{feeRecord.studentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Father Name / ولدیت:</span>
                  <span className="font-semibold text-slate-800">{feeRecord.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Class / کلاس:</span>
                  <span className="font-bold text-[#0D285F]">{feeRecord.className} {student?.rollNo ? `(Roll #${student.rollNo})` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Status / کیفیت:</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${
                    feeRecord.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : feeRecord.status === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {feeRecord.status === 'Paid' ? '✓ PAID' : feeRecord.status === 'Partial' ? 'PARTIAL' : 'UNPAID'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <table className="w-full text-xs border border-slate-300">
            <thead className="bg-[#07193B] text-white">
              <tr>
                <th className="p-2 text-left">Description (تفصیل)</th>
                <th className="p-2 text-right">Amount (رقم)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">
                  Monthly Tuition Fee (ماہانہ فیس برائے {feeRecord.month})
                </td>
                <td className="p-2.5 text-right font-bold text-slate-900">
                  Rs. {feeRecord.tuitionFee.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-red-50/50">
                <td className="p-2.5 text-slate-800">
                  <div className="font-bold text-red-900">
                    Unapproved Absence Fine (غیر حاضری جرمانہ)
                  </div>
                  <div className="text-[10px] text-red-700">
                    {feeRecord.absentDays} دن غیر حاضر × Rs. {finePerDay} فی دن
                  </div>
                </td>
                <td className="p-2.5 text-right font-bold text-red-700">
                  Rs. {feeRecord.fineAmount.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-100 font-extrabold text-slate-900">
                <td className="p-2.5 text-slate-900">
                  Total Payable (کل واجب الادا رقم)
                </td>
                <td className="p-2.5 text-right text-sm font-black text-[#0D285F]">
                  Rs. {feeRecord.totalPayable.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 text-emerald-800 font-bold">
                  Amount Received / Paid (وصول شدہ رقم)
                </td>
                <td className="p-2.5 text-right font-black text-emerald-700 text-sm">
                  Rs. {feeRecord.paidAmount.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-amber-50/60 font-black">
                <td className="p-2.5 text-slate-900">
                  Balance Remaining (بقیہ واجبات)
                </td>
                <td className="p-2.5 text-right text-base text-red-700 font-black">
                  Rs. {feeRecord.balanceRemaining.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notice & Signatures */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-2">
            <p className="italic text-center text-slate-500">
              * فیس ہر ماہ کی 10 تاریخ تک جمع کروانا لازمی ہے۔ غیر حاضری پر بغیر چھٹی کے Rs. 50 یومیہ جرمانہ لاگو ہوگا۔
            </p>
            <div className="flex justify-between items-end pt-6">
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">Fee Clerk / اکاؤنٹنٹ</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b-2 border-slate-800 mb-1"></div>
                <span className="text-[10px] font-bold text-slate-900">
                  Principal Signature & Stamp
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="flex gap-2 print:hidden pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#0D285F] hover:bg-[#07193B] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt (پرنٹ رسید)</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
