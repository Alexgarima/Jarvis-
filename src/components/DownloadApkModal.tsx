import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Sparkles,
  Layers,
  ShieldCheck,
  Github,
  Package,
  ArrowRight,
  Info,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { soundEffects } from '../modules/SoundEffects';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGithubRepo?: string;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({
  isOpen,
  onClose,
  defaultGithubRepo = 'mohitgurjar988729/jarvis-ai-assistant',
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'phone_install' | 'pwabuilder'>('github');
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [copiedReleaseUrl, setCopiedReleaseUrl] = useState(false);
  const [customRepo, setCustomRepo] = useState(defaultGithubRepo);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const appUrl =
    typeof window !== 'undefined' && window.location.href.includes('ais-')
      ? window.location.origin
      : 'https://ais-pre-3dntmzqmjti5fhn3ufpmdb-177179059689.asia-southeast1.run.app';

  // Construct GitHub Releases URL dynamically based on repo
  const cleanRepo = customRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  const githubReleasesUrl = `https://github.com/${cleanRepo || 'mohitgurjar988729/jarvis-ai-assistant'}/releases`;

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyReleaseUrl = () => {
    navigator.clipboard.writeText(githubReleasesUrl);
    setCopiedReleaseUrl(true);
    soundEffects.play('confirm');
    setTimeout(() => setCopiedReleaseUrl(false), 2500);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedAppUrl(true);
    soundEffects.play('confirm');
    setTimeout(() => setCopiedAppUrl(false), 2500);
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        soundEffects.play('confirm');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=0c1024&color=06b6d4&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="w-full max-w-xl bg-[#0c1024] border border-cyan-800/80 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-cyan-950 bg-gradient-to-r from-[#0f1430] via-[#121940] to-[#0f1430] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] shrink-0">
              <img
                src="/jarvis-logo.jpg"
                alt="JARVIS"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-1.5">
                Download JARVIS APK & GitHub Releases
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h2>
              <p className="text-[11px] text-cyan-300/80 font-mono">
                Android APK & Native Installation Center
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyan-950/80 bg-[#080b1a] px-3 sm:px-5 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('github');
            }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-[#0f1533] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-cyan-400" />
            <span>GitHub Releases APK</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              New
            </span>
          </button>

          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('phone_install');
            }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'phone_install'
                ? 'bg-[#0f1533] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Phone Install</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Fast
            </span>
          </button>

          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('pwabuilder');
            }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pwabuilder'
                ? 'bg-[#0f1533] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>PWABuilder Cloud</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: GitHub Releases Guide */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Release URL Banner & Copy Feature */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-[#10173d] to-[#0c1028] border border-cyan-600/60 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                    <Github className="w-4 h-4 text-cyan-400" />
                    GitHub Release Page URL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    APK Download Destination
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3">
                  GitHub Actions jab bhi build finish karega, aapka debug APK is exact release link par automatically publish ho jayega:
                </p>

                {/* Release URL Display & Copy Button */}
                <div className="bg-[#080b18] p-2.5 rounded-xl border border-cyan-900/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 min-w-0 bg-[#0c1024] px-2.5 py-1.5 rounded-lg border border-cyan-950">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={githubReleasesUrl}
                      readOnly
                      className="bg-transparent text-xs text-cyan-200 font-mono w-full select-all outline-none truncate"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Copy Release URL Feature */}
                    <button
                      onClick={handleCopyReleaseUrl}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                      title="Copy Release Page URL"
                    >
                      {copiedReleaseUrl ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Release URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={githubReleasesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title="Open in new tab"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Optional Repo customizer */}
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="shrink-0">Repository:</span>
                  <input
                    type="text"
                    value={customRepo}
                    onChange={(e) => setCustomRepo(e.target.value)}
                    placeholder="username/repo-name"
                    className="bg-[#080b18] px-2 py-0.5 rounded border border-cyan-950 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-600 flex-1"
                  />
                </div>
              </div>

              {/* Step-by-Step Guide */}
              <div className="p-4 rounded-2xl bg-[#090d20] border border-cyan-950/90 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Step-by-Step: How to Download APK from GitHub Release
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0c112b] border border-cyan-950">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-cyan-500/30">
                      1
                    </span>
                    <div className="space-y-1">
                      <span className="font-bold text-white block">
                        Build Trigger Karein (GitHub Actions)
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Jab aap repository me naya code push karenge ya <strong>Actions tab</strong> me jakar <strong>"Run workflow"</strong> dabayenge, toh GitHub ke cloud servers automatic APK build shuru kar dete hain. (Build complete hone me ~1 se 2 minute lagte hain).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0c112b] border border-cyan-950">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-cyan-500/30">
                      2
                    </span>
                    <div className="space-y-1">
                      <span className="font-bold text-white block">
                        Release Page Open Karein
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Upar diye gaye <strong>"Copy Release URL"</strong> button par tap karke link copy karein aur apne mobile ke Chrome browser me kholein, ya GitHub repo par jaakar <strong>"Releases"</strong> section par click karein.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0c112b] border border-cyan-950">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-cyan-500/30">
                      3
                    </span>
                    <div className="space-y-1">
                      <span className="font-bold text-white block">
                        Latest Release aur "Assets" Section Check Karein
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Release page par sabse upar latest release tag dikhega (e.g. <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">debug-apk-build-1-1</code>). Uske neeche <strong>"Assets"</strong> drop-down par tap karein.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0c112b] border border-cyan-950">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-emerald-500/30">
                      4
                    </span>
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        APK File Par Tap Karke Direct Download Karein
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Assets me <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">*-debug-build-*.apk</code> file dikhegi. Us par tap karein — APK turant aapke phone ke Downloads me save ho jayegi!
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0c112b] border border-cyan-950">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-cyan-500/30">
                      5
                    </span>
                    <div className="space-y-1">
                      <span className="font-bold text-white block">
                        Phone me Install Karein
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Downloaded APK par tap karein. Agar phone <em>"Install unknown apps"</em> pooche toh Chrome/Files ko allow kar dein aur <strong>"Install"</strong> dabayein.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helpful Note / Artifacts Backup */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/60 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-cyan-300">Backup Option (GitHub Actions Artifacts):</strong> Agar Release create hone me koi delay ho, toh aap GitHub ke <strong>Actions</strong> tab me jakar successful workflow run par tap karein aur neeche <strong>"app-debug-apk"</strong> Artifact download kar sakte hain.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Phone Install (WebAPK) */}
          {activeTab === 'phone_install' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-[#121738] to-[#0e132e] border border-cyan-600/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  NATIVE ANDROID PHONE INSTALL (NO PC NEEDED)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  RECOMMENDED
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Android ka WebAPK engine is app ko direct aapke mobile me real application banakar install kar deta hai. Ye Chrome ke andar nahi balki phone ke home screen aur app drawer me full screen khulti hai:
              </p>

              {isInstallable && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>TAP HERE TO INSTALL ON THIS PHONE NOW</span>
                </button>
              )}

              <div className="bg-[#080b18]/90 rounded-xl p-3.5 border border-cyan-900/60 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <span>
                    Apne Android phone me Google Chrome me ye app URL kholein:
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#0c1024] p-2 rounded-lg border border-cyan-950">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="bg-transparent text-xs text-cyan-300 font-mono w-full select-all outline-none"
                  />
                  <button
                    onClick={handleCopyAppUrl}
                    className="shrink-0 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedAppUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAppUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <span>
                    Chrome me top right corner me <strong>3 Dots (⋮)</strong> par click karein.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </span>
                  <span>
                    Menu me <strong>"Install app"</strong> (ya <strong>"Add to Home screen"</strong>) dabayein aur <strong>"Install"</strong> confirm karein.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  JARVIS icon drawer me aa jayega aur phone me independently khulega bina browser search bar ke!
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PWABuilder Cloud */}
          {activeTab === 'pwabuilder' && (
            <div className="p-5 rounded-2xl bg-[#0e122b]/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                  <Layers className="w-4 h-4 text-amber-400" />
                  MICROSOFT PWABUILDER (FREE CLOUD BUILD)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  STANDALONE APK
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                PWABuilder se direct bina coding ke 15 seconds me signed APK generate kar sakte hain:
              </p>

              <div className="space-y-2 text-xs text-slate-300 bg-[#080b18]/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-white">PWABuilder Website</span>
                  <a
                    href="https://www.pwabuilder.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open PWABuilder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div>1. PWABuilder me apna Live App URL paste karke <strong>Start</strong> dabayein.</div>
                  <div>2. <strong>Package for Android</strong> par tap karein.</div>
                  <div>
                    3. Form details:
                    <div className="mt-1 pl-2 text-cyan-300 font-mono">
                      • App Name: JARVIS AI Assistant<br />
                      • Short Name: JARVIS<br />
                      • Package ID: com.jarvis.assistant
                    </div>
                  </div>
                  <div>4. <strong>Generate APK</strong> par tap karein — signed APK phone me download ho jayegi.</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick QR Code */}
          <div className="p-4 rounded-2xl bg-[#080b18] border border-cyan-950 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 bg-[#0c1024] rounded-xl border border-cyan-800/60 shadow-md shrink-0">
              <img
                src={qrUrl}
                alt="JARVIS QR Code"
                className="w-24 h-24 object-contain rounded-lg"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-white block">
                Phone Camera / Lens Scan
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Camera se scan karke direct phone me open karein aur install karein.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `JARVIS AI Assistant on your Android Phone: ${appUrl}\n\nGitHub Releases: ${githubReleasesUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-cyan-950 bg-[#0c1024] flex items-center justify-between">
          <button
            onClick={handleCopyReleaseUrl}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1.5 cursor-pointer"
          >
            {copiedReleaseUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReleaseUrl ? 'Release URL Copied' : 'Copy Release Link'}</span>
          </button>
          <button
            onClick={() => {
              soundEffects.play('confirm');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
