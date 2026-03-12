import type { Group } from "@/types/groups";

const ACTIVE_GROUP_KEY = "active_group_id";

function getSavedGroupId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_GROUP_KEY);
}

function saveGroupId(group: Group): void {
  if (typeof window !== "undefined")
    localStorage.setItem(ACTIVE_GROUP_KEY, JSON.stringify({ id: group.id }));
}

function clearGroupId(): void {
  if (typeof window !== "undefined")
    localStorage.removeItem(ACTIVE_GROUP_KEY);
}

export { ACTIVE_GROUP_KEY, getSavedGroupId, saveGroupId, clearGroupId };
