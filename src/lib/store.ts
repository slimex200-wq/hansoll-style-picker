const USER_ID_KEY = "hansoll-user-id";
const USER_NAME_KEY = "hansoll-user-name";

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
  getUserId();
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

