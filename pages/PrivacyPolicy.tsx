import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-white">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-emerald-50">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="prose max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At ShopOS ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our point-of-sale (POS) software and services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Please read this Privacy Policy carefully. By using ShopOS, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-emerald-600" />
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Business name, address, and contact details</li>
                <li>Tax identification numbers (if provided)</li>
                <li>Business registration information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">User Account Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Name, email address, and phone number</li>
                <li>Username and encrypted password</li>
                <li>User role and permissions</li>
                <li>Language preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Data</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Product inventory and pricing information</li>
                <li>Sales transactions and receipts</li>
                <li>Customer information (names, phone numbers, purchase history)</li>
                <li>Financial data (revenue, expenses, debts)</li>
                <li>Supplier information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Device information and browser type</li>
                <li>IP address and location data (general geographic area)</li>
                <li>Usage patterns and feature interactions</li>
                <li>Error logs and performance data</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-emerald-600" />
                How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>To provide, maintain, and improve our POS services</li>
                <li>To process transactions and manage your business operations</li>
                <li>To send you important updates and notifications about your account</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To analyze usage patterns and improve our software</li>
                <li>To detect, prevent, and address technical issues or security threats</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-emerald-600" />
                Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li><strong>Encryption:</strong> All data in transit is encrypted using SSL/TLS protocols</li>
                <li><strong>Secure Storage:</strong> Data is stored on secure, encrypted servers with regular backups</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
                <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments</li>
                <li><strong>Offline Security:</strong> Local data is securely stored on your device</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                While we strive to use commercially acceptable means to protect your data, no method of transmission 
                over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we 
                are committed to protecting your information to the best of our ability.
              </p>
            </section>

            {/* Data Sharing and Disclosure */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our services (e.g., cloud hosting, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Account Closure:</strong> Close your account and request data deletion</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@shopos.app" className="text-emerald-600 hover:text-emerald-700">privacy@shopos.app</a>
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. 
                When you close your account, we will delete or anonymize your personal data within 30 days, except where we are required 
                to retain it for legal, regulatory, or accounting purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopOS is not intended for use by individuals under the age of 18. We do not knowingly collect personal information 
                from children. If we become aware that we have collected information from a child, we will take steps to delete such information promptly.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. 
                Changes are effective when posted on this page.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:privacy@shopos.app" className="text-emerald-600 hover:text-emerald-700">privacy@shopos.app</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Support:</strong> <a href="mailto:support@shopos.app" className="text-emerald-600 hover:text-emerald-700">support@shopos.app</a>
                </p>
                <p className="text-gray-700">
                  <strong>Address:</strong> Lagos, Nigeria
                </p>
              </div>
            </section>

            {/* Consent */}
            <section className="pt-6 border-t border-gray-200">
              <p className="text-gray-700 leading-relaxed">
                By using ShopOS, you consent to the collection and use of information as described in this Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
