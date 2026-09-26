import React, { useRef, useState, useEffect } from 'react';
import { Volume2, Copy, Check, Eye, EyeOff, Crop, Sparkles } from 'lucide-react';
import { OverlayItem, OverlayDisplayMode, BubbleTheme } from '../types.ts';
import { speakText } from '../utils/speech.ts';

interface SnipBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDrawing: boolean;
}

interface ScreenOverlayCanvasProps {
  imageSrc: string;
  items: OverlayItem[];
  displayMode: OverlayDisplayMode;
  bubbleTheme: BubbleTheme;
  opacity: number;
  fontSizeScale: number;
  showOriginal: boolean;
  selectedIndex: number | null;
  onSelectItem: (index: number) => void;
  isSnipMode: boolean;
  onSnipComplete: (croppedDataUrl: string) => void;
  isLoading: boolean;
}

export const ScreenOverlayCanvas: React.FC<ScreenOverlayCanvasProps> = ({
  imageSrc,
  items,
  displayMode,
  bubbleTheme,
  opacity,
  fontSizeScale,
  showOriginal,
  selectedIndex,
  onSelectItem,
  isSnipMode,
  onSnipComplete,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [snipBox, setSnipBox] = useState<SnipBox | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mouse handlers for Snip (Crop) mode
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSnipMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSnipBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      isDrawing: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSnipMode || !snipBox?.isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setSnipBox((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
  };

  const handleMouseUp = () => {
    if (!isSnipMode || !snipBox?.isDrawing || !imageRef.current) {
      if (snipBox) setSnipBox(null);
      return;
    }

    const x1 = Math.min(snipBox.startX, snipBox.currentX);
    const y1 = Math.min(snipBox.startY, snipBox.currentY);
    const x2 = Math.max(snipBox.startX, snipBox.currentX);
    const y2 = Math.max(snipBox.startY, snipBox.currentY);
    const widthPct = x2 - x1;
    const heightPct = y2 - y1;

    // Minimum drag threshold (1% width/height)
    if (widthPct > 2 && heightPct > 2) {
      cropAndEmit(x1, y1, widthPct, heightPct);
    }
    setSnipBox(null);
  };

  const cropAndEmit = (xPct: number, yPct: number, wPct: number, hPct: number) => {
    const img = imageRef.current;
    if (!img) return;

    try {
      const canvas = document.createElement('canvas');
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const sx = (xPct / 100) * naturalW;
      const sy = (yPct / 100) * naturalH;
      const sw = (wPct / 100) * naturalW;
      const sh = (hPct / 100) * naturalH;

      canvas.width = Math.max(1, sw);
      canvas.height = Math.max(1, sh);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const dataUrl = canvas.toDataURL('image/png');
        onSnipComplete(dataUrl);
      }
    } catch (err) {
      console.error('Error cropping image:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Helper theme classes for in-place overlays
  const getThemeClasses = (itemTheme?: string) => {
    const selectedTheme = itemTheme || bubbleTheme;
    switch (selectedTheme) {
      case 'bubble':
        return {
          bg: `rgba(255, 255, 255, ${opacity / 100})`,
          text: 'text-neutral-950 font-medium',
          border: 'border-2 border-neutral-900 shadow-lg',
          badge: 'bg-neutral-900 text-white',
        };
      case 'neon':
        return {
          bg: `rgba(8, 20, 36, ${opacity / 100})`,
          text: 'text-cyan-100 font-medium',
          border: 'border border-cyan-400/80 shadow-md shadow-cyan-500/20',
          badge: 'bg-cyan-900/80 text-cyan-200 border border-cyan-400/40',
        };
      case 'glass':
        return {
          bg: `rgba(255, 255, 255, ${Math.min(0.25, (opacity / 100) * 0.3)})`,
          text: 'text-white font-medium backdrop-blur-md',
          border: 'border border-white/30 shadow-lg',
          badge: 'bg-black/60 text-white border border-white/20',
        };
      case 'dark':
      default:
        return {
          bg: `rgba(15, 17, 23, ${opacity / 100})`,
          text: 'text-neutral-100 font-medium',
          border: 'border border-neutral-700/80 shadow-xl',
          badge: 'bg-amber-400 text-neutral-950 font-semibold',
        };
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950 select-none ${
        isSnipMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* Base Image Container */}
      <div className="relative max-w-full max-h-full inline-block shadow-2xl">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Screen Capture to Translate"
          className="max-w-full max-h-[calc(100vh-140px)] object-contain block mx-auto pointer-events-none rounded-lg"
          draggable={false}
        />

        {/* Loading Overlay Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 rounded-lg">
            <div className="w-9 h-9 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
            <div className="text-white text-sm font-semibold tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>AI กำลังวิเคราะห์ OCR และแปลภาษาไทย...</span>
            </div>
          </div>
        )}

        {/* Active Snip Box Selection Rectangle */}
        {snipBox?.isDrawing && (
          <div
            className="absolute border-2 border-amber-400 bg-amber-400/20 pointer-events-none z-40 rounded"
            style={{
              left: `${Math.min(snipBox.startX, snipBox.currentX)}%`,
              top: `${Math.min(snipBox.startY, snipBox.currentY)}%`,
              width: `${Math.abs(snipBox.currentX - snipBox.startX)}%`,
              height: `${Math.abs(snipBox.currentY - snipBox.startY)}%`,
            }}
          >
            <div className="absolute -top-7 left-0 px-2 py-0.5 bg-neutral-900 text-amber-400 text-[10px] font-mono rounded shadow">
              ตัดภาพบริเวณนี้
            </div>
          </div>
        )}

        {/* OVERLAY ITEMS LAYER */}
        {!isSnipMode &&
          items.map((item, index) => {
            const [ymin, xmin, ymax, xmax] = item.box_2d;
            const topPct = (ymin / 1000) * 100;
            const leftPct = (xmin / 1000) * 100;
            const widthPct = Math.max(3, ((xmax - xmin) / 1000) * 100);
            const heightPct = Math.max(2.5, ((ymax - ymin) / 1000) * 100);

            const isHovered = hoveredIndex === index;
            const isSelected = selectedIndex === index;
            const themeStyle = getThemeClasses(item.bg_theme);

            // Compute dynamic font size based on heightPct and user font scaling
            const baseFontSize = Math.max(10, Math.min(22, 12 * (fontSizeScale / 100)));

            // 1) IN-PLACE OVERLAY MODE
            if (displayMode === 'inplace') {
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(index);
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    minHeight: `${heightPct}%`,
                    backgroundColor: themeStyle.bg,
                    fontSize: `${baseFontSize}px`,
                  }}
                  className={`absolute p-1.5 md:p-2 rounded-lg ${themeStyle.border} ${themeStyle.text} transition-all duration-150 flex flex-col justify-center cursor-pointer group hover:scale-[1.01] hover:z-20 ${
                    isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-neutral-950 z-20' : 'z-10'
                  }`}
                >
                  {/* Category Pill Tag on Hover */}
                  {(isHovered || isSelected) && (
                    <div className="absolute -top-3 left-2 flex items-center gap-1 z-30">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${themeStyle.badge}`}>
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="leading-snug break-words">
                    {showOriginal ? (
                      <span className="font-mono text-neutral-400 italic">
                        {item.original_text}
                      </span>
                    ) : (
                      <span>{item.translated_thai}</span>
                    )}
                  </div>

                  {/* Quick Action Overlay on Hover */}
                  {isHovered && (
                    <div className="absolute -bottom-7 right-1 flex items-center gap-1 bg-neutral-900/90 border border-neutral-700 rounded-md p-0.5 shadow-lg z-30">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(item.translated_thai);
                        }}
                        className="p-1 hover:text-cyan-400 text-neutral-300 rounded"
                        title="ฟังเสียง"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.id, item.translated_thai);
                        }}
                        className="p-1 hover:text-white text-neutral-300 rounded"
                        title="คัดลอก"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 2) HIGHLIGHT / BOUNDING BOX MODE
            if (displayMode === 'highlight') {
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(index);
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  className={`absolute border-2 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/20 z-20'
                      : isHovered
                      ? 'border-cyan-400 bg-cyan-400/15 z-20'
                      : 'border-white/50 bg-black/10 hover:border-amber-400 hover:bg-amber-400/15 z-10'
                  }`}
                >
                  <span className="absolute -top-3.5 left-0 px-1 py-0.2 bg-neutral-900/90 text-amber-300 text-[9px] font-bold rounded">
                    #{index + 1}
                  </span>

                  {/* Tooltip on Hover or Selection */}
                  {(isHovered || isSelected) && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-64 bg-neutral-900/95 backdrop-blur border border-neutral-700 rounded-xl p-2.5 shadow-2xl z-40 text-left pointer-events-auto">
                      <div className="text-[10px] text-amber-400 font-semibold mb-1 uppercase tracking-wider">
                        {item.category} #{index + 1}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mb-1 truncate">
                        {item.original_text}
                      </div>
                      <div className="text-xs text-white font-medium leading-relaxed mb-2">
                        {item.translated_thai}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(item.translated_thai);
                          }}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>ฟังเสียง</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.id, item.translated_thai);
                          }}
                          className="flex items-center gap-1 text-neutral-300 hover:text-white"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>คัดลอก</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // 3) SUBTITLE & SPLIT MODES
            // Minimalist bounding highlight to anchor to the subtitle bar / split panel
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(index);
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                className={`absolute border rounded transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/25 z-20 ring-2 ring-amber-400'
                    : isHovered
                    ? 'border-cyan-400 bg-cyan-400/20 z-20'
                    : 'border-white/30 bg-transparent hover:border-amber-300 hover:bg-amber-400/10 z-10'
                }`}
              >
                <span className="absolute -top-3 left-0 px-1 bg-neutral-900 text-neutral-300 text-[9px] font-bold rounded">
                  #{index + 1}
                </span>
              </div>
            );
          })}
      </div>

      {/* Snip Mode Instructions Banner */}
      {isSnipMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-900/90 backdrop-blur border border-amber-500/40 rounded-full text-amber-300 text-xs font-medium flex items-center gap-2 shadow-xl z-50">
          <Crop className="w-4 h-4 animate-pulse" />
          <span>คลิกแล้วลากกรอบสี่เหลี่ยมบนภาพ เพื่อแปลเฉพาะพื้นที่ที่ต้องการ</span>
        </div>
      )}
    </div>
  );
};
