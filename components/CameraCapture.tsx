import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, ArrowRight, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (images: { front: string; back: string }) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  // State for two-step capture
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions or use file upload.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        if (step === 'front') {
          setFrontImage(imageData);
          setStep('back');
          // Optional visual flash or pause could go here
        } else {
          // Both captured
          if (frontImage) {
            stopCamera();
            onCapture({ front: frontImage, back: imageData });
          }
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        if (step === 'front') {
          setFrontImage(result);
          setStep('back');
        } else {
          if (frontImage) {
            stopCamera();
            onCapture({ front: frontImage, back: result });
          }
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      <div className="absolute top-4 right-4 z-20">
        <button onClick={onCancel} className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-0 right-0 z-10 flex justify-center space-x-2">
         <div className={`h-1 w-12 rounded-full transition-colors ${step === 'front' ? 'bg-blue-500' : 'bg-green-500'}`} />
         <div className={`h-1 w-12 rounded-full transition-colors ${step === 'back' ? 'bg-blue-500' : 'bg-gray-600'}`} />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => startCamera()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Camera</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
          <canvas ref={canvasRef} className="hidden" />
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Guide */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
             <div className={`w-64 h-64 border-4 rounded-full border-dashed transition-colors duration-300 ${step === 'front' ? 'border-white/70' : 'border-blue-400/80'}`} />
             <div className="mt-8 bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                <p className="font-bold text-lg">
                  {step === 'front' ? '1. Capture FRONT' : '2. Capture BACK'}
                </p>
             </div>
          </div>
        </div>
      )}

      <div className="h-28 bg-black flex items-center justify-around px-8 pb-6 pt-4">
        <label className="flex flex-col items-center cursor-pointer text-gray-400 hover:text-white transition-colors">
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs">Upload</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </label>

        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
        >
          {step === 'front' ? (
             <div className="w-16 h-16 rounded-full border-2 border-black" />
          ) : (
             <div className="w-16 h-16 rounded-full bg-blue-600 border-2 border-black flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
             </div>
          )}
        </button>

        <div className="w-8" /> 
      </div>
    </div>
  );
};

export default CameraCapture;
