'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Eye,
  EyeOff,
  GraduationCap,
  UserCog,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { login } from '@/lib/api';

const demoAccounts = [
  { email: 'student@bonevisqa.com', password: '123456', role: 'student', label: 'Student' },
  { email: 'lecturer@bonevisqa.com', password: '123456', role: 'lecturer', label: 'Lecturer' },
  { email: 'expert@bonevisqa.com', password: '123456', role: 'expert', label: 'Expert' },
  { email: 'curator@bonevisqa.com', password: '123456', role: 'curator', label: 'Curator' },
  { email: 'admin@bonevisqa.com', password: '123456', role: 'admin', label: 'Admin' },
];

const roleRoutes: Record<string, string> = {
  student: '/student/dashboard',
  lecturer: '/lecturer/dashboard',
  expert: '/expert/dashboard',
  curator: '/curator/dashboard',
  admin: '/admin/dashboard',
};

const roleIcons: Record<string, typeof Stethoscope> = {
  student: GraduationCap,
  lecturer: UserCog,
  expert: Stethoscope,
  curator: BookOpen,
  admin: ShieldCheck,
};

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  student: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary' },
  lecturer: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent' },
  expert: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning' },
  curator: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary' },
  admin: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive' },
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role selection state
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);

      if (data.success && data.token && data.roles) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('email', data.email);
        localStorage.setItem('roles', JSON.stringify(data.roles));

        // Multiple roles → show role picker
        if (data.roles.length > 1) {
          setAvailableRoles(data.roles.map((r) => r.toLowerCase()));
          setUserName(data.fullName);
          setShowRolePicker(true);
          setLoading(false);
          return;
        }

        // Single role → go directly
        const role = data.roles[0]?.toLowerCase();
        localStorage.setItem('activeRole', role);
        router.push(roleRoutes[role] ?? '/');
        return;
      }

      setError(data.message || 'Invalid email or password.');
    } catch {
      // API failed — fallback to demo accounts
      const demo = demoAccounts.find((a) => a.email === email && a.password === password);
      if (demo) {
        localStorage.setItem('token', 'demo');
        localStorage.setItem('userId', '');
        localStorage.setItem('fullName', demo.label);
        localStorage.setItem('email', demo.email);
        localStorage.setItem('roles', JSON.stringify([demo.role]));
        localStorage.setItem('activeRole', demo.role);
        router.push(roleRoutes[demo.role]);
        return;
      }
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (account: (typeof demoAccounts)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleRoleSelect = (role: string) => {
    localStorage.setItem('activeRole', role);
    router.push(roleRoutes[role] ?? '/');
  };

  // Role picker screen
  if (showRolePicker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">BoneVisQA</h1>
            <p className="text-sm text-muted-foreground mt-1">Medical Education Platform</p>
          </div>

          {/* Role Picker Card */}
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
                      <p className="font-semibold text-card-foreground capitalize">{role}</p>
                      <p className="text-xs text-muted-foreground">
                        {role === 'student' && 'Access cases, quizzes & AI Q&A'}
                        {role === 'lecturer' && 'Manage classes, assignments & analytics'}
                        {role === 'expert' && 'Review cases, Q&A answers & quizzes'}
                        {role === 'curator' && 'Manage documents & indexing pipeline'}
                        {role === 'admin' && 'System administration & user management'}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">BoneVisQA</h1>
          <p className="text-sm text-muted-foreground mt-1">Medical Education Platform</p>
        </div>

        {/* Login Card */}
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
            {/* Email */}
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

            {/* Password */}
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
                  type={showPassword ? 'text' : 'password'}
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-card-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-sm font-medium text-card-foreground mb-3">Demo Accounts</p>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border hover:bg-input/50 cursor-pointer transition-colors duration-150 text-left"
              >
                <div>
                  <span className="text-sm font-medium text-card-foreground">
                    {account.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{account.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">pw: {account.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
