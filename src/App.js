import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const PomodoroTimer = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('pomodoroUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (!isBreak) {
      setCompletedPomodoros((prev) => prev + 1);
      setIsBreak(true);
      setTimeLeft(5 * 60);
      playNotificationSound();
    } else {
      setIsBreak(false);
      setTimeLeft(25 * 60);
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCWJ0fPTgjMGHm7A7+OZSA0PVqzn7q1aFgxDmN7xuGgjBSOM0vLZhzQHImm98+CWRAwRYLPo7ahXFQxAmN3vwW8gBSuS1vPgizYIJ2+++NKLQQwQWq3o7KdUFQxBmt7wv2wfBTOY2fTjjzcIKXHB8tqMQAwOVKji6KdRFAxAl93uv2wfBTKY2fTijjgIKnLB8tqNQQwPVKni56dRFAw/ltvuw2seBTKX2fTiijgIKnLB89qNQQwPVKni56dRFAw/ltvuwmseBTKX2fTiijgIKnLB89qNQQwOVKni56dRFAw/ltvuwWseBTKX2fTiijgIKnLB89qNQQwOVKni56dRFAw/ltvuv2seBTKX2fTiijgIKnLB89qNQQwOVKni56dRFA');
    audio.play().catch(() => {});
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isLogin) {
      const savedUsers = JSON.parse(localStorage.getItem('pomodoroUsers') || '{}');
      if (savedUsers[email] && savedUsers[email].password === password) {
        const userData = { email, name: savedUsers[email].name };
        setUser(userData);
        localStorage.setItem('pomodoroUser', JSON.stringify(userData));
      } else {
        setError('Invalid email or password');
      }
    } else {
      if (!confirmPassword) {
        setError('Please confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const savedUsers = JSON.parse(localStorage.getItem('pomodoroUsers') || '{}');
      if (savedUsers[email]) {
        setError('Email already registered');
        return;
      }
      const name = email.split('@')[0];
      savedUsers[email] = { password, name };
      localStorage.setItem('pomodoroUsers', JSON.stringify(savedUsers));
      
      const userData = { email, name };
      setUser(userData);
      localStorage.setItem('pomodoroUser', JSON.stringify(userData));
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userData = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User')
      };
      setUser(userData);
      localStorage.setItem('pomodoroUser', JSON.stringify(userData));
    } catch (err) {
      // User closed popup or an error occurred
      console.error('Google sign-in error', err);
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pomodoroUser');
    // Also sign out from Firebase if signed in
    firebaseSignOut(auth).catch(() => {});
    setTimeLeft(25 * 60);
    setIsActive(false);
    setIsBreak(false);
    setCompletedPomodoros(0);
    setEmail('');
    setPassword('');
    setError('');
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (isBreak) {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(25 * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((5 * 60 - timeLeft) / (5 * 60)) * 100
    : ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Pomodoro Timer</h1>
            <p className="text-gray-600">Stay focused, work smart</p>
          </div>

          <form onSubmit={handleAuth} className="mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
            </div>
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setConfirmPassword('');
                setShowPassword(false);
                setShowConfirmPassword(false);
                setPassword('');
                setEmail('');
              }}
              className="w-full text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Logout
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-semibold mb-4">
              {isBreak ? '☕ Break Time' : '🍅 Focus Time'}
            </div>
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold text-gray-800">{formatTime(timeLeft)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={toggleTimer}
              className={`${
                isActive 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex-1 sm:flex-none`}
            >
              {isActive ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={resetTimer}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex-1 sm:flex-none"
            >
              🔄 Reset
            </button>
          </div>

          <div className="text-center">
            <div className="inline-block bg-gray-100 px-6 py-3 rounded-xl">
              <span className="text-gray-700 font-semibold">
                Completed Pomodoros: <span className="text-purple-600 text-xl">{completedPomodoros}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-90 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold text-gray-800">Focus</div>
              <div className="text-sm text-gray-600">Work for 25 minutes</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl">
              <div className="text-3xl mb-2">☕</div>
              <div className="font-semibold text-gray-800">Break</div>
              <div className="text-sm text-gray-600">Rest for 5 minutes</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl">
              <div className="text-3xl mb-2">🔁</div>
              <div className="font-semibold text-gray-800">Repeat</div>
              <div className="text-sm text-gray-600">Stay productive</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;