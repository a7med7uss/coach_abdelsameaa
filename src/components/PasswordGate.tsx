import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import LogoImg from '../assets/Logo.jpeg';

interface PasswordGateProps {
  onSuccess: () => void;
}

const PASSWORD_KEY = 'hc_access_gate_unlocked';
const ATTEMPTS_KEY = 'hc_gate_failed_attempts';
const LOCK_UNTIL_KEY = 'hc_gate_lock_until';
const CORRECT_PASS = 'abdelsameaa113418#';
const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Check existing lock and session on mount
  useEffect(() => {
    const isUnlocked = sessionStorage.getItem(PASSWORD_KEY);
    if (isUnlocked === 'true') {
      onSuccess();
      return;
    }

    const checkLock = () => {
      const lockUntilStr = localStorage.getItem(LOCK_UNTIL_KEY);
      if (lockUntilStr) {
        const lockUntil = parseInt(lockUntilStr, 10);
        const now = Date.now();
        if (lockUntil > now) {
          setRemainingTime(Math.ceil((lockUntil - now) / 1000));
          return true;
        } else {
          // Lock expired
          localStorage.removeItem(LOCK_UNTIL_KEY);
          localStorage.removeItem(ATTEMPTS_KEY);
          setRemainingTime(0);
        }
      }
      return false;
    };

    checkLock();

    const interval = setInterval(() => {
      const isLocked = checkLock();
      if (!isLocked && remainingTime > 0) {
        setRemainingTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onSuccess, remainingTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If currently locked, prevent submission
    if (remainingTime > 0) {
      return;
    }

    if (!password) {
      setErrorMsg('يرجى إدخال كلمة المرور للمتابعة');
      return;
    }

    if (password === CORRECT_PASS) {
      // Success
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCK_UNTIL_KEY);
      sessionStorage.setItem(PASSWORD_KEY, 'true');
      setErrorMsg(null);
      onSuccess();
    } else {
      // Incorrect password
      const currentAttempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPTS_KEY, currentAttempts.toString());

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(LOCK_UNTIL_KEY, lockUntil.toString());
        setRemainingTime(Math.ceil(LOCK_DURATION_MS / 1000));
        setErrorMsg('تم استنفاد المحاولات المسموحة (3 محاولات). تم قفل الدخول لمدة 5 دقائق.');
      } else {
        const left = MAX_ATTEMPTS - currentAttempts;
        setErrorMsg(`كلمة المرور غير صحيحة. متبقي لديك ${left} ${left === 1 ? 'محاولة واحدة' : 'محاولات'}.`);
      }
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/80 p-6 sm:p-8 text-center transition-all">
        {/* Brand Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={LogoImg}
            alt="كوتش عبدالسميع عادل المالكي"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border-2 border-emerald-500/20"
          />
        </div>

        {/* Brand Title */}
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
          كوتش عبدالسميع عادل المالكي
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          يرجى إدخال رمز المرور لتسجيل الدخول إلى الحاسبة
        </p>

        {remainingTime > 0 ? (
          /* Locked State Countdown */
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 mb-4 text-amber-900 dark:text-amber-200 animate-fadeIn">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2 animate-pulse" />
            <h2 className="text-sm font-bold mb-1">تم قفل المحاولات مؤقتاً</h2>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              لقد تجاوزت الحد الأقصى للمحاولات (3 محاولات غير صحيحة).
            </p>
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xs border border-amber-200 dark:border-amber-700 font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
              <span>{formatCountdown(remainingTime)}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
              يرجى الانتظار حتى انتهاء العد التنازلي لإعادة المحاولة.
            </p>
          </div>
        ) : (
          /* Password Input Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-start">
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  autoComplete="current-password"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 pointer-events-none" />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>دخول</span>
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400">
          حاسبة الصحة والتغذية التخصصية
        </div>
      </div>
    </div>
  );
};
