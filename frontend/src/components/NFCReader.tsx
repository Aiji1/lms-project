'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Wifi, WifiOff, Scan, AlertCircle, CheckCircle } from 'lucide-react';

interface NFCReaderProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
  onToggle?: () => void;
}

const StudentNFCReader: React.FC<NFCReaderProps> = ({
  onScan,
  onError,
  isActive = false,
  onToggle
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [ndefReader, setNdefReader] = useState<any>(null);

  // Check NFC support on component mount
  useEffect(() => {
    const checkNFCSupport = () => {
      if ('NDEFReader' in window) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        if (onError) {
          onError('NFC tidak didukung di browser ini. Gunakan Chrome di Android dengan NFC aktif.');
        }
      }
    };

    checkNFCSupport();
  }, [onError]);

  const handleNFCRead = useCallback((event: any) => {
    const { message } = event;
    
    for (const record of message.records) {
      if (record.recordType === "text") {
        const textDecoder = new TextDecoder(record.encoding);
        const scannedText = textDecoder.decode(record.data);
        
        // Prevent duplicate scans
        if (scannedText !== lastScanned) {
          setLastScanned(scannedText);
          onScan(scannedText);
          
          // Auto-stop scanning after successful scan
          setTimeout(() => {
            stopScanning();
          }, 1000);
        }
      } else if (record.recordType === "url") {
        const url = new TextDecoder().decode(record.data);
        
        if (url !== lastScanned) {
          setLastScanned(url);
          onScan(url);
          
          setTimeout(() => {
            stopScanning();
          }, 1000);
        }
      }
    }
  }, [lastScanned, onScan]);

  const handleNFCError = useCallback((error: any) => {
    console.error('NFC Error:', error);
    setIsScanning(false);
    
    let errorMessage = 'Error membaca NFC tag';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Akses NFC ditolak. Pastikan NFC diaktifkan dan berikan izin.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'NFC tidak didukung di perangkat ini.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Tidak dapat membaca NFC tag. Coba lagi.';
    }
    
    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  const startScanning = useCallback(async () => {
    if (!isSupported) {
      if (onError) {
        onError('NFC tidak didukung di browser ini.');
      }
      return;
    }

    try {
      const reader = new (window as any).NDEFReader();
      setNdefReader(reader);
      
      await reader.scan();
      
      reader.addEventListener('reading', handleNFCRead);
      reader.addEventListener('readingerror', handleNFCError);
      
      setIsScanning(true);
      console.log('NFC scanning started');
      
    } catch (error) {
      handleNFCError(error);
    }
  }, [isSupported, onError, handleNFCRead, handleNFCError]);

  const stopScanning = useCallback(() => {
    if (ndefReader) {
      ndefReader.removeEventListener('reading', handleNFCRead);
      ndefReader.removeEventListener('readingerror', handleNFCError);
    }
    setIsScanning(false);
    setNdefReader(null);
    console.log('NFC scanning stopped');
  }, [ndefReader, handleNFCRead, handleNFCError]);

  const toggleScanner = useCallback(() => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
    
    if (onToggle) onToggle();
  }, [isScanning, stopScanning, startScanning, onToggle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="h-5 w-5" />
          NFC/RFID Reader
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Support Status */}
        <div className={`p-3 rounded-lg border ${
          isSupported 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {isSupported ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              isSupported ? 'text-green-800' : 'text-red-800'
            }`}>
              {isSupported ? 'NFC Didukung' : 'NFC Tidak Didukung'}
            </span>
          </div>
          {!isSupported && (
            <p className="text-xs text-red-600 mt-1">
              Gunakan Chrome di Android dengan NFC aktif
            </p>
          )}
        </div>

        {/* Scanner Controls */}
        <div className="flex justify-center">
          <button
            onClick={toggleScanner}
            disabled={!isSupported}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isScanning 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isScanning ? (
              <>
                <WifiOff className="h-4 w-4" />
                Stop NFC
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Start NFC
              </>
            )}
          </button>
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-blue-800 font-medium">
                Menunggu NFC tag...
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Dekatkan kartu NFC/RFID ke perangkat
            </p>
          </div>
        )}

        {/* Last Scanned Result */}
        {lastScanned && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Terakhir Dibaca:</strong> {lastScanned}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Pastikan NFC aktif di perangkat Android</p>
          <p>Dekatkan kartu RFID/NFC ke bagian belakang perangkat</p>
          <p>Mendukung format NDEF (Text, URL)</p>
        </div>
      </div>
    </div>
  );
};

export default StudentNFCReader;