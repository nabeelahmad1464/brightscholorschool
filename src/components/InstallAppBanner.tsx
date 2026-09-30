import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share2, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    // Check if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleOpenGuide = () => {
      handleInstallClick();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('open-install-guide', handleOpenGuide);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open-install-guide', handleOpenGuide);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Prominent Floating Banner at top/bottom for Mobile & Web */}
      {!isInstalled && isBannerVisible && (
        <div className="bg-gradient-to-r from-[#0D285F] via-[#1A3D8F] to-[#07193B] text-white px-3 py-2 border-b border-amber-400/30 shadow-md sticky top-0 z-40 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow">
                <img src="/school_logo.jpg" alt="BSS App" className="w-full h-full rounded object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-300">BSS Mobile App</span>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-semibold border border-amber-400/30">
                    Android & iOS
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 hidden sm:block">
                  اسکول کی آفیشل ایپ موبائل میں انسٹال کریں — تیز رفتار اور بغیر براؤزر کے
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>انسٹال کریں (Install App)</span>
              </button>
              <button
                onClick={() => setIsBannerVisible(false)}
                className="text-blue-200 hover:text-white p-1 rounded-full hover:bg-white/10"
                title="Close banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0D285F]" />
                <h3 className="font-bold text-sm text-slate-900">موبائل ایپ انسٹال کرنے کا طریقہ</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
                <MoreVertical className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-amber-950 font-bold mb-0.5">اینڈرائیڈ (Chrome) کے لیے:</strong>
                  <span>براؤزر میں اوپر دائیں طرف <strong>تین ڈاٹس (⋮)</strong> پر کلک کریں، اور پھر <strong>"Install app"</strong> یا <strong>"Add to Home screen"</strong> دبائیں۔</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-2.5">
                <Share2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-blue-950 font-bold mb-0.5">آئی فون (Safari) کے لیے:</strong>
                  <span>نیچے <strong>Share (⎋)</strong> والے بٹن پر کلک کریں اور <strong>"Add to Home Screen"</strong> پر ٹیپ کریں۔</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>ایپ فوراً آپ کے موبائل ہوم اسکرین پر انسٹال ہو جائے گی!</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-[#0D285F] text-amber-300 hover:bg-[#07193B] py-2 rounded-xl text-xs font-bold"
            >
              سمجھ گیا (OK)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
