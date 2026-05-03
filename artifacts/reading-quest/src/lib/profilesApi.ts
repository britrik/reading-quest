export interface ProfileListItem {
  id: number;
  name: string;
  avatar: string;
  companion?: string | null;
  gems: number;
  stars: number;
  onboarded: boolean;
}

export const AVATARS = ["fox", "owl", "bunny", "turtle", "star", "moon"] as const;
export type Avatar = (typeof AVATARS)[number];

export const AVATAR_EMOJI: Record<Avatar, string> = {
  fox: "🦊",
  owl: "🦉",
  bunny: "🐰",
  turtle: "🐢",
  star: "⭐",
  moon: "🌙",
};

function jsonHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (token) h["x-grownup-token"] = token;
  return h;
}

export async function listProfiles(): Promise<ProfileListItem[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) throw new Error(`list profiles ${res.status}`);
  return (await res.json()) as ProfileListItem[];
}

export async function createProfile(
  input: { name: string; avatar?: Avatar },
  token?: string,
): Promise<ProfileListItem> {
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Grown-ups passcode required");
    throw new Error(`create profile ${res.status}`);
  }
  return (await res.json()) as ProfileListItem;
}

export async function updateProfile(
  id: number,
  patch: { name?: string; avatar?: Avatar; companion?: string | null; onboardedAt?: string | null },
  token?: string,
): Promise<ProfileListItem> {
  const res = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Grown-ups passcode required");
    throw new Error(`update profile ${res.status}`);
  }
  return (await res.json()) as ProfileListItem;
}

export async function deleteProfile(id: number, token?: string): Promise<void> {
  const res = await fetch(`/api/profiles/${id}`, {
    method: "DELETE",
    headers: token ? { "x-grownup-token": token } : undefined,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Grown-ups passcode required");
    throw new Error(`delete profile ${res.status}`);
  }
}

export async function markOnboarded(id: number, companion?: string | null): Promise<void> {
  await updateProfile(id, {
    onboardedAt: new Date().toISOString(),
    ...(companion !== undefined ? { companion } : {}),
  });
}

export async function setCompanion(id: number, companion: string): Promise<void> {
  await updateProfile(id, { companion });
}
