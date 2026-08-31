import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import JSZip from 'jszip';
import firebaseConfig from '../../firebase-applet-config.json';

// Defined Scope for Google Drive Workspace Integration
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Helper to get configured GoogleAuthProvider
const getProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
};

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedGoogleUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, getProvider());
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive OAuth access token from authentication provider.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google sign-in window was closed by the user.');
    } else {
      console.warn('Google Sign In Issue:', error?.message || error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCachedUser = (): User | null => {
  return cachedGoogleUser || auth.currentUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

export interface CollectionMeta {
  key: string;
  name: string;
  category: 'patients' | 'visits' | 'vouchers' | 'ledger' | 'pharmacy' | 'system';
  isKeyCollection?: boolean;
}

export const BACKUP_COLLECTIONS: CollectionMeta[] = [
  { key: 'cms_patients', name: 'Patients Directory & Demographics', category: 'patients', isKeyCollection: true },
  { key: 'cms_visits', name: 'Clinical Visits & OPD Consultations', category: 'visits', isKeyCollection: true },
  { key: 'cms_appointments', name: 'Appointments Queue Records', category: 'visits' },
  { key: 'cms_tokens', name: 'Daily OPD Token Queue', category: 'visits' },
  { key: 'cms_items', name: 'Pharmacy Medicines & Stock Inventory', category: 'pharmacy', isKeyCollection: true },
  { key: 'cms_suppliers', name: 'Suppliers & Vendors Master', category: 'pharmacy' },
  { key: 'cms_lab_tests', name: 'Lab Tests Master Catalog', category: 'visits' },
  { key: 'cms_visit_medicines', name: 'Prescription Medicine Records', category: 'visits' },
  { key: 'cms_med_certs', name: 'Issued Medical Certificates', category: 'visits' },
  { key: 'cms_sbp_certs', name: 'SBP Fitness Certificates', category: 'visits' },
  { key: 'cms_invoices', name: 'Pharmacy Sales Invoices', category: 'pharmacy', isKeyCollection: true },
  { key: 'cms_invoice_details', name: 'Sales Line Items & Dispensary Logs', category: 'pharmacy' },
  { key: 'cms_sales_returns', name: 'Pharmacy Sales Returns Log', category: 'pharmacy' },
  { key: 'cms_grns', name: 'Goods Received Notes (GRNs)', category: 'pharmacy' },
  { key: 'cms_grn_details', name: 'GRN Item Line Breakdowns', category: 'pharmacy' },
  { key: 'cms_inv_ledger', name: 'Inventory Movement Stock Ledger', category: 'ledger', isKeyCollection: true },
  { key: 'cms_tl_accounts', name: 'Top-Level Chart of Accounts', category: 'vouchers' },
  { key: 'cms_fl_accounts', name: 'First-Level Control Accounts', category: 'vouchers' },
  { key: 'cms_sl_accounts', name: 'Sub-Ledger Accounts', category: 'vouchers' },
  { key: 'cms_vouchers', name: 'Financial Vouchers (CP, CR, BP, BR, JV)', category: 'vouchers', isKeyCollection: true },
  { key: 'cms_voucher_details', name: 'Journal Entry Line Breakdowns', category: 'vouchers' },
  { key: 'cms_ac_ledger', name: 'General Accounts & Audit Ledger', category: 'ledger', isKeyCollection: true },
  { key: 'cms_users_list', name: 'System User Accounts & Roles', category: 'system' },
  { key: 'cms_clinic_settings', name: 'Clinic Settings & Branding', category: 'system' },
  { key: 'cms_sms_settings', name: 'SMS Gateway Configuration', category: 'system' },
  { key: 'cms_mongodb_settings', name: 'MongoDB Database Config', category: 'system' },
  { key: 'cms_cities', name: 'Cities & Geographic Masters', category: 'system' }
];

export interface ExportZipResult {
  zipBlob: Blob;
  fileName: string;
  totalRecords: number;
  uncompressedKb: number;
  compressedKb: number;
  collectionsStats: Record<string, number>;
}

/**
 * Exports current local state and database collections into a high-compression ZIP archive
 */
export const generateDatabaseZip = async (
  targetDbName = 'PharmacyPOSDB',
  onStepProgress?: (step: string, percent: number) => void
): Promise<ExportZipResult> => {
  if (onStepProgress) onStepProgress('Initializing database serialization engine...', 5);

  const localBackup: Record<string, any> = {
    backupDate: new Date().toISOString(),
    system: 'Punjab Homeopathic Clinic EMR & Pharmacy POS',
    databaseName: targetDbName,
    collectionsCount: BACKUP_COLLECTIONS.length,
    collections: {}
  };

  let totalRecordsCount = 0;
  const collectionsStats: Record<string, number> = {};

  for (let i = 0; i < BACKUP_COLLECTIONS.length; i++) {
    const col = BACKUP_COLLECTIONS[i];
    const cleanKey = col.key.replace(/^cms_/, '');
    const raw = localStorage.getItem(col.key);

    let itemsCount = 0;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        localBackup.collections[cleanKey] = parsed;
        if (Array.isArray(parsed)) {
          itemsCount = parsed.length;
        } else if (typeof parsed === 'object' && parsed !== null) {
          itemsCount = Object.keys(parsed).length;
        } else {
          itemsCount = 1;
        }
      } catch {
        localBackup.collections[cleanKey] = raw;
        itemsCount = 1;
      }
    } else {
      localBackup.collections[cleanKey] = [];
      itemsCount = 0;
    }

    collectionsStats[col.key] = itemsCount;
    totalRecordsCount += itemsCount;

    const progressPct = Math.round(10 + ((i + 1) / BACKUP_COLLECTIONS.length) * 45);
    if (onStepProgress) {
      onStepProgress(`Extracted table [${i + 1}/${BACKUP_COLLECTIONS.length}]: ${col.name} (${itemsCount.toLocaleString()} records)`, progressPct);
    }
  }

  // Also include metadata stamp
  localBackup.metadata = {
    appVersion: '2.5.0',
    exportTimestamp: Date.now(),
    exportDateFormatted: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
    totalRecords: totalRecordsCount
  };

  if (onStepProgress) onStepProgress('Stringifying JSON payload...', 60);
  const compactJson = JSON.stringify(localBackup);
  const uncompressedBlob = new Blob([compactJson], { type: 'application/json' });
  const uncompressedKb = Math.round(uncompressedBlob.size / 1024);

  if (onStepProgress) onStepProgress('Compressing database snapshot with JSZip DEFLATE Level 9...', 70);
  const zip = new JSZip();
  const dateStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const internalJsonName = `mongodb_backup_${targetDbName}_${dateStamp}.json`;
  const finalZipFileName = `mongodb_backup_${targetDbName}_${dateStamp}.zip`;

  zip.file(internalJsonName, compactJson);
  zip.file('README_BACKUP_RESTORE.txt', [
    `PUNJAB HOMEOPATHIC CLINIC & PHARMACY ERP - DATABASE BACKUP ARCHIVE`,
    `Generated At: ${new Date().toISOString()}`,
    `Target DB: ${targetDbName}`,
    `Total Collections: ${BACKUP_COLLECTIONS.length}`,
    `Total Records: ${totalRecordsCount.toLocaleString()}`,
    `Primary Clinic: Punjab Homeopathic Clinic, Burewala, Punjab`,
    `Cloud Destination: Google Drive (Punjabhomeopathic@gmail.com)`
  ].join('\n'));

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    },
    (metadata) => {
      if (onStepProgress) {
        const zipProg = Math.round(70 + (metadata.percent / 100) * 25);
        onStepProgress(`Compressing archive... (${metadata.percent.toFixed(0)}%)`, zipProg);
      }
    }
  );

  const compressedKb = Math.round(zipBlob.size / 1024);
  if (onStepProgress) onStepProgress('ZIP archive compiled successfully!', 100);

  return {
    zipBlob,
    fileName: finalZipFileName,
    totalRecords: totalRecordsCount,
    uncompressedKb,
    compressedKb,
    collectionsStats
  };
};

