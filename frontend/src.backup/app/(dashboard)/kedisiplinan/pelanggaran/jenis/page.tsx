'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Option = { value: string; label: string };
type DbJenis = { id: number; label: string; poin_default?: number; status?: 'Aktif' | 'Non-aktif' };

type JenisItem = { id: string; label: string; source: 'default' | 'db'; editable: boolean };

export default function JenisPelanggaranPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<JenisItem[]>([]);
  const [newJenisName, setNewJenisName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const respDb = await api.get('/v1/jenis-pelanggaran');
      const dbRows: DbJenis[] = Array.isArray(respDb.data?.data) ? (respDb.data.data as DbJenis[]) : [];
      const fromDb: JenisItem[] = dbRows.map((r) => ({ id: String(r.id), label: r.label, source: 'db', editable: true }));

      setItems(fromDb);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal memuat data jenis pelanggaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const addDb = async () => {
    const name = newJenisName.trim();
    if (!name) return;
    try {
      await api.post('/v1/jenis-pelanggaran', { label: name });
      setNewJenisName('');
      await fetchAll();
    } catch {}
  };

  const startEdit = (item: JenisItem) => {
    if (!item.editable) return;
    setEditingId(item.id);
    setEditingValue(item.label);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const nextName = editingValue.trim();
    if (!nextName) return;
    try {
      const target = items.find(i => i.id === editingId);
      if (target?.source === 'db') {
        await api.patch(`/v1/jenis-pelanggaran/${editingId}`, { label: nextName });
        await fetchAll();
      }
      setEditingId(null);
      setEditingValue('');
    } catch {}
  };

  const deleteItem = async (item: JenisItem) => {
    if (!item.editable) return;
    try {
      if (item.source === 'db') {
        await api.delete(`/v1/jenis-pelanggaran/${item.id}`);
        await fetchAll();
      }
    } catch {}
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Jenis Pelanggaran</h1>
          <a href="/kedisiplinan/pelanggaran" className="px-3 py-2 bg-slate-200 text-slate-800 rounded-md">Kembali</a>
        </div>

        {loading && <div className="mb-3 text-sm">Memuat...</div>}
        {error && <div className="mb-3 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>}

        <div className="bg-white rounded-md shadow-sm p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newJenisName}
              onChange={(e) => setNewJenisName(e.target.value)}
              placeholder="Nama jenis pelanggaran"
              className="flex-1 border rounded px-3 py-2"
            />
            <button onClick={addDb} className="px-3 py-2 rounded bg-blue-600 text-white">Tambah</button>
          </div>
          <ul className="divide-y">
            {items.map(item => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <div className="flex-1">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <span className="text-sm">{item.label}</span>
                  )}
                  <span className="ml-2 text-xs text-gray-500">{item.source === 'db' ? 'Default' : 'Default'}</span>
                </div>
                <div className="flex gap-2">
                  {item.editable ? (
                    editingId === item.id ? (
                      <>
                        <button onClick={saveEdit} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Simpan</button>
                        <button onClick={() => { setEditingId(null); setEditingValue(''); }} className="px-3 py-1 text-sm bg-slate-200 text-slate-800 rounded">Batal</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="px-3 py-1 text-sm bg-slate-200 text-slate-800 rounded">Edit</button>
                        <button onClick={() => deleteItem(item)} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Hapus</button>
                      </>
                    )
                  ) : (
                    <span className="text-xs text-gray-400">Tidak dapat diubah</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}