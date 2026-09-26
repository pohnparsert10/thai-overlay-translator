import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Copy,
  Layers,
  FileCode,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      if (isInstallable) {
        await install();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Export & ติดตั้งเป็นแอป Android / APK</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA & WebAPK Ready
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                ติดตั้งบนมือถือและแท็บเล็ต ใช้งานเป็นแอปเดี่ยวเต็มหน้าจอ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-neutral-300 max-h-[80vh] overflow-y-auto">
          {/* Method 1: Instant Direct 1-Click Install (WebAPK) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-400 text-neutral-950 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <span>ติดตั้งเป็นแอป Android ทันที (ไม่ต้องผ่าน Store)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                แนะนำ 100%
              </span>
            </div>

            <p className="text-neutral-300 leading-relaxed text-xs">
              ระบบ Android รองรับการสร้าง <strong>WebAPK</strong> ลงบนเครื่องโดยตรง แค่เปิดผ่าน <strong>Google Chrome บนมือถือ</strong>:
            </p>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>เปิดแอปนี้ในเบราว์เซอร์ <strong>Google Chrome</strong> บนมือถือ</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>แตะปุ่มจุด 3 จุด <strong className="text-white">(⋮)</strong> ที่มุมขวาบนของหน้าจอ Chrome</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>เลือก <strong className="text-emerald-400">"ติดตั้งแอป (Install App)"</strong> หรือ <strong className="text-emerald-400">"เพิ่มลงในหน้าจอหลัก"</strong></span>
              </div>
            </div>

            {isInstalled ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>แอปนี้ถูกติดตั้งลงบนเครื่องของคุณเรียบร้อยแล้ว! ใช้งานได้เต็มหน้าจอ</span>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-neutral-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'กำลังส่งคำขอติดตั้ง...' : 'กดเพื่อติดตั้งลงเครื่องทันที (Install WebAPK)'}</span>
              </button>
            ) : null}
          </div>

          {/* Explanation about PWABuilder & AI Studio Preview URL */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-neutral-950 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span>การ Export เป็นไฟล์ APK ผ่าน PWABuilder</span>
              </span>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] leading-relaxed">
              <strong>สาเหตุที่ PWABuilder ขึ้น Error:</strong> ลิงก์พรีวิว (<code className="text-amber-100">ais-dev-...</code>) อยู่ภายใต้การล็อกอินส่วนตัวของ Google ทำให้บอตจากภายนอกของ PWABuilder เข้ามาดึงไฟล์ไม่ได้โดยตรง
            </div>

            {/* Prominent URL Copy & Open PWABuilder Buttons */}
            <div className="p-3 bg-neutral-900 border border-cyan-500/30 rounded-xl space-y-2.5">
              <span className="text-[11px] font-semibold text-neutral-200 block">
                ลิงก์ URL ของแอปคุณ (สำหรับนำไปใส่ใน PWABuilder):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-neutral-950 border border-neutral-800 text-cyan-300 text-xs px-3 py-2 rounded-lg flex-1 focus:outline-none font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-cyan-600/20"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'คัดลอก URL แล้ว!' : 'คัดลอก URL'}</span>
                </button>
              </div>

              <a
                href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-98 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 border border-cyan-400/30 shadow-md cursor-pointer mt-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>คลิกที่นี่เพื่อเปิดเว็บ PWABuilder พร้อมลิงก์แอปทันที</span>
              </a>
            </div>

            <p className="text-neutral-400 text-[11px] leading-relaxed">
              หากต้องการสร้างไฟล์ APK ใน PWABuilder สามารถกดปุ่มสีม่วง <strong className="text-white">"Edit Your Manifest"</strong> ในหน้า PWABuilder แล้วคัดลอกค่า Manifest ด้านล่างนี้ไปวางได้ทันที:
            </p>

            {/* Manifest JSON copy box */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400">manifest.json</span>
                <button
                  type="button"
                  onClick={() => {
                    const manifestStr = JSON.stringify({
                      name: "Thai Overlay Translator",
                      short_name: "ThaiOverlay",
                      description: "แอปพลิเคชันแปลภาษาทับหน้าจอและเสียงอนิเมะสดเป็นไทย",
                      start_url: "/",
                      display: "standalone",
                      background_color: "#090a0f",
                      theme_color: "#090a0f",
                      icons: [
                        {
                          src: "https://raw.githubusercontent.com/google/material-design-icons/master/png/action/translate/materialicons/192dp/2x/baseline_translate_black_192dp.png",
                          sizes: "192x192",
                          type: "image/png",
                          purpose: "any"
                        },
                        {
                          src: "https://raw.githubusercontent.com/google/material-design-icons/master/png/action/translate/materialicons/512dp/2x/baseline_translate_black_512dp.png",
                          sizes: "512x512",
                          type: "image/png",
                          purpose: "any maskable"
                        }
                      ]
                    }, null, 2);
                    navigator.clipboard.writeText(manifestStr);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'คัดลอก Manifest แล้ว' : 'คัดลอกโค้ด Manifest'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono text-neutral-400 overflow-x-auto max-h-28 p-2 bg-neutral-950 rounded border border-neutral-800">
{`{
  "name": "Thai Overlay Translator",
  "short_name": "ThaiOverlay",
  "description": "แอปพลิเคชันแปลภาษาทับหน้าจอและเสียงอนิเมะสดเป็นไทย",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#090a0f",
  "theme_color": "#090a0f"
}`}
              </pre>
            </div>
          </div>

          {/* Capabilities note */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>ดาวน์โหลดซอร์สโค้ดโปรเจกต์ทั้งหมด (Full Source Code)</span>
              </span>
              <span className="text-[10px] text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                .tar.gz (4.0 MB)
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              รวมไฟล์โค้ดทั้งหมด (React, Express Backend, Gemini API, Types, Styles, Icons, Manifest, SW) พร้อมนำไปเปิดพัฒนาต่อใน Cursor, VS Code หรือให้ AI ตัวอื่น (Claude, ChatGPT, etc.) ทำงานต่อได้ทันที
            </p>
            <a
              href="/thai-overlay-translator-source.tar.gz"
              download="thai-overlay-translator-source.tar.gz"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>คลิกเพื่อดาวน์โหลดไฟล์โค้ดทั้งหมด (.tar.gz)</span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>รองรับ Manifest v3, Service Worker ออฟไลน์ และไอคอนมาตรฐานความละเอียดสูง</span>
          </div>
        </div>
      </div>
    </div>
  );
};
