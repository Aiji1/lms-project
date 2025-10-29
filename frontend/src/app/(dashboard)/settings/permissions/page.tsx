'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings, RefreshCcw, Save, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Permission, UserRole, DEFAULT_PERMISSIONS, FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS, VIEW_CREATE_PERMISSIONS } from '@/types/permissions';
import { universalMenuConfig } from '@/config/menuConfig';
import { fetchMergedOverrides, mergeItemPermissions } from '@/lib/permissionOverrides';
import { getUserPermission } from '@/lib/permissions';

interface OverrideItem {
  id_override?: number;
  target_type: 'role' | 'user';
  target_id: string; // role name or user_id
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
};

const NONE: Permission = { view: false, create: false, edit: false, delete: false };
const ACCESS_LEVELS: AccessLevel[] = [
  { key: 'none', label: 'None', perm: NONE },
  { key: 'view', label: 'View', perm: READ_ONLY_PERMISSIONS },
  { key: 'view_create', label: 'View+Create', perm: VIEW_CREATE_PERMISSIONS },
  { key: 'view_edit', label: 'View+Edit', perm: VIEW_EDIT_PERMISSIONS },
  { key: 'full', label: 'Full', perm: FULL_PERMISSIONS },
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
  baseForRole: Permission; // base permission untuk selected role
};

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideMap, setOverrideMap] = useState<Record<string, Permission>>({});
  const [existingOverrides, setExistingOverrides] = useState<Record<string, OverrideItem>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingSelections, setPendingSelections] = useState<Record<string, Permission>>({});
  const [saving, setSaving] = useState(false);

  // Flatten menu items into list per group and items
  const groups = useMemo(() => {
    return universalMenuConfig.map(group => {
      const groupItem: FlatItem | null = group.resourceKey ? {
        label: group.label,
        resourceKey: group.resourceKey,
        baseForRole: getUserPermission(selectedRole, group.permissions),
      } : null;
      const childItems: FlatItem[] = (group.children || [])
        .filter(c => !!c.resourceKey)
        .map(c => ({
          label: c.label,
          resourceKey: c.resourceKey!,
          baseForRole: getUserPermission(selectedRole, c.permissions),
        }));
      return { groupLabel: group.label, groupItem, childItems };
    });
  }, [selectedRole]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.map(g => {
      const matchGroup = g.groupLabel.toLowerCase().includes(term) || (g.groupItem && g.groupItem.label.toLowerCase().includes(term));
      const childItems = g.childItems.filter(ci => ci.label.toLowerCase().includes(term));
      return { groupLabel: g.groupLabel, groupItem: matchGroup ? g.groupItem : null, childItems };
    }).filter(g => g.groupItem || g.childItems.length > 0);
  }, [groups, searchTerm]);

  // Fetch overrides for selected role
  useEffect(() => {
    const fetchOverridesForRole = async () => {
      try {
        const merged = await fetchMergedOverrides({ role: selectedRole });
        setOverrideMap(merged);
        // Fetch existing override entries with ids for updates/deletes
        const res = await api.get('/v1/permission-overrides', { params: { target_type: 'role', target_id: selectedRole } });
        const list: OverrideItem[] = res.data || [];
        const byKey: Record<string, OverrideItem> = {};
        list.forEach(o => { byKey[o.resource_key] = o; });
        setExistingOverrides(byKey);
        setPendingSelections({});
      } catch (e) {
        console.error('Gagal memuat overrides:', e);
      }
    };
    fetchOverridesForRole();
  }, [selectedRole]);

  // Helper: get current effective permission for a resourceKey
  function getEffectiveFor(resourceKey: string, baseForRole: Permission): Permission {
    const override = overrideMap[resourceKey];
    if (!override) return baseForRole;
    return override;
  }

  function handleSelectLevel(resourceKey: string, perm: Permission) {
    setPendingSelections(prev => ({ ...prev, [resourceKey]: perm }));
  }

  async function handleRefresh() {
    // Re-trigger useEffect by toggling role to same value
    setSelectedRole(r => r);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const ops: Promise<any>[] = [];
      // Iterate all pending selections
      for (const [resourceKey, desired] of Object.entries(pendingSelections)) {
        // Find base and existing override
        const baseItem = groups.flatMap(g => [g.groupItem, ...g.childItems]).find(i => i && i.resourceKey === resourceKey) as FlatItem | undefined;
        if (!baseItem) continue;
        const base = baseItem.baseForRole;
        const existing = existingOverrides[resourceKey];
        const currentOverride = overrideMap[resourceKey];

        if (permissionEquals(desired, base)) {
          // Matches base: remove override if exists
          if (existing && existing.id_override) {
            ops.push(api.delete(`/v1/permission-overrides/${existing.id_override}`));
          }
        } else {
          // Different from base: create or update override
          if (existing && existing.id_override) {
            // Only update if different from current override
            if (!currentOverride || !permissionEquals(desired, currentOverride)) {
              ops.push(api.put(`/v1/permission-overrides/${existing.id_override}`, desired));
            }
          } else {
            ops.push(api.post('/v1/permission-overrides', {
              target_type: 'role',
              target_id: selectedRole,
              resource_key: resourceKey,
              ...desired,
            }));
          }
        }
      }
      await Promise.all(ops);
      // Beri tahu komponen lain (Sidebar) untuk refresh overrides
      try {
        window.dispatchEvent(new Event('permission-overrides-saved'));
      } catch {}
      await handleRefresh();
    } catch (e) {
      console.error('Gagal menyimpan perubahan override:', e);
      alert('Gagal menyimpan sebagian perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function LevelSelector({ resourceKey, baseForRole }: { resourceKey: string; baseForRole: Permission }) {
    const effective = getEffectiveFor(resourceKey, baseForRole);
    const selected = pendingSelections[resourceKey] || effective;
    const selectedKey = getAccessKeyForPermission(selected);
    return (
      <div className="flex flex-wrap gap-2">
        {ACCESS_LEVELS.map(level => {
          const isActive = selectedKey === level.key;
          return (
            <button
              key={level.key}
              onClick={() => handleSelectLevel(resourceKey, level.perm)}
              className={`px-3 py-1 text-sm rounded border ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
            >
              {level.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="text-blue-600" size={22} />
          <h1 className="text-xl font-semibold">Permission Overrides</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
            <RefreshCcw size={18} />
            Refresh
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-600">Pilih Role</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value as UserRole)}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Cari Menu/Submenu</label>
          <div className="mt-1 flex items-center gap-2 border rounded px-3 py-2">
            <Search size={16} className="text-gray-500" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ketik untuk mencari..."
              className="flex-1 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredGroups.map(g => (
          <div key={g.groupLabel} className="border rounded">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
              <button
                className="flex items-center gap-2"
                onClick={() => setExpanded(prev => ({ ...prev, [g.groupLabel]: !prev[g.groupLabel] }))}
              >
                {expanded[g.groupLabel] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-medium">{g.groupLabel}</span>
              </button>
            </div>

            {g.groupItem && (
              <div className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Menu</div>
                    <div className="font-medium">{g.groupItem.label}</div>
                  </div>
                  <LevelSelector resourceKey={g.groupItem.resourceKey} baseForRole={g.groupItem.baseForRole} />
                </div>
              </div>
            )}

            {expanded[g.groupLabel] && (
              <div className="divide-y">
                {g.childItems.map(ci => (
                  <div key={ci.resourceKey} className="px-3 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Submenu</div>
                      <div className="font-medium">{ci.label}</div>
                    </div>
                    <LevelSelector resourceKey={ci.resourceKey} baseForRole={ci.baseForRole} />
                  </div>
                ))}
                {g.childItems.length === 0 && (
                  <div className="px-3 py-3 text-sm text-gray-500">Tidak ada submenu</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}