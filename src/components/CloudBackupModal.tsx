import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Cloud,
  CloudUpload,
  CheckCircle2,
  RefreshCw,
  Download,
  ExternalLink,
  ShieldCheck,
  Database,
  Lock,
  User,
  HardDrive,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  FileArchive,
  LogOut,
  FolderOpen
} from 'lucide-react';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getCachedUser,
  initAuth,
  generateDatabaseZip,
  getOrCreateDriveFolder,
  uploadZipBlobToDrive,
  listRecentDriveBackups,
  BACKUP_COLLECTIONS,
  DriveUploadResponse,
  ExportZipResult
} from '../utils/googleDriveBackup';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDbName?: string;
  suggestedEmail?: string;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  targetDbName = 'PharmacyPOSDB',
  suggestedEmail = 'Punjabhomeopathic@gmail.com'
}) => {
  // Google Auth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getCachedUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Backup Execution State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [stepPercent, setStepPercent] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<'idle' | 'extracting' | 'compressing' | 'connecting' | 'uploading' | 'complete' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [lastUploadedResult, setLastUploadedResult] = useState<DriveUploadResponse | null>(null);
  const [lastZipResult, setLastZipResult] = useState<ExportZipResult | null>(null);
  const [driveFolder, setDriveFolder] = useState<{ id: string; name: string } | null>(null);
  const [recentBackups, setRecentBackups] = useState<DriveUploadResponse[]>([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch recent backups when token and folder are ready
  const loadRecentBackups = async (token: string, fId?: string) => {
    setIsLoadingRecents(true);
    try {
      const list = await listRecentDriveBackups(token, fId);
      setRecentBackups(list);
    } catch (e) {
      console.warn('Failed to load recent backups:', e);
    } finally {
      setIsLoadingRecents(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      getAccessToken().then((token) => {
        if (token) {
          setAccessToken(token);
          loadRecentBackups(token);
        }
      });
    }
  }, [isOpen]);

  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString('en-GB');
    setLogs((prev) => [...prev, `[${timeStr}] ${msg}`]);
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
      addLog(`Authenticated with Google account: ${res.user.email}`);
      loadRecentBackups(res.accessToken);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setDriveFolder(null);
      setRecentBackups([]);
      addLog('Signed out of Google Drive account.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleStartCloudBackup = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google Drive first to continue.');
      return;
    }

    setIsProcessing(true);
    setActiveStage('extracting');
    setStepPercent(0);
    setLogs([]);
    setLastUploadedResult(null);
    setLastZipResult(null);
    setAuthError(null);

    try {
      addLog(`🚀 Starting Cloud Database Backup Workflow for target database [${targetDbName}]...`);
      addLog(`☁️ Destination Account: ${googleUser?.email || suggestedEmail}`);

      // Step 1 & 2: Extract and compress tables into high-compression ZIP
      const zipRes = await generateDatabaseZip(targetDbName, (msg, pct) => {
        setCurrentStepText(msg);
        setStepPercent(pct);
        addLog(msg);
      });

      setLastZipResult(zipRes);
      setStats(zipRes.collectionsStats);
      setActiveStage('connecting');
      setCurrentStepText('Connecting to Google Drive API & verifying destination folder...');
      addLog(`Connecting to Google Drive to locate or create folder "Punjab Homeopathic DB Backups"...`);

      // Step 3: Get or create dedicated Drive folder
      const folder = await getOrCreateDriveFolder(accessToken, 'Punjab Homeopathic DB Backups');
      setDriveFolder(folder);
      addLog(`Target Folder in Google Drive ready: "${folder.name}" (ID: ${folder.id})`);

      // Step 4: Multipart Upload to Google Drive
      setActiveStage('uploading');
      setCurrentStepText(`Uploading ZIP archive (${zipRes.compressedKb.toLocaleString()} KB) to Google Drive...`);
      setStepPercent(85);
      addLog(`Uploading file "${zipRes.fileName}" (${zipRes.compressedKb.toLocaleString()} KB) via Google Drive API...`);

      const uploadResult = await uploadZipBlobToDrive(
        accessToken,
        zipRes.zipBlob,
        zipRes.fileName,
        folder.id,
        `Complete Punjab Homeopathic Clinic database backup archive (${zipRes.totalRecords.toLocaleString()} records, ${BACKUP_COLLECTIONS.length} collections)`
      );

      uploadResult.folderName = folder.name;
      setLastUploadedResult(uploadResult);
      setStepPercent(100);
      setActiveStage('complete');
      setCurrentStepText('Backup successfully uploaded and secured in Google Drive!');
      addLog(`SUCCESS! Backup file securely saved in Google Drive: ${uploadResult.name}`);
      if (uploadResult.webViewLink) {
        addLog(`Direct Drive Web Link: ${uploadResult.webViewLink}`);
      }

      // Refresh recents
      loadRecentBackups(accessToken, folder.id);
    } catch (err: any) {
      console.error('Backup upload failed:', err);
      setActiveStage('error');
      setCurrentStepText(`Backup upload failed: ${err.message || 'Unknown network error'}`);
      addLog(`❌ ERROR: ${err.message || 'Failed to upload backup to Google Drive.'}`);
      setAuthError(err.message || 'Upload failed. Please check network connectivity or permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadLocalCopy = () => {
    if (!lastZipResult) return;
    const url = window.URL.createObjectURL(lastZipResult.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lastZipResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-500/20 border border-sky-400/30 text-sky-400 p-2.5 rounded-xl shrink-0 shadow-inner">
              <CloudUpload className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-wider">
                  Google Drive Cloud DB Backup
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded uppercase tracking-wider">
                  OAuth Drive Sync
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Target Cloud: <span className="font-semibold text-slate-200">{suggestedEmail}</span> | Auto-zipped Snapshot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">

          {/* Google Account Authentication Banner */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-300">
                    Google Drive Cloud Account
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5">
                    {googleUser ? (
                      <>
                        <span className="text-emerald-400">●</span>
                        <span className="truncate max-w-[220px] sm:max-w-none">{googleUser.email}</span>
                        {googleUser.email?.toLowerCase() === suggestedEmail.toLowerCase() && (
                          <span className="bg-emerald-950 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-800 uppercase">
                            Official Clinic Drive
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">Not connected to Google Drive</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign in with Google / Sign out button */}
              <div className="shrink-0">
                {!googleUser ? (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isAuthenticating || isProcessing}
                    className="gsi-material-button cursor-pointer transition shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents font-bold text-xs">
                        {isAuthenticating ? 'Connecting...' : 'Connect Google Drive'}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                      title="Switch or sign out Google Drive account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Switch Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Action Trigger Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-blue-500/30 rounded-xl p-4 space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>Full Database Snapshot (.zip) ➔ Google Drive</span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Archives all <strong>26 tables</strong> (Patients, OPD Visits, Prescriptions, Pharmacy Stock, Invoices, Chart of Accounts, Vouchers, Ledgers) into a compressed ZIP file and automatically uploads to your Google Drive folder: <strong className="text-sky-300">📁 Punjab Homeopathic DB Backups</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartCloudBackup}
                disabled={isProcessing || !googleUser}
                className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:from-sky-700 active:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-950/50 border border-sky-400/40 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Cloud Sync...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 text-sky-200" />
                    <span>Upload Backup to Drive</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Bar & Stage Indicator */}
            {isProcessing && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-300 font-bold flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>{currentStepText || 'Processing...'}</span>
                  </span>
                  <span className="font-mono font-black text-sky-400 text-sm">
                    {stepPercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-500 via-blue-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-md shadow-sky-500/50"
                    style={{ width: `${stepPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {activeStage === 'complete' && lastUploadedResult && (
            <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/50 rounded-xl p-4 text-xs space-y-3 animate-fadeIn shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold uppercase tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Cloud Backup Uploaded Successfully!</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                  Google Drive Secured
                </span>
              </div>

              <div className="space-y-1 text-slate-200 text-xxs leading-relaxed">
                <p>
                  File: <strong className="text-white font-mono">{lastUploadedResult.name}</strong>
                </p>
                <p>
                  Destination Folder: <strong className="text-sky-300 font-mono">📁 {lastUploadedResult.folderName || 'Punjab Homeopathic DB Backups'}</strong>
                </p>
                {lastZipResult && (
                  <p>
                    Archived Records: <strong className="text-emerald-300">{lastZipResult.totalRecords.toLocaleString()}</strong> across <strong>{BACKUP_COLLECTIONS.length} collections</strong> ({lastZipResult.compressedKb.toLocaleString()} KB)
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                {lastUploadedResult.webViewLink && (
                  <a
                    href={lastUploadedResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Google Drive</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleDownloadLocalCopy}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Local .ZIP Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Activity Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center space-x-1.5 text-sky-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Synchronization Output Terminal</span>
              </div>
              <span className="font-mono text-slate-500">{logs.length} activity records</span>
            </div>

            <div className="font-mono text-[11px] text-sky-300/90 bg-black/80 p-2.5 rounded-lg h-28 overflow-y-auto space-y-1 scrollbar-thin border border-slate-850">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-xs italic">
                  Connect your Google Drive account and click "Upload Backup to Drive" to initiate live cloud sync.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed break-words">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Recent Drive Backups List */}
          {googleUser && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4 text-sky-400" />
                  <h5 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Recent Backups in Your Google Drive
                  </h5>
                </div>
                {accessToken && (
                  <button
                    type="button"
                    onClick={() => loadRecentBackups(accessToken, driveFolder?.id)}
                    disabled={isLoadingRecents}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingRecents ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {isLoadingRecents ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Loading recent Drive backups...</span>
                </div>
              ) : recentBackups.length === 0 ? (
                <div className="py-3 text-center text-slate-500 text-xs italic">
                  No previous backup archives found in this Google Drive folder yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {recentBackups.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        <FileArchive className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-200 truncate">{b.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {b.createdTime ? new Date(b.createdTime).toLocaleString() : ''}
                            {b.size ? ` • ${Math.round(parseInt(b.size) / 1024).toLocaleString()} KB` : ''}
                          </p>
                        </div>
                      </div>

                      {b.webViewLink && (
                        <a
                          href={b.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold rounded flex items-center space-x-1 shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xxs text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted transmission via official Google Drive REST API v3</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            {activeStage === 'complete' ? 'Done' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
