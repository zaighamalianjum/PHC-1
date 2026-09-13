/**
 * Direct Silent Printing Utility for Pharmacy & ERP
 * 
 * Bypasses opening unnecessary popup browser windows (`window.open`) or in-app preview modals.
 * Injects formatted print HTML into an invisible DOM iframe and directly triggers the printer.
 * When browser is configured with `--kiosk-printing`, this prints instantly with zero prompts!
 */

export const silentPrintHtml = (htmlContent: string): void => {
  try {
    let frame = document.getElementById('app-direct-silent-print-frame') as HTMLIFrameElement;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'app-direct-silent-print-frame';
      frame.style.position = 'fixed';
      frame.style.top = '-9999px';
      frame.style.left = '-9999px';
      frame.style.width = '0px';
      frame.style.height = '0px';
      frame.style.border = 'none';
      frame.style.visibility = 'hidden';
      document.body.appendChild(frame);
    }

    const frameDoc = frame.contentWindow?.document || frame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
      
      // Allow fonts and styles to render before triggering printer spooler
      setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch (err) {
          console.warn('Direct iframe print interrupted:', err);
        }
      }, 300);
    }
  } catch (err) {
    console.error('silentPrintHtml failed:', err);
    // Fallback: If iframe printing is blocked by environment
    const printWin = window.open('', '_blank', 'width=900,height=900');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 300);
    }
  }
};
