import React from 'react';
import { ArrowLeft, ShoppingCart, Users, TrendingUp, Shield, Globe, Zap } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About ShopOS</h1>
          <p className="text-xl md:text-2xl text-emerald-50 max-w-3xl">
            Empowering businesses across Africa with modern, efficient point-of-sale solutions
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            ShopOS is dedicated to revolutionizing how small and medium-sized businesses manage their operations. 
            We believe that every business owner deserves access to powerful, affordable, and easy-to-use technology 
            that helps them grow and succeed.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our mission is to make professional-grade POS systems accessible to businesses across Africa, 
            regardless of size or technical expertise. We're committed to building tools that work offline, 
            sync seamlessly, and provide real-time insights into your business performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ShoppingCart className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Complete POS Solution</h3>
            <p className="text-gray-600">
              Full-featured point-of-sale system with inventory management, sales tracking, and customer management all in one place.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Zap className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Offline First</h3>
            <p className="text-gray-600">
              Works seamlessly offline and syncs automatically when you're back online. Never lose a sale due to connectivity issues.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <TrendingUp className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Insights</h3>
            <p className="text-gray-600">
              Track your sales, inventory levels, and customer debts in real-time with comprehensive dashboards and reports.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Users className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-User Support</h3>
            <p className="text-gray-600">
              Manage multiple users with different roles and permissions. Perfect for businesses with multiple staff members.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Globe className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Language</h3>
            <p className="text-gray-600">
              Available in multiple languages including English, Hausa, Yoruba, Igbo, Arabic, and French to serve diverse markets.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Shield className="w-10 h-10 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your data is securely stored with enterprise-grade encryption. Regular backups ensure your information is always safe.
            </p>
          </div>
        </div>

        {/* Why Choose ShopOS */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose ShopOS?</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">💡 Built for African Businesses</h3>
              <p className="text-gray-700">
                We understand the unique challenges faced by businesses in Africa. ShopOS is designed with local market needs in mind, 
                supporting multiple currencies, local payment methods, and regional business practices.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">💰 Affordable Pricing</h3>
              <p className="text-gray-700">
                Start with our free trial and choose a plan that fits your business. No hidden fees, no long-term contracts. 
                Pay monthly or annually with significant savings.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Easy to Use</h3>
              <p className="text-gray-700">
                Intuitive interface designed for users of all technical levels. Get started in minutes, not days. 
                No complex training required - if you can use a smartphone, you can use ShopOS.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">📱 Works Everywhere</h3>
              <p className="text-gray-700">
                Access ShopOS from any device - desktop, tablet, or mobile. Our responsive design ensures you can manage 
                your business from anywhere, anytime.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🤖 AI-Powered Assistant</h3>
              <p className="text-gray-700">
                Get instant help with our built-in AI assistant. Ask questions about your inventory, sales trends, 
                and get recommendations to grow your business.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            ShopOS was born from a simple observation: many small and medium-sized businesses in Africa struggle with 
            outdated or expensive POS systems that don't meet their needs. Traditional solutions are either too complex, 
            too expensive, or don't work well in low-connectivity environments.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            We set out to create a solution that's affordable, easy to use, and works reliably even when the internet is slow or unavailable. 
            Our team of developers, designers, and business experts came together to build ShopOS from the ground up, 
            with input from real business owners across Nigeria and other African countries.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Today, ShopOS serves hundreds of businesses across Africa, helping them streamline their operations, 
            increase sales, and make better decisions with real-time data. We're constantly improving and adding new features 
            based on feedback from our users, because your success is our success.
          </p>
        </div>
      </div>
    </div>
  );
};
