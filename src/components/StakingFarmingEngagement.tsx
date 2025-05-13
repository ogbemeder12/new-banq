
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
};

type Props = {
  stakingActivities: StakingActivity[];
  solToUsdcRate: number;
};

const StakingFarmingEngagement: React.FC<Props> = ({ stakingActivities, solToUsdcRate }) => {
  // Calculate staking metrics
  const calculateMetrics = () => {
    if (!stakingActivities || stakingActivities.length === 0) {
      return { 
        totalStaked: 0, 
        activeValidators: 0, 
        avgStakeDuration: 0,
        score: 10
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
    
    // Calculate score based on staking behavior
    let score = 10; // Base score
    
    // Factor 1: Total staked amount
    if (totalStaked >= 100) score += 30;
    else if (totalStaked >= 10) score += 25;
    else if (totalStaked >= 1) score += 15;
    else if (totalStaked > 0) score += 10;
    
    // Factor 2: Validator diversification
    if (activeValidators >= 3) score += 25;
    else if (activeValidators >= 2) score += 15;
    else if (activeValidators >= 1) score += 10;
    
    // Factor 3: Staking duration
    if (avgStakeDuration >= 180) score += 35; // 6+ months
    else if (avgStakeDuration >= 90) score += 25; // 3+ months
    else if (avgStakeDuration >= 30) score += 15; // 1+ month
    else if (avgStakeDuration >= 7) score += 10; // 1+ week
    
    return {
      totalStaked,
      activeValidators,
      avgStakeDuration,
      score: Math.min(score, 100) // Cap at 100
    };
  };
  
  const { totalStaked, activeValidators, avgStakeDuration, score } = calculateMetrics();
  
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
  
  // Calculate USD value
  const stakingValueUsd = solToUsdcRate > 0 ? 
    totalStaked * solToUsdcRate : 0;

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
          <h5 className="text-sm font-medium text-muted-foreground">Total Staked</h5>
          <p className="text-xl font-bold">{totalStaked.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">SOL</span></p>
          {stakingValueUsd > 0 && (
            <p className="text-xs text-muted-foreground">${stakingValueUsd.toFixed(2)} USD</p>
          )}
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Validators</h5>
          <p className="text-xl font-bold">{activeValidators} <span className="text-xs font-normal text-muted-foreground">active</span></p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Avg. Duration</h5>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">{formatDuration(avgStakeDuration)}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>Staking and yield farming activity demonstrates long-term commitment and financial stability.</p>
      </div>
    </div>
  );
};

export default StakingFarmingEngagement;
