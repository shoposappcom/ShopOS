import React, { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { useStore } from '../context/StoreContext';
import { X, Camera, AlertTriangle, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const { t } = useStore();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        console.log('🔍 Starting barcode scanner...');
        setLoading(true);
        setError('');

        // Check if BarcodeDetector is supported
        console.log('📋 Checking supported formats...');
        const formats = await BarcodeDetector.getSupportedFormats();
        console.log('✅ Supported formats:', formats);
        
        if (!formats || formats.length === 0) {
          throw new Error('Barcode detection not supported in this browser');
        }

        // Initialize BarcodeDetector with multiple formats
        console.log('🔧 Initializing BarcodeDetector...');
        barcodeDetectorRef.current = new BarcodeDetector({
          formats: [
            'qr_code',
            'code_128',
            'code_39',
            'code_93',
            'codabar',
            'ean_13',
            'ean_8',
            'itf',
            'upc_a',
            'upc_e',
            'data_matrix',
            'pdf417',
            'aztec'
          ]
        });
        console.log('✅ BarcodeDetector initialized');

        // Request camera access with HIGH resolution for barcode detection
        console.log('📷 Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // Prefer back camera
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            aspectRatio: { ideal: 16 / 9 },
            // High-quality settings for barcode detection
            focusMode: { ideal: 'continuous' },
            frameRate: { ideal: 30 }
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video timeout')), 10000);
            
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = async () => {
                clearTimeout(timeout);
                try {
                  await videoRef.current?.play();
                  console.log('✅ Video is playing');
                  // Give video a moment to have actual frames
                  setTimeout(resolve, 500);
                } catch (err) {
                  console.error('❌ Video play error:', err);
                  reject(err);
                }
              };
            }
          });

          if (mounted) {
            console.log('✅ Camera ready, starting detection...');
            setLoading(false);
            setScanning(true);
            startDetection();
          }
        }

      } catch (err: any) {
        console.error("❌ Scanner init failed:", err);
        if (mounted) {
          let errorMessage = "Failed to start camera";
          
          if (err.name === 'NotAllowedError') {
            errorMessage = "Camera access denied. Please allow camera permissions.";
          } else if (err.name === 'NotFoundError') {
            errorMessage = "No camera found on this device.";
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    const startDetection = () => {
      console.log('🎯 Detection loop started');
      let frameCount = 0;
      let consecutiveFailures = 0;
      
      const detect = async () => {
        if (!mounted || !videoRef.current || !barcodeDetectorRef.current) {
          console.log('⚠️ Detection stopped - component unmounted or refs missing');
          return;
        }

        try {
          frameCount++;
          if (frameCount % 30 === 0) {
            console.log(`🔍 Scanning frame ${frameCount}... (Video size: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight})`);
          }
          
          // Ensure video has dimensions (is actually playing)
          if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
            if (frameCount % 30 === 0) {
              console.log('⚠️ Waiting for video to have dimensions...');
            }
            animationFrameRef.current = requestAnimationFrame(detect);
            return;
          }
          
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
          
          if (barcodes && barcodes.length > 0) {
            const barcode = barcodes[0];
            const currentTime = Date.now();
            
            console.log('🎉 Barcode detected:', barcode.rawValue, 'Format:', barcode.format);
            
            // Prevent duplicate scans within 2 seconds
            if (barcode.rawValue && 
                (barcode.rawValue !== lastScannedRef.current || 
                 currentTime - lastScannedTimeRef.current > 2000)) {
              
              console.log('✅ New barcode confirmed:', barcode.rawValue);
              lastScannedRef.current = barcode.rawValue;
              lastScannedTimeRef.current = currentTime;
              
              // Audio feedback for successful scan
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
              
              // Call the onScan callback
              onScan(barcode.rawValue);
            }
          }
        } catch (err) {
          // Silently handle detection errors (e.g., bad frame)
          if (frameCount % 60 === 0) {
            console.debug('Detection error at frame', frameCount, ':', err);
          }
        }

        // Continue scanning
        if (mounted) {
          animationFrameRef.current = requestAnimationFrame(detect);
        }
      };

      detect();
    };

    // Delay start slightly to prevent UI thrashing and allow DOM to settle
    const timer = setTimeout(startScanner, 500);

    return () => {
      mounted = false;
      setScanning(false);
      clearTimeout(timer);
      
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      barcodeDetectorRef.current = null;
    };
  }, [onScan]);

  const handleRetry = () => {
    setError('');
    setLoading(true);
    // Force remount by changing key or just reload
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md relative bg-black h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-400" />
            {t('scanBarcode')}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            muted 
            playsInline
            autoPlay
          />
          
          {/* Loading State */}
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50">
              <RefreshCw className="w-10 h-10 text-white animate-spin mb-4" />
              <p className="text-white text-sm">Initializing camera...</p>
            </div>
          )}

          {/* Visual Guide Overlay (Only if not error and not loading) */}
          {!loading && !error && scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Wider frame for linear barcodes */}
              <div className="w-[85%] aspect-[16/9] border-2 border-green-500/50 rounded-lg relative shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-0.5 -mr-0.5 rounded-br-sm"></div>
                
                {/* Horizontal scanning line for barcodes */}
                <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              </div>
              <div className="absolute bottom-24 text-center">
                <div className="text-white/90 text-sm font-medium bg-black/60 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10 mb-2">
                  Align barcode with red line
                </div>
                <div className="text-white/70 text-xs bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  💡 Hold steady • Good lighting • Fill frame
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white p-6 text-center z-20">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-lg font-bold mb-2">Scanner Error</p>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">{error}</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleRetry}
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition-colors"
                >
                  Retry
                </button>
                <button 
                  onClick={onClose}
                  className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
