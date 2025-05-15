
import React from "react";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { CoinsIcon, Clock } from "lucide-react";

type StakingActivity = {
  validatorAddress: string;
  validatorName?: string;
  amount: number;
  timestamp?: number;
  blockTime?: number;
  status: string;
  protocol?: string;
};

type Props = {
  stakingActivities: StakingActivity[];
  solToUsdcRate: number;
};

// List of major/reputable protocols
const MAJOR_PROTOCOLS = [
  'Solana', 'Marinade', 'Lido', 'Jito', 'Everstake',
  'Solflare', 'Figment', 'Chorus One', 'P2P', 'Staked'
];

const StakingFarmingEngagement: React.FC<Props> = ({ stakingActivities, solToUsdcRate }) => {
  // Calculate staking metrics
  const calculateMetrics = () => {
    if (!stakingActivities || stakingActivities.length === 0) {
      return { 
        totalStaked: 0, 
        activeValidators: 0, 
        avgStakeDuration: 0,
        valueLocked: 0,
        reputationScore: 0,
        score: 0
      };
    }
    
    // Calculate total staked amount
    const totalStaked = stakingActivities.reduce((sum, activity) => {
      if (activity.status === 'Active' || activity.status === 'Delegated') {
        return sum + activity.amount;
      }
      return sum;
    }, 0);
    
    // Count unique validators
    const validators = new Set(stakingActivities.map(a => a.validatorAddress));
    const activeValidators = validators.size;
    
    // Calculate average stake duration (in days)
    const now = Math.floor(Date.now() / 1000);
    let totalDuration = 0;
    
    stakingActivities.forEach(activity => {
      const startTime = activity.timestamp || activity.blockTime || now;
      totalDuration += (now - startTime) / (24 * 60 * 60); // Convert to days
    });
    
    const avgStakeDuration = stakingActivities.length > 0 ? 
      totalDuration / stakingActivities.length : 0;
    
    // Calculate dollar value locked
    const valueLocked = totalStaked * solToUsdcRate;
    
    // Calculate protocol reputation score
    const protocolReputation = stakingActivities.reduce((score, activity) => {
      const protocol = activity.protocol || '';
      if (MAJOR_PROTOCOLS.some(p => protocol.includes(p))) {
        return score + 1;
      }
      return score;
    }, 0);
    
    const reputationScore = stakingActivities.length > 0 ?
      (protocolReputation / stakingActivities.length) * 100 : 0;
    
    // Calculate score based on Algorithm #6: Staking & Farming Engagement
    let score = 0;
    
    // Metric A: Value Locked in Staking/Farming
    let valueScore = 0;
    if (valueLocked >= 5000) {
      valueScore = 40;
    } else if (valueLocked >= 1000) {
      valueScore = 30;
    } else if (valueLocked > 0) {
      valueScore = 20;
    }
    
    // Metric B: Duration of Positions
    let durationScore = 0;
    if (avgStakeDuration >= 30) {
      durationScore = 30;
    } else if (avgStakeDuration >= 14) {
      durationScore = 20;
    } else if (avgStakeDuration > 0) {
      durationScore = 10;
    }
    
    // Metric C: Reputable Protocols Used
    let reputationScoreValue = 0;
    if (reputationScore >= 80) {
      reputationScoreValue = 30;
    } else if (reputationScore >= 50) {
      reputationScoreValue = 20;
    } else if (reputationScore > 0) {
      reputationScoreValue = 10;
    }
    
    // Calculate final score using Algorithm #6
    score = valueScore + durationScore + reputationScoreValue;
    
    // If no staking activity at all, score is 0
    if (stakingActivities.length === 0) {
      score = 0;
    }
    
    return {
      totalStaked,
      activeValidators,
      avgStakeDuration,
      valueLocked,
      reputationScore,
      score: Math.min(score, 100) // Cap at 100
    };
  };
  
  const { 
    totalStaked, 
    activeValidators, 
    avgStakeDuration, 
    valueLocked, 
    reputationScore, 
    score 
  } = calculateMetrics();
  
  // Mock data for the chart (would be real data in production)
  const generateMockData = () => {
    const data = [];
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 30; i >= 0; i--) {
      // Create some random but trending data
      const value = totalStaked * (0.9 + Math.random() * 0.2);
      data.push({
        time: now - i * 24 * 60 * 60, // Go back i days
        value
      });
    }
    
    return data;
  };
  
  const chartData = generateMockData();
  
  // Format stake duration
  const formatDuration = (days: number) => {
    if (days >= 365) return `${(days / 365).toFixed(1)} years`;
    if (days >= 30) return `${(days / 30).toFixed(1)} months`;
    return `${Math.round(days)} days`;
  };

  // For logging purposes
  console.log("StakingFarmingEngagement Metrics:", {
    totalStaked,
    valueLocked,
    avgStakeDuration,
    score
  });

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="StakingFarming">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <CoinsIcon className="h-5 w-5" />
          Staking & Farming Engagement
        </h4>
        
        <span 
          className={`inline-block rounded px-3 py-1 text-sm font-bold ${
            score >= 90
              ? "bg-green-200 text-green-800"
              : score >= 70
              ? "bg-yellow-200 text-yellow-800"
              : score >= 40
              ? "bg-orange-200 text-orange-900"
              : "bg-red-200 text-red-800"
          }`}
          data-score={score}
        >
          Score: {score}/100
        </span>
      </div>
      
      <div className="h-28 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={2} 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Value Locked</h5>
          <p className="text-xl font-bold">${valueLocked.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
          <p className="text-xs text-muted-foreground">{totalStaked.toFixed(2)} SOL</p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Avg. Duration</h5>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">{formatDuration(avgStakeDuration)}</p>
          </div>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Protocol Quality</h5>
          <p className="text-xl font-bold">{Math.round(reputationScore)}% <span className="text-xs font-normal text-muted-foreground">reputable</span></p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <ul className="list-disc pl-5 space-y-1">
          <li>$5K+ staked, &gt;30-day avg, major protocols: 90–100</li>
          <li>$1K–5K staked, mixed use: 70–89</li>
          <li>&lt;$1K, short-term or risky farms: 30–69</li>
          <li>No staking activity: 0–29</li>
        </ul>
      </div>
    </div>
  );
};

export default StakingFarmingEngagement;
