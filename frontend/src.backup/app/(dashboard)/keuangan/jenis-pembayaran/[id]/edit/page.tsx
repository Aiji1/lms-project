'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Users, AlertCircle } from 'lucide-react';

interface FormOptionsTA { id: number; tahun_ajaran: string }
interface FormOptionsKelas { id: number; nama_kelas: string; nama_jurusan: string }
interface FormOptionsSiswa { id: number; nama_lengkap: string; nis: string }

interface FormOptions {
  tahun_ajaran: FormOptionsTA[];
  kelas: FormOptionsKelas[];
  siswa: FormOptionsSiswa[];
  tipe_periode: Array<{ value: string; label: string }>;
  tipe_siswa: Array<{ value: string; label: string }>;
  bulan: Array<{ value: number; label: string }>;
}

interface DetailJP {
  id_jenis_pembayaran: number;
  kode?: string;
  nama_pembayaran: string;
  deskripsi?: string;
  nominal: number;
  tipe_periode: 'bulanan' | 'custom' | 'sekali';
  tipe_siswa: 'semua' | 'kelas' | 'individu';
  id_tahun_ajaran?: number;
  periode_bulan?: number[];
  kelas?: Array<{ id_kelas: number; nama_kelas: string; nama_jurusan: string }>
  siswa?: Array<{ nis: string; nama_lengkap: string }>
}

