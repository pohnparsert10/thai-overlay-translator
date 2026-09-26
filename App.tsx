import React, { useState, useEffect, useCallback } from 'react';
import { TopNavbar, SourceMode } from './components/TopNavbar.tsx';
import { ToolbarControls } from './components/ToolbarControls.tsx';
import { ScreenOverlayCanvas } from './components/ScreenOverlayCanvas.tsx';
import { DualSubtitleBar } from './components/DualSubtitleBar.tsx';
import { SplitTranscriptView } from './components/SplitTranscriptView.tsx';
import { FloatingHudWidget } from './components/FloatingHudWidget.tsx';
import { PresetSelectorModal } from './components/PresetSelectorModal.tsx';
import { ScreenCaptureModal } from './components/ScreenCaptureModal.tsx';
import { CameraFeedModal } from './components/CameraFeedModal.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { LiveVideoAudioTranslator } from './components/LiveVideoAudioTranslator.tsx';
import { ApkExportModal } from './components/ApkExportModal.tsx';
import { PRESET_SCENES } from './data/presets.ts';
import {
  OverlayDisplayMode,
  ToneMode,
  BubbleTheme,
  TranslationResult,
  PresetScene,
  OverlayItem,
} from './types.ts';
import { exportImageWithOverlay } from './utils/exportImage.ts';
import { speakText } from './utils/speech.ts';

