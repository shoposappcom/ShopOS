
import React from 'react';
import { Button } from '../components/ui/Button';
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
  Star
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-green-200">
                S
              </div>
              <span className="font-bold text-xl tracking-tight">ShopOS</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogin}
                className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors hidden sm:block"
              >
                Log In
              </button>
              <Button onClick={onGetStarted} className="shadow-lg shadow-green-200 rounded-full px-6">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-green-50/50 to-transparent -z-10"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-40 left-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered POS System</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl leading-[1.1]">
            Manage your shop with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Superhuman Intelligence</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
            The all-in-one POS, Inventory, and Accounting solution built for African businesses. Works offline, speaks your language, and grows your profit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
            <Button onClick={onGetStarted} size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-green-200 hover:scale-105 transition-transform">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button onClick={onLogin} variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-slate-200 hover:bg-slate-50">
              Login to Account
            </Button>
          </div>

          {/* Mockup */}
          <div className="mt-16 sm:mt-24 relative w-full max-w-5xl mx-auto">
            <div className="relative rounded-2xl bg-slate-900 p-2 sm:p-4 shadow-2xl border border-slate-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-slate-800 rounded-b-xl z-20"></div>
                <div className="rounded-xl overflow-hidden bg-white aspect-[16/9] relative">
                    {/* Abstract UI Representation */}
                    <div className="flex h-full">
                        <div className="w-64 bg-slate-50 border-r border-slate-100 hidden md:block p-4 space-y-4">
                            <div className="w-32 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                            <div className="space-y-2">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-full h-10 bg-white border border-slate-100 rounded-lg"></div>)}
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <div className="flex justify-between mb-8">
                                <div className="w-48 h-10 bg-slate-100 rounded-xl"></div>
                                <div className="w-32 h-10 bg-green-100 rounded-xl"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-32 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                                        <div className="w-10 h-10 bg-white rounded-full mb-3 shadow-sm"></div>
                                        <div className="w-20 h-4 bg-slate-200 rounded mb-2"></div>
                                        <div className="w-16 h-6 bg-slate-300 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute bottom-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-[3000ms]">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">AI Insight</p>
                            <p className="text-sm font-bold text-slate-800">Restock Peak Milk</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500 to-blue-500 opacity-20 blur-3xl -z-10 rounded-[3rem]"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to run your shop</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Built for the unique challenges of African businesses. From unreliable internet to complex inventory units.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: WifiOff,
                title: "Works Offline",
                desc: "No internet? No problem. Keep selling and syncing automatically when you're back online.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Zap,
                title: "AI Assistant",
                desc: "Ask questions like 'What is my profit today?' or 'What should I restock?' in plain language.",
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                icon: LayoutDashboard,
                title: "Dual Inventory",
                desc: "Track stock in Cartons and Units simultaneously. Automatic conversion logic built-in.",
                color: "text-orange-600",
                bg: "bg-orange-50"
              },
              {
                icon: Globe,
                title: "Multilingual",
                desc: "Available in English, Hausa, Yoruba, Igbo, Arabic, and French. Switch instantly.",
                color: "text-green-600",
                bg: "bg-green-50"
              },
              {
                icon: ShieldCheck,
                title: "Debt Management",
                desc: "Track who owes you money, send WhatsApp reminders, and view payment history.",
                color: "text-red-600",
                bg: "bg-red-50"
              },
              {
                icon: Monitor,
                title: "Multi-Platform",
                desc: "Access your shop from your phone, tablet, or laptop. Data stays synced everywhere.",
                color: "text-teal-600",
                bg: "bg-teal-50"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500">Choose the plan that fits your growth. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-green-500 transition-colors relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 group-hover:bg-green-500 transition-colors rounded-t-3xl"></div>
              <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₦5,000</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited Products",
                  "3 Staff Accounts",
                  "Basic Reports",
                  "Mobile App Access"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onGetStarted} variant="outline" className="w-full py-4 text-base font-bold border-slate-200">
                Choose Monthly
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative text-white shadow-2xl transform md:-translate-y-4">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                SAVE 20%
              </div>
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-2">Yearly</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">₦48,000</span>
                <span className="text-slate-400">/year</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">Equivalent to ₦4,000/month</p>
              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Monthly",
                  "Unlimited Staff Accounts",
                  "Advanced AI Analytics",
                  "Priority Support",
                  "Free Data Import"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onGetStarted} className="w-full py-4 text-base font-bold bg-green-500 hover:bg-green-600 border-none text-white">
                Get Yearly Plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-20 bg-green-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Take your shop anywhere</h2>
          <p className="text-green-100 text-lg max-w-2xl mx-auto mb-10">
            Download ShopOS for your preferred device. Seamlessly sync across mobile and desktop.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-transform hover:-translate-y-1 shadow-lg">
                <Smartphone className="w-8 h-8" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Get it on</p>
                    <p className="font-bold leading-none">Google Play</p>
                </div>
            </button>
            <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-transform hover:-translate-y-1 shadow-lg">
                <div className="w-8 h-8 flex items-center justify-center font-bold text-2xl"></div>
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Download on the</p>
                    <p className="font-bold leading-none">App Store</p>
                </div>
            </button>
            <button className="flex items-center gap-3 bg-white text-green-900 px-6 py-3 rounded-xl hover:bg-green-50 transition-transform hover:-translate-y-1 shadow-lg">
                <Monitor className="w-8 h-8" />
                <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-green-700">Download for</p>
                    <p className="font-bold leading-none">Windows / Mac</p>
                </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-bold">S</div>
                    <span className="font-bold text-slate-700">ShopOS</span>
                </div>
                <div className="flex gap-8 text-sm text-slate-500">
                    <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-green-600 transition-colors">Support</a>
                </div>
                <p className="text-sm text-slate-400">© 2025 ShopOS Inc.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};
