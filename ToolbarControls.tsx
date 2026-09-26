import React from 'react';
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  Download,
  Languages,
  Palette,
  Volume2,
  Copy,
  Check,
} from 'lucide-react';
import { OverlayDisplayMode, ToneMode, BubbleTheme } from '../types.ts';

interface ToolbarControlsProps {
  displayMode: OverlayDisplayMode;
  onChangeDisplayMode: (mode: OverlayDisplayMode) => void;
  tone: ToneMode;
  onChangeTone: (tone: ToneMode) => void;
  sourceLanguage: string;
  onChangeSourceLanguage: (lang: string) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  fontSizeScale: number;
  onChangeFontSizeScale: (scale: number) => void;
  bubbleTheme: BubbleTheme;
  onChangeBubbleTheme: (theme: BubbleTheme) => void;
  showOriginal: boolean;
  onToggleShowOriginal: () => void;
  onExportImage: () => void;
  onCopyAllText: () => void;
  copied: boolean;
  onSpeakAllText: () => void;
  detectedLang?: string;
  summaryThai?: string;
}

export const ToolbarControls: React.FC<ToolbarControlsProps> = ({
  displayMode,
  onChangeDisplayMode,
  tone,
  onChangeTone,
  sourceLanguage,
  onChangeSourceLanguage,
  opacity,
  onChangeOpacity,
  fontSizeScale,
  onChangeFontSizeScale,
  bubbleTheme,
  onChangeBubbleTheme,
  showOriginal,
  onToggleShowOriginal,
  onExportImage,
  onCopyAllText,
  copied,
  onSpeakAllText,
  detectedLang,
  summaryThai,
}) => {
  return (
    <div className="w-full bg-neutral-900/80 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Group 1: Display Mode Segmented Selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-neutral-400 font-medium whitespace-nowrap">โหมดแสดงผล:</span>
        <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeDisplayMode('inplace')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              displayMode === 'inplace'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ทับข้อความเดิม
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayMode('highlight')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              displayMode === 'highlight'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            กรอบไฮไลต์
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayMode('subtitle')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              displayMode === 'subtitle'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            แถบซับไตเติลคู่
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayMode('split')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              displayMode === 'split'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            เทียบเคียง 2 ฝั่ง
          </button>
        </div>
      </div>

      {/* Group 2: Tone & Language Selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Source Language */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <Languages className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sourceLanguage}
            onChange={(e) => onChangeSourceLanguage(e.target.value)}
            className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="Auto Detect" className="bg-neutral-900">ภาษาต้นฉบับ: ตรวจจับอัตโนมัติ</option>
            <option value="Japanese" className="bg-neutral-900">ภาษาญี่ปุ่น (Japanese)</option>
            <option value="English" className="bg-neutral-900">ภาษาอังกฤษ (English)</option>
            <option value="Korean" className="bg-neutral-900">ภาษาเกาหลี (Korean)</option>
            <option value="Chinese" className="bg-neutral-900">ภาษาจีน (Chinese)</option>
          </select>
        </div>

        {/* Tone */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <span className="text-neutral-400">สไตล์แปล:</span>
          <select
            value={tone}
            onChange={(e) => onChangeTone(e.target.value as ToneMode)}
            className="bg-transparent text-amber-300 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="manga" className="bg-neutral-900 text-white">มังงะ / การ์ตูน</option>
            <option value="gaming" className="bg-neutral-900 text-white">เกม & RPG สนทนา</option>
            <option value="general" className="bg-neutral-900 text-white">บทสนทนาทั่วไป</option>
            <option value="formal" className="bg-neutral-900 text-white">ทางการ / เอกสาร</option>
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <Palette className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={bubbleTheme}
            onChange={(e) => onChangeBubbleTheme(e.target.value as BubbleTheme)}
            className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="bubble" className="bg-neutral-900">ธีมบอลลูนการ์ตูน (ขาว)</option>
            <option value="dark" className="bg-neutral-900">ธีมมืดคุมโทน (Dark HUD)</option>
            <option value="neon" className="bg-neutral-900">ธีมนีออนไซเบอร์ (Cyan)</option>
            <option value="glass" className="bg-neutral-900">ธีมกระจกฝ้า (Glass)</option>
          </select>
        </div>
      </div>

      {/* Group 3: Opacity, Font Scale, Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Opacity slider */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px]">ความทึบ:</span>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={opacity}
            onChange={(e) => onChangeOpacity(Number(e.target.value))}
            className="w-16 h-1 accent-amber-400 cursor-pointer"
          />
          <span className="text-[11px] tabular-nums text-neutral-300 w-7">{opacity}%</span>
        </div>

        {/* Toggle Original Text */}
        <button
          type="button"
          onClick={onToggleShowOriginal}
          title="สลับดูข้อความภาษาต้นทาง"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
            showOriginal
              ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {showOriginal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>ดูต้นฉบับ</span>
        </button>

        {/* Audio Speech */}
        <button
          type="button"
          onClick={onSpeakAllText}
          title="อ่านออกเสียงบทสนทนาภาษาไทย"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>อ่านเสียง</span>
        </button>

        {/* Copy All */}
        <button
          type="button"
          onClick={onCopyAllText}
          title="คัดลอกข้อความแปลภาษาไทยทั้งหมด"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
        </button>

        {/* Export Image with Overlay */}
        <button
          type="button"
          onClick={onExportImage}
          title="ส่งออกรูปภาพพร้อมข้อความแปลไทย"
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>บันทึกภาพ</span>
        </button>
      </div>

      {/* Summary Kicker if available */}
      {summaryThai && (
        <div className="w-full pt-1 pb-0.5 px-1 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400 font-semibold whitespace-nowrap">สรุปใจความ:</span>
            <span className="text-neutral-300 truncate">{summaryThai}</span>
          </div>
          {detectedLang && (
            <div className="text-[10px] text-neutral-400 shrink-0 ps-3">
              ตรวจพบ: <span className="text-neutral-200">{detectedLang}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
