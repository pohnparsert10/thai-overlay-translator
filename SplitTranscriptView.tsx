import React, { useState } from 'react';
import { Search, Volume2, Copy, Check, Filter } from 'lucide-react';
import { OverlayItem, CategoryType } from '../types.ts';
import { speakText } from '../utils/speech.ts';

interface SplitTranscriptViewProps {
  items: OverlayItem[];
  selectedIndex: number | null;
  onSelectItem: (index: number) => void;
  onUpdateItemText?: (id: string, newThaiText: string) => void;
  summaryThai?: string;
  detectedLang?: string;
}

export const SplitTranscriptView: React.FC<SplitTranscriptViewProps> = ({
  items,
  selectedIndex,
  onSelectItem,
  onUpdateItemText,
  summaryThai,
  detectedLang,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.translated_thai.toLowerCase().includes(search.toLowerCase()) ||
      item.original_text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSpeak = (text: string) => {
    speakText(text, 'th-TH');
  };

  const categoryLabels: Record<string, string> = {
    dialogue: 'บทสนทนา',
    ui: 'อินเตอร์เฟส/เมนู',
    narration: 'คำบรรยาย',
    sfx: 'เสียง SFX',
    heading: 'หัวข้อ',
    other: 'ทั่วไป',
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-neutral-800 text-xs">
      {/* Header bar */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-neutral-200">
            รายการตรวจพบ ({items.length} รายการ)
          </div>
          {detectedLang && (
            <div className="text-[11px] text-neutral-400">
              ภาษาต้นทาง: <span className="text-amber-400">{detectedLang}</span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาข้อความเดิม หรือคำแปลไทย..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar text-[11px]">
          <Filter className="w-3 h-3 text-neutral-500 shrink-0" />
          {['all', 'dialogue', 'ui', 'sfx', 'narration', 'heading'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-amber-400 text-neutral-950 font-medium'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary if present */}
      {summaryThai && (
        <div className="p-3 bg-neutral-900/30 border-b border-neutral-800/80">
          <div className="text-[10px] uppercase font-semibold text-amber-400 mb-1">
            สรุปภาพรวมฉาก
          </div>
          <div className="text-neutral-300 leading-relaxed text-[11px]">{summaryThai}</div>
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            ไม่พบข้อความที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const originalIndex = items.findIndex((i) => i.id === item.id);
            const isSelected = selectedIndex === originalIndex;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(originalIndex)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                    : 'bg-neutral-900/70 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[10px]">
                  <span className="text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {categoryLabels[item.category] || item.category}
                  </span>
                  <span className="text-neutral-500 tabular-nums">#{idx + 1}</span>
                </div>

                {/* Original Source */}
                <div className="text-neutral-400 text-xs font-mono mb-1.5 select-all">
                  {item.original_text}
                </div>

                {/* Thai Translation */}
                <div className="text-neutral-100 text-sm font-medium leading-relaxed mb-2.5">
                  {item.translated_thai}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(item.translated_thai);
                      }}
                      className="p-1 text-neutral-400 hover:text-cyan-300 rounded hover:bg-neutral-800 transition-colors"
                      title="ฟังเสียงไทย"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.id, item.translated_thai);
                      }}
                      className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                      title="คัดลอกข้อความแปล"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <span className="text-[10px] text-neutral-500 tabular-nums">
                    ความแม่นยำ {Math.round((item.confidence || 0.95) * 100)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
