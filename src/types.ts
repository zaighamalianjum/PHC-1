/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface City {
  _id?: string;
  CityID: number;
  CityName: string;
  Province?: string;
}

export interface Patient {
  PatientID: string;
  PatientName: string;
  Father_husband: string;
  AgeYears: number;
  Sex: 'Male' | 'Female' | 'Other';
  MaritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  Occupation: string;
  Address: string;
  CityID: number;
  Country: string;
  PhoneMobile: string;
  PhoneRes?: string;
  PhoneOff?: string;
  Email?: string;
  RegistrationDate: string;
}

export interface Appointment {
  AppointmentID: string;
  PatientID: string;
  PatientName?: string;
  PhoneMobile?: string;
  AppointmentDate: string;
  Shift: 1 | 2; // 1 = Morning, 2 = Evening
  Status: 1 | 2 | 3 | 4; // 1 = New, 2 = Visited, 3 = Cancel, 4 = Payment Posted
  Remarks: string;
  FeeCharged: number;
  PaymentStatus?: string;
  IsImported?: boolean;
  Source?: 'Booked' | 'Visit' | 'Uploaded' | string;
}

export interface Token {
  TokenNo: number;
  PatientID: string;
  Shift: 1 | 2; // 1 = Morning, 2 = Evening
  Status: 1 | 2 | 3; // 1 = New, 2 = Visited, 3 = Cancel
  Date: string;
}

export interface Item {
  ItemID: string;
  ItemName: string;
  Price: number; // Retail price / MRP
  PurchasePrice: number; // Purchase price
  CStock: number; // Current stock
  MinStock: number; // Minimum threshold
  Unit: string; // e.g., Tab, Syrup, Amp, Cap
  MedicineType?: 'C' | 'P';
  Category?: string;
  ReorderQty?: number; // Buy or reorder QTY
  VendorBarcode?: string; // Optional vendor/manufacturer barcode or QR code mapping (e.g. BM Private Limited QR code)
  BatchNo?: string; // e.g. B# 115 (Active/Latest Batch)
  MfgDate?: string; // e.g. Mfg: 05-26
  ExpDate?: string; // e.g. Exp: 05-31
  Batches?: ItemBatch[]; // Multi-batch / Lot history
}

export interface ItemBatch {
  _id?: string;
  BatchID: string;
  ItemID: string;
  ItemName?: string;
  BatchNo: string;
  MfgDate?: string;
  ExpDate: string;
  PurchasePrice?: number;
  SalePrice?: number;
  Qty: number; // Remaining stock in this batch
  InitialQty?: number;
  GRNID?: string;
  POID?: string;
  VendorName?: string;
  ReceivedDate?: string;
  Status?: 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'EXHAUSTED';
  CreatedAt?: string;
}

export interface BarcodeMapping {
  _id?: string;
  Barcode: string;      // Scanned raw barcode / QR code text
  ItemID: string;       // Inventory medicine ItemID
  ItemName?: string;    // Inventory medicine name cache
  VendorName?: string;  // e.g., "BM Private Limited"
  Notes?: string;
  LinkedAt?: string;
  CreatedBy?: string;
}

export interface Supplier {
  SID: string;
  SupplierName: string;
  Phone: string;
  Address: string;
}

export interface LabTest {
  TID: string;
  TestName: string;
  Cost: number;
}

export interface Visit {
  VisitID: string;
  PatientID: string;
  TokenNo?: number;
  VisitDate: string;
  SymptomsDiagnosis: string;
  MedicalReportResult: string;
  LabTestAdvice: string;
  PatientAdvice: string;
  VisitRemarks: string;
  Status: 1 | 2; // 1 = New, 2 = Posted (Read Only)
  ConsultationFee?: number;
  ConsultationPaymentOption?: string; // 'Cash Paid', 'Unpaid', 'Panel Claim', 'FOC'
  FocWaivedOpdFee?: number | string;
  FocWaivedClinicalFee?: number | string;
  FocWaivedFileCardFee?: number | string;
  FocReason?: string;
  CardsPayment?: string;
  FileFee?: string;
  CardFee?: string;
  ClinicalMedicinePayment?: string;
  PatentPaymentOption?: string; // 'Clinic', 'Outside'
  ClinicalPaymentOption?: string; // 'Clinic', 'Outside'
  Shift?: 1 | 2; // 1 = Morning, 2 = Evening
}

