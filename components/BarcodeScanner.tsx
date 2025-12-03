import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, Smartphone, Zap, ZapOff, Scan, AlertTriangle, Camera, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { playSuccessSound, playErrorSound } from '../utils/sound';
import { analyzeImageWithGemini } from '../services/scannerService';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const { t } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [supportsNativeScan, setSupportsNativeScan] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 }, // High resolution for better barcode clarity
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });
      
      setStream(newStream);
      setPermissionError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      // @ts-ignore
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      // @ts-ignore
      setHasTorch(!!capabilities.torch);

    } catch (err) {
      console.error("Camera access error:", err);
      setPermissionError("Camera access denied. Please allow camera permissions to scan.");
    }
  }, [facingMode]);

  // Check for native BarcodeDetector support
  useEffect(() => {
    const checkSupport = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats && formats.length > 0) {
            setSupportsNativeScan(true);
            console.log("Native barcode detection supported:", formats);
          }
        } catch (e) {
          console.warn("BarcodeDetector present but failed to get formats", e);
        }
      }
    };
    checkSupport();
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Fast Detection Loop
  useEffect(() => {
    if (!supportsNativeScan || !videoRef.current || isProcessing) return;

    // Initialize with ALL common formats for POS/Inventory
    const barcodeDetector = new window.BarcodeDetector({
          formats: [
            'qr_code',
        'aztec', 
            'code_128',
            'code_39',
            'code_93',
            'codabar',
        'data_matrix', 
            'ean_13',
            'ean_8',
            'itf',
        'pdf417', 
            'upc_a',
        'upc_e'
      ]
    });

    // Fix: Use 'any' type for intervalId as NodeJS namespace might not be available in browser environment
    let intervalId: any;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || isProcessing) return;

      try {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length > 0) {
          const code = barcodes[0];
          const rawValue = code.rawValue;

          // Simple debounce to prevent rapid-fire triggers on the same code
          if (rawValue && rawValue !== lastScannedData) {
            setLastScannedData(rawValue);
            playSuccessSound();
            onScan(rawValue);
            // Clear debounce after 3 seconds
            setTimeout(() => setLastScannedData(null), 3000);
          }
        }
      } catch (e) {
        // Silently fail frame detection
      }
    };

    // Run rapid detection (every 100ms)
    intervalId = setInterval(detect, 100);

    return () => clearInterval(intervalId);
  }, [supportsNativeScan, isProcessing, lastScannedData, onScan]);


  // Torch Toggle
  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        // @ts-ignore
        advanced: [{ torch: !torchEnabled }]
      });
      setTorchEnabled(!torchEnabled);
    } catch (e) {
      console.error("Torch toggle failed", e);
    }
  };

  // Switch Camera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100); 
  };

  // Manual Capture Image (fallback for non-native browsers or difficult codes)
  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        setIsProcessing(true);
        
        const MAX_SIZE = 800;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Manual capture uses Gemini AI as fallback (for difficult codes or when native fails)
        try {
          const result = await analyzeImageWithGemini(imageData);
          
          if (result.found && result.data) {
            if (result.data !== lastScannedData) {
              setLastScannedData(result.data);
              playSuccessSound();
              onScan(result.data);
              setTimeout(() => setLastScannedData(null), 3000);
            } else {
              playErrorSound();
              alert(t('barcodeNotFound') || 'Barcode not found. Please try again.');
            }
          } else {
            playErrorSound();
            alert(result.summary || t('barcodeNotFound') || 'Barcode not found. Please try again.');
          }
        } catch (error) {
          console.error("Gemini scanning failed:", error);
          playErrorSound();
          alert(t('scanError') || 'Scan failed. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md relative bg-black h-full flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-green-400" />
                {t('scanBarcode') || 'Scan Barcode'}
              </h3>
              {/* Warning if native scan not supported - positioned below header text */}
              {!supportsNativeScan && !permissionError && (
                <div className="flex items-center gap-2">
                  <div className="bg-amber-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/50 flex items-center gap-2 shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] text-amber-200 font-semibold">Auto-scan unavailable. Use button.</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              aria-label="Close scanner"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Permission Error Overlay */}
        {permissionError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 p-6 text-center">
            <div className="max-w-md">
              <Smartphone className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
              <p className="text-slate-400">{permissionError}</p>
              <button 
                onClick={startCamera}
                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Video Viewfinder */}
        <div className="relative flex-1 bg-black group cursor-pointer" onDoubleClick={handleCapture}>
          <video 
            ref={videoRef} 
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay Guides */}
          {!permissionError && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Main Scan Frame */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 border-2 rounded-lg transition-all duration-300 ${supportsNativeScan ? 'border-green-500/50 shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]' : 'border-blue-500/50'}`}>
                <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-sm -mt-0.5 -ml-0.5 ${supportsNativeScan ? 'border-green-400' : 'border-blue-400'}`}></div>
                <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-sm -mt-0.5 -mr-0.5 ${supportsNativeScan ? 'border-green-400' : 'border-blue-400'}`}></div>
                <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-sm -mb-0.5 -ml-0.5 ${supportsNativeScan ? 'border-green-400' : 'border-blue-400'}`}></div>
                <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-sm -mb-0.5 -mr-0.5 ${supportsNativeScan ? 'border-green-400' : 'border-blue-400'}`}></div>
                
                {/* Scanning Line Animation */}
                {!isProcessing && (
                  <div className={`absolute top-0 left-0 w-full h-0.5 shadow-[0_0_20px_rgba(74,222,128,0.8)] animate-[scan_1.5s_infinite_linear] ${supportsNativeScan ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                )}

                {/* Red center line helper for 1D barcodes */}
                <div className="absolute top-1/2 left-4 right-4 h-px bg-red-500/40"></div>
              </div>
              
              <div className="absolute bottom-8 w-full text-center px-4">
                 {supportsNativeScan ? (
                    <div className="inline-flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                       <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/50 shadow-lg shadow-green-900/20">
                           <Scan className="w-5 h-5 text-green-400 animate-pulse" />
                           <span className="text-green-300 text-sm font-bold tracking-wide">AUTO-SCAN READY</span>
                       </div>
                       <span className="text-white/60 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">Point at any barcode</span>
                </div>
                 ) : (
                    <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                        <span className="text-white/80 text-sm font-medium">Align code and tap Deep Scan</span>
                </div>
                 )}
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
                <div className="w-16 h-16 rounded-full border-4 border-blue-900/30"></div>
              </div>
              <p className="mt-6 text-blue-400 font-bold tracking-widest animate-pulse">PROCESSING</p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-950 p-6 pb-8 flex items-center justify-between border-t border-slate-900">
          
          {/* Torch Button */}
          <button
            onClick={toggleTorch}
            disabled={!hasTorch}
            className={`p-4 rounded-full transition-all duration-200 active:scale-95 ${
              !hasTorch ? 'opacity-20 cursor-not-allowed text-slate-500' :
              torchEnabled ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {torchEnabled ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>

          {/* Capture Button (Dynamic) */}
          <div className="flex flex-col items-center gap-2 -mt-10 relative z-10">
                <button 
              onClick={handleCapture}
              disabled={isProcessing}
              className={`relative group transition-all duration-300 ${supportsNativeScan ? 'scale-90 opacity-90 hover:opacity-100 hover:scale-100' : 'scale-100'}`}
              title="Manual Photo Capture"
              >
              <div className={`absolute inset-0 bg-gradient-to-br ${supportsNativeScan ? 'from-slate-600 to-slate-800' : 'from-blue-600 to-indigo-600'} rounded-full blur opacity-40 group-hover:opacity-80 transition-opacity duration-500`}></div>
              <div className={`relative ${supportsNativeScan ? 'w-16 h-16' : 'w-20 h-20'} bg-white rounded-full border-4 border-slate-950 flex items-center justify-center shadow-2xl transform group-active:scale-95 transition-transform`}>
                  <div className={`w-full h-full m-1 rounded-full flex items-center justify-center ${supportsNativeScan ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                      <Camera className={`${supportsNativeScan ? 'w-6 h-6 text-slate-400' : 'w-8 h-8 text-white'}`} />
                  </div>
              </div>
                </button>
              <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${supportsNativeScan ? 'text-slate-600 bg-slate-900/50' : 'text-blue-400 bg-blue-900/20'}`}>
                  {supportsNativeScan ? 'MANUAL FALLBACK' : 'DEEP SCAN'}
              </span>
          </div>

          {/* Switch Camera Button */}
                <button 
            onClick={switchCamera}
            className="p-4 rounded-full bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-95"
                >
            <RefreshCw className="w-6 h-6" />
                </button>
        </div>


        {/* Hidden Canvas for Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Custom Scan Animation Style */}
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};
