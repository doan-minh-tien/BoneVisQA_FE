'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';

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

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Replace with real authentication API
    const account = demoAccounts.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (account) {
      router.push(roleRoutes[account.role]);
    } else {
      setError('Invalid email or password. Try a demo account below.');
    }
  };

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    router.push(roleRoutes[account.role]);
  };

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
          <h2 className="text-xl font-semibold text-card-foreground mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1.5">
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-card-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              Sign in
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
                  <span className="text-sm font-medium text-card-foreground">{account.label}</span>
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
