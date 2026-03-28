import axios from "axios";
import { UserInfo } from "./types";

export const AUTH_STATE_EVENT = "auth-state-update";

export const notifyAuthStateChanged = () => {
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
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
    await axios.post("/api/logout");
  } finally {
    notifyAuthStateChanged();
  }
};
