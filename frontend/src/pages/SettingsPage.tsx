import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { Settings as SettingsIcon, User, Bell, Clock, Globe, Shield, Save } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [timerSound, setTimerSound] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await authService.updateMe({
        name: name.trim(),
        timezone,
      });
      setUser(updated);
      addToast({ type: 'success', message: 'Settings saved successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Settings</h1>
          <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
            Configure your personal profile, notification preferences, and application defaults.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="neu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
          <User className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h2 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">
            Profile & Identity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-neutral-400 cursor-not-allowed bg-black/[0.02]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Timezone</label>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-secondary shrink-0" />
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary focus:outline-none bg-surface"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (GMT +0:00)</option>
              <option value="America/New_York">America/New_York (EST -5:00)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
              <option value="Europe/London">Europe/London (GMT +0:00)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* Focus & Productivity Preferences */}
      <div className="neu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
          <Clock className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h2 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">
            Focus Timer Preferences
          </h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-bold text-primary dark:text-neutral-100">Audio Chime on Completion</p>
            <p className="text-[11px] text-secondary dark:text-neutral-500">
              Play a gentle tone when a focus or break session finishes.
            </p>
          </div>
          <input
            type="checkbox"
            checked={timerSound}
            onChange={(e) => setTimerSound(e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-t border-black/5 dark:border-white/10">
          <div>
            <p className="text-xs font-bold text-primary dark:text-neutral-100">Desktop Notifications</p>
            <p className="text-[11px] text-secondary dark:text-neutral-500">
              Send native browser notifications even when the tab is in the background.
            </p>
          </div>
          <button
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then((res) => {
                  if (res === 'granted') {
                    addToast({ type: 'success', message: 'Notification permission granted' });
                  }
                });
              }
            }}
            className="px-3 py-1.5 neu-button text-xs font-semibold rounded-xl"
          >
            Request Permission
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className="neu-card p-6 space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
          <Shield className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h2 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">
            Security & Authentication
          </h2>
        </div>

        <p className="text-xs text-secondary dark:text-neutral-500 leading-relaxed">
          Your account is secured with Argon2 password hashing and stateless JWT bearer tokens.
          Session refreshes occur automatically over protected HttpOnly cookies.
        </p>
      </div>
    </div>
  );
};
