import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: _login } = useAuthStore();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Bad link — missing params
  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <p className="text-rose-500 font-medium">Invalid invitation link.</p>
          <p className="text-sm text-gray-500 mt-1">Please contact the person who invited you.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.ACCEPT_INVITE, { uid, token, password });
      const { access, refresh, user } = res.data;

      // Store tokens and user — mirrors what authStore.login does
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      useAuthStore.setState({ user, isAuthenticated: true });

      setDone(true);
      toast.success("Welcome to Gero!");
      navigate("/portal/invoices", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. The link may have expired.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            G
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Gero</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Set your password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose a password to access your client portal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Repeat password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || done}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? "Setting up your account..." : "Set password & continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
