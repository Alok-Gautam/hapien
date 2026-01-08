import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Hapien',
  description: 'Hapien Privacy Policy - Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Hapien ("we," "our," or "us"). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile application and website
              (collectively, the "Service").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-600 mb-4">When you register for an account, we collect:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Phone number (for authentication via OTP)</li>
              <li>Name and profile information</li>
              <li>Profile photos you choose to upload</li>
              <li>Interests and preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Usage Information</h3>
            <p className="text-gray-600 mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Device information (device type, operating system)</li>
              <li>App usage data and interactions</li>
              <li>Log data and analytics</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Location Information</h3>
            <p className="text-gray-600 mb-4">
              With your permission, we may collect location data to show you nearby hangouts
              and communities. You can disable location access in your device settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Create and manage your account</li>
              <li>Connect you with friends and community members</li>
              <li>Show relevant hangouts and events near you</li>
              <li>Send notifications about activities you're interested in</li>
              <li>Improve our services and user experience</li>
              <li>Ensure the security and integrity of our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-600 mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Other users (based on your privacy settings)</li>
              <li>Service providers who assist in operating our platform</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your
              personal information, including encryption, secure servers, and regular security audits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your personal information for as long as your account is active or as
              needed to provide you services. You can request deletion of your account at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              Our Service is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our practices, please contact us at:
            </p>
            <p className="text-gray-600">
              Email: privacy@hapien.com<br />
              Address: Hapien Technologies Pvt. Ltd., India
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
