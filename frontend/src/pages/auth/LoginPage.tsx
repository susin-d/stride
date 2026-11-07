import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { useUIStore } from '@/store/uiStore';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setToken(data.access_token);
      setUser(data.user);
      addToast({ type: 'success', message: `Welcome back, ${data.user.name}!` });
      navigate('/today');
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.detail || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@stride.app');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background text-primary">
      <div className="w-full max-w-md neu-card p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-fg flex items-center justify-center text-xl font-bold shadow-lg mx-auto">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Sign in to STRIDE</h1>
        </div>

        {/* Demo Account Helper Pill */}
        <button
          type="button"
          onClick={handleDemoFill}
          className="w-full py-2.5 px-3 bg-surface hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-primary transition-colors border border-border"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Auto-fill Demo Credentials</span>
        </button>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@stride.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input rounded-xl text-xs text-primary placeholder:text-secondary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input rounded-xl text-xs text-primary placeholder:text-secondary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-accent-fg text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Register Link */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
