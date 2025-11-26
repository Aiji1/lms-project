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

export async function generateQRCode(nis: string, regenerate: boolean = false): Promise<QRCodeGenerateResponse> {
  const response = await api.get(`/qrcode/generate/${nis}`, {
    params: { regenerate }
  });
  return response.data;
}

export async function generateAllQRCodes(regenerate: boolean = false): Promise<QRCodeBulkResponse> {
  const response = await api.post('/qrcode/generate-all', { regenerate });
  return response.data;
}

export async function getQRCodeInfo(nis: string): Promise<QRCodeGenerateResponse> {
  const response = await api.get(`/qrcode/info/${nis}`);
  return response.data;
}

export async function deleteQRCode(nis: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/qrcode/${nis}`);
  return response.data;
}

export async function downloadQRCode(nis: string): Promise<void> {
  try {
    const response = await api.get(`/qrcode/download/${nis}`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'image/svg+xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-${nis}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

export function getQRCodeDownloadUrl(nis: string): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return `${API_URL}/qrcode/download/${nis}`;
}

export function getQRCodeDisplayUrl(qrCodeUrl: string | null): string | null {
  if (!qrCodeUrl) return null;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${API_BASE}${qrCodeUrl}`;
}
