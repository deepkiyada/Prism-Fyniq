import { cookies } from "next/headers";

export type FlashPayload = {
  type: "success" | "error";
  message: string;
};

const FLASH_COOKIE = "app_flash";

export async function setFlash(payload: FlashPayload) {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE, JSON.stringify(payload), {
    path: "/",
    sameSite: "lax",
    maxAge: 60,
  });
}

