import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log("Login attempt with:", { email, password: "***" });
          const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
            email: email, // Send email field directly
            password,
          });
          console.log("Login response:", response.data);

          const { access, refresh } = response.data;

          if (!access) {
            throw new Error("No access token received");
          }

          localStorage.setItem("accessToken", access);
          localStorage.setItem("refreshToken", refresh);
          // Debug toast
          // import toast from "react-hot-toast"; (ensure import at top if not present, but using simple console for now if imports tricky, actually let's add toast import)

          // Fetch user profile
          try {
            const profileResponse = await apiClient.get(API_ENDPOINTS.PROFILE);
            set({
              user: profileResponse.data,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          } catch (profileError) {
            console.error("Profile fetch failed:", profileError);
            throw new Error(
              "Login successful but failed to load profile: " +
                (profileError.message || "Unknown error"),
            );
          }
        } catch (error) {
          console.error("Login error:", error);
          set({ isLoading: false });
          return {
            success: false,
            error:
              error.response?.data?.detail ||
              error.response?.data ||
              error.message ||
              "Login failed",
          };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          await apiClient.post(API_ENDPOINTS.REGISTER, userData);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data || "Registration failed",
          };
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            await apiClient.post(API_ENDPOINTS.LOGOUT, {
              refresh: refreshToken,
            });
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await apiClient.get(API_ENDPOINTS.PROFILE);
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          set({ isAuthenticated: false, user: null });
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