export interface VisitMedicine {
  VisitID: string;
  ItemID: string;
  MedicineDetail: string; // Frequency, instructions
  Dosage: string; // e.g., 1-0-1, 1 Daily
  MedicineType: 'C' | 'P'; // C = Clinical/Compounded, P = Patent/Pre-packaged
  Price?: number; // Optional doctor-specified price for Clinical/Compounded
  ExpireDate?: string; // Only Clinical medicine expire date picker
  Notes50?: string; // Textbox for 50 characters
  Qty?: number; // Prescribed quantity of tabs for Clinical/Compounded
}

export interface VisitLabTest {
  VisitID: string;
  TID: string;
}

export interface MedicalCertificate {
  CertificateID: string;
  VisitID: string;
  PatientID: string;
  SufferingFrom: string;
  DurationFrom: string;
  DurationTo: string;
  DateIssued: string;
}

export interface MedicalCertificateSBP {
  CertificateID: string;
  VisitID: string;
  PatientID: string;
  EmployeeName: string;
  Designation: string;
  ConsultantFee: number;
  CostofMedicines: number;
  TreatmentForDays: number;
  receipttype: 1 | 2; // 1 = General, 2 = SBP
  DateIssued: string;
  Medicines: MCSBPMedicineDetail[];
}

export interface MCSBPMedicineDetail {
  ItemID: string;
  Qty: number;
  Price: number;
}

export interface InvoiceHeader {
  InvoiceNo: string;
  PatientID: string;
  InvoiceDate: string;
  GAmount: number;
  Discount: number;
  NetAmount: number;
  shift: 1 | 2; // 1 = Morning, 2 = Evening
  Status: 1 | 2; // 1 = New, 2 = Posted
}

export interface InvoiceDetail {
  InvoiceNo: string;
  ItemID: string;
  Qty: number;
  Price: number;
  LineTotal: number;
  MedicineType?: 'C' | 'P' | 'S'; // C = Clinical, P = Patent, S = Store
}

export interface SRInvHeader {
  SRInvoiceNo: string;
  OriginalInvoiceNo: string;
  ReturnDate: string;
  shift: 1 | 2;
  NetPaid: number;
  Remarks: string;
}

export interface SRInvDetail {
  SRInvoiceNo: string;
  ItemID: string;
  QtyReturned: number;
  PriceRef: number;
  LineTotal: number;
}

export interface InvVchHeader {
  VchNo: string;
  SID: string;
  VchDate: string;
  Status: 1 | 2; // 1 = New, 2 = Posted
  Remarks: string;
}

export interface InvVchDetail {
  VchNo: string;
  ItemID: string;
  QtyIn: number;
  PurchaseRate: number;
}

export interface InvLedger {
  LedgerID: string;
  ItemID: string;
  DocType: 'INV' | 'SR' | 'GRN';
  DocNo: string;
  TxDate: string;
  QtyIn: number;
  QtyOut: number;
  Balance: number;
}

export interface FLAccount {
  FLID: number;
  FLName: string;
}

export interface SLAccount {
  FLID: number;
  SLID: number;
  SLName: string;
}

export interface TLAccount {
  FLID: number;
  SLID: number;
  TLID: number;
  TLName: string;
  AcBalance: number;
}

export interface Config {
  ConfigID: number;
  ClinicCIH_: number; // TLID for Clinic Cash In Hand
  StoreCIH_: number;  // TLID for Store Cash In Hand
  StoreSale_: number; // TLID for Store Sale Revenue
  StoreDisc_: number; // TLID for Store Sale Discount
  StoreSR_: number;   // TLID for Store Sales Return
  StoreSRdisc_: number; // TLID for Store Return Discount
  AppCIH_: number;    // TLID for Appointment Cash In Hand
  AppSale_: number;   // TLID for Appointment Sale Revenue
}

export interface VchHeader {
  VchNo: string;
  VchDate: string;
  VchType: 'JV' | 'CRV' | 'CPV'; // Journal, Cash Receipt, Cash Payment
  Status: 1 | 2; // 1 = New, 2 = Posted
  Remarks: string;
}

