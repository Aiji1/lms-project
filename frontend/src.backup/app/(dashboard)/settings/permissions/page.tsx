'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings, RefreshCcw, Save, ChevronDown, ChevronRight, Search, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Permission, UserRole, DEFAULT_PERMISSIONS, FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS, VIEW_CREATE_PERMISSIONS } from '@/types/permissions';
import { universalMenuConfig } from '@/config/menuConfig';
import { fetchMergedOverrides, mergeItemPermissions } from '@/lib/permissionOverrides';
import { getUserPermission } from '@/lib/permissions';

interface OverrideItem {
  id_override?: number;
  target_type: 'role' | 'user';
  target_id: string;
  resource_key: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const roles: UserRole[] = ['Admin', 'Kepala_Sekolah', 'Guru', 'Siswa', 'Petugas_Keuangan', 'Orang_Tua'];

type AccessLevel = {
  key: string;
  label: string;
  perm: Permission;
  color: string;
  icon: string;
};

const NONE: Permission = { view: false, create: false, edit: false, delete: false };
const ACCESS_LEVELS: AccessLevel[] = [
  { key: 'none', label: 'None', perm: NONE, color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200', icon: '🚫' },
  { key: 'view', label: 'View Only', perm: READ_ONLY_PERMISSIONS, color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200', icon: '👁️' },
  { key: 'view_create', label: 'View + Create', perm: VIEW_CREATE_PERMISSIONS, color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200', icon: '➕' },
  { key: 'view_edit', label: 'View + Edit', perm: VIEW_EDIT_PERMISSIONS, color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200', icon: '✏️' },
  { key: 'full', label: 'Full Access', perm: FULL_PERMISSIONS, color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200', icon: '⚡' },
];

function permissionEquals(a: Permission, b: Permission): boolean {
  return a.view === b.view && a.create === b.create && a.edit === b.edit && a.delete === b.delete;
}

function getAccessKeyForPermission(p: Permission): string {
  for (const level of ACCESS_LEVELS) {
    if (permissionEquals(p, level.perm)) return level.key;
  }
  return 'custom';
}

type FlatItem = {
  label: string;
  resourceKey: string;
  baseForRole: Permission;
  description?: string;
};

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Guru');
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideMap, setOverrideMap] = useState<Record<string, Permission>>({});
  const [existingOverrides, setExistingOverrides] = useState<Record<string, OverrideItem>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingSelections, setPendingSelections] = useState<Record<string, Permission>>({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Flatten menu items into list per group and items
  const groups = useMemo(() => {
    return universalMenuConfig.map(group => {
      const groupItem: FlatItem | null = group.resourceKey ? {
        label: group.label,
        resourceKey: group.resourceKey,
        baseForRole: getUserPermission(selectedRole, group.permissions),
        description: group.description,
      } : null;
      const childItems: FlatItem[] = (group.children || [])
        .filter(c => !!c.resourceKey)
        .map(c => ({
          label: c.label,
          resourceKey: c.resourceKey!,
          baseForRole: getUserPermission(selectedRole, c.permissions),
          description: c.description,
        }));
      return { groupLabel: group.label, groupItem, childItems };
    });
  }, [selectedRole]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.map(g => {
      const matchGroup = g.groupLabel.toLowerCase().includes(term) || (g.groupItem && g.groupItem.label.toLowerCase().includes(term));
      const childItems = g.childItems.filter(ci => ci.label.toLowerCase().includes(term) || ci.resourceKey.toLowerCase().includes(term));
      return { groupLabel: g.groupLabel, groupItem: matchGroup ? g.groupItem : null, childItems };
    }).filter(g => g.groupItem || g.childItems.length > 0);
  }, [groups, searchTerm]);

  // Auto-expand groups yang ada hasil search
  useEffect(() => {
    if (searchTerm) {
      const newExpanded: Record<string, boolean> = {};
      filteredGroups.forEach(g => {
        if (g.childItems.length > 0) {
          newExpanded[g.groupLabel] = true;
        }
      });
      setExpanded(newExpanded);
    }
  }, [searchTerm, filteredGroups]);

  // Fetch overrides for selected role
  useEffect(() => {
    const fetchOverridesForRole = async () => {
      try {
        const merged = await fetchMergedOverrides({ role: selectedRole });
        setOverrideMap(merged);
        const res = await api.get('/v1/permission-overrides', { params: { target_type: 'role', target_id: selectedRole } });
        const list: OverrideItem[] = res.data || [];
        const byKey: Record<string, OverrideItem> = {};
        list.forEach(o => { byKey[o.resource_key] = o; });
        setExistingOverrides(byKey);
        setPendingSelections({});
        setHasChanges(false);
      } catch (e) {
        console.error('Gagal memuat overrides:', e);
        setErrorMessage('Gagal memuat data permissions');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    };
    fetchOverridesForRole();
  }, [selectedRole]);

  // Helper: get current effective permission for a resourceKey
  function getEffectiveFor(resourceKey: string, baseForRole: Permission): Permission {
    const pending = pendingSelections[resourceKey];
    if (pending) return pending;
    const override = overrideMap[resourceKey];
    if (!override) return baseForRole;
    return override;
  }

  function handleSelectLevel(resourceKey: string, perm: Permission) {
    setPendingSelections(prev => ({ ...prev, [resourceKey]: perm }));
    setHasChanges(true);
  }

  async function handleRefresh() {
    try {
      console.log('🔄 Refreshing permission data...');
      
      // Clear all pending selections
      setPendingSelections({});
      setHasChanges(false);

      // Fetch merged overrides
      const merged = await fetchMergedOverrides({ role: selectedRole });
      console.log('📊 Merged overrides loaded:', merged);
      setOverrideMap(merged);

      // Fetch raw overrides
      const res = await api.get('/v1/permission-overrides', { 
        params: { target_type: 'role', target_id: selectedRole } 
      });
      const list: OverrideItem[] = res.data || [];
      const byKey: Record<string, OverrideItem> = {};
      list.forEach(o => { byKey[o.resource_key] = o; });
      console.log('📊 Raw overrides loaded:', byKey);
      setExistingOverrides(byKey);

      console.log('✅ Refresh complete');
    } catch (e) {
      console.error('❌ Failed to refresh:', e);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setShowError(false);
    setShowSuccess(false);

    try {
      // Step 1: Get fresh data from server
      console.log('🔄 Fetching fresh overrides from server...');
      const freshOverridesRes = await api.get('/v1/permission-overrides', { 
        params: { target_type: 'role', target_id: selectedRole } 
      });
      const freshList: OverrideItem[] = freshOverridesRes.data || [];
      const freshByKey: Record<string, OverrideItem> = {};
      freshList.forEach(o => { freshByKey[o.resource_key] = o; });

      console.log('📊 Fresh overrides from server:', freshByKey);
      console.log('📝 Pending changes to apply:', pendingSelections);

      const ops: Promise<any>[] = [];
      let changeCount = 0;
      const changesLog: string[] = [];

      for (const [resourceKey, desired] of Object.entries(pendingSelections)) {
        const baseItem = groups.flatMap(g => [g.groupItem, ...g.childItems]).find(i => i && i.resourceKey === resourceKey) as FlatItem | undefined;
        if (!baseItem) {
          console.warn(`⚠️ Resource key ${resourceKey} not found in menu config`);
          continue;
        }
        
        const base = baseItem.baseForRole;
        const existing = freshByKey[resourceKey]; // Use fresh data
        const currentOverride = overrideMap[resourceKey]; // Current in-memory state

        console.log(`\n🔍 Processing ${resourceKey}:`);
        console.log('  Base permission:', base);
        console.log('  Desired permission:', desired);
        console.log('  Existing override:', existing);
        console.log('  Current override (memory):', currentOverride);

        // If desired equals base, DELETE override (reset to default)
        if (permissionEquals(desired, base)) {
          if (existing && existing.id_override) {
            console.log(`  ❌ DELETE override for ${resourceKey} (id: ${existing.id_override})`);
            ops.push(
              api.delete(`/v1/permission-overrides/${existing.id_override}`)
                .then(() => {
                  changesLog.push(`Deleted override for ${resourceKey}`);
                })
                .catch(err => {
                  console.error(`Failed to delete ${resourceKey}:`, err);
                  throw new Error(`Failed to delete override for ${resourceKey}`);
                })
            );
            changeCount++;
          } else {
            console.log(`  ✓ No override exists, already using base permission`);
          }
        } 
        // If desired differs from base, CREATE or UPDATE override
        else {
          if (existing && existing.id_override) {
            // Check if update is actually needed
            const needsUpdate = !permissionEquals(desired, {
              view: existing.view,
              create: existing.create,
              edit: existing.edit,
              delete: existing.delete
            });

            if (needsUpdate) {
              console.log(`  ✏️ UPDATE override for ${resourceKey} (id: ${existing.id_override})`);
              ops.push(
                api.put(`/v1/permission-overrides/${existing.id_override}`, {
                  target_type: 'role',
                  target_id: selectedRole,
                  resource_key: resourceKey,
                  ...desired
                })
                .then(() => {
                  changesLog.push(`Updated override for ${resourceKey}`);
                })
                .catch(err => {
                  console.error(`Failed to update ${resourceKey}:`, err);
                  throw new Error(`Failed to update override for ${resourceKey}`);
                })
              );
              changeCount++;
            } else {
              console.log(`  ✓ Override already matches desired state, skip update`);
            }
          } else {
            console.log(`  ➕ CREATE new override for ${resourceKey}`);
            ops.push(
              api.post('/v1/permission-overrides', {
                target_type: 'role',
                target_id: selectedRole,
                resource_key: resourceKey,
                ...desired
              })
              .then(() => {
                changesLog.push(`Created override for ${resourceKey}`);
              })
              .catch(err => {
                console.error(`Failed to create ${resourceKey}:`, err);
                throw new Error(`Failed to create override for ${resourceKey}`);
              })
            );
            changeCount++;
          }
        }
      }

      console.log(`\n💾 Executing ${changeCount} operations...`);
      
      if (changeCount === 0) {
        console.log('ℹ️ No changes to save');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        setSaving(false);
        return;
      }

      // Execute all operations
      await Promise.all(ops);
      
      console.log('✅ All operations completed successfully');
      console.log('📋 Changes applied:', changesLog);

      // Step 2: Wait a bit for DB to sync
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Trigger sidebar refresh event
      try {
        window.dispatchEvent(new Event('permission-overrides-saved'));
        console.log('📢 Sidebar refresh event dispatched');
      } catch (e) {
        console.warn('Failed to dispatch event:', e);
      }

      // Step 4: Show success notification
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Step 5: Force refresh data from server
      console.log('🔄 Refreshing data from server...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Extra wait
      await handleRefresh();

    } catch (e: any) {
      console.error('❌ Error saving permission overrides:', e);
      setErrorMessage(e?.response?.data?.message || e?.message || 'Gagal menyimpan perubahan. Coba lagi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setSaving(false);
    }
  }

  function LevelSelector({ resourceKey, baseForRole }: { resourceKey: string; baseForRole: Permission }) {
    const effective = getEffectiveFor(resourceKey, baseForRole);
    const selected = pendingSelections[resourceKey] || effective;
    const selectedKey = getAccessKeyForPermission(selected);
    const selectedLevel = ACCESS_LEVELS.find(l => l.key === selectedKey);

    return (
      <div className="flex flex-wrap gap-2">
        {ACCESS_LEVELS.map(level => {
          const isActive = selectedKey === level.key;
          return (
            <button
              key={level.key}
              onClick={() => handleSelectLevel(resourceKey, level.perm)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                isActive 
                  ? level.color.replace('hover:', '') + ' shadow-md transform scale-105' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1.5">{level.icon}</span>
              {level.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900">Berhasil Disimpan!</p>
              <p className="text-sm text-green-700">Permission berhasil diupdate</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-700 hover:text-green-900">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900">Gagal Menyimpan</p>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
            <button onClick={() => setShowError(false)} className="text-red-700 hover:text-red-900">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
              <p className="text-sm text-gray-600 mt-1">Kelola akses menu untuk setiap role pengguna</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg border border-amber-300">
                Ada perubahan yang belum disimpan
              </span>
            )}
            <button 
              onClick={handleRefresh} 
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw size={18} />
              <span className="font-medium">Refresh</span>
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                saving || !hasChanges
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              <Save size={18} />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Pilih Role</label>
            <select
              value={selectedRole}
              onChange={e => {
                setSelectedRole(e.target.value as UserRole);
                setHasChanges(false);
              }}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {roles.map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Cari Menu</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ketik nama menu untuk mencari..."
                className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Permission List */}
      <div className="space-y-4">
        {filteredGroups.map(g => (
          <div key={g.groupLabel} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
              onClick={() => setExpanded(prev => ({ ...prev, [g.groupLabel]: !prev[g.groupLabel] }))}
            >
              <div className="flex items-center gap-3">
                {expanded[g.groupLabel] ? <ChevronDown size={20} className="text-gray-600" /> : <ChevronRight size={20} className="text-gray-600" />}
                <span className="font-semibold text-gray-900 text-lg">{g.groupLabel}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {g.childItems.length} menu
                </span>
              </div>
            </div>

            {g.groupItem && (
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">PARENT</span>
                      <span className="font-semibold text-gray-900">{g.groupItem.label}</span>
                    </div>
                    {g.groupItem.description && (
                      <p className="text-sm text-gray-600">{g.groupItem.description}</p>
                    )}
                  </div>
                  <LevelSelector resourceKey={g.groupItem.resourceKey} baseForRole={g.groupItem.baseForRole} />
                </div>
              </div>
            )}

            {expanded[g.groupLabel] && (
              <div className="divide-y divide-gray-100">
                {g.childItems.map((ci, idx) => (
                  <div key={ci.resourceKey} className={`px-6 py-5 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">SUBMENU</span>
                          <span className="font-medium text-gray-900">{ci.label}</span>
                        </div>
                        {ci.description && (
                          <p className="text-sm text-gray-600">{ci.description}</p>
                        )}
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{ci.resourceKey}</code>
                      </div>
                      <LevelSelector resourceKey={ci.resourceKey} baseForRole={ci.baseForRole} />
                    </div>
                  </div>
                ))}
                {g.childItems.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Tidak ada submenu
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada hasil</h3>
            <p className="text-gray-600">Coba kata kunci pencarian yang lain</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-600" />
          Keterangan Level Akses
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {ACCESS_LEVELS.map(level => (
            <div key={level.key} className="flex items-center gap-2">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <p className="font-medium text-sm text-gray-900">{level.label}</p>
                <p className="text-xs text-gray-600">
                  {level.key === 'none' && 'Tidak ada akses'}
                  {level.key === 'view' && 'Hanya lihat'}
                  {level.key === 'view_create' && 'Lihat & buat'}
                  {level.key === 'view_edit' && 'Lihat & edit'}
                  {level.key === 'full' && 'Akses penuh'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}