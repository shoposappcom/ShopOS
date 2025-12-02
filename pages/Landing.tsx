import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { getTrialDays, isTrialEnabled } from '../services/trialConfig';
import { 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  WifiOff, 
  Sparkles, 
  Globe, 
  ArrowRight, 
  LayoutDashboard, 
  ShieldCheck, 
  Zap,
  Download,
  Gift
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [trialDays, setTrialDays] = useState(7);
  const [trialEnabled, setTrialEnabled] = useState(true);

  useEffect(() => {
    // Load trial configuration
    setTrialDays(getTrialDays());
    setTrialEnabled(isTrialEnabled());
    
    // Listen for storage changes to update dynamically
    const handleStorageChange = () => {
      setTrialDays(getTrialDays());
      setTrialEnabled(isTrialEnabled());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically in case same-window updates
    const interval = setInterval(() => {
      setTrialDays(getTrialDays());
      setTrialEnabled(isTrialEnabled());
    }, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <img 
                src="https://i.ibb.co/1tRs3MMv/Adobe-Express-file-1.png" 
                alt="ShopOS Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogin}
                className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors hidden sm:block"
              >
                Log In
              </button>
              <Button onClick={onGetStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 rounded-full px-6 transition-all hover:scale-105">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 sm:pt-44 sm:pb-32 relative">
        {/* Animated Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-20 lg:mb-32">
                {/* Left Column: Text */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-Powered POS System</span>
                  </div>
                  
                  <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                    Manage your shop with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600">Superhuman Intelligence</span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed font-medium">
                    The all-in-one POS, Inventory, and Accounting solution built for modern businesses. Works offline, speaks your language, and grows your profit.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button onClick={onGetStarted} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 px-8 text-lg shadow-xl shadow-emerald-200/50 hover:scale-105 transition-transform">
                      Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button onClick={onLogin} variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400">
                      Login to Account
                    </Button>
                  </div>
                </div>

                {/* Right Column: Feature Highlight (Gift Card) */}
                <div className="hidden lg:block relative h-[400px] w-full">
                     {/* Floating Element 1: The Card */}
                     <div className="absolute top-10 right-10 w-80 aspect-[1.586/1] rounded-xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-20 transform -rotate-6 hover:rotate-0 transition-all duration-700 hover:scale-105 group border-2 border-white/50">
                        {/* Gold Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/40 mix-blend-overlay"></div>
                        
                        <div className="relative h-full w-full p-6 flex flex-col justify-between text-white font-sans">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-sm tracking-widest uppercase opacity-90 drop-shadow-sm text-amber-900">ShopOS</div>
                                <div className="text-[10px] font-bold border border-amber-900/30 px-2 py-0.5 rounded backdrop-blur-sm bg-white/20 text-amber-900">GIFT CARD</div>
                            </div>
                            <div className="text-center my-auto">
                                <p className="font-mono text-xl font-bold tracking-[0.15em] drop-shadow-md text-amber-950/90">GIFT-GOLD</p>
                            </div>
                            <div className="flex justify-between items-end text-amber-900">
                                <div>
                                    <p className="text-[9px] opacity-75 uppercase mb-0.5 font-semibold">Valid Thru</p>
                                    <p className="text-sm font-bold font-mono">12/25</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] opacity-75 uppercase mb-0.5 font-semibold">Value</p>
                                    <p className="text-xl font-extrabold tabular-nums">₦50,000</p>
                                </div>
                            </div>
                        </div>
                     </div>

                     {/* Floating Element 2: Description Bubble */}
                     <div className="absolute bottom-20 left-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 max-w-xs z-10 animate-in fade-in zoom-in duration-1000 delay-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-100/50 rounded-2xl text-amber-600 shadow-sm">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">Branded Gift Cards</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Create custom gift cards to boost customer loyalty and upfront revenue.
                                </p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

          {/* Mockup with Glass Effect */}
          <div className="relative w-full max-w-6xl mx-auto px-4">
             <div className="relative rounded-3xl bg-slate-900/5 p-2 ring-1 ring-inset ring-slate-900/10 lg:-m-4 lg:rounded-4xl lg:p-4 backdrop-blur-sm">
                <div className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 aspect-[16/10] sm:aspect-[16/9] relative group">
                    {/* Desktop Dashboard Screenshot */}
                    <img 
                        src="https://i.ibb.co/Wp4LBpk6/Screenshot-2025-12-02-014752.png" 
                        alt="ShopOS Dashboard - Desktop View"
                        className="hidden lg:block w-full h-full object-cover"
                    />
                    
                    {/* Mobile Dashboard Screenshot */}
                    <img 
                        src="https://i.ibb.co/j9g76HDR/Screenshot-2025-12-02-014836.png" 
                        alt="ShopOS Dashboard - Mobile View"
                        className="lg:hidden w-full h-full object-cover"
                    />
                    
                    {/* Floating Elements */}
                    <div className="absolute bottom-8 right-8 lg:bottom-12 lg:right-12 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 flex items-center gap-4 animate-bounce duration-[3000ms] z-10 max-w-xs">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Insight</p>
                            <p className="text-sm font-bold text-slate-800">Restock "Peak Milk" - Low Stock</p>
                        </div>
                    </div>
                </div>
             </div>
             {/* Glow behind mockup */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/20 blur-[100px] -z-10 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Everything you need to <span className="text-emerald-600">scale</span></h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Built for the unique challenges of modern retail. Powerful enough for chains, simple enough for startups.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            {/* Large Card 1 */}
            <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <WifiOff className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Works Completely Offline</h3>
                    <p className="text-slate-500 text-lg leading-relaxed max-w-md">No internet? No problem. Keep selling, tracking stock, and managing debts. We sync automatically when you're back online.</p>
                </div>
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500/5 rounded-tl-[100px] -mr-8 -mb-8 transition-transform group-hover:scale-110 duration-500"></div>
            </div>

            {/* Tall Card */}
            <div className="md:row-span-2 bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-300 hover:scale-[1.01] flex flex-col relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-slate-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">AI Assistant</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">Your personal business analyst. Ask questions in plain language.</p>
                    
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm space-y-3">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">AI</div>
                            <div className="flex-1 bg-slate-700/50 rounded-r-xl rounded-bl-xl p-3 text-sm text-slate-300">
                                You sold 15 cartons of Indomie today. Profit: ₦12,500.
                            </div>
                        </div>
                        <div className="flex gap-3 flex-row-reverse">
                             <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">Me</div>
                             <div className="bg-blue-600/20 rounded-l-xl rounded-br-xl p-3 text-sm text-blue-200">
                                What should I restock?
                             </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Dual Inventory</h3>
                <p className="text-slate-500">Track Cartons & Units simultaneously. Auto-conversion logic included.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Multilingual</h3>
                <p className="text-slate-500">English, Hausa, Yoruba, Igbo, Arabic, & French.</p>
            </div>

             {/* Wide Card */}
             <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 border border-emerald-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col md:flex-row items-center gap-8 group">
                <div className="flex-1">
                    <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Debt Tracking</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">Never lose money again. Track who owes you, set credit limits, and send WhatsApp reminders automatically.</p>
                </div>
                <div className="w-full md:w-1/3 bg-white rounded-2xl p-4 shadow-lg border border-emerald-100 transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Debtors</span>
                        <span className="text-xs font-bold text-red-500">-₦450,000</span>
                    </div>
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                <div className="h-2 w-8 bg-red-100 rounded ml-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {trialEnabled 
                ? `Start with a ${trialDays}-day free trial. No credit card required.`
                : 'Get started today. No credit card required.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-xl relative group flex flex-col">
              <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider mb-4">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-extrabold text-slate-900 tracking-tight">₦5,000</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <p className="text-slate-500 mb-8 pb-8 border-b border-slate-100">Perfect for small shops just getting started.</p>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Unlimited Products & Sales",
                  "3 Staff Accounts",
                  "Offline Sync (Works without Internet)",
                  "Smart Debt Tracking & Reminders",
                  "AI Assistant",
                  "Branded Gift Cards Feature",
                  "Advanced Transaction Insights",
                  "Staff Activity Logs",
                  "Multilingual Support"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={onGetStarted} variant="outline" className="w-full py-6 text-base font-bold border-2 border-slate-100 hover:border-emerald-500 hover:text-emerald-600 rounded-xl transition-all">
                Choose Monthly
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] border border-slate-800 relative text-white shadow-2xl shadow-emerald-900/20 transform md:-translate-y-4 flex flex-col">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-2xl shadow-lg">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wider mb-4">Yearly</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-extrabold text-white tracking-tight">₦48,000</span>
                <span className="text-slate-400 font-medium">/yr</span>
              </div>
              <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">SAVE 20%</span>
                <span>vs. paying monthly</span>
              </p>
              
              <div className="w-full h-px bg-slate-800 mb-8"></div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Unlimited Products & Sales",
                  "Unlimited Staff Accounts",
                  "Offline Sync (Works without Internet)",
                  "Smart Debt Tracking & Reminders",
                  "AI Assistant",
                  "Branded Gift Cards Feature",
                  "Advanced Transaction Insights",
                  "Staff Activity Logs",
                  "Multilingual Support"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={onGetStarted} className="w-full py-6 text-base font-bold bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]">
                Get Yearly Plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-24 bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block p-3 rounded-full bg-emerald-800/50 mb-6 backdrop-blur-sm border border-emerald-700">
            <Download className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Take your shop anywhere</h2>
          <p className="text-emerald-100 text-xl max-w-2xl mx-auto mb-12 font-medium">
            Download ShopOS Android app or Desktop app. Seamlessly sync across all your devices.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a 
                href="https://aanqdrwwgncigiumtlfz.supabase.co/storage/v1/object/public/app/ShopOS.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-slate-950 text-white px-8 py-4 rounded-2xl hover:bg-slate-900 transition-all hover:-translate-y-1 shadow-xl border border-slate-800 group"
            >
                <Smartphone className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Download</p>
                    <p className="font-bold text-lg leading-none">Android App</p>
                </div>
            </a>
            <button className="flex items-center gap-4 bg-white text-slate-900 px-8 py-4 rounded-2xl hover:bg-emerald-50 transition-all hover:-translate-y-1 shadow-xl border border-white group">
                <Monitor className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Download</p>
                    <p className="font-bold text-lg leading-none">Desktop App</p>
                </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <img 
                            src="https://i.ibb.co/1tRs3MMv/Adobe-Express-file-1.png" 
                            alt="ShopOS Logo" 
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                    <p className="text-slate-500 max-w-sm text-base leading-relaxed">
                        Empowering African businesses with intelligent, easy-to-use technology.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                    <ul className="space-y-4 text-slate-500">
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Download</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                    <ul className="space-y-4 text-slate-500">
                        <li>
                            <a 
                                href="/about" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.history.pushState({}, '', '/about');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                                About
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/contact" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.history.pushState({}, '', '/contact');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                                Contact
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/privacy" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.history.pushState({}, '', '/privacy');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                                Privacy Policy
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>© 2025 ShopOS Inc. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-slate-600">Twitter</a>
                    <a href="#" className="hover:text-slate-600">LinkedIn</a>
                    <a href="#" className="hover:text-slate-600">Instagram</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
