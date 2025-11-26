'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Camera, CameraOff, QrCode } from 'lucide-react';

// Dynamically import the QR code scanner to avoid SSR issues
const QRCodeScanner = dynamic(
  () => import('react-qr-barcode-scanner'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">Loading scanner...</div>
  }
);

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
  onToggle?: () => void;
}

const StudentQRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  onError,
  isActive = false,
  onToggle
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');

  const handleScan = useCallback((result: any) => {
    console.log('QR Scanner - Raw result:', result);
    console.log('QR Scanner - Result type:', typeof result);
    console.log('QR Scanner - Result keys:', result ? Object.keys(result) : 'null');
    
    if (result) {
      // In newer versions of react-qr-barcode-scanner, result is directly the scanned text
      const scannedText = typeof result === 'string' ? result : (result.text || result.getText?.() || '');
      console.log('QR Scanner - Extracted text:', scannedText);
      
      // Prevent duplicate scans
      if (scannedText && scannedText !== lastScanned) {
        console.log('QR Scanner - New scan detected:', scannedText);
        setLastScanned(scannedText);
        onScan(scannedText);
        
        // Auto-stop scanning after successful scan
        setTimeout(() => {
          setIsScanning(false);
          if (onToggle) onToggle();
        }, 1000);
      } else {
        console.log('QR Scanner - Duplicate or empty scan ignored');
      }
    } else {
      console.log('QR Scanner - No result received');
    }
  }, [lastScanned, onScan, onToggle]);

  const handleError = useCallback((error: any) => {
    console.error('QR code scanner error:', error);
    console.error('QR code scanner error type:', typeof error);
    console.error('QR code scanner error message:', error?.message || 'Unknown error');
    if (onError) {
      onError('Error accessing camera or scanning QR code');
    }
  }, [onError]);

  const toggleScanner = () => {
    setIsScanning(!isScanning);
    if (onToggle) onToggle();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Scanner
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex justify-center">
          <button
            onClick={toggleScanner}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isScanning 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="h-4 w-4" />
                Stop Scanner
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start Scanner
              </>
            )}
          </button>
        </div>

        {isScanning && (
          <div className="relative">
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <QRCodeScanner
                width="100%"
                height={300}
                onUpdate={handleScan}
                onError={handleError}
                facingMode="environment" // Use back camera
                delay={300} // Scan every 300ms
              />
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-32 border-2 border-red-500 rounded-lg opacity-50"></div>
              </div>
            </div>
          </div>
        )}

        {lastScanned && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Last Scanned:</strong> {lastScanned}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>Position the QR code within the red frame</p>
          <p>Supports QR codes and various barcode formats</p>
        </div>
      </div>
    </div>
  );
};

export default StudentQRCodeScanner;