export interface VchDetail {
  VchNo: string;
  TLID: number;
  Debit: number;
  Credit: number;
  Description: string;
}

export interface ACLedger {
  ACLedgerID: string;
  VchNo: string;
  TLID: number;
  TxDate: string;
  Debit: number;
  Credit: number;
  Remarks: string;
  BalanceAfter: number;
}

export interface User {
  UserID: string;
  LoginName: string;
  FullName: string;
  PasswordHash: string;
  Role: 'Administrator' | 'Doctor' | 'Receptionist' | 'Pharmacist' | 'Accountant';
  AssignedShift?: 1 | 2 | 'Both'; // 1 = Morning, 2 = Evening, 'Both' = Unrestricted
  Status?: 'Active' | 'Inactive';
  MobileNumber?: string;
  CNIC?: string;
  NickName?: string;
  Permissions?: {
    canViewDashboard?: boolean;
    canViewPatientDesk?: boolean;
    canViewEMRDesk?: boolean;
    canViewPharmacyPOS?: boolean;
    canViewAccountingDesk?: boolean;
    canViewReportingDesk?: boolean;
    canViewUploadingDesk?: boolean;
    canViewSettingsDesk?: boolean;
    canViewQueryHandlerDesk?: boolean;
    canViewNhcHistoryDesk?: boolean;
    canViewErpDesk?: boolean;

    // Granular Patient Intake & Queue Sub-desk Permissions
    canAccessPatientRegistration?: boolean;
    canAccessAppointmentsDesk?: boolean;
    canAccessTokenIssue?: boolean;
    canAccessWaitingQueue?: boolean;
    canAccessPatientVisitDesk?: boolean;
    canAccessGridView?: boolean;
    canAccessLargeScreenDisplay?: boolean;

    // Granular Pharmacy POS Sub-desk Permissions
    canAccessClinicalMedicine?: boolean;
    canAccessStoreMedicine?: boolean;
    canAccessSalesReturns?: boolean;
    canAccessStockManager?: boolean;
    canAccessInvoiceLogs?: boolean;
    canAccessMedicineLabels?: boolean;
    canViewPwaInstall?: boolean;

    // Granular Mini ERP System Sub-desk Permissions
    canAccessErpOverview?: boolean;
    canAccessErpFiscalCalendar?: boolean;
    canAccessErpCashBook?: boolean;
    canAccessErpVendors?: boolean;
    canAccessErpVendorStatement?: boolean;
    canAccessErpPoGrn?: boolean;
    canAccessErpLedger?: boolean;
    canAccessErpHrPayroll?: boolean;
    canAccessErpExpensesAssets?: boolean;
    canAccessErpReporting?: boolean;

    // Specific Action Permissions
    canAddPatient?: boolean;
    canEditPatient?: boolean;
    canIssueToken?: boolean;
    canBookAppointment?: boolean;
    canCancelAppointment?: boolean;
    canDeleteToken?: boolean;
    canCallServeToken?: boolean;
    canEditStockLevel?: boolean;

    // Granular Admin Controlled Printing & Export Permissions
    canPrintPrescription?: boolean;
    canPrintLabAdvice?: boolean;
    canPrintVisitSlip?: boolean;
    canPrintTokenSlip?: boolean;
    canPrintPOSInvoice?: boolean;
    canPrintVouchers?: boolean;
    canPrintFinancialReports?: boolean;
    canExportCSVExcel?: boolean;
  };
  UserRights?: UserRight[];
  AllowedUserIDs?: string[]; // Allowed User-to-User Access Control Matrix (Array of UserIDs/LoginNames or ['ALL'] / ['*'])
  AccessApprovalStatus?: 'Pending' | 'Approved' | 'Rejected'; // Official Administrator Approval Status
  AccessApprovedBy?: string; // Administrator who approved access
  AccessApprovedAt?: string; // Timestamp of administrator approval
  CreatedAt?: string;
}

export interface ClinicSettings {
  ClinicName: string;
  ClinicLogoText: string;
  DoctorName: string;
  DoctorSignatureText: string;
  ClinicAddress: string;
  PhoneMobile: string;
  Website?: string;
  OPDFee: number;
  ClinicLogoImage?: string;
  LetterHeadImage?: string;
  ClinicalLabelImage?: string;
}

