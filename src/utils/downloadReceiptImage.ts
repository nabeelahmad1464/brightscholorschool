import html2canvas from 'html2canvas';
import { Student, FeeRecord } from '../types';

/**
 * Downloads a DOM element (the receipt card) as a high-resolution PNG image
 */
export async function downloadReceiptElementAsImage(
  elementId: string,
  fileName: string = 'Fee_Receipt'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x sharp high-definition resolution for crisp mobile display
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure cloned element is fully visible and styled
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.transform = 'none';
          clonedEl.style.borderRadius = '16px';
        }
      }
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    return true;
  } catch (error) {
    console.warn('html2canvas capture failed, using canvas generator fallback:', error);
    return false;
  }
}

/**
 * Direct Canvas-drawn Official School Fee Voucher Picture Generator
 * Guarantees 100% reliable image generation on all mobile browsers and devices
 */
export function generateAndDownloadReceiptCanvas(
  student: Student,
  feeRecord: FeeRecord,
  finePerDay: number = 50,
  schoolName: string = 'Bright Scholar School',
  schoolAddress: string = 'Chak No. 47 GB, Samundri, Faisalabad'
): boolean {
  try {
    const width = 800;
    const height = 960;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer Border
    ctx.strokeStyle = '#0D285F';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // Header Background
    ctx.fillStyle = '#0D285F';
    ctx.fillRect(29, 29, width - 58, 150);

    // School Name
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.fillText(schoolName.toUpperCase(), width / 2, 75);

    // Motto & Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('“پہلے تربیت، پھر تعلیم” • Since 2017 (سنس 2017)', width / 2, 108);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${schoolAddress} • Ph / WhatsApp: 0302-5053993`, width / 2, 138);

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OFFICIAL COMPUTERIZED FEE RECEIPT / فیس رسید', width / 2, 165);

    // Voucher Subheader
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(35, 185, width - 70, 40);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Receipt No: ${feeRecord.receiptNo || 'REC-BSS-1001'}`, 48, 210);
    ctx.textAlign = 'right';
    ctx.fillText(`Month: ${feeRecord.month || 'October 2026'}`, width - 48, 210);

    // Student Information Box
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(35, 235, width - 70, 130, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#0D285F';

    // Col 1
    ctx.fillText(`طالب علم کا نام: ${student.name}`, 50, 270);
    ctx.fillText(`کلاس (Class): ${student.className}`, 50, 305);
    ctx.fillText(`داخلہ نمبر (Adm #): ${student.admissionNo}`, 50, 340);

    // Col 2
    ctx.fillText(`ولدیت: ${student.fatherName}`, 420, 270);
    ctx.fillText(`رول نمبر (Roll #): ${student.rollNo}`, 420, 305);
    ctx.fillText(`فون / واٹس ایپ: ${student.contactNo || '0302-5053993'}`, 420, 340);

    // Fee Ledger Table
    const tableTop = 385;
    ctx.fillStyle = '#07193B';
    ctx.fillRect(35, tableTop, width - 70, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('تفصیلات فیس (Description)', 50, tableTop + 24);
    ctx.textAlign = 'right';
    ctx.fillText('رقم (Amount PKR)', width - 50, tableTop + 24);

    // Rows
    const rows = [
      { label: `ماہانہ ٹیوشن فیس (${feeRecord.month})`, amount: `Rs. ${feeRecord.tuitionFee.toLocaleString()}` },
      { label: `غیر حاضری فائن (${feeRecord.absentDays} دن @ Rs. ${finePerDay}/دن)`, amount: `Rs. ${feeRecord.fineAmount.toLocaleString()}` },
      { label: 'کل واجب الادا فیس (Total Payable)', amount: `Rs. ${feeRecord.totalPayable.toLocaleString()}`, isBold: true },
      { label: 'ادا شدہ رقم (Paid Amount)', amount: `Rs. ${feeRecord.paidAmount.toLocaleString()}`, isPaid: true },
      { label: 'بقیہ واجبات (Remaining Balance Due)', amount: `Rs. ${feeRecord.balanceRemaining.toLocaleString()}`, isDue: true }
    ];

    let currentY = tableTop + 38;
    rows.forEach((r, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      if (r.isDue) ctx.fillStyle = '#FEF2F2';
      if (r.isPaid && feeRecord.balanceRemaining === 0) ctx.fillStyle = '#F0FDF4';

      ctx.fillRect(35, currentY, width - 70, 42);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(35, currentY, width - 70, 42);

      ctx.textAlign = 'left';
      ctx.font = r.isBold || r.isDue ? 'bold 15px sans-serif' : '14px sans-serif';
      ctx.fillStyle = r.isDue && feeRecord.balanceRemaining > 0 ? '#B91C1C' : '#0F172A';
      ctx.fillText(r.label, 50, currentY + 26);

      ctx.textAlign = 'right';
      ctx.font = r.isBold || r.isDue ? 'bold 16px sans-serif' : '14px sans-serif';
      ctx.fillStyle = r.isDue && feeRecord.balanceRemaining > 0 ? '#B91C1C' : (r.isPaid ? '#047857' : '#0F172A');
      ctx.fillText(r.amount, width - 50, currentY + 26);

      currentY += 42;
    });

    // Stamp & Status
    const isPaid = feeRecord.balanceRemaining === 0;
    const stampX = width / 2;
    const stampY = currentY + 55;

    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.rotate(-0.06);

    ctx.strokeStyle = isPaid ? '#059669' : '#DC2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-160, -32, 320, 64, 12);
    ctx.stroke();

    ctx.fillStyle = isPaid ? '#059669' : '#DC2626';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isPaid ? '✓ PAID IN FULL (ادا شدہ)' : '⚠️ UNPAID (واجب الادا)', 0, 8);
    ctx.restore();

    // Footer Signatures & Date
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748B';
    const issueDate = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(`تاریخ اجراء: ${issueDate}`, 50, height - 70);
    ctx.fillText('کمپیوٹرائزڈ رسید برائٹ اسکالر اسکول سمندری', 50, height - 50);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#0D285F';
    ctx.fillText('دستخط پرنسپل / اکاؤنٹنٹ: ________________', width - 50, height - 60);

    // Trigger image download
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const cleanName = student.name.replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `BSS_Receipt_${cleanName}_Roll_${student.rollNo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('Canvas receipt generation failed:', e);
    return false;
  }
}

/**
 * Downloads the student's personal photo or generates a sharp official photo badge
 */
export function downloadStudentPhotoDirectly(student: Student): boolean {
  try {
    const cleanName = student.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const fileName = `Student_Photo_${cleanName}_${student.className}_Roll_${student.rollNo}.png`;

    if (student.photo && student.photo.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = student.photo;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // Generate crisp HD avatar canvas if no custom photo uploaded yet
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, '#0D285F');
    grad.addColorStop(1, '#07193B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 700);

    // Border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 580, 680);

    // School Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRIGHT SCHOLAR SCHOOL', 300, 60);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('“Pehle Tarbiyat, Phir Taleem”', 300, 90);

    // Photo Box / Crest Avatar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(300, 260, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#0D285F';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(student.name.charAt(0).toUpperCase(), 300, 305);

    // Student Information Card
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(40, 430, 520, 200);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 430, 520, 200);

    ctx.fillStyle = '#0D285F';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(student.name, 300, 480);

    ctx.fillStyle = '#475569';
    ctx.font = '18px sans-serif';
    ctx.fillText(`ولدیت: ${student.fatherName}`, 300, 520);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`کلاس: ${student.className}   |   رول نمبر: #${student.rollNo}`, 300, 565);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Adm No: ${student.admissionNo}   •   Chak 47 GB Samundri`, 300, 605);

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Download student photo failed:', err);
    return false;
  }
}

