import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { useUIStore } from '@/store/uiStore';
import { ArrowRight, Lock, Mail, User, Globe } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        timezone,
      });
      setToken(data.access_token);
      setUser(data.user);
      addToast({ type: 'success', message: 'Account created! Welcome to STRIDE.' });
      navigate('/today');
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.detail || 'Registration failed. Try a different email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background text-primary">
      <div className="w-full max-w-md neu-card p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-fg flex items-center justify-center text-xl font-bold shadow-lg mx-auto">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Create an Account</h1>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Susindran"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input rounded-xl text-xs text-primary placeholder:text-secondary focus:outline-none"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-primary mb-1">
              Password (min. 8 characters)
            </label>
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

          <div>
            <label className="block text-xs font-semibold text-primary mb-1">Timezone</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 neu-input rounded-xl text-xs text-primary focus:outline-none bg-surface"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (GMT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-accent-fg text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
