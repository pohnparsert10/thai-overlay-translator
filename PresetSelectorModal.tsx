import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { PRESET_SCENES } from '../data/presets.ts';
import { PresetScene } from '../types.ts';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: string;
  onSelectPreset: (preset: PresetScene) => void;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  activePresetId,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">เลือกฉากตัวอย่างสำหรับการทดสอบแปล</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_SCENES.map((scene) => {
            const isActive = scene.id === activePresetId;
            return (
              <div
                key={scene.id}
                onClick={() => {
                  onSelectPreset(scene);
                  onClose();
                }}
                className={`group relative rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all ${
                  isActive
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-neutral-900 border border-neutral-800/80">
                    <img
                      src={scene.imagePath}
                      alt={scene.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-950/80 text-amber-300 backdrop-blur-xs">
                      {scene.categoryName}
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {scene.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    {scene.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                  <span>ภาษา: <strong className="text-neutral-200">{scene.sourceLanguage}</strong></span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Check className="w-3.5 h-3.5" /> ใช้งานอยู่
                    </span>
                  ) : (
                    <span className="text-neutral-500 group-hover:text-neutral-300">คลิกเพื่อเปิด</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