export default function App() {
  // Source State
  const [currentSource, setCurrentSource] = useState<SourceMode>('presets');
  const [activePreset, setActivePreset] = useState<PresetScene>(PRESET_SCENES[0]);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Active image to display/process
  const activeImageSrc = customImageSrc || activePreset.imagePath;

  // Translation State
  const [translationResult, setTranslationResult] = useState<TranslationResult>(
    activePreset.initialResult
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Control Options
  const [displayMode, setDisplayMode] = useState<OverlayDisplayMode>('inplace');
  const [tone, setTone] = useState<ToneMode>(activePreset.recommendedTone);
  const [sourceLanguage, setSourceLanguage] = useState<string>('Auto Detect');
  const [opacity, setOpacity] = useState<number>(90);
  const [fontSizeScale, setFontSizeScale] = useState<number>(100);
  const [bubbleTheme, setBubbleTheme] = useState<BubbleTheme>('bubble');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Modals & Panels
  const [floatingHudOpen, setFloatingHudOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isScreenCaptureModalOpen, setIsScreenCaptureModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isSnipMode, setIsSnipMode] = useState<boolean>(false);

  // Status flags
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Handle switching presets
  const handleSelectPreset = (preset: PresetScene) => {
    setActivePreset(preset);
    setCustomImageSrc(null);
    setTranslationResult(preset.initialResult);
    setTone(preset.recommendedTone);
    setSelectedIndex(null);
    setCurrentSource('presets');
    setIsSnipMode(false);
  };

  // Convert image URL / asset to base64 if needed
  const getBase64FromUrl = async (url: string): Promise<string> => {
    if (url.startsWith('data:image/')) return url;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Trigger Gemini Vision AI Translation
  const handleRunAiTranslation = async (customImg?: string) => {
    const targetImage = customImg || activeImageSrc;
    if (!targetImage) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const base64Image = await getBase64FromUrl(targetImage);

      const response = await fetch('/api/translate-overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          sourceLanguage,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'การแปลภาษาขัดข้อง โปรดลองใหม่อีกครั้ง');
      }

      const formattedItems: OverlayItem[] = (data.items || []).map((it: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        box_2d: it.box_2d,
        original_text: it.original_text,
        translated_thai: it.translated_thai,
        category: it.category || 'dialogue',
        reading_direction: it.reading_direction || 'horizontal',
        confidence: it.confidence || 0.96,
        bg_theme: it.bg_theme || (bubbleTheme === 'bubble' ? 'bubble' : 'dark'),
      }));

      setTranslationResult({
        items: formattedItems,
        detected_source_language: data.detected_source_language || 'Auto Detected',
        overall_summary_thai: data.overall_summary_thai || '',
        timestamp: Date.now(),
      });

      if (formattedItems.length > 0) {
        setSelectedIndex(0);
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI');
    } finally {
      setIsLoading(false);
      setIsSnipMode(false);
    }
  };

  // Handle source navigation
  const handleSelectSource = (mode: SourceMode) => {
    setCurrentSource(mode);
    setIsSnipMode(false);
    if (mode === 'presets') {
      setIsPresetModalOpen(true);
    } else if (mode === 'screen') {
      setIsScreenCaptureModalOpen(true);
    } else if (mode === 'camera') {
      setIsCameraModalOpen(true);
    } else if (mode === 'upload') {
      setIsUploadModalOpen(true);
    } else if (mode === 'snip') {
      setIsSnipMode(true);
    }
  };

  // When a new image is loaded from Screen Share / Camera / Upload
  const handleNewCapturedImage = (dataUrl: string) => {
    setCustomImageSrc(dataUrl);
    setSelectedIndex(null);
    setIsSnipMode(false);
    // Automatically trigger AI translation for newly captured images
    handleRunAiTranslation(dataUrl);
  };

  // When user finishes snipping an area
  const handleSnipComplete = (croppedDataUrl: string) => {
    setCustomImageSrc(croppedDataUrl);
    setIsSnipMode(false);
    handleRunAiTranslation(croppedDataUrl);
  };

  // Global Paste listener (Ctrl+V) anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              const result = uploadEvent.target?.result as string;
              if (result) {
                handleNewCapturedImage(result);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Export translated image
  const handleExportImage = async () => {
    try {
      await exportImageWithOverlay(
        activeImageSrc,
        translationResult.items,
        `Thai-Overlay-${Date.now()}.png`,
        { opacity: opacity / 100, theme: bubbleTheme }
      );
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Copy all Thai translation text
  const handleCopyAllText = () => {
    const allThai = translationResult.items.map((it) => it.translated_thai).join('\n\n');
    if (!allThai) return;
    navigator.clipboard.writeText(allThai);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Read all Thai text in sequence
  const handleSpeakAllText = () => {
    const allThai = translationResult.items.map((it) => it.translated_thai).join('. ');
    if (allThai) {
      speakText(allThai, 'th-TH');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-x-hidden font-sans">
      {/* 1. TOP BAR */}
      <TopNavbar
        currentSource={currentSource}
        onSelectSource={handleSelectSource}
        onTriggerTranslate={() => handleRunAiTranslation()}
        isLoading={isLoading}
        floatingHudOpen={floatingHudOpen}
        onToggleFloatingHud={() => setFloatingHudOpen(!floatingHudOpen)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        itemCount={translationResult.items.length}
      />

      {/* 2. CONTROL TOOLBAR */}
      <ToolbarControls
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
        tone={tone}
        onChangeTone={setTone}
        sourceLanguage={sourceLanguage}
        onChangeSourceLanguage={setSourceLanguage}
        opacity={opacity}
        onChangeOpacity={setOpacity}
        fontSizeScale={fontSizeScale}
        onChangeFontSizeScale={setFontSizeScale}
        bubbleTheme={bubbleTheme}
        onChangeBubbleTheme={setBubbleTheme}
        showOriginal={showOriginal}
        onToggleShowOriginal={() => setShowOriginal(!showOriginal)}
        onExportImage={handleExportImage}
        onCopyAllText={handleCopyAllText}
        copied={copiedAll}
        onSpeakAllText={handleSpeakAllText}
        detectedLang={translationResult.detected_source_language}
        summaryThai={translationResult.overall_summary_thai}
      />

      {/* Error alert banner */}
      {errorMessage && (
        <div className="w-full bg-rose-950/80 border-b border-rose-800 px-4 py-2 text-rose-200 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold px-2 py-0.5"
          >
            ปิด
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE VIEWPORT */}
      {currentSource === 'live-audio' ? (
        <div className="flex-1 flex overflow-hidden relative">
          <LiveVideoAudioTranslator
            sourceLanguage={sourceLanguage}
            onClose={() => setCurrentSource('presets')}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Canvas Area */}
          <div className={`flex-1 relative h-[calc(100vh-120px)] overflow-hidden bg-neutral-950`}>
            <ScreenOverlayCanvas
              imageSrc={activeImageSrc}
              items={translationResult.items}
              displayMode={displayMode}
              bubbleTheme={bubbleTheme}
              opacity={opacity}
              fontSizeScale={fontSizeScale}
              showOriginal={showOriginal}
              selectedIndex={selectedIndex}
              onSelectItem={setSelectedIndex}
              isSnipMode={isSnipMode}
              onSnipComplete={handleSnipComplete}
              isLoading={isLoading}
            />

            {/* Subtitle Bar Overlay (when mode is 'subtitle' or item selected) */}
            {displayMode === 'subtitle' && translationResult.items.length > 0 && (
              <DualSubtitleBar
                items={translationResult.items}
                currentIndex={selectedIndex !== null ? selectedIndex : 0}
                onSelectIndex={setSelectedIndex}
              />
            )}
          </div>

          {/* Right: Split Side-by-Side Transcript Panel (when mode is 'split') */}
          {displayMode === 'split' && (
            <div className="w-80 md:w-96 h-[calc(100vh-120px)] shrink-0">
              <SplitTranscriptView
                items={translationResult.items}
                selectedIndex={selectedIndex}
                onSelectItem={setSelectedIndex}
                summaryThai={translationResult.overall_summary_thai}
                detectedLang={translationResult.detected_source_language}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. FLOATING HUD OVERLAY WIDGET */}
      <FloatingHudWidget
        isOpen={floatingHudOpen}
        onClose={() => setFloatingHudOpen(false)}
        items={translationResult.items}
        overallSummary={translationResult.overall_summary_thai}
        detectedLang={translationResult.detected_source_language}
      />

      {/* 5. MODALS */}
      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        activePresetId={activePreset.id}
        onSelectPreset={handleSelectPreset}
      />

      <ScreenCaptureModal
        isOpen={isScreenCaptureModalOpen}
        onClose={() => setIsScreenCaptureModalOpen(false)}
        onCaptureFrame={handleNewCapturedImage}
      />

      <CameraFeedModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureFrame={handleNewCapturedImage}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImageLoaded={handleNewCapturedImage}
      />

      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
