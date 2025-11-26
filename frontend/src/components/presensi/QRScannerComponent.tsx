'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerComponentProps {
  onScanSuccess: (nis: string) => void;
  onScanError?: (error: string) => void;
  isScanning?: boolean;
}

export default function QRScannerComponent({ 
  onScanSuccess, 
  onScanError,
  isScanning = true 
}: QRScannerComponentProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerState, setScannerState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastScan, setLastScan] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // ✅ Single ref for scanner instance
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Cleanup function
  const cleanup = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current;
        
        // Try to get state, if fails, skip
        try {
          const state = await scanner.getState();
          if (state === 2) { // SCANNING state
            await scanner.stop();
          }
        } catch (stateErr) {
          // If can't get state, try to stop anyway
          try {
            await scanner.stop();
          } catch (stopErr) {
            // Ignore stop errors
          }
        }
        
        // Try to clear, ignore errors
        try {
          await scanner.clear();
        } catch (clearErr) {
          // Ignore clear errors
        }
        
      } catch (err) {
        // Ignore all cleanup errors
      } finally {
        scannerRef.current = null;
      }
    }
  };

  // Get available cameras ONCE
  useEffect(() => {
    isMountedRef.current = true;

    Html5Qrcode.getCameras().then(devices => {
      if (!isMountedRef.current) return;
      
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer back camera
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
        setSelectedCamera(backCamera?.id || devices[0].id);
      }
    }).catch(err => {
      if (!isMountedRef.current) return;
      console.error('Error getting cameras:', err);
      setErrorMessage('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    });

    // ✅ Main cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // Start/Stop scanner based on camera selection and isScanning prop
  useEffect(() => {
    if (!selectedCamera || !isScanning || !isMountedRef.current) {
      return;
    }

    let isActive = true;

    const startScanner = async () => {
      try {
        // ✅ Cleanup any existing scanner first
        await cleanup();

        if (!isActive || !isMountedRef.current) return;

        const qrScanner = new Html5Qrcode('qr-reader');
        scannerRef.current = qrScanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await qrScanner.start(
          selectedCamera,
          config,
          (decodedText) => {
            if (!isMountedRef.current) return;

            // Prevent duplicate scans
            if (decodedText === lastScan) return;
            
            setLastScan(decodedText);
            setScannerState('success');
            
            // Play success sound
            playSound('success');
            
            // Extract NIS from QR code
            const nis = extractNIS(decodedText);
            
            if (nis) {
              onScanSuccess(nis);
              
              // Reset after 2 seconds
              timeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                  setScannerState('scanning');
                  setLastScan('');
                }
              }, 2000);
            } else {
              setScannerState('error');
              setErrorMessage('QR Code tidak valid');
              playSound('error');
              
              timeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                  setScannerState('scanning');
                }
              }, 2000);
            }
          },
          (errorMessage) => {
            // Scanning error (ignore - too noisy)
            if (isMountedRef.current && scannerState !== 'scanning') {
              setScannerState('scanning');
            }
          }
        );

        if (isMountedRef.current) {
          setScannerState('scanning');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        console.error('Error starting scanner:', err);
        setScannerState('error');
        setErrorMessage(`Error: ${err}`);
        onScanError?.(String(err));
      }
    };

    startScanner();

    // ✅ Cleanup when dependencies change
    return () => {
      isActive = false;
      cleanup();
    };
  }, [selectedCamera, isScanning]);

  const extractNIS = (qrData: string): string | null => {
    // Try to extract NIS from QR code
    // Assuming QR code might contain just NIS or in format like "NIS:xxxx"
    
    // If it's just the NIS
    if (/^\d{4}-\d{7}$/.test(qrData)) {
      return qrData;
    }
    
    // If it contains NIS: prefix
    const match = qrData.match(/NIS[:\s]*([\d-]+)/i);
    if (match) {
      return match[1];
    }
    
    // If it's a URL with NIS parameter
    const urlMatch = qrData.match(/nis=([\d-]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Otherwise, assume the whole string is NIS
    return qrData;
  };

  const playSound = (type: 'success' | 'error') => {
    // ✅ Disabled audio to prevent interruption errors
    // Sound playback can cause issues during navigation
    return;
  };

  return (
    <div className="relative">
      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Kamera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div id="qr-reader" className="w-full" />
        
        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
          
          {/* Status Badge */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            {scannerState === 'scanning' && (
              <div className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Scanning...</span>
              </div>
            )}
            {scannerState === 'success' && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Berhasil!</span>
              </div>
            )}
            {scannerState === 'error' && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Cara Scan:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Arahkan QR Code ke dalam frame</li>
          <li>• Pastikan pencahayaan cukup</li>
          <li>• Jaga jarak ±20cm dari kamera</li>
          <li>• QR Code akan otomatis terdeteksi</li>
        </ul>
      </div>
    </div>
  );
}