import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Impact Tracker AI
        </h1>
        <p className="text-lg text-gray-500 max-w-xl">
          Turn your day-to-day work into powerful, quantified resume bullets.
          Log what you did, and let AI refine it into results that get noticed.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/tracker"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Log an Impact
        </Link>
        <Link
          href="/dashboard"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-2xl text-left">
        {[
          {
            title: "Log",
            desc: "Describe what you did in plain language — no formatting required.",
          },
          {
            title: "Refine",
            desc: "AI rewrites your entry into strong, action-verb-led bullet points.",
          },
          {
            title: "Track",
            desc: "Build a library of accomplishments ready for interviews or resumes.",
          },
        ].map((step) => (
          <div key={step.title} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
