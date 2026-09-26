import React, { useRef, useState, useEffect } from 'react';
import { Monitor, X, Play, Square, Camera, Clock } from 'lucide-react';

interface ScreenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureFrame: (dataUrl: string) => void;
}

export const ScreenCaptureModal: React.FC<ScreenCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureFrame,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start display capture
  const startScreenShare = async () => {
    try {
      setErrorMsg(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (err: any) {
      console.error('Error starting screen share:', err);
      setErrorMsg(err?.message || 'ไม่สามารถเปิดการแชร์หน้าจอได้ หรือผู้ใช้ยกเลิก');
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsAutoCapture(false);
  };

  useEffect(() => {
    if (isOpen && !stream) {
      startScreenShare();
    }
    return () => {
      stopScreenShare();
    };
  }, [isOpen]);

  // Capture current frame from video to canvas
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onCaptureFrame(dataUrl);
        onClose();
      }
    } catch (err: any) {
      console.error('Error taking snapshot:', err);
    }
  };

  // Auto interval capture
  useEffect(() => {
    if (!isAutoCapture || !stream) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCaptureFrame(canvas.toDataURL('image/png'));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoCapture, stream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">แชร์หน้าจอ / หน้าต่างเกม / แท็บเบราว์เซอร์สด</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScreenShare();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="p-4 bg-neutral-950 flex flex-col items-center justify-center min-h-[340px]">
          {errorMsg ? (
            <div className="text-center p-6 max-w-md">
              <p className="text-rose-400 text-xs mb-3">{errorMsg}</p>
              <button
                type="button"
                onClick={startScreenShare}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg"
              >
                ลองแชร์ใหม่อีกครั้ง
              </button>
            </div>
          ) : stream ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-neutral-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>กำลังแชร์หน้าจอสด</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-neutral-400 text-xs">
              กำลังเตรียมพร้อมระบบจับภาพหน้าจอ...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            เลือกหน้าต่างเกม มังงะ หรือโปรแกรมที่ต้องการแปล
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!stream}
              onClick={() => setIsAutoCapture(!isAutoCapture)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isAutoCapture
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAutoCapture ? 'หยุดแปลอัตโนมัติ' : 'แปลซ้ำอัตโนมัติ (4 วิ)'}</span>
            </button>

            <button
              type="button"
              disabled={!stream}
              onClick={takeSnapshot}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>จับภาพและเริ่มแปล</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
