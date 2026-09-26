import React, { useState, useRef } from 'react';
import {
  GripHorizontal,
  Minus,
  Maximize2,
  Volume2,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { OverlayItem } from '../types.ts';
import { speakText } from '../utils/speech.ts';

interface FloatingHudWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  items: OverlayItem[];
  overallSummary?: string;
  detectedLang?: string;
}

export const FloatingHudWidget: React.FC<FloatingHudWidgetProps> = ({
  isOpen,
  onClose,
  items,
  overallSummary,
  detectedLang,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 80 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.initialY + dy)),
      });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 w-80 md:w-96 bg-neutral-950/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden transition-shadow duration-200"
    >
      {/* Draggable Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-neutral-500" />
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-200">หน้าต่างแปลลอย (HUD)</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={isMinimized ? 'ขยายหน้าต่าง' : 'ย่อหน้าต่าง'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            title="ปิดหน้าต่างลอย"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!isMinimized && (
        <div className="p-3 text-xs">
          {detectedLang && (
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-2 mb-2 border-b border-neutral-800">
              <span>ภาษาต้นทาง: <span className="text-amber-400 font-medium">{detectedLang}</span></span>
              <span>{items.length} รายการ</span>
            </div>
          )}

          {overallSummary && (
            <div className="p-2 mb-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">สรุป:</span> {overallSummary}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">
                ยังไม่มีข้อมูลการแปล
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                    <span className="font-medium text-amber-400/90 uppercase">{item.category}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mb-1 truncate">
                    {item.original_text}
                  </div>
                  <div className="text-neutral-100 font-medium leading-relaxed mb-2">
                    {item.translated_thai}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                    <button
                      type="button"
                      onClick={() => speakText(item.translated_thai)}
                      className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>ฟังเสียง</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.translated_thai)}
                      className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === item.id ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
