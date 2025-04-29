
import React from "react";
import { Activity, DollarSign, Clock, Star } from "lucide-react";

type StakingActivity = {
  validatorAddress: string;
  validatorName?: string;
  amount: number;
  status?: string;
  timestamp?: number;
  type?: string;
};

type Props = {
  stakingActivities: StakingActivity[];
  solToUsdcRate: number;
};

const reputableProtocols = [
  // Example reputable validators/protocol vote addresses (add more as needed)
  "Everstake", "Certus One", "Marinade.Finance", "Coinbase", "Binance Staking"
];

function getDurationDays(position: StakingActivity) {
  // Fallback to a default if no timestamp
  const now = Date.now() / 1000;
  if (!position.timestamp) return 0;
  // For demo: assume it's been active since that time until now
  const duration = (now - position.timestamp) / (60 * 60 * 24);
  return Math.max(Math.floor(duration), 0);
}

function getScore({
  usdLocked,
  avgDuration,
  reputableCount,
  activityCount
}: {
  usdLocked: number;
  avgDuration: number;
  reputableCount: number;
  activityCount: number;
}): number {
  if (activityCount === 0) return 0;
  // Heuristic based on provided scoring
  // 90–100: $5K staked, >30-day hold, major protocols
  if (usdLocked >= 5000 && avgDuration > 30 && reputableCount > 0) return 92;
  // 70–89: $1K–$5K, mixed use
  if (usdLocked >= 1000 && usdLocked < 5000 && avgDuration > 10) return 80;
  // 30–69: <$1K, short-term/risky farms
  if (usdLocked > 0 && usdLocked < 1000) return 50;
  return 25; // No significant or only risky/short-term
}

// US Dollar formatted string
function usd(amount: number) {
  return "$" + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const StakingFarmingEngagement: React.FC<Props> = ({ stakingActivities, solToUsdcRate }) => {
  // Group staking stats
  const totalLockedSol = stakingActivities.reduce((acc, x) => acc + (typeof x.amount === "number" ? x.amount : 0), 0);
  const usdLocked = totalLockedSol * solToUsdcRate;
  const avgDuration =
    stakingActivities.length > 0
      ? stakingActivities.reduce((acc, a) => acc + getDurationDays(a), 0) / stakingActivities.length
      : 0;
  const reputableCount = stakingActivities.filter(a =>
    reputableProtocols.some(p =>
      (a.validatorName || "").toLowerCase().includes(p.toLowerCase())
    )
  ).length;
  const score = getScore({
    usdLocked,
    avgDuration,
    reputableCount,
    activityCount: stakingActivities.length
  });

  console.log("Rendering StakingFarmingEngagement with activities:", stakingActivities.length);
  console.log("Stats: totalLockedSol:", totalLockedSol, "usdLocked:", usdLocked, "score:", score);

  return (
    <div className="border rounded-lg p-4 bg-muted shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h4 className="font-semibold text-lg">Staking & Farming Engagement</h4>
        <span className={`inline-block rounded px-3 py-1 text-sm font-bold ${score >= 90
          ? "bg-green-200 text-green-800"
          : score >= 70
            ? "bg-yellow-200 text-yellow-800"
            : score >= 30
              ? "bg-orange-200 text-orange-900"
              : "bg-red-200 text-red-800"
          }`}>
          Score: {score} / 100
        </span>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
        <div>
          <dt className="text-muted-foreground text-sm mb-1">Value Locked in Staking</dt>
          <dd className="text-lg font-bold">{usd(usdLocked)} <span className="text-xs text-muted-foreground">({totalLockedSol.toFixed(4)} SOL)</span></dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm mb-1">Average Duration of Positions</dt>
          <dd className="text-lg font-bold">{avgDuration.toFixed(1)} days</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm mb-1">Reputable Protocols Used</dt>
          <dd className="text-lg font-bold">{reputableCount}</dd>
        </div>
      </dl>
      {stakingActivities.length > 0 && (
        <div className="mt-3">
          <h5 className="font-semibold mb-1 text-[15px]">Active Positions</h5>
          <ul className="divide-y text-sm">
            {stakingActivities.map((a, i) => (
              <li key={i} className="py-1 flex flex-col">
                <span>
                  <span className="font-medium">{a.validatorName || a.validatorAddress}</span>:
                  {" "}
                  {a.amount} SOL
                  {" "}
                  ({getDurationDays(a)} days)
                </span>
                <span className="text-muted-foreground text-xs">
                  Status: {a.status || "N/A"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StakingFarmingEngagement;

