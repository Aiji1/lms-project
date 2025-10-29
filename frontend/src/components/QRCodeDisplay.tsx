'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({ value, size = 200, className = '' }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      const canvas = canvasRef.current;
      
      // Set canvas size
      canvas.width = size;
      canvas.height = size;
      
      // Generate QR code
      QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }).catch((error) => {
        console.error('Error generating QR code:', error);
        
        // Fallback: draw error message
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR Code Error', size / 2, size / 2);
        }
      });
    }
  }, [value, size]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}