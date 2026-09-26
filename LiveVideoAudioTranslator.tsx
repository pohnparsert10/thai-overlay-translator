import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  Tv,
  Square,
  Play,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { LiveAudioSubtitle } from '../types.ts';
import { speakText } from '../utils/speech.ts';

interface LiveVideoAudioTranslatorProps {
  sourceLanguage: string;
  onClose?: () => void;
}

export const LiveVideoAudioTranslator: React.FC<LiveVideoAudioTranslatorProps> = ({
  sourceLanguage,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [subtitles, setSubtitles] = useState<LiveAudioSubtitle[]>([
    {
      id: 'demo-1',
      timestamp: Date.now() - 12000,
      timeStr: '14:20:01',
      original_transcript: '待ってくれ！これ以上先へ進むのは危険すぎる！',
      thai_translation: 'เดี๋ยวก่อน! ขืนมุ่งหน้าไปไกลกว่านี้ มันอันตรายเกินไปแล้วนะ!',
      detected_language: 'Japanese',
      speaker_mood: 'ตื่นเต้น / ร้อนรน',
    },
    {
      id: 'demo-2',
      timestamp: Date.now() - 6000,
      timeStr: '14:20:07',
      original_transcript: '諦めるわけにはいかない… 仲間が待っているんだ！',
      thai_translation: 'ฉันยอมแพ้ไม่ได้หรอก... เพื่อนพ้องกำลังรอฉันอยู่!',
      detected_language: 'Japanese',
      speaker_mood: 'มุ่งมั่น / เด็ดเดี่ยว',
    },
  ]);
  const [currentStatus, setCurrentStatus] = useState<string>('พร้อมเปิดรับเสียงจากแท็บ Chrome หรือวิดีโออนิเมะ');
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<'tab' | 'mic'>('tab');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSpeakThai, setAutoSpeakThai] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest subtitle
  useEffect(() => {
    bottomScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [subtitles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    setErrorMsg(null);
    try {
      let stream: MediaStream;

      if (captureSource === 'tab') {
        setCurrentStatus('กำลังเปิดหน้าต่างให้เลือกแท็บ Chrome ที่เปิดอนิเมะ/วิดีโอ...');
        // Request display media with tab audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          } as any,
        });

        // Verify audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error('ไม่พบสัญญาณเสียง! กรุณาติ๊กเลือก "Share audio" หรือ "แชร์เสียงระบบ/แท็บ" ในหน้าต่างที่ Chrome แสดงขึ้นมา');
        }
      } else {
        // Microphone capture
        setCurrentStatus('กำลังเปิดไมโครโฟนเพื่อรับเสียงจากลำโพง...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      streamRef.current = stream;
      stream.getTracks()[0].addEventListener('ended', () => {
        stopListening();
      });

      setIsListening(true);
      setCurrentStatus('กำลังดักฟังเสียงและส่งแปลเป็นภาษาไทยเรียลไทม์...');

      // Record in continuous 4-5 second chunks for real-time speech translation
      setupChunkRecording(stream);
    } catch (err: any) {
      console.error('Error starting live audio translator:', err);
      setErrorMsg(err.message || 'ไม่สามารถเริ่มฟังเสียงได้ โปรดตรวจสอบการอนุญาตสิทธิ์');
      stopListening();
    }
  };

  const setupChunkRecording = (stream: MediaStream) => {
    // Only capture audio track into the recorder
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const audioStream = new MediaStream([audioTrack]);

    const recordNextChunk = () => {
      if (!streamRef.current || !streamRef.current.active) return;

      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(audioStream, { mimeType });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            // Send chunk to AI translation endpoint
            if (blob.size > 2000) {
              await processAudioChunk(blob, mimeType);
            }
          }
          // Loop to record next segment
          if (streamRef.current && streamRef.current.active) {
            recordNextChunk();
          }
        };

        recorder.start();

        // Record for 4 seconds per speech chunk
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 3800);
      } catch (err: any) {
        console.error('Recorder error:', err);
      }
    };

    recordNextChunk();
  };

  const processAudioChunk = async (blob: Blob, mimeType: string) => {
    setIsProcessingChunk(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      });
      reader.readAsDataURL(blob);
      const dataUrl = await base64Promise;

      const res = await fetch('/api/translate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: dataUrl,
          mimeType,
          sourceLanguage,
          context: 'Anime series, video, or stream dialogue in Japanese/English',
        }),
      });

      const data = await res.json();
      if (data.success && data.has_speech && data.thai_translation) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const newSub: LiveAudioSubtitle = {
          id: `sub-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          original_transcript: data.original_transcript,
          thai_translation: data.thai_translation,
          detected_language: data.detected_language,
          speaker_mood: data.speaker_mood,
        };

        setSubtitles((prev) => [...prev.slice(-40), newSub]);

        if (autoSpeakThai) {
          speakText(data.thai_translation, 'th-TH');
        }
      }
    } catch (err: any) {
      console.warn('Chunk translation warning:', err?.message);
    } finally {
      setIsProcessingChunk(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
    setIsListening(false);
    setIsProcessingChunk(false);
    setCurrentStatus('หยุดการดักฟังแล้ว');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const latestSubtitle = subtitles[subtitles.length - 1];

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Top Banner Control Header */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-3 w-3 relative">
                {isListening && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isListening ? 'bg-rose-500' : 'bg-neutral-600'
                  }`}
                />
              </span>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <span>แปลเสียงจากวิดีโอ & อนิเมะสด (Live Anime Subtitle)</span>
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              ดักจับเสียงจากแท็บเบราว์เซอร์หรือวิดีโอที่กำลังเล่นอยู่ แล้วแปลงเป็นคำแปลภาษาไทยทันที
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Source switch */}
            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
              <button
                type="button"
                disabled={isListening}
                onClick={() => setCaptureSource('tab')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  captureSource === 'tab'
                    ? 'bg-neutral-800 text-cyan-300 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>เสียงจากแท็บ Chrome</span>
              </button>

              <button
                type="button"
                disabled={isListening}
                onClick={() => setCaptureSource('mic')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  captureSource === 'mic'
                    ? 'bg-neutral-800 text-amber-300 shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>ไมค์ / เสียงลำโพง</span>
              </button>
            </div>

            {/* Start / Stop button */}
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>เริ่มดักฟังและแปลสด</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-rose-400" />
                <span>หยุดการแปลเสียง</span>
              </button>
            )}
          </div>
        </div>

        {/* How to use notification box */}
        <div className="max-w-5xl mx-auto mt-4 p-3 rounded-xl bg-neutral-950/80 border border-cyan-500/20 text-xs flex items-start gap-3 text-neutral-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-cyan-300 font-semibold">วิธีใช้งานขณะดูอนิเมะบน Chrome:</strong>{' '}
            เมื่อกดปุ่ม <span className="text-rose-400 font-medium">"เริ่มดักฟังและแปลสด"</span>{' '}
            ระบบจะขึ้นหน้าต่างให้เลือกแท็บ ให้คลิกเลือกแท็บของเว็บอนิเมะ/Youtube ที่กำลังดูอยู่ และ{' '}
            <strong className="text-amber-300 underline underline-offset-2">
              อย่าลืมติ๊กเปิดสวิตช์ "แชร์เสียง (Share audio)" ที่มุมล่างซ้าย
            </strong>{' '}
            จากนั้น AI จะฟังเสียงตัวละครและแปลเป็นภาษาไทยสไตล์ซับไตเติลให้อัตโนมัติ!
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-5xl mx-auto mt-3 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left column: Live Cinema Subtitle Preview Card */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>จอซับไตเติลภาษาไทยเรียลไทม์ (Live Overlay)</span>
            </div>
            {isProcessingChunk && (
              <span className="text-[11px] text-amber-400 animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>AI กำลังถอดเสียง...</span>
              </span>
            )}
          </div>

          {/* Subtitle Cinema Screen Simulation */}
          <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-neutral-800 shadow-2xl flex flex-col justify-end p-6 overflow-hidden group">
            {/* Ambient anime backdrop glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.06),transparent_70%)]" />

            {/* Audio waveform pulsing indicator if listening */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isListening ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>กำลังรับเสียงอนิเมะ...</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-400 text-[11px]">
                  รอเริ่มการดักฟัง
                </div>
              )}
            </div>

            {/* Current Subtitle Box */}
            <div className="relative z-10 text-center flex flex-col items-center">
              {latestSubtitle ? (
                <div className="max-w-xl mx-auto space-y-2">
                  {/* Original text */}
                  <div className="text-neutral-400 text-xs font-sans tracking-wide drop-shadow">
                    {latestSubtitle.original_transcript}
                  </div>

                  {/* High contrast Thai Subtitle Box */}
                  <div className="inline-block px-5 py-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-neutral-700/80 text-white text-base md:text-xl font-medium tracking-wide shadow-2xl leading-relaxed text-balance">
                    {latestSubtitle.thai_translation}
                  </div>

                  {latestSubtitle.speaker_mood && (
                    <div className="text-[10px] text-amber-400/90 font-medium">
                      อารมณ์: {latestSubtitle.speaker_mood}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  ยังไม่มีบทสนทนาใหม่ เสียงพูดจะแสดงเป็นคำแปลที่นี่แบบอัตโนมัติ
                </div>
              )}
            </div>
          </div>

          {/* Quick Subtitle Controls */}
          <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800/80 rounded-xl px-4 py-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSpeakThai}
                onChange={(e) => setAutoSpeakThai(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
              />
              <span>อ่านออกเสียงภาษาไทยอัตโนมัติ (Thai TTS Voiceover)</span>
            </label>

            {latestSubtitle && (
              <button
                type="button"
                onClick={() => speakText(latestSubtitle.thai_translation, 'th-TH')}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>ฟังเสียงวรรคปัจจุบัน</span>
              </button>
            )}
          </div>
        </div>

        {/* Right column: Subtitle Transcript Timeline */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3.5 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <div className="font-semibold text-xs text-neutral-200">
              ประวัติบทสนทนาที่แปล ({subtitles.length})
            </div>
            <button
              type="button"
              onClick={() => setSubtitles([])}
              className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors"
            >
              ล้างประวัติ
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[380px] md:max-h-[500px]">
            {subtitles.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                ยังไม่มีประวัติบทสนทนา
              </div>
            ) : (
              subtitles.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                    <span className="font-mono">{sub.timeStr}</span>
                    <span className="text-amber-400 font-medium">{sub.detected_language}</span>
                  </div>

                  <div className="text-neutral-400 text-xs mb-1 font-sans">
                    {sub.original_transcript}
                  </div>

                  <div className="text-neutral-100 font-medium leading-relaxed mb-2 text-[13px]">
                    {sub.thai_translation}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/60 text-[11px]">
                    <span className="text-neutral-500 text-[10px]">
                      {sub.speaker_mood ? `โทนเสียง: ${sub.speaker_mood}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(sub.thai_translation, 'th-TH')}
                        className="text-neutral-400 hover:text-cyan-300"
                        title="ฟังเสียง"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(sub.id, sub.thai_translation)}
                        className="text-neutral-400 hover:text-white"
                        title="คัดลอก"
                      >
                        {copiedId === sub.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomScrollRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
