import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null); // IScannerControls
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Initialize hints for multi-format support
        const hints = new Map();
        const formats = [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints, 500); // 500ms delay between scans
        codeReaderRef.current = codeReader;

        // Get available video devices
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
            throw new Error("No camera devices found");
        }

        // Prefer back camera ('environment')
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment'))
          ?.deviceId || videoInputDevices[0].deviceId;

        if (!mounted || !videoRef.current) return;

        const controls = await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result && mounted) {
              const text = result.getText();
              if (text) {
                 // Audio feedback for successful scan
                 const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                 audio.volume = 0.5;
                 audio.play().catch(() => {});
                 
                 onScan(text);
              }
            }
          }
        );

        if (mounted) {
           controlsRef.current = controls;
           setLoading(false);
        } else {
           controls.stop();
        }

      } catch (err: any) {
        console.error("Scanner init failed", err);
        if (mounted) {
           setError(err.message || "Failed to start camera");
           setLoading(false);
        }
      }
    };

    // Delay start slightly to prevent UI thrashing and allow DOM to settle
    const timer = setTimeout(startScanner, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      codeReaderRef.current = null;
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md relative bg-black h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
           <h3 className="text-white font-bold text-lg flex items-center gap-2">
             <Camera className="w-5 h-5 text-green-400" />
             {t('scanBarcode')}
           </h3>
           <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
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
           />
           
           {/* Loading State */}
           {loading && !error && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
             </div>
           )}

           {/* Visual Guide Overlay (Only if not error and not loading) */}
           {!loading && !error && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] aspect-square border-2 border-green-500/50 rounded-lg relative shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-0.5 -mr-0.5 rounded-br-sm"></div>
                   
                   <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                </div>
                <div className="absolute bottom-24 text-white/90 text-sm font-medium bg-black/60 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
                   Align code within frame
                </div>
             </div>
           )}

           {error && (
             <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white p-6 text-center z-20">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-bold mb-2">Scanner Error</p>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">{error}</p>
                <button 
                  onClick={onClose}
                  className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                  Close Scanner
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};