export interface UserRight {
  MenuID: string;
  MenuName: string;
  Status: boolean;       // View/Access Menu item
  AddRec: boolean;       // Enable Save/Create
  PostRec: boolean;      // Enable voucher post/finalize
  CancelPosted: boolean; // Enable authorization to reverse/strike out
  PrintRec?: boolean;    // Enable document / slip printing
  ExportRec?: boolean;   // Enable CSV / Excel data export
}

export interface SmsSettings {
  Provider: 'twilio' | 'infobip' | 'jazz' | 'telenor' | 'custom_webhook';
  Enabled: boolean;
  ApiUrl: string;
  ApiKey: string;
  SenderID: string;
  BookingTemplate: string;
  RepeatTemplate: string;
}

export interface MongoDbSettings {
  ConnectionString: string;
  DatabaseName: string;
  SyncEnabled: boolean;
  BridgeUrl?: string;
}

export interface ThermalPrinterSettings {
  paperWidth: number; // e.g. 80, 76, 58, 57 (in mm)
  printableWidth: number; // e.g. 76, 72, 70, 68, 54, 48 (in mm)
  paperHeightMode: 'auto' | 'fixed';
  fixedHeightMm: number; // e.g. 200, 250, 300
  marginTop: number; // in mm
  marginBottom: number; // in mm (feed before cutter)
  marginLeft: number; // in mm
  marginRight: number; // in mm
  scalePercent: number; // e.g. 80, 85, 90, 95, 100, 105, 110
  baseFontSize: number; // in pt/px, e.g. 9.5, 10.5, 11.5, 12.5, 13.5
  lineHeight: number; // e.g. 1.15, 1.25, 1.35, 1.50
  fontFamily: 'monospace' | 'sans-serif' | 'courier';
  headerTitleSize: number; // e.g. 12, 13.5, 15, 16.5, 18
  showHeaderLogoText: boolean;
  showHeaderAddress: boolean;
  showHeaderPhone: boolean;
  dividerStyle: 'dashed' | 'dotted' | 'solid' | 'double';
  tokenCardStyle: 'boxed' | 'inverted' | 'simple';
  showCutLine: boolean;
  showFooterTimestamp: boolean;
  footerCustomMessage: string;
  autoPrintPopup: boolean;
}

export interface NhcPatientHistory {
  _id?: string;
  VisitID?: string;
  PatientID: string;
  PatientName: string;
  AgeYears?: number;
  Sex?: 'Male' | 'Female' | 'Other' | string;
  PhoneMobile?: string;
  Address?: string;
  RegistrationDate?: string;
  Father_husband?: string;
  MedicalCondition?: string;
  Symptoms?: string;
  Diagnosis?: string;
  SymptomsDiagnosis?: string;
  VisitDate?: string;
  date?: string;
  symptoms?: string;
  clinicalMedication?: string;
  patientMedication?: string;
  VisitRemarks?: string;
  PrescribedMedicines?: string;
  LabTests?: string;
  LabTestAdvice?: string;
  MedicalReportResult?: string;
  Allergies?: string;
  BloodGroup?: string;
  MedicineDetail?: string;
  Dosage?: string;
  MedicineType?: 'C' | 'P' | string;
}

export interface MultiPatientSearchResult {
  PatientID: string;
  PatientName: string;
  PhoneMobile?: string;
  Father_husband?: string;
  AgeYears?: number | string;
  Sex?: string;
  Address?: string;
  City?: string;
  tokenNo?: number;
  tokenShift?: number;
  isNhc?: boolean;
  source?: string;
}

export interface SmartLocatorMedicine {
  Symptoms: string;
  MedicineName: string;
  Dosage: string;
  Composition: string;
}

// ============================================================================
// MINI ERP SYSTEM INTERFACES
// ============================================================================

export interface ErpVendor {
  _id?: string;
  VendorID: string;
  VendorName: string;
  ContactPerson: string;
  Phone: string;
  Email?: string;
  Address: string;
  TaxID?: string;
  Balance: number;
  Status: 'Active' | 'Inactive';
}

export interface ErpPurchaseOrderItem {
  ItemID: string;
  ItemName: string;
  Category?: string;
  Qty: number;
  UnitPrice: number;
  LineTotal: number;
  BatchNo?: string;
  ExpiryDate?: string;
}

