import React, { useState } from 'react';
import { 
  Boxes, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { api } from '../../api/client';

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@stocksense.io');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        onLoginSuccess(res.user);
      } else if (mode === 'signup') {
        const res = await api.signup({ name, email, password });
        onLoginSuccess(res.user);
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword({ email });
        setInfoMsg(`OTP Generated: ${res.devOtp || '123456'} (Dev Mode)`);
        if (res.devOtp) setOtp(res.devOtp);
        setMode('reset');
      } else if (mode === 'reset') {
        await api.resetPassword({ email, otp, newPassword });
        setInfoMsg('Password reset successfully! You can now log in.');
        setMode('login');
        setPassword(newPassword);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@stocksense.io');
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20 mb-3">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockSense IMS</h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to access real-time warehouse inventory'}
            {mode === 'signup' && 'Create your IMS administrator account'}
            {mode === 'forgot' && 'Reset your password with OTP verification'}
            {mode === 'reset' && 'Enter your OTP and set a new password'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Demo Admin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="admin@stocksense.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">OTP Code</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset OTP'}
              {mode === 'reset' && 'Reset Password'}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-2 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Quick Demo Fill Button */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 transition"
          >
            Fill Demo Credentials (admin@stocksense.io)
          </button>
        </div>
      </div>
    </div>
  );
};
