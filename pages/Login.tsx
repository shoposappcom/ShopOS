
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Language } from '../types';
import { COUNTRIES_STATES } from '../constants';
import { Globe, Lock, User as UserIcon, ArrowRight, Loader, Mail, Store, MapPin, CheckCircle, Zap } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, registerShop, t, language, setLanguage } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Abuja (FCT)');
  const [regPassword, setRegPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    
    try {
        const success = await login(usernameOrEmail, password);
        if (!success) {
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
    if (!fullName || !email || !shopName || !regPassword) {
        setError("Please fill all required fields");
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
            fullName,
            email,
            shopName,
            country: country || 'Nigeria',
            state: state || 'Abuja (FCT)',
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

  const cycleLang = () => {
    const langs: Language[] = ['en', 'ha', 'yo', 'ig', 'ar', 'fr'];
    const next = langs[(langs.indexOf(language) + 1) % langs.length];
    setLanguage(next);
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
            <button 
                onClick={cycleLang} 
                className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-100 uppercase"
            >
                <Globe className="w-3 h-3" />
                <span>{language}</span>
            </button>
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
                                setRegPassword(e.target.value);
                                checkPasswordStrength(e.target.value);
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
                                onChange={e => setUsernameOrEmail(e.target.value)}
                                autoFocus
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
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
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
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
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
