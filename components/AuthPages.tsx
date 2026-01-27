
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthPagesProps {
  type: 'login' | 'signup';
  onSwitch: () => void;
  onSuccess: () => void;
  onBack: () => void;
}

const AuthPages: React.FC<AuthPagesProps> = ({ type, onSwitch, onSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (type === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        // If Supabase is configured for OTP, we move to verification step
        // Even if it's link-based, showing the OTP UI is what the user requested
        setIsVerifying(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (verifyError) throw verifyError;
      
      if (data.session) {
        onSuccess();
      } else {
        throw new Error("Verification failed. Please check your code.");
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#fcfaf2] flex flex-col md:flex-row animate-in fade-in duration-700">
        <div className="hidden md:flex md:w-1/2 bg-[#2d3436] p-24 flex-col justify-between text-[#fcfaf2]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
              <i className="fa-solid fa-feather text-[#2d3436] text-sm"></i>
            </div>
            <span className="font-bold text-2xl tracking-tight">Lumina</span>
          </div>
          <div className="space-y-6">
            <h2 className="text-6xl font-light tracking-tight leading-tight">
              Verify your <br/> <span className="font-bold italic">identity.</span>
            </h2>
            <p className="text-stone-400 text-lg max-w-md font-medium leading-relaxed">
              We've dispatched a secure verification protocol to your email registry. Enter the 6-digit code to finalize your access.
            </p>
          </div>
          <div className="text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">
            Encrypted Verification Active
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
          <div className="max-w-md w-full mx-auto space-y-10">
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-[#2d3436]">Confirmation</h1>
              <p className="text-stone-500 font-medium">Enter the code sent to <span className="text-[#2d3436] font-bold">{email}</span></p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm animate-in slide-in-from-top-2 duration-300">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">6-Digit Access Token</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-6 py-5 bg-white border border-stone-200 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#2d3436]/10 focus:border-[#2d3436] transition-all placeholder:text-stone-100"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading || otp.length < 6}
                className={`
                  w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.3em] transition-all shadow-xl
                  ${isLoading || otp.length < 6
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                    : 'bg-[#2d3436] text-white hover:scale-[1.02] active:scale-[0.98]'}
                `}
              >
                {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Confirm Registry'}
              </button>
            </form>

            <div className="pt-6 text-center">
              <button 
                onClick={() => setIsVerifying(false)}
                className="text-stone-400 hover:text-[#2d3436] font-bold text-sm transition-colors"
              >
                Incorrect email? Return to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf2] flex flex-col md:flex-row animate-in fade-in duration-700">
      {/* Visual Side */}
      <div className="hidden md:flex md:w-1/2 bg-[#2d3436] p-24 flex-col justify-between text-[#fcfaf2]">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
            <i className="fa-solid fa-feather text-[#2d3436] text-sm"></i>
          </div>
          <span className="font-bold text-2xl tracking-tight">Lumina</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-6xl font-light tracking-tight leading-tight">
            Refined intelligence <br/> is <span className="font-bold italic">one step away.</span>
          </h2>
          <p className="text-stone-400 text-lg max-w-md font-medium leading-relaxed">
            Access the world's most sophisticated agent architecture. Simple, powerful, and deeply insightful.
          </p>
        </div>
        <div className="text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">
          Lumina Security Layer v3.04.1
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="md:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#2d3436] flex items-center justify-center shadow-lg" onClick={onBack}>
              <i className="fa-solid fa-feather text-white text-sm"></i>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-[#2d3436]">
              {type === 'login' ? 'Welcome Back' : 'Join the Luminal'}
            </h1>
            <p className="text-stone-500 font-medium">
              {type === 'login' 
                ? 'Enter your credentials to access the terminal.' 
                : 'Create your account to start your journey.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm animate-in slide-in-from-top-2 duration-300">
              <i className="fa-solid fa-circle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Email Registry</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@lumina.io"
                className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2d3436]/10 focus:border-[#2d3436] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Security Phrase</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2d3436]/10 focus:border-[#2d3436] transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.3em] transition-all shadow-xl
                ${isLoading 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                  : 'bg-[#2d3436] text-white hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                type === 'login' ? 'Authenticate' : 'Establish Registry'
              )}
            </button>
          </form>

          <div className="pt-6 text-center">
            <button 
              onClick={onSwitch}
              className="text-stone-400 hover:text-[#2d3436] font-bold text-sm transition-colors"
            >
              {type === 'login' 
                ? "Don't have an identity yet? Sign Up" 
                : "Already established? Login"}
            </button>
          </div>

          <button 
            onClick={onBack}
            className="w-full text-stone-300 hover:text-stone-400 transition-colors pt-12 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
            Return to Surface
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
