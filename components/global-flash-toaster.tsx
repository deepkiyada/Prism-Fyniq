"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type FlashPayload = {
  type: "success" | "error";
  message: string;
};

function readFlashCookie(): FlashPayload | null {
  const cookieKey = "app_flash=";
  const cookiePart = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(cookieKey));

  if (!cookiePart) {
    return null;
  }

  try {
    const raw = decodeURIComponent(cookiePart.slice(cookieKey.length));
    const parsed = JSON.parse(raw) as FlashPayload;
    if (!parsed?.message || (parsed.type !== "success" && parsed.type !== "error")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearFlashCookie() {
  document.cookie = "app_flash=; Max-Age=0; Path=/; SameSite=Lax";
}

export function GlobalFlashToaster() {
  useEffect(() => {
    const flash = readFlashCookie();
    if (!flash) {
      return;
    }

    if (flash.type === "success") {
      toast.success(flash.message);
    } else {
      toast.error(flash.message);
    }

    clearFlashCookie();
  }, []);

  return null;
}
