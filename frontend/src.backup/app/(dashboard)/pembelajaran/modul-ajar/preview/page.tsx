'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function PreviewModulPage() {
  const params = useSearchParams();
  const router = useRouter();

  const fileUrl = decodeURIComponent(params.get('url') || '');
  const type = (params.get('type') || '').toLowerCase();
  const title = params.get('title') || 'Preview Modul';

  const embedUrl = useMemo(() => {
    if (!fileUrl) return '';
    // Gunakan Google Docs Viewer untuk dokumen Office agar tampil inline
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(type)) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fileUrl)}`;
    }
    // PDF dan gambar bisa ditampilkan langsung
    return fileUrl;
  }, [fileUrl, type]);

  if (!fileUrl) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          URL file tidak valid. Kembali ke daftar modul.
        </div>
        <button onClick={() => router.back()} className="mt-4 px-3 py-2 border rounded-lg">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <button onClick={() => router.back()} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Kembali</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-3">
        {/* Untuk PDF/gambar: tampilkan langsung; untuk Office: gunakan Google Viewer */}
        <iframe src={embedUrl} className="w-full h-[80vh] rounded-lg" title={title} />
      </div>
    </div>
  );
}