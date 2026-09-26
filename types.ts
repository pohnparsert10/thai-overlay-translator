export type CategoryType = 'dialogue' | 'ui' | 'narration' | 'sfx' | 'heading' | 'other';

export interface OverlayItem {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  original_text: string;
  translated_thai: string;
  category: CategoryType;
  reading_direction?: 'horizontal' | 'vertical';
  confidence?: number;
  bg_theme?: 'dark' | 'light' | 'bubble';
}

export interface TranslationResult {
  items: OverlayItem[];
  detected_source_language: string;
  overall_summary_thai: string;
  timestamp: number;
}

export type OverlayDisplayMode = 'inplace' | 'highlight' | 'subtitle' | 'split';

export type ToneMode = 'manga' | 'gaming' | 'general' | 'formal';

export type BubbleTheme = 'bubble' | 'dark' | 'neon' | 'glass';

export interface PresetScene {
  id: string;
  title: string;
  categoryName: string;
  description: string;
  imagePath: string;
  sourceLanguage: string;
  recommendedTone: ToneMode;
  initialResult: TranslationResult;
}

export interface LiveAudioSubtitle {
  id: string;
  timestamp: number;
  timeStr: string;
  original_transcript: string;
  thai_translation: string;
  detected_language: string;
  speaker_mood?: string;
}
