import { create } from "zustand";
import client from "../api/client";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token"),
  doctor: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await client.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      set({ token: data.access_token, loading: false });
      return true;
    } catch {
      set({ loading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      await client.post("/auth/register", { name, email, password });
      set({ loading: false });
      return true;
    } catch {
      set({ loading: false });
      return false;
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await client.get("/auth/me");
      set({ doctor: data });
    } catch {
      set({ doctor: null });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    set({ token: null, doctor: null });
  },
}));
