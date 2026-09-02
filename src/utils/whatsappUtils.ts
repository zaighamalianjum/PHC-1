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

export interface WhatsAppPurchaseOrderPayload {
  poId: string;
  vendorName: string;
  vendorPhone?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentTerms?: string;
  items: Array<{
    ItemName: string;
    Qty: number | string;
    UnitPrice?: number | string;
    Category?: string;
    BatchNo?: string;
  }>;
  notes?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  preparedBy?: string;
}

export function generateWhatsAppPurchaseOrderText(data: WhatsAppPurchaseOrderPayload): string {
  const clinic = data.clinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
  const address = data.clinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan';
  const clinicPhone = data.clinicPhone || '+92-311-4000608';
  const isCash = String(data.paymentMethod || data.paymentTerms || '').trim().toLowerCase() === 'cash';

  let msg = `🏥 *${clinic}*\n`;
  msg += `📋 *${isCash ? 'CASH ORDER PO' : 'CREDIT ORDER PO'} & REQUISITION*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔖 *PO Number:* ${data.poId}\n`;
  msg += `💳 *Order Type:* ${isCash ? '💵 Cash Order PO (Spot Paid)' : '💳 Credit Order PO (Vendor Payable)'}\n`;
  msg += `🏢 *Vendor / Supplier:* ${data.vendorName}\n`;
  msg += `📅 *Order Date:* ${data.orderDate || new Date().toISOString().split('T')[0]}\n`;
  if (data.expectedDeliveryDate) {
    msg += `🚚 *Expected Delivery:* ${data.expectedDeliveryDate}\n`;
  }
  if (data.preparedBy) {
    msg += `👤 *Authorized By:* ${data.preparedBy}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *ORDER ITEMS (${data.items.length} Medicines):*\n`;

  data.items.forEach((item, idx) => {
    const qty = Number(item.Qty) || 1;
    const rate = Number(item.UnitPrice) || 0;
    const catStr = item.Category ? ` [${item.Category}]` : '';
    const rateStr = rate > 0 ? ` @ Rs. ${rate.toLocaleString()}` : '';
    msg += `${idx + 1}. *${item.ItemName}*${catStr}\n   ▫️ Qty: *${qty}*${rateStr}\n`;
  });

  if (data.totalAmount && Number(data.totalAmount) > 0) {
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Est. Total Value:* Rs. ${Number(data.totalAmount).toLocaleString()}\n`;
  }

  if (data.notes && data.notes.trim()) {
    msg += `📝 *Instructions / Notes:*\n${data.notes.trim()}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 *Delivery Address:* ${address}\n`;
  msg += `📞 *Clinic Contact:* ${clinicPhone}\n`;
  msg += `📄 _Please process this Purchase Order. Official PDF copy attached._`;

  return msg;
}

export function generateWhatsAppPurchaseOrderUrl(data: WhatsAppPurchaseOrderPayload): string {
  const cleanPhone = formatWhatsAppPhone(data.vendorPhone || '');
  const message = generateWhatsAppPurchaseOrderText(data);
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
