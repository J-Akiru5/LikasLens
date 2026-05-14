import { ArrowLeft, Trophy, Leaf, Award, Target, Shield } from "lucide-react";
import Link from "next/link";

interface Badge {
  id: string;
  name: string;
  icon: typeof Trophy;
  color: string;
  description: string;
  date: string;
}

const badges: Badge[] = [
  {
    id: "first-report",
    name: "First Report",
    icon: Target,
    color: "text-blue-500",
    description: "Submitted your first environmental report",
    date: "Jan 15, 2026",
  },
  {
    id: "environmental-guardian",
    name: "Environmental Guardian",
    icon: Leaf,
    color: "text-green-600",
    description: "10+ successful reports filed",
    date: "Feb 28, 2026",
  },
  {
    id: "accuracy-master",
    name: "Accuracy Master",
    icon: Trophy,
    color: "text-yellow-500",
    description: "Reports confirmed by agencies (95%+ accuracy)",
    date: "Mar 10, 2026",
  },
  {
    id: "rapid-response",
    name: "Rapid Response",
    icon: Shield,
    color: "text-red-500",
    description: "Report resolved within 1 hour",
    date: "Apr 5, 2026",
  },
  {
    id: "community-hero",
    name: "Community Hero",
    icon: Award,
    color: "text-purple-600",
    description: "25+ community upvotes on reports",
    date: "Apr 20, 2026",
  },
];

const ecoCreditsBreakdown = [
  { activity: "Report Submitted", amount: "+50 Eco", percentage: 30 },
  { activity: "Report Verified", amount: "+100 Eco", percentage: 40 },
  { activity: "Community Upvote", amount: "+25 Eco", percentage: 20 },
  { activity: "Fast Resolution", amount: "+75 Eco", percentage: 25 },
];

export default function ProfilePage() {
  const totalEcoCredits = 9_250;
  const ecoCreditLevel = "Guardian";

  return (
    <div className="min-h-screen bg-background font-body p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">
            Citizen Profile
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Eco-Credits Card */}
          <div className="brutal-panel bg-white p-8 md:col-span-1">
            <div className="text-center">
              <div className="text-sm font-mono uppercase text-primary/70 mb-4">
                Eco-Credit Balance
              </div>
              <div className="font-heading text-5xl font-black text-primary mb-2">
                {totalEcoCredits.toLocaleString()}
              </div>
              <div className="text-xs font-mono uppercase text-primary/60 mb-6 tracking-widest">
                Level: {ecoCreditLevel}
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary" style={{ width: "65%" }} />
              </div>
              <p className="text-sm font-semibold text-foreground/80">
                Earn more credits by submitting verified reports and engaging with the community.
              </p>
            </div>
          </div>

          {/* User Stats */}
          <div className="brutal-panel bg-white p-8 md:col-span-2">
            <h2 className="font-heading text-xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
              Your Impact Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded border border-primary">
                <div className="font-mono text-xs uppercase text-primary/70 mb-2">
                  Reports Filed
                </div>
                <div className="font-heading text-3xl font-black text-primary">48</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded border border-secondary">
                <div className="font-mono text-xs uppercase text-secondary mb-2">
                  Verified
                </div>
                <div className="font-heading text-3xl font-black text-secondary">46</div>
              </div>
              <div className="p-4 bg-accent/10 rounded border border-accent">
                <div className="font-mono text-xs uppercase text-accent mb-2">
                  Avg Response
                </div>
                <div className="font-heading text-3xl font-black text-accent">23m</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded border border-blue-500 col-span-2 md:col-span-1">
                <div className="font-mono text-xs uppercase text-blue-600 mb-2">
                  Community Upvotes
                </div>
                <div className="font-heading text-3xl font-black text-blue-600">127</div>
              </div>
            </div>
          </div>
        </div>

        {/* Eco-Credits Breakdown */}
        <div className="brutal-panel bg-white p-8 mb-8">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
            Eco-Credits Earned
          </h2>
          <div className="space-y-4">
            {ecoCreditsBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="font-semibold text-foreground mb-2">{item.activity}</div>
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="font-heading text-2xl font-black text-primary min-w-fit">
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="brutal-panel bg-white p-8">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
            Achievement Badges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="p-6 border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors relative overflow-hidden group"
                >
                  <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-32 h-32" />
                  </div>

                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-xl border-2 border-primary flex items-center justify-center mb-4 bg-background shadow-[4px_4px_0px_#1b4332]`}>
                      <Icon className={`w-8 h-8 ${badge.color}`} />
                    </div>

                    <h3 className="font-heading text-lg font-black uppercase text-primary mb-2">
                      {badge.name}
                    </h3>

                    <p className="text-sm text-foreground/80 font-semibold mb-4">
                      {badge.description}
                    </p>

                    <div className="text-xs font-mono text-primary/60 uppercase">
                      Unlocked • {badge.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