export interface DriveFolderInfo {
  id: string;
  name: string;
}

export interface DriveUploadResponse {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  folderId?: string;
  folderName?: string;
}

/**
 * Finds or creates the dedicated target folder in Google Drive
 */
export const getOrCreateDriveFolder = async (
  accessToken: string,
  folderName = 'Punjab Homeopathic DB Backups'
): Promise<DriveFolderInfo> => {
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to search Google Drive folder: ${res.status} ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      name: data.files[0].name
    };
  }

  // Create new folder in Drive
  const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Automated database backups from Punjab Homeopathic Clinic EMR & Pharmacy POS'
    })
  });

  if (!createFolderRes.ok) {
    const errText = await createFolderRes.text();
    throw new Error(`Failed to create Google Drive backup folder: ${createFolderRes.status} ${errText}`);
  }

  const newFolder = await createFolderRes.json();
  return {
    id: newFolder.id,
    name: newFolder.name
  };
};

/**
 * Uploads a ZIP file to Google Drive using multipart upload
 */
export const uploadZipBlobToDrive = async (
  accessToken: string,
  zipBlob: Blob,
  fileName: string,
  folderId?: string,
  description?: string
): Promise<DriveUploadResponse> => {
  const boundary = '-------PunjabHomeoDriveBackupBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: 'application/zip',
    description: description || 'Punjab Homeopathic Clinic automated database snapshot archive (.zip)'
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    'Content-Type: application/zip\r\n\r\n',
    zipBlob,
    closeDelim
  ], { type: `multipart/related; boundary=${boundary}` });

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,createdTime,parents';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errorText}`);
  }

  const uploadedFile = await res.json();
  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    webViewLink: uploadedFile.webViewLink,
    webContentLink: uploadedFile.webContentLink,
    size: uploadedFile.size,
    createdTime: uploadedFile.createdTime,
    folderId
  };
};

/**
 * Fetches recent backups list from Google Drive
 */
export const listRecentDriveBackups = async (
  accessToken: string,
  folderId?: string
): Promise<DriveUploadResponse[]> => {
  try {
    let query = "mimeType = 'application/zip' and trashed = false";
    if (folderId) {
      query = `'${folderId}' in parents and ${query}`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=10&fields=files(id,name,webViewLink,webContentLink,size,createdTime,parents)`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    console.warn('Failed to list previous Drive backups:', e);
    return [];
  }
};
