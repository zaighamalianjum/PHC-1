/**
 * WhatsApp integration utility using official WhatsApp wa.me / api.whatsapp.com deep links.
 * Free, reliable, works on desktop (WhatsApp Web) and mobile (WhatsApp App).
 */

export interface WhatsAppPrescriptionPayload {
  patientName?: string;
  patientId?: string;
  phoneMobile?: string;
  visitDate?: string;
  visitId?: string;
  symptomsDiagnosis?: string;
  medicines?: Array<{
    MedicineDetail: string;
    Dosage: string;
    MedicineType?: string;
  }>;
  labTests?: string;
  patientAdvice?: string;
  consultationFee?: number | string;
  clinicName?: string;
}

export function formatWhatsAppPhone(phone: string): string {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
    cleanPhone = '92' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('3') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone;
  }
  return cleanPhone;
}

export function generateWhatsAppPrescriptionUrl(data: WhatsAppPrescriptionPayload): string {
  const cleanPhone = formatWhatsAppPhone(data.phoneMobile || '');
  const clinic = data.clinicName || 'Punjab Homeopathic Clinic (PHC)';
  const date = data.visitDate || new Date().toISOString().split('T')[0];

  let message = `🏥 *${clinic}*\n`;
  message += `📋 *Prescription & Patient Visit Summary*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Patient Name:* ${data.patientName || 'N/A'}\n`;
  message += `🆔 *Patient ID (MR#):* ${data.patientId || 'N/A'}\n`;
  if (data.visitId) {
    message += `🔖 *Visit ID:* ${data.visitId}\n`;
  }
  message += `📅 *Date:* ${date}\n\n`;

  if (data.symptomsDiagnosis && data.symptomsDiagnosis.trim()) {
    message += `🩺 *Diagnosis / Symptoms:*\n${data.symptomsDiagnosis.trim()}\n\n`;
  }

  if (data.medicines && data.medicines.length > 0) {
    message += `💊 *Prescribed Medicines:*\n`;
    data.medicines.forEach((med, idx) => {
      const detail = med.MedicineDetail || 'Medicine';
      const dosage = med.Dosage ? ` - ${med.Dosage}` : '';
      message += `${idx + 1}. *${detail}*${dosage}\n`;
    });
    message += `\n`;
  }

  if (data.labTests && data.labTests !== 'N/A' && data.labTests.trim()) {
    message += `🧪 *Lab Test Advice:*\n${data.labTests.trim()}\n\n`;
  }

  if (data.patientAdvice && data.patientAdvice.trim()) {
    message += `💡 *Advice / Notes:*\n${data.patientAdvice.trim()}\n\n`;
  }

  if (data.consultationFee && Number(data.consultationFee) > 0) {
    message += `💵 *Consultation Fee:* Rs. ${data.consultationFee}\n\n`;
  }

  message += `✨ _Thank you for visiting Punjab Homeopathic Clinic! Wish you a quick recovery._`;

  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
}

export function generateWhatsAppRegistrationUrl(data: {
  patientId: string;
  patientName: string;
  phoneMobile: string;
  clinicName?: string;
}): string {
  const cleanPhone = formatWhatsAppPhone(data.phoneMobile || '');
  const clinic = data.clinicName || 'Punjab Homeopathic Clinic (PHC)';

  let message = `🏥 *${clinic}*\n`;
  message += `🎉 *Patient Registration Confirmation*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Dear *${data.patientName}*,\n`;
  message += `Your patient registration is successful!\n\n`;
  message += `🆔 *Your Patient ID (MR#):* ${data.patientId}\n`;
  message += `📞 *Registered Contact:* ${data.phoneMobile || 'N/A'}\n\n`;
  message += `Please keep your Patient ID (MR#) for future visits and appointments.\n`;
  message += `✨ _Wish you good health!_`;

  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
}

export function openWhatsAppUrl(url: string, useDesktopApp: boolean = true): void {
  try {
    let targetUrl = url;

    // Convert wa.me or api.whatsapp.com URL to direct whatsapp:// protocol if requested
    if (useDesktopApp && (url.startsWith('https://wa.me/') || url.startsWith('https://api.whatsapp.com/'))) {
      try {
        const parsed = new URL(url);
        let phone = parsed.searchParams.get('phone');
        const text = parsed.searchParams.get('text');

        if (!phone && url.startsWith('https://wa.me/')) {
          phone = parsed.pathname.replace(/^\//, '');
        }

        if (phone && text) {
          targetUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
        }
      } catch (e) {
        // use original url if URL parsing fails
      }
    }

    if (targetUrl.startsWith('whatsapp://')) {
      // Direct protocol launch for Desktop/Mobile App
      window.location.href = targetUrl;
    } else {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    }
  } catch (err) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
