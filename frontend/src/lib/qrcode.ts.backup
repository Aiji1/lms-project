// QR Code API Helper Functions
// Add these to your existing api helper or create new file

import { api } from './api';

export interface QRCodeInfo {
  nis: string;
  nama_lengkap: string;
  kelas: string;
  jurusan: string;
  qr_code_exists: boolean;
  qr_code_path: string | null;
  qr_code_url: string | null;
  regenerated?: boolean;
}

export interface QRCodeGenerateResponse {
  success: boolean;
  message: string;
  data?: QRCodeInfo;
}

export interface QRCodeBulkResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    details: Array<{
      nis: string;
      nama: string;
      status: 'success' | 'failed';
      message: string;
    }>;
  };
}

// Generate QR Code untuk satu siswa
export async function generateQRCode(nis: string, regenerate: boolean = false): Promise<QRCodeGenerateResponse> {
  const response = await api.get(`/qrcode/generate/${nis}`, {
    params: { regenerate }
  });
  return response.data;
}

// Generate QR Code untuk semua siswa
export async function generateAllQRCodes(regenerate: boolean = false): Promise<QRCodeBulkResponse> {
  const response = await api.post('/qrcode/generate-all', { regenerate });
  return response.data;
}

// Get QR Code info
export async function getQRCodeInfo(nis: string): Promise<QRCodeGenerateResponse> {
  const response = await api.get(`/qrcode/info/${nis}`);
  return response.data;
}

// Delete QR Code
export async function deleteQRCode(nis: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/qrcode/${nis}`);
  return response.data;
}

// Get QR Code download URL
export function getQRCodeDownloadUrl(nis: string): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return `${API_URL}/qrcode/download/${nis}`;
}

// Get QR Code display URL (from storage)
export function getQRCodeDisplayUrl(qrCodeUrl: string | null): string | null {
  if (!qrCodeUrl) return null;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${API_BASE}${qrCodeUrl}`;
}