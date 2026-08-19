import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  ShoppingBag,
  Info
} from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchStoreMode?: () => void;
}

export default function PwaInstallModal({
  isOpen,
  onClose,
  onLaunchStoreMode
}: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'android_guide' | 'qr_mobile' | 'features'>('android_guide');
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);

      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Check if already running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const directStoreUrl = `${window.location.origin}/?app=store_medicine&tab=pharmacy&sub=store_sales`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(directStoreUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 flex items-center justify-between border-b border-indigo-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 p-2 border border-white/20 shadow-inner flex items-center justify-center">
              <img src="/pwa-icon.svg" alt="Store Medicine Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-wide">Store Medicine Mobile App</h3>
                <span className="px-2 py-0.5 text-[9.5px] font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Android PWA
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">Punjab Homeopathic Clinic • Direct Mobile App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 bg-slate-950/70 p-1.5 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('android_guide')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'android_guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('qr_mobile')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'qr_mobile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan to Phone</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'features'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>App Features</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {activeTab === 'android_guide' && (
            <div className="space-y-4">
              {/* 1-Click Install Button if supported */}
              {deferredPrompt && !isInstalled && (
                <div className="bg-linear-to-r from-emerald-950/80 to-blue-950/80 border border-emerald-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div>
                    <div className="font-black text-emerald-300 text-sm flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Ready for 1-Click Installation!</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Directly install Store Medicine app on your device screen.
                    </div>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong>App is already installed!</strong> You can launch Store Medicine directly from your home screen or app drawer.
                  </span>
                </div>
              )}

              {/* Step by Step Android Chrome Guide */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center space-x-2">
                  <span>Android Phone Par Install Karne Ka Tareeqa (3 Steps)</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mobile Chrome Browser Mein Kholein</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Yeh link apne mobile ke Google Chrome browser mein open karein.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Chrome Menu (3 Dots ⋮) Par Click Karein</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Chrome ke oopar right corner par <strong>3 Dots (⋮)</strong> menu dabayein.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">"Install app" Ya "Add to Home screen" Dabayein</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Menu mein <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> (ہوم اسکرین پر شامل کریں) par click karein.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-950/40 border border-blue-900/60 p-3 rounded-xl text-[11.5px] text-blue-200 flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>
                    Install hone ke baad aapke mobile desktop par <strong>Store Medicine</strong> ka icon ban jayega aur full screen real app ki tarah open hoga!
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr_mobile' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Apne Mobile Camera ya QR Scanner se is code ko scan karein taake mobile par direct Store Medicine open ho sake:
              </p>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border border-slate-300">
                <img
                  src={qrCodeUrl}
                  alt="Store Medicine QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono text-blue-300 break-all">
                {directStoreUrl}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(directStoreUrl);
                  alert('Store Medicine Mobile Link copied to clipboard!');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-slate-700"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Mobile URL to Clipboard</span>
              </button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-3">
              {[
                {
                  title: 'Direct Store Sales & OTC Billing',
                  desc: 'Mobile screen par direct walk-in customers ki store medicine sales aur cash receipt generate karein.',
                  icon: ShoppingBag,
                  color: 'text-emerald-400'
                },
                {
                  title: 'Mobile Camera Barcode / QR Scanner',
                  desc: 'Mobile ke camera se medicine dabba ya QR code scan karein aur automatic stock aur retail price search karein.',
                  icon: QrCode,
                  color: 'text-indigo-400'
                },
                {
                  title: 'Real-Time Stock & Batch Expiry Tracker',
                  desc: 'Har medicine ka counter stock, batch number, aur expiry alert live check karein.',
                  icon: Layers,
                  color: 'text-amber-400'
                },
                {
                  title: 'Full Screen & 100% Real-Time Cloud Sync',
                  desc: 'Jo bhi sale ya stock update mobile se hogi, wo foran clinic ke main computer/ERP mein reflect hogi.',
                  icon: Zap,
                  color: 'text-sky-400'
                }
              ].map((feat, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl flex items-start space-x-3">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                    <feat.icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          {onLaunchStoreMode && (
            <button
              onClick={() => {
                onLaunchStoreMode();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <span>Launch Store Medicine Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
