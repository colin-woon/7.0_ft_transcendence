import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: April 2026</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Introduction</h2>
        <p>
          Welcome to 42 overflow (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We operate an online platform featuring a community forum, real-time chat, and project discussion spaces.
        </p>
        <p className="mt-2">
          This Privacy Policy explains how we collect, use, and protect your information when you use our services.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Information We Collect</h2>
        <p className="mb-4">We collect only the minimum data necessary to operate the platform.</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800">2.1 Account and Authentication Data</h3>
            <p>We collect essential login data such as name, email, profile picture, and unique identifiers. No additional unnecessary personal data is requested.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">2.2 42 Intra Profile Data</h3>
            <p>If linked, we may access public profile data such as username, image, and academic information for display purposes.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">2.3 Public Profile Information</h3>
            <p>Username, avatar, and selected profile data may be visible to other users.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">2.4 Forum and Public Content</h3>
            <p>Content you post (forum posts, comments, discussions) is public. Do not share sensitive personal information.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">2.5 Chat and Messaging</h3>
            <p>Messages are stored to provide functionality and may be used for moderation.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">2.6 Technical Data</h3>
            <p>We collect IP address, device info, and logs for system performance and security.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">3. How We Use Your Information</h2>
        <p>To authenticate users, provide services, display content, and maintain system security.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Cookies</h2>
        <p>Used for login sessions and preferences. Disabling may affect functionality.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Sharing</h2>
        <p>We do not sell data. Data may be shared with authentication providers or when required by law.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Data Retention & Account Deletion</h2>
        <p>Data is retained while your account is active.</p>
        <p className="mt-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <strong>Account Deletion:</strong> When your account is deleted, personal data is removed. Your posts and messages remain but are anonymized (e.g., shown as &apos;deleted&apos;).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Your Rights</h2>
        <p>You may request access, correction, or deletion of your data.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Contact</h2>
        <p>Contact us at: <a href="mailto:support@42overflow.com" className="text-indigo-600 hover:underline">support@42overflow.com</a></p>
      </section>
    </div>
  );
}
