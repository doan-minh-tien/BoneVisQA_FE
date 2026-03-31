"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  Stethoscope,
  Eye,
  EyeOff,
  GraduationCap,
  UserCog,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { login } from "@/lib/api";

const roleRoutes: Record<string, string> = {
  student: "/student/dashboard",
  lecturer: "/lecturer/dashboard",
  expert: "/expert/dashboard",
  admin: "/admin/dashboard",
};

const roleIcons: Record<string, typeof Stethoscope> = {
  student: GraduationCap,
  lecturer: UserCog,
  expert: Stethoscope,
  admin: ShieldCheck,
};

const roleColors: Record<string, { bg: string; text: string; border: string }> =
  {
    student: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary",
    },
    lecturer: {
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent",
    },
    expert: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning",
    },
    admin: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive",
    },
  };

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Role selection state
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userName, setUserName] = useState("");

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.email);
    localStorage.setItem("roles", JSON.stringify(data.roles));

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    if (data.roles.length > 1) {
      setAvailableRoles(data.roles.map((r: string) => r.toLowerCase()));
      setUserName(data.fullName);
      setShowRolePicker(true);
      return;
    }

    const role = data.roles[0]?.toLowerCase();
    localStorage.setItem("activeRole", role);
    router.push(roleRoutes[role] ?? "/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success && data.token && data.roles) {
        handleLoginSuccess(data);
        return;
      }
      setError(data.message || "Invalid email or password.");
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://bonevisqa.onrender.com/api/Auths/google-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: credentialResponse.credential }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success && data.token && data.roles) {
        handleLoginSuccess(data);
      } else {
        setError(data.message || "Google login failed.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    localStorage.setItem("activeRole", role);
    router.push(roleRoutes[role] ?? "/");
  };

  if (showRolePicker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">BoneVisQA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Medical Education Platform
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <button
              onClick={() => {
                setShowRolePicker(false);
                setAvailableRoles([]);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-card-foreground mb-4 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>

            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Welcome, {userName}!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account has multiple roles. Choose one to continue:
            </p>

            <div className="space-y-3">
              {availableRoles.map((role) => {
                const Icon = roleIcons[role] ?? ShieldCheck;
                const colors = roleColors[role] ?? roleColors.admin;

                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:${colors.border} hover:${colors.bg} cursor-pointer transition-all duration-150 group`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-card-foreground capitalize">
                        {role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role === "student" && "Access cases, quizzes & AI Q&A"}
                        {role === "lecturer" &&
                          "Manage classes, assignments & analytics"}
                        {role === "expert" &&
                          "Review cases, Q&A answers & quizzes"}
                        {role === "admin" &&
                          "System administration & user management"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Khai báo sẵn Client ID để chạy mà không bị lỗi
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "460789969186-6fv8r174fiioshd1b57s32dfu8167ji5.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">BoneVisQA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Medical Education Platform
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-card-foreground mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-card-foreground mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-card-foreground">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <div className="h-px bg-border flex-1"></div>
              <span className="px-3 text-sm text-muted-foreground">
                Or continue with
              </span>
              <div className="h-px bg-border flex-1"></div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() =>
                  setError("Google Login failed. Please try again.")
                }
              />
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/register" className="text-primary hover:underline font-medium">
                Register now
              </a>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
