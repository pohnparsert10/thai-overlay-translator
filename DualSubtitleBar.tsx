import React from 'react';
import { Volume2, Copy, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OverlayItem } from '../types.ts';
import { speakText } from '../utils/speech.ts';

interface DualSubtitleBarProps {
  items: OverlayItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onClose?: () => void;
}

export const DualSubtitleBar: React.FC<DualSubtitleBarProps> = ({
  items,
  currentIndex,
  onSelectIndex,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentItem.translated_thai);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    speakText(currentItem.translated_thai, 'th-TH');
  };

  const categoryLabels: Record<string, string> = {
    dialogue: 'บทสนทนาตัวละคร',
    ui: 'เมนู / อินเตอร์เฟส',
    narration: 'คำบรรยายฉาก',
    sfx: 'เสียงเอฟเฟกต์ (SFX)',
    heading: 'หัวข้อ / ชื่อเรื่อง',
    other: 'ข้อความทั่วไป',
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl bg-neutral-950/90 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-4 shadow-2xl z-20 transition-all duration-200">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
            {categoryLabels[currentItem.category] || 'บทสนทนา'}
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400 tabular-nums text-[11px]">
            ลำดับที่ {currentIndex + 1} จาก {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => onSelectIndex(currentIndex - 1)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="ข้อความก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentIndex >= items.length - 1}
            onClick={() => onSelectIndex(currentIndex + 1)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="ข้อความถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 ml-1"
              title="ปิดแถบซับไตเติล"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Original Language Line */}
      <div className="text-neutral-400 text-xs mb-1.5 font-sans tracking-wide truncate">
        {currentItem.original_text}
      </div>

      {/* Thai Translated Subtitle Line */}
      <div className="text-white text-base md:text-lg font-medium leading-relaxed font-sans mb-3 text-balance">
        {currentItem.translated_thai}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeak}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-cyan-300 rounded-lg border border-neutral-800 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>ฟังเสียงไทย</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400">
          ความแม่นยำ: {Math.round((currentItem.confidence || 0.95) * 100)}%
        </div>
      </div>
    </div>
  );
};
