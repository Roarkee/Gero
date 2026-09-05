import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button, Input } from "../../components/ui";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [id]: type === "checkbox" ? checked : value,
    });
    setErrors({ ...errors, [id]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success("Welcome back to Gero!");
      
      const user = useAuthStore.getState().user;
      if (user && user.is_client && !user.is_freelancer) {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } else {
      let errorMsg = "Login failed";
      if (typeof result.error === "string") {
        errorMsg = result.error;
      } else if (typeof result.error === "object") {
        errorMsg = Object.entries(result.error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("; ");
      }
      toast.error(errorMsg);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    const result = await googleLogin(credential);
    if (result.success) {
      toast.success("Welcome back to Gero!");
      const user = useAuthStore.getState().user;
      if (user && user.is_client && !user.is_freelancer) {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } else {
      toast.error(result.error || "Google Sign-In failed.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0a0a13] text-[#fcfcfc] font-sans selection:bg-[#6199f6]/30 selection:text-white relative">
      {/* Cosmic background effects on the form side */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#000b35_0%,transparent_60%)] pointer-events-none lg:left-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0e0f20_0%,transparent_50%)] pointer-events-none lg:left-1/2" />

      {/* Left Column: Cinematic Visual Panel (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#040407] border-r border-[#2a2a32]/30 flex-col justify-between p-12">
        {/* Glow halo */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#4f4f80]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-[#6199f6]/10 rounded-full blur-[100px]" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <span className="text-xl font-bold tracking-tight text-[#fcfcfc] flex items-center gap-2 font-mono">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6199f6] to-[#4f4f80] flex items-center justify-center text-[#0a0a13]">G</span>
            GERO
          </span>
        </Link>

        <div className="space-y-6 relative z-10 max-w-md">
          <div className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Intelligence
          </div>
          <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-[#fcfcfc]">
            The space where creative content projects forward.
          </h2>
          <p className="text-sm leading-relaxed text-[#757580]">
            Simplify how you run your business. Track tasks, view real-time intelligence, and invoice clients—all inside a dark suite designed for modern creatives.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#757580] relative z-10">
          GERO SYSTEM // VERSION 2.0.0
        </div>
      </div>

      {/* Right Column: Authentication Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[420px] space-y-8 bg-[#08080c]/60 backdrop-blur-xl p-8 rounded-2xl border border-[#4f4f80]/20 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
          <div className="text-left space-y-2">
            <h1 className="text-[28px] font-normal tracking-tight text-[#fcfcfc]">
              Welcome back
            </h1>
            <p className="text-sm text-[#757580]">
              Sign in to manage your workspace and clients.
            </p>
          </div>

          {/* Social Sign-In */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={(res) => handleGoogleSuccess(res.credential)}
              onError={() => toast.error("Google authentication failed.")}
              theme="filled_black"
              shape="pill"
              width="356"
            />
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-full h-[1px] bg-[#2a2a32]/60" />
            <span className="relative bg-[#08080c] px-4 text-xs font-mono tracking-wider text-[#757580] uppercase">
              Or credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-[12px] font-mono tracking-wider text-[#757580] uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757580]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/50 text-sm"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 font-mono mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[12px] font-mono tracking-wider text-[#757580] uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#6199f6] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757580]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#757580] hover:text-[#fcfcfc]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 font-mono mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#a3a3b3]">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#6199f6] bg-[#040407] border border-[#2a2a32] rounded focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-[#fcfcfc] transition-all font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-[#757580]">
              New to Gero?{" "}
              <Link to="/register" className="text-[#6199f6] hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
