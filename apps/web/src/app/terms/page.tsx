import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Hapien',
  description: 'Hapien Terms of Service - Read our terms and conditions for using the platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using Hapien ("the Service"), you agree to be bound by these Terms of
              Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              Hapien is a social networking platform designed to help users connect with others in their
              local communities through organized hangouts and activities. The Service includes mobile
              applications and web-based interfaces.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Be at least 13 years of age (or the minimum age in your jurisdiction)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or deceptive content</li>
              <li>Impersonate any person or entity</li>
              <li>Spam or send unsolicited messages</li>
              <li>Upload malicious code or interfere with the Service</li>
              <li>Collect user data without consent</li>
              <li>Use automated systems to access the Service</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Content</h2>
            <p className="text-gray-600 mb-4">
              You retain ownership of content you post on the Service. By posting content, you grant
              Hapien a non-exclusive, worldwide, royalty-free license to use, display, and distribute
              your content in connection with the Service.
            </p>
            <p className="text-gray-600 mb-4">
              You are solely responsible for your content and must ensure it does not violate any
              third-party rights or applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Hangouts and Events</h2>
            <p className="text-gray-600 mb-4">
              Hapien facilitates connections between users for in-person meetups. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Hapien does not organize or control hangouts</li>
              <li>You participate in hangouts at your own risk</li>
              <li>You are responsible for your conduct during hangouts</li>
              <li>Hapien is not liable for any incidents during meetups</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Payments</h2>
            <p className="text-gray-600 mb-4">
              Some features may require payment. All payments are processed through secure third-party
              payment providers. Refunds are handled according to our refund policy and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Service and its original content (excluding user content), features, and functionality
              are owned by Hapien and are protected by international copyright, trademark, and other
              intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account immediately, without prior notice, for any reason,
              including breach of these Terms. Upon termination, your right to use the Service will
              immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-600 mb-4">
              The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.
              We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by law, Hapien shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use of
              the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
            <p className="text-gray-600 mb-4">
              You agree to indemnify and hold harmless Hapien and its officers, directors, employees,
              and agents from any claims, damages, or expenses arising from your use of the Service
              or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify these Terms at any time. We will provide notice of
              significant changes through the Service or via email. Your continued use of the
              Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-600">
              Email: legal@hapien.com<br />
              Address: Hapien Technologies Pvt. Ltd., India
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
