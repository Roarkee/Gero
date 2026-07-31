import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, Sparkles } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register, googleLogin, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: "" });
  };

  const handleValidation = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    
    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!handleValidation()) return;

    // Send payload matching backend expected UserSerializer fields
    const payload = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
    };

    const result = await register(payload);

    if (result.success) {
      toast.success("Account created successfully! Please log in.");
      navigate("/login");
    } else {
      let errorMsg = "Registration failed";
      if (typeof result.error === "object") {
        errorMsg = Object.entries(result.error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("; ");
      } else if (typeof result.error === "string") {
        errorMsg = result.error;
      }
      toast.error(errorMsg);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    const result = await googleLogin(credential);
    if (result.success) {
      toast.success("Logged in with Google successfully!");
      navigate("/dashboard");
    } else {
      toast.error(result.error || "Google Sign-In failed.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0a0a13] text-[#fcfcfc] font-sans selection:bg-[#6199f6]/30 selection:text-white relative">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#000b35_0%,transparent_60%)] pointer-events-none lg:left-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0e0f20_0%,transparent_50%)] pointer-events-none lg:left-1/2" />

      {/* Left Column: Cinematic Visual Panel (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#040407] border-r border-[#2a2a32]/30 flex-col justify-between p-12">
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
            <Sparkles className="w-3.5 h-3.5" /> Premium Freelancer Suite
          </div>
          <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-[#fcfcfc]">
            Get started with Gero today.
          </h2>
          <p className="text-sm leading-relaxed text-[#757580]">
            Create a unified home for your client pipeline, timesheets, and finance insights. Experience the productivity shift with beautifully engineered, cinematic design.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#757580] relative z-10">
          GERO SYSTEM // VERSION 2.0.0
        </div>
      </div>

      {/* Right Column: Authentication Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[460px] space-y-6 bg-[#08080c]/60 backdrop-blur-xl p-8 rounded-2xl border border-[#4f4f80]/20 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
          <div className="text-left space-y-1">
            <h1 className="text-[28px] font-normal tracking-tight text-[#fcfcfc]">
              Create account
            </h1>
            <p className="text-sm text-[#757580]">
              Let's set up your premium freelancer workspace.
            </p>
          </div>

          {/* Social Sign-In */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={(res) => handleGoogleSuccess(res.credential)}
              onError={() => toast.error("Google authentication failed.")}
              theme="filled_black"
              shape="pill"
              width="396"
            />
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute w-full h-[1px] bg-[#2a2a32]/60" />
            <span className="relative bg-[#08080c] px-4 text-xs font-mono tracking-wider text-[#757580] uppercase">
              Or email registration
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono tracking-wider text-[#757580] uppercase">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757580]">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-10 pr-4 py-2 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/30 text-sm"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-xs text-rose-500 font-mono mt-1">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono tracking-wider text-[#757580] uppercase">
                  Last Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757580]">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-10 pr-4 py-2 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/30 text-sm"
                  />
                </div>
                {errors.last_name && (
                  <p className="text-xs text-rose-500 font-mono mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono tracking-wider text-[#757580] uppercase">
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
                  className="w-full pl-10 pr-4 py-2 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/30 text-sm"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 font-mono mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono tracking-wider text-[#757580] uppercase">
                Password (min. 8 characters)
              </label>
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
                  className="w-full pl-10 pr-10 py-2 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/30 text-sm"
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

            <div className="space-y-1">
              <label className="block text-[11px] font-mono tracking-wider text-[#757580] uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#757580]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-[#040407] border border-[#2a2a32] focus:border-[#6199f6] focus:ring-1 focus:ring-[#6199f6] rounded-xl outline-none transition-all text-[#fcfcfc] placeholder:text-[#757580]/30 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#757580] hover:text-[#fcfcfc]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-rose-500 font-mono mt-1">{errors.confirm_password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-[#fcfcfc] transition-all font-semibold rounded-xl text-sm flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="text-center pt-1">
            <p className="text-sm text-[#757580]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#6199f6] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
