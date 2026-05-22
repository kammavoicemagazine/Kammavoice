import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Kamma Voice",
  description: "Privacy policy for the Kamma Voice AI-powered multilingual community media platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-playfair)] text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted font-mono">
            Last Updated: May 23, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Overview</h2>
            <p>
              Kamma Voice (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Kamma Voice mobile
              application and website (collectively, the &quot;Service&quot;). This Privacy Policy describes
              how we collect, use, and protect information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-3">
              Kamma Voice is designed as an <strong className="text-foreground">open-access, public platform</strong>.
              We do not require user registration, login, or personal account creation to access our content.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-foreground">No Personal Accounts:</strong> We do not collect names,
                email addresses, passwords, or personal profile information from readers.
              </li>
              <li>
                <strong className="text-foreground">Analytics Data:</strong> We use Vercel Analytics to collect
                anonymous, aggregated usage statistics such as page views, device types, and geographic regions.
                This data cannot identify individual users.
              </li>
              <li>
                <strong className="text-foreground">Push Notifications:</strong> If you opt in to receive push
                notifications, we store an anonymous device token to deliver news alerts. No personal information
                is associated with this token.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. How We Use Information</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>To deliver multilingual news, articles, and digital magazine content.</li>
              <li>To improve the performance and reliability of our Service.</li>
              <li>To send breaking news alerts and magazine release notifications (if opted in).</li>
              <li>To analyze aggregate traffic patterns for editorial decision-making.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
              <li><strong className="text-foreground">Firebase (Google):</strong> For content storage and delivery.</li>
              <li><strong className="text-foreground">Cloudinary:</strong> For image and media optimization.</li>
              <li><strong className="text-foreground">Vercel:</strong> For hosting and anonymous analytics.</li>
              <li><strong className="text-foreground">Google Gemini AI:</strong> For automated content translation and OCR processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Data Retention</h2>
            <p>
              Since we do not collect personal information from readers, there is no personal data to retain or delete.
              Anonymous analytics data is retained in accordance with our third-party providers&apos; standard policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Children&apos;s Privacy</h2>
            <p>
              Our Service is a general-audience news and media platform. We do not knowingly collect any personal
              information from children under the age of 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated revision date. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a
                href="mailto:contact@kammavoice.com"
                className="text-gold hover:underline font-semibold"
              >
                contact@kammavoice.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border-subtle text-center">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Kamma Voice. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