export interface ErpPurchaseOrder {
  _id?: string;
  POID: string;
  VendorID: string;
  VendorName: string;
  OrderDate: string;
  ExpectedDeliveryDate: string;
  TotalAmount: number;
  PaidAmount: number;
  Status: 'Draft' | 'Sent' | 'Approved' | 'Partially Received' | 'Received' | 'Paid' | 'Cancelled' | string;
  PaymentMethod?: 'Credit' | 'Cash' | string;
  PaymentTerms?: 'Credit' | 'Cash' | string;
  Items: ErpPurchaseOrderItem[];
  Notes?: string;
}

export interface ErpGrnItem {
  ItemID: string;
  ItemName: string;
  OrderedQty: number;
  AlreadyReceivedQty?: number;
  PendingQty?: number;
  ReceivedQty: number | string;
  UnitPrice: number | string;
  LineTotal: number;
  BatchNo?: string;
  MfgDate?: string;
  ExpiryDate?: string;
}

export interface ErpGrn {
  _id?: string;
  GRNID: string;
  POID: string;
  VendorID: string;
  VendorName: string;
  ReceivedDate: string;
  ChallanNo?: string;
  SupplierInvoiceNo?: string;
  TotalAmount: number;
  Items: ErpGrnItem[];
  Status: 'Draft' | 'Approved' | 'Cancelled';
  PaymentMethod?: 'Credit' | 'Cash' | string;
  PaymentStatus?: 'Unpaid' | 'Paid' | string;
  PaymentRef?: string;
  Remarks?: string;
  CreatedBy?: string;
}

export interface ErpTransaction {
  _id?: string;
  TransactionID: string;
  Type: 'Income' | 'Expense' | 'VendorPayment' | 'CustomerReceipt' | 'PayrollPayment';
  Category: string;
  Description: string;
  Amount: number;
  PaymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  ReferenceNo?: string;
  Date: string;
  CreatedBy: string;
  VendorID?: string;
  VendorName?: string;
}

export interface ErpEmployee {
  _id?: string;
  EmployeeID: string;
  FullName: string;
  Role: string;
  Department: string;
  Phone: string;
  Email?: string;
  JoiningDate: string;
  Salary: number;
  Status: 'Active' | 'OnLeave' | 'Terminated';
  CNIC: string;
  BankAccount?: string;
}

export interface ErpPayroll {
  _id?: string;
  PayrollID: string;
  EmployeeID: string;
  EmployeeName: string;
  MonthYear: string; // e.g. "2026-08"
  BasicSalary: number;
  Allowances: number;
  Deductions: number;
  NetSalary: number;
  PaymentStatus: 'Pending' | 'Paid';
  PaymentDate?: string;
  PaymentMethod?: 'Cash' | 'Bank' | 'Cheque' | 'Online';
}

export interface ErpExpense {
  _id?: string;
  ExpenseID: string;
  Category: string;
  Description: string;
  Amount: number;
  ExpenseDate: string;
  PaymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  ReceiptRef?: string;
}

export interface ErpAsset {
  _id?: string;
  AssetID: string;
  AssetName: string;
  Category: 'Equipment' | 'Furniture' | 'IT Hardware' | 'Vehicle' | 'Other';
  PurchaseDate: string;
  PurchaseCost: number;
  CurrentValue: number;
  DepreciationRate: number; // percentage per year
  Status: 'Active' | 'Maintenance' | 'Disposed';
}

export interface FiscalMonthPeriod {
  _id?: string;
  PeriodID: string; // e.g., '2026-01'
  Year: number;     // e.g., 2026
  Month: number;    // 1-12
  MonthName: string; // 'January'
  StartDate: string; // '2026-01-01'
  EndDate: string;   // '2026-01-31'
  Status: 'OPEN' | 'CLOSED';
  ClosedAt?: string;
  ClosedBy?: string;
  Notes?: string;
  ClosingSnapshot?: {
    TotalInflow: number;
    TotalOutflow: number;
    NetSurplus: number;
    OpdInflow: number;
    PharmacyInflow: number;
    VendorPayments: number;
    ExpenseOutflow: number;
    GrnTotal: number;
  };
}

export interface FiscalYearConfig {
  YearType: 'CALENDAR' | 'JULY_JUNE';
  SelectedYear: number;
}



