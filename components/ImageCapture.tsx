import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCaptureProps {
  onImageCaptured: (base64Image: string) => void;
  initialImage: string | null;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ onImageCaptured, initialImage }) => {
  const [image, setImage] = useState<string | null>(initialImage);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const startCamera = async () => {
    stopCamera();
    setIsCapturing(true);
    setImage(null);
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API is not supported by this browser.");
      setIsCapturing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let message = "Could not access camera. An unexpected error occurred.";
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera found. Please ensure a camera is connected and enabled.";
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera access denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          message = "Your camera is currently in use by another application.";
      }
      setError(message);
      setIsCapturing(false);
    }
  };
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        onImageCaptured(dataUrl);
      }
      stopCamera();
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        onImageCaptured(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
        {isCapturing && <video ref={videoRef} autoPlay className="w-full h-full object-cover"></video>}
        {!isCapturing && image && <img src={image} alt="Captured" className="w-full h-full object-contain" />}
        {!isCapturing && !image && <span className="text-slate-500">Image Preview</span>}
      </div>
       <canvas ref={canvasRef} className="hidden"></canvas>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex items-center gap-4">
        {!isCapturing ? (
          <>
            <button type="button" onClick={startCamera} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm">Use Camera</button>
            <label className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors cursor-pointer text-sm">
              Upload File
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </>
        ) : (
          <>
            <button type="button" onClick={captureImage} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">Capture Photo</button>
            <button type="button" onClick={() => { stopCamera(); setIsCapturing(false); }} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageCapture;