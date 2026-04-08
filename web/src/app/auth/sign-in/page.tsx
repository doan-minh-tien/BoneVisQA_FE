"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

/** Hand X-ray art inside hero (same as clinical mock) */
const AUTH_HERO_HAND_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAiGfyZ6N39coIC7rt9DV9aTzXRG6RQ_nWQrUfzvseTJTzVHZoXBwSIv12MmBhmdXCKbWX0yOvO1cYV7PD9UfLA4HJ5LJYbR5a7WCRZcFGuxPOQFKKtjmvoRikeflzrb1pXA0mbuqokEkhF31OBtOpjFP3RpC7nRzCvmcywMrtx7pTIWOhPMdPOVWxuysyjObpLWjp8rLnbU0NHM3ZEABxi3ERbJ1OOoVoLkfdOfqi-tAhLVrWIPi3aK0AnSjh9PsC7a76wlp81auU";
import { login } from "@/lib/api/auth";
import { http, getApiErrorMessage } from "@/lib/api/client";
import type { LoginResponse } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const motionEase = [0.22, 1, 0.36, 1] as const;

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

function isPendingOrUnassignedUser(payload: {
  roles?: string[] | null;
  status?: string | null;
  userStatus?: string | null;
}) {
  const normalizedStatus = (payload.status ?? payload.userStatus ?? '').trim().toLowerCase();
  if (normalizedStatus === 'pending') {
    return true;
  }

  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => r.trim().toLowerCase()).filter(Boolean)
    : [];
  if (roles.length === 0) {
    return true;
  }
  if (roles.includes('none') || roles.includes('unassigned') || roles.includes('pending')) {
    return true;
  }
  return false;
}

type LoginPageInnerProps = {
  googleEnabled: boolean;
};

/**
 * Renders the full login UI. When googleEnabled, this component must be a descendant of
 * GoogleOAuthProvider (single provider instance avoids extra GSI initialize warnings).
 */
function LoginPageInner({ googleEnabled }: LoginPageInnerProps) {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLoginSuccess = useCallback(
    (data: LoginResponse) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("fullName", data.fullName);
      localStorage.setItem("email", data.email);
      localStorage.setItem("roles", JSON.stringify(data.roles));
      const resolvedStatus = data.status ?? data.userStatus ?? null;
      if (resolvedStatus) {
        localStorage.setItem("userStatus", resolvedStatus);
      } else {
        localStorage.removeItem("userStatus");
      }

      if (isPendingOrUnassignedUser(data)) {
        localStorage.removeItem("activeRole");
        router.push("/pending-approval");
        return;
      }

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
    },
    [router],
  );

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

      const { data } = await http.post("/api/auths/google-login", {
        idToken: credentialResponse.credential,
      });

      if (data.success && data.token && data.roles) {
        handleLoginSuccess(data);
      } else if (data.success && data.requiresMedicalVerification) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId ?? "");
        localStorage.setItem("fullName", data.fullName ?? "");
        localStorage.setItem("email", data.email ?? "");
        toast.success(data.message || "Vui lòng xác nhận thông tin y khoa để hoàn tất đăng ký.");
        router.push("/auth/medical-verification");
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

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950">
      {/*
        dir="ltr" keeps hero on the left and form on the right regardless of browser locale.
        max-lg:hidden avoids Tailwind hidden/lg:flex ordering quirks; flex-col keeps content stacked.
        Background uses z-0 + isolate so it cannot paint over text/icons (z-10).
      */}
      <div
        dir="ltr"
        className="grid min-h-[100dvh] w-full grid-cols-1 items-stretch lg:grid-cols-[1.22fr_1fr]"
      >
        <motion.section
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: motionEase }}
          className="relative isolate max-lg:hidden min-h-[100dvh] w-full min-w-0 overflow-hidden bg-[#0A0A14] lg:flex lg:min-h-0 lg:flex-col"
        >
          {/* Animated mesh — soft drifting blobs + grid (no heavy JS). */}
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            <div className="absolute -left-[10%] top-[8%] h-[min(52vw,420px)] w-[min(52vw,420px)] rounded-full bg-blue-500/25 blur-3xl animate-blob" />
            <div className="absolute right-[-8%] top-[22%] h-[min(48vw,380px)] w-[min(48vw,380px)] rounded-full bg-cyan-400/20 blur-3xl animate-blob-slow" />
            <div className="absolute bottom-[5%] left-[18%] h-[min(44vw,340px)] w-[min(44vw,340px)] rounded-full bg-indigo-500/20 blur-3xl animate-blob-delayed" />
            <div className="absolute right-[12%] top-[55%] h-[min(36vw,280px)] w-[min(36vw,280px)] rounded-full bg-sky-400/15 blur-3xl animate-blob" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(0,123,255,0.18),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,auto,32px_32px,32px_32px]"
            aria-hidden
          />
          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col justify-between px-10 py-12 xl:px-16 xl:py-14">
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-accent/30 bg-cyan-accent/10">
                <Stethoscope className="h-7 w-7 text-cyan-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-white">BoneVisQA</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-accent/70">
                  Radiology Education
                </p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center py-8">
              <div className="relative flex aspect-square w-full max-w-[420px] items-center justify-center rounded-[40px] border border-cyan-accent/10 bg-white/[0.02]">
                <div className="absolute inset-8 rounded-[32px] border border-cyan-accent/15" />
                <div className="absolute inset-x-[10%] top-[12%] bottom-[28%] rounded-[28px] border border-cyan-accent/25 bg-cyan-accent/[0.02] shadow-[0_0_45px_rgba(0,229,255,0.08)]" />
                <div className="absolute inset-x-[14%] top-[16%] bottom-[32%] overflow-hidden rounded-2xl border-2 border-cyan-accent/80 shadow-[0_0_30px_rgba(0,229,255,0.26)]">
                  <img
                    src={AUTH_HERO_HAND_IMAGE}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-[0.12]"
                  />
                  <span className="absolute left-4 top-3 rounded-full border border-cyan-accent/60 bg-[#0A0A14]/90 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-cyan-accent backdrop-blur-sm">
                    AI BONE ANALYSIS
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center gap-6 text-cyan-accent/90">
                    <ScanSearch className="h-10 w-10 shrink-0" />
                    <Cpu className="h-10 w-10 shrink-0" />
                    <Activity className="h-10 w-10 shrink-0" />
                  </div>
                </div>
                <div className="absolute bottom-10 left-10 right-10 grid grid-cols-3 gap-2 text-[10px] text-slate-300 sm:gap-3 sm:text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 sm:px-3">
                    Lesion localization
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 sm:px-3">
                    Multimodal retrieval
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 sm:px-3">
                    Explainable report
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="max-w-xl shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: motionEase }}
            >
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                BoneVisQA
              </h1>
              <p className="mt-3 text-base font-medium leading-relaxed text-cyan-accent/90 xl:text-lg">
                AI-Powered Interactive Visual Question Answering for Radiology
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                A medical imaging workspace for students, lecturers, experts, and administrators to
                analyze radiographs, validate AI reasoning, and accelerate radiology education.
              </p>
            </motion.div>
          </div>
        </motion.section>

        <section className="flex min-h-[100dvh] min-w-0 items-center justify-center bg-surface px-6 py-10 lg:min-h-0">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: motionEase }}
          >
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

            <motion.div
              className="rounded-[28px] border border-border-color bg-surface p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: motionEase }}
            >
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
                  <div className="mb-1.5 flex items-center justify-between px-0.5">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-text-main"
                    >
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-xl border border-border-color bg-background px-4 py-3 pr-11 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary [&::-ms-clear]:hidden [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
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

              {!googleEnabled ? (
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
                          "Google sign-in popup failed or was closed. Check Google Cloud origins for this URL.";
                        console.warn("Google login onError:", msg);
                        setError(msg);
                        toast.error(msg);
                      }}
                      useOneTap={false}
                    />
                  </div>
                </div>
              )}

              <p className="mt-8 text-center text-sm text-text-muted">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-bold text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const hasGoogleClientId = googleClientId.length > 0;

  if (!hasGoogleClientId) {
    return <LoginPageInner googleEnabled={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginPageInner googleEnabled />
    </GoogleOAuthProvider>
  );
}
