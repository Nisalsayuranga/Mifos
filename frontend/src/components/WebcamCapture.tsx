import React, { useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, X, Check } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(image);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="flex flex-col items-center bg-slate-900/95 p-4 rounded-xl shadow-2xl relative w-full max-w-lg mx-auto">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 text-white hover:bg-slate-800 rounded-full"
        onClick={handleClose}
      >
        <X className="w-5 h-5" />
      </Button>

      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative mt-6 flex items-center justify-center">
        {error ? (
          <div className="text-red-400 text-sm font-semibold p-4 text-center">{error}</div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-4 flex gap-3 w-full justify-center">
        {capturedImage ? (
          <>
            <Button onClick={handleRetake} variant="secondary" className="flex-1 font-bold">
              Retake
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2">
              <Check className="w-4 h-4" /> Confirm
            </Button>
          </>
        ) : (
          <Button onClick={capturePhoto} disabled={!!error} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 gap-2 text-lg">
            <Camera className="w-5 h-5" /> Capture Photo
          </Button>
        )}
      </div>
    </div>
  );
}
