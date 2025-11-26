'use client';

import { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  endpoint: string;
  templateEndpoint: string;
}

export default function ImportModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Import Data",
  endpoint,
  templateEndpoint
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success_count: number;
    error_count: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResult(response.data.data);
        if (response.data.data.error_count === 0) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      }
    } catch (error: unknown) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan saat import'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      console.log('Starting template download...');
      
      const response = await api.get(templateEndpoint, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Response received:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      
      // Pastikan response adalah blob Excel
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('spreadsheetml') && !contentType.includes('excel') && !contentType.includes('octet-stream')) {
        throw new Error('Response bukan file Excel. Content-Type: ' + contentType);
      }
      
      // Get filename from Content-Disposition header atau gunakan default
      let filename = `template_data_siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create blob dengan MIME type Excel yang benar
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      console.log('Blob created:', blob.size, 'bytes', 'Type:', blob.type);
      
      // Buat URL untuk download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download triggered successfully for:', filename);
      
    } catch (error: unknown) {
      console.error('Download error:', error);
      
      let errorMessage = 'Terjadi kesalahan saat mendownload template.';
      
      // Type guard to check if error is an axios error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any; // Cast to any for axios error properties
        console.error('Error response data:', axiosError.response?.data);
        console.error('Error response headers:', axiosError.response?.headers);
        
        // Jika response error adalah JSON
        if (axiosError.response?.headers?.['content-type']?.includes('application/json')) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              const errorData = JSON.parse(reader.result as string);
              console.error('Server error message:', errorData.message);
              alert('Server Error: ' + errorData.message);
            };
            reader.readAsText(axiosError.response.data);
            return;
          } catch {
            // Fallback ke error message default
          }
        }
        
        errorMessage = `Server Error: ${axiosError.response?.status} - ${axiosError.response?.statusText}`;
      } else if (error && typeof error === 'object' && 'request' in error) {
        errorMessage = 'Tidak dapat terhubung ke server. Pastikan Laravel backend berjalan di http://localhost:8000';
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }
      
      alert(errorMessage);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result ? (
              <>
                {/* Instructions */}
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" size={16} />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Petunjuk Import:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)</li>
                          <li>Maksimal ukuran file 5MB</li>
                          <li>Download template untuk format yang benar</li>
                          <li>NIS harus unik (tidak boleh duplikat)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Download Template */}
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 mb-4"
                  >
                    <Download className="text-blue-600 mr-3 flex-shrink-0" size={20} />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Download Template</p>
                      <p className="text-sm text-gray-500">Unduh template Excel</p>
                    </div>
                  </button>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-600 font-medium">
                        Klik untuk pilih file
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Excel atau CSV (Max 5MB)
                      </p>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-3 p-2 bg-gray-50 rounded border flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-700">
                        <FileText size={16} className="mr-2 text-blue-600" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Import
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Results */
              <div>
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                    result.error_count === 0 ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {result.error_count === 0 ? (
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Import Selesai</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
                      <p className="text-sm text-gray-600">Berhasil</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{result.error_count}</p>
                      <p className="text-sm text-gray-600">Gagal</p>
                    </div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mb-4">
                    <p className="font-medium text-gray-900 mb-2">Detail Error:</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700 mb-1">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}