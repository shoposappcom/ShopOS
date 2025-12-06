
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Language } from '../types';
import { COUNTRIES_STATES } from '../constants';
import { Lock, User as UserIcon, ArrowRight, Loader, Mail, Store, MapPin, CheckCircle, Zap, Phone } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';

const REMEMBERED_USERNAME_KEY = 'shopos_remembered_username';
const REMEMBERED_PASSWORD_KEY = 'shopos_remembered_password';

export const Login: React.FC = () => {
  const { login, registerShop, t, language, setLanguage } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Registration State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Abuja (FCT)');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Load remembered username and password on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
    const rememberedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY);
    if (rememberedUsername) {
      setUsernameOrEmail(rememberedUsername);
      setRememberMe(true);
      // Load password if it exists
      if (rememberedPassword) {
        // Simple base64 decode (not secure, but obfuscates it slightly)
        try {
          setPassword(atob(rememberedPassword));
        } catch {
          // If decode fails, just use empty password
          setPassword('');
        }
      }
    }
  }, []);
  
  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  };
  
  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(Boolean);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Trim whitespace from username/email and password to fix browser autofill issues
    const trimmedUsername = usernameOrEmail.trim();
    const trimmedPassword = password.trim();
    
    // Update state with trimmed values
    setUsernameOrEmail(trimmedUsername);
    setPassword(trimmedPassword);
    
    try {
        const success = await login(trimmedUsername, trimmedPassword);
        if (success) {
            // Save username and password if remember me is checked (save trimmed values)
            if (rememberMe) {
                localStorage.setItem(REMEMBERED_USERNAME_KEY, trimmedUsername);
                // Store password with simple base64 encoding (obfuscation, not encryption)
                localStorage.setItem(REMEMBERED_PASSWORD_KEY, btoa(trimmedPassword));
            } else {
                // Clear remembered username and password if unchecked
                localStorage.removeItem(REMEMBERED_USERNAME_KEY);
                localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
            }
        } else {
            setError('Invalid credentials or account inactive.');
        }
    } catch (err) {
        setError('Login failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!fullName.trim() || !email.trim() || !phone.trim() || !shopName.trim() || !country.trim() || !state.trim() || !regPassword || !confirmPassword) {
        setError("Please fill all required fields");
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address");
        return;
    }
    
    // Validate phone format (basic validation - at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
        setError("Please enter a valid phone number (at least 10 digits)");
        return;
    }
    
    // Check password match
    if (regPassword !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        return;
    }
    
    // Check password strength
    if (!isPasswordStrong()) {
        setError("Password does not meet requirements. Please check the requirements below.");
        return;
    }

    setLoading(true);
    setError('');

    try {
        const success = await registerShop({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            shopName: shopName.trim(),
            country: country.trim(),
            state: state.trim(),
            password: regPassword
        });

        if (!success) {
            setError('Registration failed. Try again.');
        }
    } catch (err) {
        setError('Registration failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };


  const handleQuickLogin = async (role: string) => {
      // Test Account Credentials
      setLoading(true);
      try {
        if (role === 'admin') await login('admin', 'password123');
        if (role === 'manager') await login('manager', 'password123');
        if (role === 'cashier') await login('cashier', 'password123');
        if (role === 'stock') await login('stock', 'password123');
      } catch (err) {
        setError('Quick login failed. Please try again.');
      } finally {
        setLoading(false);
      }
  };

  const availableStates = COUNTRIES_STATES[country] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 border border-gray-100 overflow-hidden">
        
        {/* Top Bar */}
        <div className="bg-white p-6 pb-0 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <img 
                    src="https://i.ibb.co/1tRs3MMv/Adobe-Express-file-1.png" 
                    alt="ShopOS Logo" 
                    className="h-10 w-auto object-contain"
                />
            </div>
            <LanguageSelector 
                currentLanguage={language}
                onLanguageChange={setLanguage}
                variant="minimal"
            />
        </div>

        <div className="p-8 pt-6">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isRegistering ? t('createShopAccount') : t('welcomeBack')}
            </h1>
            <p className="text-sm text-gray-500">
                {isRegistering ? t('startManaging') : t('enterDetails')}
            </p>
          </div>

          {isRegistering ? (
             /* Registration Form */
             <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('fullName')}</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="email"
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900"
                            placeholder="owner@shop.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="tel"
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900"
                            placeholder="+234 800 000 0000"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('shopName')}</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900"
                            placeholder="My Awesome Shop"
                            value={shopName}
                            onChange={e => setShopName(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('country')}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
                            <select 
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900 appearance-none"
                                value={country}
                                onChange={e => {
                                    const newCountry = e.target.value;
                                    setCountry(newCountry);
                                    setState(COUNTRIES_STATES[newCountry]?.[0] || '');
                                }}
                                required
                            >
                                {Object.keys(COUNTRIES_STATES).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('state')}</label>
                        <select 
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900 appearance-none"
                            value={state}
                            onChange={e => setState(e.target.value)}
                            required
                        >
                            {availableStates.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="password"
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium text-gray-900"
                            placeholder="••••••••"
                            value={regPassword}
                            onChange={e => {
                                const newPassword = e.target.value;
                                setRegPassword(newPassword);
                                checkPasswordStrength(newPassword);
                                // Clear confirm password if it doesn't match the new password
                                if (confirmPassword && confirmPassword !== newPassword) {
                                    setConfirmPassword('');
                                }
                            }}
                            required
                        />
                    </div>
                    {regPassword && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                            <ul className="space-y-1">
                                <li className={`text-xs flex items-center gap-2 ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-500'}`}>
                                    <CheckCircle className={`w-3 h-3 ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-400'}`} />
                                    At least 8 characters
                                </li>
                                <li className={`text-xs flex items-center gap-2 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                                    <CheckCircle className={`w-3 h-3 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                                    At least 1 capital letter
                                </li>
                                <li className={`text-xs flex items-center gap-2 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                                    <CheckCircle className={`w-3 h-3 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`} />
                                    At least 1 lowercase letter
                                </li>
                                <li className={`text-xs flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                                    <CheckCircle className={`w-3 h-3 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`} />
                                    At least 1 number
                                </li>
                                <li className={`text-xs flex items-center gap-2 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                                    <CheckCircle className={`w-3 h-3 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`} />
                                    At least 1 special character (!@#$%^&*...)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="password"
                            className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 outline-none text-sm font-medium text-gray-900 ${
                                confirmPassword 
                                    ? (confirmPassword === regPassword 
                                        ? 'border-green-300 focus:ring-green-500' 
                                        : 'border-red-300 focus:ring-red-500') 
                                    : 'border-gray-200 focus:ring-green-500'
                            }`}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {confirmPassword && (
                        <div className="mt-1">
                            {confirmPassword === regPassword ? (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Passwords match
                                </p>
                            ) : (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Passwords do not match
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {error && <p className="text-xs text-red-500 text-center font-bold bg-red-50 py-2 rounded-lg">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-green-100"
                >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : t('registerShop')}
                </button>
             </form>
          ) : (
             /* Login Form */
             <div className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username or Email</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium transition-all text-gray-900"
                                placeholder="Enter username or email"
                                value={usernameOrEmail}
                                onChange={e => setUsernameOrEmail(e.target.value.trimStart().toLowerCase())}
                                onBlur={e => setUsernameOrEmail(e.target.value.trim().toLowerCase())}
                                autoFocus
                                autoCapitalize="none"
                                autoCorrect="off"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t('password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input 
                                type="password"
                                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-medium transition-all text-gray-900"
                                placeholder="Enter password"
                                value={password}
                                onChange={e => setPassword(e.target.value.trimStart())}
                                onBlur={e => setPassword(e.target.value.trim())}
                            />
                        </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={rememberMe}
                                onChange={e => {
                                    setRememberMe(e.target.checked);
                                    // Clear remembered username and password if unchecked
                                    if (!e.target.checked) {
                                        localStorage.removeItem(REMEMBERED_USERNAME_KEY);
                                        localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
                                        setPassword(''); // Also clear password field
                                    }
                                }}
                            />
                            <div className="relative w-5 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded border border-gray-300 peer-checked:bg-green-600 peer-checked:border-green-600 transition-all">
                                {rememberMe && (
                                    <svg className="absolute inset-0 w-full h-full text-white flex items-center justify-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </label>
                        <span className="text-sm text-gray-600 font-medium cursor-pointer" onClick={() => {
                            setRememberMe(!rememberMe);
                            if (rememberMe) {
                                localStorage.removeItem(REMEMBERED_USERNAME_KEY);
                                localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
                                setPassword(''); // Also clear password field
                            }
                        }}>
                            {t('rememberMe') || 'Remember Me'}
                        </span>
                    </div>

                    {error && <p className="text-xs text-red-500 text-center font-bold bg-red-50 py-2 rounded-lg animate-in fade-in slide-in-from-top-1">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-green-200 hover:shadow-green-300"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>{t('login')} <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>

                {/* Quick Login Section - Test Accounts */}
                <div className="border-t border-gray-100 pt-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase text-center mb-3 tracking-wider">Test Accounts (Demo)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleQuickLogin('admin')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 transition-colors">Admin</button>
                        <button onClick={() => handleQuickLogin('manager')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 transition-colors">Manager</button>
                        <button onClick={() => handleQuickLogin('cashier')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 transition-colors">Cashier</button>
                        <button onClick={() => handleQuickLogin('stock')} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 transition-colors">Stock</button>
                    </div>
                    <p className="text-[9px] text-gray-400 text-center mt-2">All test accounts use password: password123</p>
                </div>
             </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
             <button 
                onClick={() => { 
                    setIsRegistering(!isRegistering); 
                    setError('');
                    setConfirmPassword('');
                    setRegPassword('');
                    setPasswordStrength({
                        hasLength: false,
                        hasUpperCase: false,
                        hasLowerCase: false,
                        hasNumber: false,
                        hasSpecialChar: false
                    });
                }}
                className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline"
             >
                {isRegistering ? t('alreadyAccount') : t('registerNewShop')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
