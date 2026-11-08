import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Helper to convert any modern CSS color (like oklch, oklab, p3) into standard RGB
function normalizeColorToRgb(colorStr: string, fallback = '#ffffff'): string {
  if (!colorStr || !colorStr.includes('oklch')) return colorStr;
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const ctx = testCanvas.getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = colorStr;
    return ctx.fillStyle;
  } catch {
    return fallback;
  }
}

export async function exportElementToPdf(
  elementId: string,
  fileName: string = 'Bao_Cao_Khao_Sat_Giac_Ngu_Ngan.pdf',
  onProgress?: (progress: number) => void
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return false;
  }

  try {
    if (onProgress) onProgress(20);

    // Render HTML element to high-res canvas using html2canvas-pro with color normalization
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crisp text & graphics
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      onclone: (clonedDoc: Document) => {
        // Deep-sanitize all computed oklch colors in the cloned tree
        const allElements = clonedDoc.querySelectorAll('*');
        const helperCanvas = document.createElement('canvas');
        helperCanvas.width = 1;
        helperCanvas.height = 1;
        const ctx = helperCanvas.getContext('2d');

        const resolveColor = (val: string) => {
          if (!val || !val.includes('oklch')) return val;
          if (!ctx) return '#ffffff';
          try {
            ctx.fillStyle = val;
            return ctx.fillStyle;
          } catch {
            return '#ffffff';
          }
        };

        allElements.forEach((node) => {
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
              node.style.backgroundColor = resolveColor(style.backgroundColor);
            }
            if (style.color && style.color.includes('oklch')) {
              node.style.color = resolveColor(style.color);
            }
            if (style.borderColor && style.borderColor.includes('oklch')) {
              node.style.borderColor = resolveColor(style.borderColor);
            }
          }
        });
      },
    });

    if (onProgress) onProgress(60);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - 10; // 5mm margin on left and right
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 5;

    // First page
    pdf.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Multiple pages if the report is tall
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    if (onProgress) onProgress(90);

    pdf.save(fileName);

    if (onProgress) onProgress(100);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    // Fallback: trigger standard browser print dialog
    window.print();
    return false;
  }
}
