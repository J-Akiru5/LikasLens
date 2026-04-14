import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">LikasLens</h1>
          <p className="text-xl text-gray-600">Neuro-symbolic Civic Reporting Platform</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Report minor environmental issues and earn rewards. A public scoreboard holds local governments accountable for resolution times.
          </p>
          <p className="text-gray-600 mb-6">
            Advanced AI analysis automatically categorizes reports and routes them to the correct government agency.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Reporting</h3>
            <p className="text-sm text-gray-600">AI-powered issue categorization</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Public Scoreboard</h3>
            <p className="text-sm text-gray-600">Track government response times</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Ghost Mode</h3>
            <p className="text-sm text-gray-600">Anonymous reporting for safety</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
