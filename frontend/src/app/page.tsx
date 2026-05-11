import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 pt-16 pb-12 text-center bg-gradient-to-b from-green-50 to-white">
        <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-8 shadow-xl shadow-green-200 flex items-center justify-center text-white text-3xl">
          🌿
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
          Agriculture <br />
          <span className="text-green-600">Reimagined.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-sm mx-auto mb-10 font-medium">
          The all-in-one platform for farmers, experts, and buyers. AI diagnosis, GIS mapping, and a thriving marketplace.
        </p>
        <div className="flex flex-col space-y-4 px-4 max-w-xs mx-auto">
          <Link
            href="/signup"
            className="bg-green-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-transform"
          >
            Get Started
          </Link>
          <Link
            href="/marketplace"
            className="bg-white text-green-700 font-bold py-5 rounded-2xl border border-green-100 active:scale-95 transition-transform"
          >
            Browse Marketplace
          </Link>
          <div className="pt-2">
            <Link 
              href="/login"
              className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
            >
              Already have an account? <span className="text-green-600 underline">Log In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-16 space-y-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Features</h2>
          <div className="w-12 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-start space-x-6 group">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">🔬</div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-gray-900">AI Diagnosis</h3>
              <p className="text-gray-500 text-sm font-medium">Instant pest and disease identification using advanced computer vision.</p>
            </div>
          </div>
          <div className="flex items-start space-x-6 group">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">📡</div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-gray-900">GIS Mapping</h3>
              <p className="text-gray-500 text-sm font-medium">Satellite health monitoring and NDVI analysis for every inch of your land.</p>
            </div>
          </div>
          <div className="flex items-start space-x-6 group">
            <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl group-hover:bg-yellow-600 group-hover:text-white transition-colors duration-300">🛍️</div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-gray-900">Direct Trade</h3>
              <p className="text-gray-500 text-sm font-medium">Eliminate middlemen. Sell directly to buyers at the best market prices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expert CTA */}
      <section className="px-6 py-12">
        <div className="bg-gray-900 rounded-[2.5rem] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/20 blur-[100px]"></div>
          <h2 className="text-3xl font-black text-white mb-4 relative z-10">Are you an Expert?</h2>
          <p className="text-gray-400 font-medium mb-8 relative z-10 text-sm">Join our network of verified agronomists and provide consultations to thousands of farmers.</p>
          <Link href="/signup" className="inline-block bg-white text-gray-900 font-black px-10 py-4 rounded-2xl relative z-10 active:scale-95 transition-transform">
            Join as Expert
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 text-center border-t border-gray-100 mt-12">
        <div className="text-xl font-black text-green-700 mb-4 italic">Dr. Plant</div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">&copy; 2026 AgTech Solutions. All rights reserved.</p>
      </footer>
    </main>
  );
}
