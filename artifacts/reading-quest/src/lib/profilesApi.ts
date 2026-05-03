export interface ProfileListItem {
  id: number;
  name: string;
  avatar: string;
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

export async function listProfiles(): Promise<ProfileListItem[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) throw new Error(`list profiles ${res.status}`);
  return (await res.json()) as ProfileListItem[];
}

export async function createProfile(input: { name: string; avatar?: Avatar }): Promise<ProfileListItem> {
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`create profile ${res.status}`);
  return (await res.json()) as ProfileListItem;
}

export async function updateProfile(
  id: number,
  patch: { name?: string; avatar?: Avatar; onboardedAt?: string | null },
): Promise<ProfileListItem> {
  const res = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update profile ${res.status}`);
  return (await res.json()) as ProfileListItem;
}

export async function deleteProfile(id: number): Promise<void> {
  const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete profile ${res.status}`);
}

export async function markOnboarded(id: number): Promise<void> {
  await updateProfile(id, { onboardedAt: new Date().toISOString() });
}
