import React from 'react';

export default function TermsCondition() {
  return (
    <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Terms & Conditions</h1>
        <p className="text-xs text-slate-500">Last updated: April 2026</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Introduction</h2>
        <p>
          Welcome to 42 overflow. By accessing or using our platform—including the community forum, live chat, and project resources—you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">2. User Accounts</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree to provide accurate information when registering or linking your 42 Intra account.</li>
          <li>You are strictly responsible for all activity that occurs under your account.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Acceptable Use & Conduct</h2>
        <p className="mb-2">We strive to maintain a safe, collaborative environment. You agree <strong>not</strong> to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Harass, abuse, or engage in toxic behavior toward other students or users.</li>
          <li>Post spam, malicious links, or distribute malware/viruses.</li>
          <li>Share sensitive personal information or violate the privacy of others.</li>
          <li>Post cheating material that violates the 42 Network academic integrity policies.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">4. User-Generated Content</h2>
        <p>
          You retain ownership of the content you post in forums, discussions, and chats. However, by posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content across the platform. We reserve the right to remove any content that violates these terms or is deemed inappropriate without prior notice.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Moderation & Termination</h2>
        <p>
          We reserve the right to moderate all areas of the platform. We may suspend, ban, or terminate your access at our sole discretion if we determine that you have violated these Terms or disrupted the community.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Disclaimers & Limitation of Liability</h2>
        <p>
          The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We do not guarantee that the service will be entirely error-free, secure, or uninterrupted. To the maximum extent permitted by law, 42 overflow and its administrators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Changes to Terms</h2>
        <p>
          We may update these Terms periodically to reflect changes in our platform or legal requirements. Continued use of the platform constitutes acceptance of any modified terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Contact Us</h2>
        <p>
          If you have questions regarding these Terms & Conditions, please contact us at: <a href="mailto:support@42overflow.com" className="text-indigo-600 hover:underline">support@42overflow.com</a>
        </p>
      </section>
    </div>
  );
}
