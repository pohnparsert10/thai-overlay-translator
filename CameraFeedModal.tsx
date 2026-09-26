import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureFrame: (dataUrl: string) => void;
}

export const CameraFeedModal: React.FC<CameraFeedModalProps> = ({
  isOpen,
  onClose,
  onCaptureFrame,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setErrorMsg(err?.message || 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์การเข้าถึงกล้อง');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      onCaptureFrame(dataUrl);
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-white">กล้องถ่ายทอดสด (Camera OCR Translation)</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video stream */}
        <div className="p-4 bg-neutral-950 flex flex-col items-center justify-center min-h-[300px]">
          {errorMsg ? (
            <div className="text-center p-6 text-xs text-rose-400">{errorMsg}</div>
          ) : stream ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-neutral-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-xs text-neutral-400">กำลังเชื่อมต่อกล้อง...</div>
          )}
        </div>

        {/* Action button */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            หันกล้องไปยังหน้าจอเครื่องเกม มังงะ หรือเอกสารภาษาต่างประเทศ
          </span>
          <button
            type="button"
            disabled={!stream}
            onClick={snapPhoto}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>ถ่ายภาพเพื่อแปล</span>
          </button>
        </div>
      </div>
    </div>
  );
};
