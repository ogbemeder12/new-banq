
import React from "react";
import { Network, Link, Database } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  protocol?: string;
  type?: string;
};

type Props = {
  transactions: Transaction[];
};

// Lists of protocol types for scoring
const SAFE_PROTOCOLS = [
  'lending', 'staking', 'governance', 'nft', 'savings',
  'payment', 'defi', 'storage', 'identity', 'oracle'
];

const MEDIUM_RISK_PROTOCOLS = [
  'dex', 'swap', 'bridge', 'yield', 'leverage', 'options'
];

const HIGH_RISK_PROTOCOLS = [
  'gambling', 'prediction', 'casino', 'lottery', 'games',
  'high-risk', 'derivatives'
];

const EcosystemDAppCoverage: React.FC<Props> = ({ transactions }) => {
  const calculateMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return {
        uniqueProtocols: 0,
        safeRatio: 0,
        mediumRiskRatio: 0,
        highRiskRatio: 0,
        score: 0
      };
    }
    
    // Extract protocol information
    const protocolsUsed = new Map<string, number>();
    let protocolTransactions = 0;
    
    transactions.forEach(tx => {
      if (tx.protocol) {
        const protocol = tx.protocol.toLowerCase();
        protocolsUsed.set(protocol, (protocolsUsed.get(protocol) || 0) + 1);
        protocolTransactions++;
      }
    });
    
    // Count protocol types
    let safeCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;
    
    protocolsUsed.forEach((count, protocol) => {
      const isHigh = HIGH_RISK_PROTOCOLS.some(p => protocol.includes(p));
      const isMedium = MEDIUM_RISK_PROTOCOLS.some(p => protocol.includes(p));
      const isSafe = SAFE_PROTOCOLS.some(p => protocol.includes(p));
      
      if (isHigh) {
        highRiskCount += count;
      } else if (isMedium) {
        mediumRiskCount += count;
      } else if (isSafe) {
        safeCount += count;
      } else {
        // Default to medium if unknown
        mediumRiskCount += count;
      }
    });
    
    // Calculate ratios
    const totalIdentifiedTx = safeCount + mediumRiskCount + highRiskCount;
    
    const safeRatio = totalIdentifiedTx > 0 ? safeCount / totalIdentifiedTx : 0;
    const mediumRiskRatio = totalIdentifiedTx > 0 ? mediumRiskCount / totalIdentifiedTx : 0;
    const highRiskRatio = totalIdentifiedTx > 0 ? highRiskCount / totalIdentifiedTx : 0;
    
    // Calculate score based on Algorithm #10: Ecosystem DApp Coverage
    let score = 50; // Default starting score
    
    // Adjust score based on protocol diversity
    score += Math.min(20, protocolsUsed.size * 2);
    
    // Adjust score based on risk profile
    if (safeRatio > 0.7) {
      score += 30;
    } else if (safeRatio > 0.5) {
      score += 20;
    } else if (safeRatio > 0.3) {
      score += 10;
    }
    
    // Penalize for high-risk usage
    if (highRiskRatio > 0.5) {
      score -= 40;
    } else if (highRiskRatio > 0.3) {
      score -= 25;
    } else if (highRiskRatio > 0.1) {
      score -= 10;
    }
    
    // Cap score
    score = Math.max(0, Math.min(100, score));
    
    return {
      uniqueProtocols: protocolsUsed.size,
      safeRatio,
      mediumRiskRatio,
      highRiskRatio,
      score: Math.round(score)
    };
  };
  
  const { uniqueProtocols, safeRatio, mediumRiskRatio, highRiskRatio, score } = calculateMetrics();
  
  console.log("EcosystemDAppCoverage Metrics:", {
    uniqueProtocols,
    safeRatio: Math.round(safeRatio * 100),
    mediumRiskRatio: Math.round(mediumRiskRatio * 100),
    highRiskRatio: Math.round(highRiskRatio * 100),
    score
  });
  
  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="EcosystemDApp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Network className="h-5 w-5" />
          Ecosystem DApp Coverage
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Unique Protocols</h5>
          <p className="text-xl font-bold">{uniqueProtocols}</p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Safe Usage</h5>
          <p className="text-xl font-bold">{Math.round(safeRatio * 100)}%</p>
        </div>
        
        <div className="bg-background/50 p-3 rounded-md">
          <h5 className="text-sm font-medium text-muted-foreground">Risk Profile</h5>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">
              {highRiskRatio > 0.3 ? "High Risk" : 
               highRiskRatio > 0.1 ? "Moderate Risk" : "Low Risk"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Safe ({Math.round(safeRatio * 100)}%)</span>
            <span>Medium ({Math.round(mediumRiskRatio * 100)}%)</span>
            <span>High ({Math.round(highRiskRatio * 100)}%)</span>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${safeRatio * 100}%` }} 
            />
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${mediumRiskRatio * 100}%` }} 
            />
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${highRiskRatio * 100}%` }} 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>
          This score evaluates the types of DApps you use and your risk profile. 
          Higher scores indicate diverse usage of reputable protocols.
        </p>
      </div>
    </div>
  );
};

export default EcosystemDAppCoverage;