export default function EditJenisPembayaranPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const rawPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const idFromParams = (params?.id as string) || '';
  const idFromPath = (() => {
    const m = rawPath.match(/jenis-pembayaran\/(.+?)\/edit/);
    return m?.[1] || '';
  })();
  const jpId = idFromParams && idFromParams !== 'undefined' ? idFromParams : idFromPath;
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    tahun_ajaran: [],
    kelas: [],
    siswa: [],
    tipe_periode: [],
    tipe_siswa: [],
    bulan: []
  });

  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [nominal, setNominal] = useState('');
  const [tipePeriode, setTipePeriode] = useState<'bulanan' | 'custom' | 'sekali'>('sekali');
  const [tipeSiswa, setTipeSiswa] = useState<'semua' | 'kelas' | 'individu'>('semua');
  const [tahunAjaran, setTahunAjaran] = useState<string>('');
  const [periodeBulan, setPeriodeBulan] = useState<number[]>([]);
  const [kelasIds, setKelasIds] = useState<number[]>([]);
  const [siswaNis, setSiswaNis] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [searchKelas, setSearchKelas] = useState('');
  const [searchSiswa, setSearchSiswa] = useState('');

  useEffect(() => {
    if (!jpId) return;
    const init = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [optRes, detRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/jenis-pembayaran-form-data', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8000/api/v1/jenis-pembayaran/${jpId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        const optJson = await optRes.json();
        const detJson = await detRes.json();
        const optData = optJson?.data?.data ?? optJson?.data;
        if (optJson?.success && optData) setFormOptions(optData);
        const detData = detJson?.data?.data ?? detJson?.data;
        if (detJson?.success && detData) {
          const d: DetailJP = detData;
          setNama(d.nama_pembayaran || '');
          setKode(d.kode || '');
          setDeskripsi(d.deskripsi || '');
          setNominal(String(d.nominal ?? ''));
          setTipePeriode(d.tipe_periode);
          setTipeSiswa(d.tipe_siswa);
          setTahunAjaran(String(d.id_tahun_ajaran ?? ''));
          setPeriodeBulan(Array.isArray(d.periode_bulan) ? d.periode_bulan : []);
          setKelasIds(Array.isArray(d.kelas) ? d.kelas.map(k => k.id_kelas) : []);
          setSiswaNis(Array.isArray(d.siswa) ? d.siswa.map(s => s.nis) : []);
        }
      } catch (e) {
        alert('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [jpId]);

  const formatCurrency = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(value));
  };

  const toggleBulan = (b: number) => {
    setPeriodeBulan(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b].sort((a, b) => a - b));
  };

  const toggleKelas = (id: number) => {
    setKelasIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSiswa = (nis: string) => {
    setSiswaNis(prev => prev.includes(nis) ? prev.filter(x => x !== nis) : [...prev, nis]);
  };

  const filteredKelas = formOptions.kelas.filter(k => {
    const nk = (k.nama_kelas || '').toLowerCase();
    const nj = (k.nama_jurusan || '').toLowerCase();
    const q = searchKelas.toLowerCase();
    return nk.includes(q) || nj.includes(q);
  });

  const filteredSiswa = formOptions.siswa.filter(s => {
    const nl = (s.nama_lengkap || '').toLowerCase();
    const q = searchSiswa.toLowerCase();
    return nl.includes(q) || (s.nis || '').includes(searchSiswa);
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jpId || jpId === 'undefined') { alert('ID tidak valid'); return; }
    const errs: Record<string, string[]> = {};
    if (!nama) errs.nama_pembayaran = ['Nama wajib diisi'];
    if (!nominal) errs.nominal = ['Nominal wajib diisi'];
    if (!tahunAjaran) errs.id_tahun_ajaran = ['Tahun ajaran wajib dipilih'];
    if (tipePeriode === 'custom' && periodeBulan.length === 0) errs.periode_bulan = ['Pilih minimal 1 bulan'];
    if (tipeSiswa === 'kelas' && kelasIds.length === 0) errs.kelas_ids = ['Pilih minimal 1 kelas'];
    if (tipeSiswa === 'individu' && siswaNis.length === 0) errs.siswa_nis = ['Pilih minimal 1 siswa'];
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setSubmitLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        nama_pembayaran: nama,
        deskripsi,
        nominal: parseInt(nominal),
        tipe_periode: tipePeriode,
        tipe_siswa: tipeSiswa,
        id_tahun_ajaran: parseInt(tahunAjaran),
        periode_bulan: tipePeriode === 'custom' ? periodeBulan : [],
        kelas_ids: tipeSiswa === 'kelas' ? kelasIds : [],
        siswa_nis: tipeSiswa === 'individu' ? siswaNis : [],
        is_active: true,
      };
      const res = await fetch(`http://localhost:8000/api/v1/jenis-pembayaran/${jpId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Jenis pembayaran berhasil diperbarui');
        router.push('/keuangan/jenis-pembayaran');
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        alert(data.message || 'Gagal memperbarui jenis pembayaran');
      }
    } catch (e) {
      alert('Gagal menyimpan');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/keuangan" className="hover:text-blue-600">Keuangan</Link>
          <span>/</span>
          <Link href="/keuangan/jenis-pembayaran" className="hover:text-blue-600">Jenis Pembayaran</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Jenis Pembayaran</h1>
            <p className="text-gray-600 mt-1">Perbarui informasi jenis pembayaran</p>
          </div>
          <Link href="/keuangan/jenis-pembayaran" className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pembayaran</label>
                  <input value={kode} onChange={(e)=>setKode(e.target.value)} type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pembayaran <span className="text-red-500">*</span></label>
                  <input value={nama} onChange={(e)=>setNama(e.target.value)} type="text" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nama_pembayaran ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.nama_pembayaran && <p className="mt-1 text-sm text-red-600">{errors.nama_pembayaran[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nominal (Rp) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input value={formatCurrency(nominal)} onChange={(e)=>setNominal(e.target.value.replace(/[^0-9]/g,''))} type="text" className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nominal ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                  {errors.nominal && <p className="mt-1 text-sm text-red-600">{errors.nominal[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran <span className="text-red-500">*</span></label>
                  <select value={tahunAjaran} onChange={(e)=>setTahunAjaran(e.target.value)} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Pilih Tahun Ajaran</option>
                    {formOptions.tahun_ajaran.map(ta => (<option key={ta.id} value={ta.id}>{ta.tahun_ajaran}</option>))}
                  </select>
                  {errors.id_tahun_ajaran && <p className="mt-1 text-sm text-red-600">{errors.id_tahun_ajaran[0]}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea value={deskripsi} onChange={(e)=>setDeskripsi(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-blue-600" />Periode Pembayaran</h2>
              <div className="space-y-3">
                {formOptions.tipe_periode.map(opt => (
                  <label key={opt.value} className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: tipePeriode===opt.value ? '#3B82F6' : '#E5E7EB'}}>
                    <input type="radio" name="tipe_periode" value={opt.value} checked={tipePeriode===opt.value} onChange={(e)=>{const v = e.target.value as 'bulanan'|'custom'|'sekali'; setTipePeriode(v); if (v!=='custom') setPeriodeBulan([]);}} className="mt-1 w-4 h-4 text-blue-600" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">{opt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
              {tipePeriode==='custom' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Bulan <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {formOptions.bulan.map(b => (
                      <button type="button" key={b.value} onClick={()=>toggleBulan(b.value)} className={`flex items-center justify-center p-2 rounded-lg border-2 transition-colors focus:outline-none ${periodeBulan.includes(b.value)?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`} aria-pressed={periodeBulan.includes(b.value)}>
                        <span className="text-sm font-medium">{b.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.periode_bulan && (<p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.periode_bulan[0]}</p>)}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" />Target Siswa</h2>
              <div className="space-y-3">
                {formOptions.tipe_siswa.map(opt => (
                  <label key={opt.value} className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: tipeSiswa===opt.value ? '#3B82F6' : '#E5E7EB'}}>
                    <input type="radio" name="tipe_siswa" value={opt.value} checked={tipeSiswa===opt.value} onChange={(e)=>{const v=e.target.value as 'semua'|'kelas'|'individu'; setTipeSiswa(v); if(v==='semua'){setKelasIds([]); setSiswaNis([]);} if(v==='kelas'){setSiswaNis([]);} if(v==='individu'){setKelasIds([]);}}} className="mt-1 w-4 h-4 text-blue-600" />
                    <div className="ml-3"><span className="font-medium text-gray-900">{opt.label}</span></div>
                  </label>
                ))}
              </div>

              {tipeSiswa==='kelas' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Pilih Kelas <span className="text-red-500">*</span></label>
                    <button type="button" onClick={()=>{
                      const ids = filteredKelas.map(k=>k.id);
                      const allSelected = ids.every(id => kelasIds.includes(id));
                      setKelasIds(prev => allSelected ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
                    }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      {filteredKelas.every(k => kelasIds.includes(k.id)) ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <input value={searchKelas} onChange={(e)=>setSearchKelas(e.target.value)} placeholder="Cari kelas..." className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm" />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredKelas.length===0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Tidak ada kelas ditemukan</p>
                    ) : filteredKelas.map(k=> (
                      <button type="button" key={k.id} onClick={()=>toggleKelas(k.id)} aria-pressed={kelasIds.includes(k.id)} className={`w-full text-left flex items-center p-3 rounded-lg border-2 transition-colors focus:outline-none ${kelasIds.includes(k.id)?'bg-orange-600 text-white border-orange-600':'bg-white text-gray-700 border-gray-300 hover:border-orange-400'}`}>
                        <div className="flex-1"><span className="font-medium">{k.nama_kelas}</span><span className="text-sm ml-2">({k.nama_jurusan})</span></div>
                      </button>
                    ))}
                  </div>
                  {errors.kelas_ids && (<p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.kelas_ids[0]}</p>)}
                </div>
              )}

              {tipeSiswa==='individu' && (
                <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Pilih Siswa <span className="text-red-500">*</span></label>
                    <button type="button" onClick={()=>{
                      const nisList = filteredSiswa.map(s=>s.nis);
                      const allSelected = nisList.every(n => siswaNis.includes(n));
                      setSiswaNis(prev => allSelected ? prev.filter(n => !nisList.includes(n)) : Array.from(new Set([...prev, ...nisList])));
                    }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      {filteredSiswa.every(s => siswaNis.includes(s.nis)) ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <input value={searchSiswa} onChange={(e)=>setSearchSiswa(e.target.value)} placeholder="Cari siswa (nama/NIS)..." className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm" />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredSiswa.length===0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Tidak ada siswa ditemukan</p>
                    ) : filteredSiswa.map(s=> (
                      <button type="button" key={s.id} onClick={()=>toggleSiswa(s.nis)} aria-pressed={siswaNis.includes(s.nis)} className={`w-full text-left flex items-center p-3 rounded-lg border-2 transition-colors focus:outline-none ${siswaNis.includes(s.nis)?'bg-pink-600 text-white border-pink-600':'bg-white text-gray-700 border-gray-300 hover:border-pink-400'}`}>
                        <div className="flex-1"><span className="font-medium">{s.nama_lengkap}</span><span className="text-sm ml-2">({s.nis})</span></div>
                      </button>
                    ))}
                  </div>
                  {errors.siswa_nis && (<p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.siswa_nis[0]}</p>)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Aksi</h3>
              <button type="submit" disabled={submitLoading} className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {submitLoading ? 'Menyimpan...' : (<><Save className="w-5 h-5 mr-2" />Simpan Perubahan</>)}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
