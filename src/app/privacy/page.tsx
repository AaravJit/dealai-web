export const metadata = {
  title: "Privacy Policy | Deal AI",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-4xl font-black">Privacy Policy</h1>
        <p className="text-white/60">Last updated: December 2025</p>

        <section className="space-y-3 text-white/80">
          <p>
            Deal AI (“we”, “our”, or “us”) respects your privacy. This policy
            explains what we collect, how we use it, and your choices when using
            Deal AI (the “Service”).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Information We Collect</h2>
          <p className="text-white/80">
            We may collect information you provide such as screenshots/images you
            upload for analysis, optional notes you enter, and account identifiers
            (like email/user ID) used for authentication.
          </p>
          <p className="text-white/80">
            We may also collect limited technical data (device/browser info,
            basic usage analytics) to keep the Service reliable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">How We Use Information</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            <li>Provide deal analysis (score, estimates, suggestions)</li>
            <li>Improve performance, reliability, and user experience</li>
            <li>Maintain security and prevent abuse</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Data Sharing</h2>
          <p className="text-white/80">
            We do not sell your personal information. We may use third-party
            infrastructure providers (e.g., hosting, storage, analytics) only to
            operate the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Your Choices</h2>
          <p className="text-white/80">
            You can stop using the Service at any time. If you have an account,
            you may request deletion of your account data through support.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Contact</h2>
          <p className="text-white/80">
            Questions? Email{" "}
            <span className="text-cyan-300">support@dealai.app</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
