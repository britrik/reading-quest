import { useEffect, useState } from "react";
import { UserPlus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  AVATARS,
  AVATAR_EMOJI,
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
  type Avatar,
  type ProfileListItem,
} from "@/lib/profilesApi";

export default function ProfileManager({ token }: { token: string }) {
  const [profiles, setProfiles] = useState<ProfileListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("fox");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function refresh() {
    try {
      setProfiles(await listProfiles());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createProfile({ name: name.trim(), avatar }, token);
      setName("");
      setShowAdd(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this profile? All their reading history will be removed.")) return;
    try {
      await deleteProfile(id, token);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startRename(p: ProfileListItem) {
    setRenamingId(p.id);
    setRenameValue(p.name);
  }

  async function saveRename(id: number) {
    if (!renameValue.trim()) return;
    try {
      await updateProfile(id, { name: renameValue.trim() }, token);
      setRenamingId(null);
      setRenameValue("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="profile-manager">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-0.5">Readers</h2>
          <p className="text-xs text-slate-500">Add, rename, or remove a kid profile on this device.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          data-testid="open-add-profile"
          className="text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-md border border-slate-200 inline-flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add reader
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          {error}
        </p>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="border border-slate-200 rounded-lg p-4 mb-4" data-testid="add-profile-form">
          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="add-profile-name">
            Name
          </label>
          <input
            id="add-profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="manager-profile-name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-3"
            maxLength={40}
          />
          <div className="flex gap-1 flex-wrap mb-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                aria-pressed={avatar === a}
                aria-label={a}
                data-testid={`manager-avatar-${a}`}
                className={`text-2xl p-2 rounded ${avatar === a ? "bg-slate-200" : "bg-slate-50"}`}
              >
                {AVATAR_EMOJI[a]}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            data-testid="manager-add-submit"
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
          >
            Add reader
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100" data-testid="profile-manager-list">
        {profiles?.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2" data-testid={`manager-row-${p.id}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl" aria-hidden="true">
                {AVATAR_EMOJI[(p.avatar as Avatar) ?? "fox"] ?? "🦊"}
              </span>
              {renamingId === p.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    data-testid={`manager-rename-input-${p.id}`}
                    className="px-2 py-1 border border-slate-300 rounded-md text-sm flex-1 min-w-0"
                    maxLength={40}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveRename(p.id)}
                    aria-label={`Save rename for ${p.name}`}
                    data-testid={`manager-rename-save-${p.id}`}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(null)}
                    aria-label="Cancel rename"
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.gems} gems · {p.stars} stars · {p.onboarded ? "onboarded" : "new"}
                  </div>
                </div>
              )}
            </div>
            {renamingId !== p.id && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startRename(p)}
                  aria-label={`Rename ${p.name}`}
                  data-testid={`manager-rename-${p.id}`}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={`Delete ${p.name}`}
                  data-testid={`manager-delete-${p.id}`}
                  disabled={(profiles?.length ?? 0) <= 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
