import type { AuthAccount } from "@/lib/types/auth";

const LOCAL_AVATAR_KEY = "bizflow_auth_avatar_data_url";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert avatar blob"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read avatar blob"));
    reader.readAsDataURL(blob);
  });
}

export function clearLocalAvatarCache() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LOCAL_AVATAR_KEY);
}

export async function persistAccountWithLocalAvatar(
  account: AuthAccount | null | undefined,
): Promise<AuthAccount | null | undefined> {
  if (!isBrowser()) {
    return account;
  }

  if (!account) {
    clearLocalAvatarCache();
    return account;
  }

  clearLocalAvatarCache();

  const sourceAvatarUrl = account.avatarUrl?.trim() ?? "";
  if (!sourceAvatarUrl) {
    return { ...account, avatarUrl: "" };
  }

  if (sourceAvatarUrl.startsWith("data:")) {
    window.localStorage.setItem(LOCAL_AVATAR_KEY, sourceAvatarUrl);
    return { ...account, avatarUrl: sourceAvatarUrl };
  }

  try {
    const response = await fetch(sourceAvatarUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return { ...account, avatarUrl: "" };
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    window.localStorage.setItem(LOCAL_AVATAR_KEY, dataUrl);

    return { ...account, avatarUrl: dataUrl };
  } catch {
    return { ...account, avatarUrl: "" };
  }
}
