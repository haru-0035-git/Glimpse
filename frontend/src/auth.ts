import axios from "axios";
import { UserInfo } from "./types";

export const AUTH_STATE_EVENT = "auth-state-update";
const XSRF_COOKIE_NAME = "XSRF-TOKEN";

let csrfRequest: Promise<void> | null = null;

export const notifyAuthStateChanged = () => {
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
};

const hasCookie = (name: string) => {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${name}=`));
};

export const ensureCsrfToken = async (): Promise<void> => {
  if (hasCookie(XSRF_COOKIE_NAME)) {
    return;
  }

  if (!csrfRequest) {
    csrfRequest = axios.get("/api/csrf").then(() => undefined).finally(() => {
      csrfRequest = null;
    });
  }

  await csrfRequest;
};

export const fetchCurrentUser = async (): Promise<UserInfo | null> => {
  try {
    const response = await axios.get<UserInfo>("/api/me");
    return response.data;
  } catch {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await ensureCsrfToken();
    await axios.post("/api/logout");
  } finally {
    notifyAuthStateChanged();
  }
};
