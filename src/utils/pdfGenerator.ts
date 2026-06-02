import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Setup standard fallback virtual file system map to prevent any initialization warning
if (pdfMake) {
  try {
    const anyPdfFonts: any = pdfFonts;
    (pdfMake as any).vfs = anyPdfFonts && anyPdfFonts.pdfMake ? anyPdfFonts.pdfMake.vfs : {};
  } catch (e) {
    console.warn("Could not register default pdfFonts vfs mapping.", e);
  }
}

// Register high-fidelity custom fonts dynamically from fast CDNs.
// Amiri and Noto Nastaliq Urdu are beautifully suited for RTL scripts (Arabic, Persian, Urdu).
// Roboto is defined as a clean baseline LTR font.
(pdfMake as any).fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  },
  Amiri: {
    normal: 'https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHqUp.ttf',
    bold: 'https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkZY4.ttf'
  },
  NotoNastaliqUrdu: {
    normal: 'https://fonts.gstatic.com/s/notonastaliqurdu/v23/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qt_-DK0.ttf',
    bold: 'https://fonts.gstatic.com/s/notonastaliqurdu/v23/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qjj5DK0.ttf'
  }
};

interface ExportPdfOptions {
  title: string;
  subtitle: string;
  contentText: string;
  langCode: string;
  filename: string;
}

/**
 * High-fidelity PDF exporter utilizing pdfmake.
 * Automatically handles RTL direction, Arabic reshaping, and Urdu alignment
 * using custom high-quality Google Fonts (Amiri, Noto Nastaliq Urdu).
 */
export function exportToPdf({ title, subtitle, contentText, langCode, filename }: ExportPdfOptions): void {
  const isRtl = langCode === 'ur' || langCode === 'ar' || langCode === 'fa';
  
  // Decide best typography based on target translation language
  let fontName = 'Roboto';
  if (langCode === 'ur') {
    // Both Amiri & NotoNastaliqUrdu are fully compatible.
    // Noto Nastaliq is beautiful for Urdu, and Amiri has excellent spacing properties.
    fontName = 'Amiri';
  } else if (langCode === 'ar' || langCode === 'fa') {
    fontName = 'Amiri';
  }

  const direction = isRtl ? 'rtl' : 'ltr';
  const align = isRtl ? 'right' : 'left';

  const docDefinition: any = {
    content: [
      { 
        text: title, 
        font: fontName, 
        fontSize: 18, 
        bold: true, 
        alignment: align, 
        textDirection: direction, 
        margin: [0, 0, 0, 10] 
      },
      { 
        text: subtitle, 
        font: 'Roboto', 
        fontSize: 10, 
        color: '#64748b', 
        alignment: align,
        textDirection: direction,
        margin: [0, 0, 0, 10] 
      },
      // Accent line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 5,
            x2: 515, y2: 5,
            lineWidth: 1.5,
            strokeColor: '#0ea5e9' // beautiful custom cyan divider matching the dashboard design
          }
        ],
        margin: [0, 0, 0, 20]
      },
      { 
        text: contentText, 
        font: fontName, 
        fontSize: 12, 
        lineHeight: 1.6,
        alignment: align, 
        textDirection: direction 
      }
    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  try {
    pdfMake.createPdf(docDefinition).download(filename);
  } catch (error) {
    console.error("PDFMake generation failed:", error);
    throw error;
  }
}
