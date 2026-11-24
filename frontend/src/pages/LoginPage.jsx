import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, UserCheck, ArrowRight, Store } from 'lucide-react';
import api from '../api/client';
import { useStore } from '../context/StoreContext';

export default function LoginPage() {
  const [mode, setMode] = useState('LOGIN');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gmailInput, setGmailInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { loginId, password });
      loginUser(res.data);
      if (res.data.user.role === 'ADMIN' || res.data.user.role === 'SUB_ADMIN') {
        navigate('/studio');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        fullName,
        email,
        phoneNumber,
        password
      });
      loginUser(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!gmailInput.includes('@')) {
      setError('Please enter a valid Gmail address.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google', {
        email: gmailInput,
        fullName: gmailInput.split('@')[0],
        googleToken: 'google-oauth-id-token'
      });
      loginUser(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillDemo = (id, pass) => {
    setMode('LOGIN');
    setLoginId(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#FCFBF8]">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Light Brand Panel */}
        <div className="md:col-span-5 bg-[#F6F3EC] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div>
            <div className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
              <span className="w-8 h-8 rounded-xl bg-[#1E6B52] text-white flex items-center justify-center">
                <Store className="w-4 h-4" />
              </span>
              <span>Bazaar<span className="text-[#1E6B52]">One</span></span>
            </div>
            <h2 className="font-display text-2xl text-slate-900 mt-6 leading-snug">
              Everyday essentials, delivered fast.
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Sign in with your Email ID, Phone Number, or Gmail account to receive instant email receipts after every order.
            </p>
          </div>

          <div className="mt-8 bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Demo Credentials
            </p>
            <button
              type="button"
              onClick={() => quickFillDemo('admin@bazaarone.in', 'admin123')}
              className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-slate-50 flex justify-between items-center"
            >
              <span className="font-semibold text-slate-800">Admin (Full Control)</span>
              <span className="text-slate-500">admin@bazaarone.in</span>
            </button>
            <button
              type="button"
              onClick={() => quickFillDemo('subadmin@bazaarone.in', 'subadmin123')}
              className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-slate-50 flex justify-between items-center"
            >
              <span className="font-semibold text-slate-800">Sub-Admin (Catalog)</span>
              <span className="text-slate-500">subadmin@bazaarone.in</span>
            </button>
            <button
              type="button"
              onClick={() => quickFillDemo('9876543212', 'user123')}
              className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-slate-50 flex justify-between items-center"
            >
              <span className="font-semibold text-slate-800">Customer (Phone Login)</span>
              <span className="text-slate-500">9876543212</span>
            </button>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 bg-white">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Email / Phone Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email ID or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>/</span>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter email@gmail.com or 9876543210"
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1E6B52] hover:bg-[#16523F] text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anmol Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID (For Order Receipts)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1E6B52] hover:bg-[#16523F] text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>{loading ? 'Creating account...' : 'Create Customer Account'}</span>
              </button>
            </form>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-medium">OR CONTINUE WITH GMAIL</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <form onSubmit={handleGmailSignIn} className="flex gap-2">
            <input
              type="email"
              value={gmailInput}
              onChange={(e) => setGmailInput(e.target.value)}
              placeholder="yourname@gmail.com"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1E6B52]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
                <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.8z"/>
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.1 7.4 24 12 24z"/>
              </svg>
              Gmail Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
