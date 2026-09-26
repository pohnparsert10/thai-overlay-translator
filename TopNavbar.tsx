import React from 'react';
import { Monitor, Scissors, UploadCloud, Camera, Sparkles, Layers, RefreshCw, Radio, Smartphone } from 'lucide-react';

export type SourceMode = 'presets' | 'live-audio' | 'screen' | 'snip' | 'upload' | 'camera';

interface TopNavbarProps {
  currentSource: SourceMode;
  onSelectSource: (mode: SourceMode) => void;
  onTriggerTranslate: () => void;
  isLoading: boolean;
  floatingHudOpen: boolean;
  onToggleFloatingHud: () => void;
  onOpenApkModal: () => void;
  itemCount: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentSource,
  onSelectSource,
  onTriggerTranslate,
  isLoading,
  floatingHudOpen,
  onToggleFloatingHud,
  onOpenApkModal,
  itemCount,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur flex items-center justify-between z-30 sticky top-0 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          <span>Thai Overlay Translator</span>
        </a>
      </div>

      {/* Zone 2: Functional navigation / input source tabs */}
      <nav className="hidden lg:flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
        <button
          type="button"
          onClick={() => onSelectSource('live-audio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            currentSource === 'live-audio'
              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
              : 'text-rose-400 hover:text-rose-300 hover:bg-neutral-800/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>แปลเสียงวิดีโอ/อนิเมะสด</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSource('presets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentSource === 'presets'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ฉากตัวอย่าง</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSource('screen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentSource === 'screen'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span>แชร์จอแบบสด</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSource('snip')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentSource === 'snip'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-emerald-400" />
          <span>เลือกพื้นที่ (Snip)</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSource('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentSource === 'upload'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
          <span>อัปโหลด / วางภาพ</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSource('camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentSource === 'camera'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-rose-400" />
          <span>กล้องถ่ายทอดสด</span>
        </button>
      </nav>

      {/* Zone 3: Primary action controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleFloatingHud}
          title="เปิด/ปิดหน้าต่างโอเวอร์เลย์ลอย"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            floatingHudOpen
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">หน้าต่างแปลลอย</span>
          {itemCount > 0 && (
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 tabular-nums">
              {itemCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenApkModal}
          title="ติดตั้งเป็นแอป Android / Export APK"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export APK</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={onTriggerTranslate}
          className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shadow-sm shadow-amber-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'กำลังประมวลผล AI...' : 'แปลภาพด้วย AI'}</span>
        </button>
      </div>
    </header>
  );
};
