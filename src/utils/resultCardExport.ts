import html2canvas from 'html2canvas';

/**
 * Downloads the student marksheet/result card DOM element as high-definition PNG/JPG image
 */
export async function downloadResultCardAsImage(
  elementId: string,
  studentName: string,
  examTitle: string,
  format: 'png' | 'jpg' = 'png'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // 3x ultra-sharp resolution for mobile screen & printing
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
        }
      }
    });

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const cleanStudent = (studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanExam = (examTitle || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Result_Card_${cleanStudent}_${cleanExam}.${format}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Error generating result card image:', err);
    return false;
  }
}

/**
 * Opens print preview for the result card element
 */
export function printResultCard(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const content = element.outerHTML;
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Result Card - Bright Scholar School</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: #ffffff;
            color: #000000;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 10px;
          }
          .no-print {
            display: none !important;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
