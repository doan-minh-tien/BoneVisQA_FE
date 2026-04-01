"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import {
  Activity,
  Cpu,
  Eye,
  EyeOff,
  ScanSearch,
  Stethoscope,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import { http, getApiErrorMessage } from "@/lib/api/client";
import type { LoginResponse } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

function getRouteForRole(role: string | null | undefined) {
  switch (role?.trim().toLowerCase()) {
    case "student":
      return { activeRole: "student", route: "/student/dashboard" };
    case "lecturer":
      return { activeRole: "lecturer", route: "/lecturer/dashboard" };
    case "expert":
      return { activeRole: "expert", route: "/expert/dashboard" };
    case "admin":
      return { activeRole: "admin", route: "/admin/dashboard" };
    default:
      return { activeRole: null, route: "/" };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = (data: LoginResponse) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.email);
    localStorage.setItem("roles", JSON.stringify(data.roles));
    const primaryRole = Array.isArray(data.roles)
      ? data.roles.find((role: string) => getRouteForRole(role).activeRole)
      : null;
    const { activeRole, route } = getRouteForRole(primaryRole);

    if (activeRole) {
      localStorage.setItem("activeRole", activeRole);
    } else {
      localStorage.removeItem("activeRole");
    }

    router.push(route);
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

      const msg = data.message || "Invalid email or password.";
      setError(msg);
      toast.error(msg);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message || "Cannot connect to server. Please try again.");
      toast.error(message || "Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setError("");
    setLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error("Google did not return a credential token.");
      }

      const { data } = await http.post("/api/Auths/google-login", {
        token: credentialResponse.credential,
      });

      if (data.success && data.token && data.roles) {
        handleLoginSuccess(data);
      } else {
        const message = data.message || "Google login failed.";
        setError(message);
        toast.error(message);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      console.warn("Google login failed:", message);
      setError(message || "Cannot connect to server. Please try again later.");
      toast.error(message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const hasGoogleClientId = googleClientId.length > 0;

  const loginCard = (
    <div className="min-h-screen w-full bg-slate-950">
      <div className="grid min-h-screen w-full lg:grid-cols-[1.22fr_1fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(0,123,255,0.18),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,auto,32px_32px,32px_32px]" />
          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-14 xl:px-16">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-accent/30 bg-cyan-accent/10">
                <Stethoscope className="h-7 w-7 text-cyan-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-white">BoneVisQA</p>
                <p className="text-sm text-slate-300">Radiology Education</p>
              </div>
            </div>

            <div className="grid flex-1 place-items-center py-10">
              <div className="relative flex h-[420px] w-[420px] items-center justify-center rounded-[40px] border border-cyan-accent/10 bg-white/[0.02]">
                <div className="absolute inset-8 rounded-[32px] border border-cyan-accent/15" />
                <div className="absolute inset-x-12 top-16 h-[220px] rounded-[28px] border border-cyan-accent/25 bg-cyan-accent/[0.02] shadow-[0_0_45px_rgba(0,229,255,0.08)]" />
                <div className="absolute inset-x-20 top-24 h-[170px] rounded-[24px] border-2 border-cyan-accent/80 shadow-[0_0_30px_rgba(0,229,255,0.26)] animate-pulse">
                  <span className="absolute -top-3 left-5 rounded-full border border-cyan-accent/60 bg-slate-950 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-cyan-accent">
                    AI BONE ANALYSIS
                  </span>
                </div>
                <div className="absolute inset-x-16 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-accent to-transparent opacity-80 animate-pulse" />
                <div className="absolute inset-x-24 bottom-24 flex items-center justify-between text-cyan-accent/80">
                  <ScanSearch className="h-10 w-10" />
                  <Cpu className="h-10 w-10" />
                  <Activity className="h-10 w-10" />
                </div>
                <div className="absolute bottom-12 left-12 right-12 grid grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    Lesion localization
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    Multimodal retrieval
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    Explainable report
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                BoneVisQA
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                AI-Powered Interactive Visual Question Answering for Radiology.
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                A medical imaging workspace for students, lecturers, experts, and administrators
                to analyze radiographs, validate AI reasoning, and accelerate radiology education.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Secure access
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-main">
                Sign in to BoneVisQA
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Continue to your clinical workspace with your institutional account.
              </p>
            </div>

            <div className="rounded-[28px] border border-border-color bg-surface p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              {error ? (
                <div className="mb-5 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-text-main"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.edu"
                    required
                    className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-text-main"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-xl border border-border-color bg-background px-4 py-3 pr-11 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border-color" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-border-color" />
              </div>

              {!hasGoogleClientId ? (
                <div className="w-full rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  Missing Google Client ID in .env file
                </div>
              ) : (
                <div className="rounded-xl border border-border-color bg-background p-3">
                  <div className="mb-3 flex items-center gap-3 text-sm text-text-muted">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                      <span className="text-sm font-bold text-[#4285F4]">G</span>
                    </div>
                    <span>Sign in with Google</span>
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleLoginSuccess}
                      onError={() => {
                        const msg =
                          "Google sign-in popup failed or was closed. Please try again.";
                        console.warn("Google login onError:", msg);
                        setError(msg);
                        toast.error(msg);
                      }}
                      useOneTap={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  if (!hasGoogleClientId) return loginCard;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {loginCard}
    </GoogleOAuthProvider>
  );
}
