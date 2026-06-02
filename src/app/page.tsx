import Link from "next/link";

const roles = [
  "Executive Assistants",
  "Chiefs of Staff",
  "Operations",
  "HR",
  "Project Managers",
  "Leaders",
  "Individual Contributors",
  "Cross-functional Teams",
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 leading-tight tracking-tight">
          Capture the impact
          <br />
          of your work.
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Track accomplishments, connect them to business value, and turn
          everyday work into language that lands.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/tracker"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          Capture Impact
        </Link>
        <Link
          href="/dashboard"
          className="border border-slate-300 text-slate-700 bg-white px-6 py-3 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm"
        >
          My Impact
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
        {[
          {
            icon: "✦",
            title: "Capture Work",
            desc: "Describe what you contributed in plain language — accomplishments, problem-solving, support, or outcomes.",
          },
          {
            icon: "⬡",
            title: "Connect Value",
            desc: "Link your work to strategy, KPIs, and company priorities in language that resonates with stakeholders.",
          },
          {
            icon: "◎",
            title: "Communicate Impact",
            desc: "AI turns your work into ready-to-use language for reviews, leadership updates, and career conversations.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <div className="text-blue-600 text-lg mb-2">{step.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">Built for</p>
        <div className="flex flex-wrap justify-center gap-2">
          {roles.map((r) => (
            <span
              key={r}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
