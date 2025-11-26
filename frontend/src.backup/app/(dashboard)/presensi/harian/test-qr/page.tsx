'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download } from 'lucide-react';

export default function TestQRPage() {
  // Data barcode Ahmad Muzaki
  const studentData = {
    nis: "4407-2425001",
    nama_lengkap: "Ahmad Muzaki",
    barcode: "BC4407-2425001_1759197191"
  };

  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-${studentData.nis}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test QR Code Generator</h1>
          <p className="text-gray-600">Generate QR code untuk testing scanner presensi</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Data Siswa</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">NIS</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{studentData.nis}</span>
                  <button
                    onClick={() => copyToClipboard(studentData.nis)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <span className="text-gray-900">{studentData.nama_lengkap}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-mono text-sm">{studentData.barcode}</span>
                  <button
                    onClick={() => copyToClipboard(studentData.barcode)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {copiedText && (
                <div className="text-sm text-green-600">
                  Copied: {copiedText}
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button
                onClick={downloadQR}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <div className="flex justify-center">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={studentData.barcode}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Scan QR code ini dengan scanner presensi
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Format: {studentData.barcode}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Cara Testing</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Download QR code di atas atau screenshot halaman ini</li>
            <li>Buka halaman <a href="/presensi/harian/scan" className="underline font-medium">Scan Presensi</a></li>
            <li>Klik tombol "QR Code Scanner" untuk mengaktifkan kamera</li>
            <li>Arahkan kamera ke QR code yang sudah di-download/screenshot</li>
            <li>Scanner akan otomatis mendeteksi dan memproses barcode</li>
            <li>Sistem akan menampilkan data siswa dan form konfirmasi presensi</li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Troubleshooting</h3>
          <div className="space-y-2 text-yellow-800">
            <p><strong>Scanner tidak muncul:</strong> Pastikan browser memiliki akses kamera</p>
            <p><strong>QR code tidak terbaca:</strong> Pastikan pencahayaan cukup dan QR code tidak blur</p>
            <p><strong>Error "Camera access denied":</strong> Izinkan akses kamera di browser settings</p>
            <p><strong>HTTPS required:</strong> Scanner hanya bekerja di HTTPS atau localhost</p>
          </div>
        </div>
      </div>
    </div>
  );
}