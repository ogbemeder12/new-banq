
import React from "react";
import { Wrench, WalletCards, Calculator } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Transaction = {
  type?: string;
  description?: string;
  source?: string;
  timestamp?: number;
  signature?: string;
  programId?: string;
};

type Props = {
  transactions: Transaction[];
};

function analyzeToolUsage(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) {
    return {
      aggregatorUse: 0,
      smartToolUse: 0,
      score: 0,
      details: []
    };
  }

  let jupiterSwaps = 0;
  let limitOrders = 0;
  let dcaCount = 0;
  let multisigUse = 0;
  let portfolioTools = 0;
  let advancedDeFi = 0;
  
  // Known program IDs for various tools
  const jupiterProgramIds = [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
  ];
  
  const serumOpenBookProgramIds = [
    "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",
    "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
  ];
  
  const multisigProgramIds = [
    "SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu",
    "AgoraGovvVuRM6nwXY4CxM3eC1vRBnqEusKGJbakaRHM"
  ];

  // Analyze each transaction for smart tool usage
  transactions.forEach(tx => {
    const description = (tx.description || '').toLowerCase();
    const source = (tx.source || '').toLowerCase();
    const programId = tx.programId || '';
    
    // Jupiter aggregator detection
    if (jupiterProgramIds.includes(programId) || 
        source.includes('jupiter') || 
        description.includes('jupiter')) {
      jupiterSwaps++;
    }

    // Limit orders detection (common programs)
    if (serumOpenBookProgramIds.includes(programId) ||
        description.includes('limit order') || 
        source.includes('serum') || 
        source.includes('openbook') || 
        description.includes('limit')) {
      limitOrders++;
    }

    // DCA tool usage
    if (description.includes('dca') || 
        source.includes('mean.finance') || 
        description.includes('dollar cost')) {
      dcaCount++;
    }

    // Multisig detection
    if (multisigProgramIds.includes(programId) ||
        source.includes('multisig') || 
        source.includes('squads') || 
        description.includes('multisig')) {
      multisigUse++;
    }

    // Portfolio management tools
    if (source.includes('birdeye') || 
        source.includes('step.finance') || 
        description.includes('portfolio')) {
      portfolioTools++;
    }
    
    // Advanced DeFi usage (lending, shorting, derivatives)
    if (description.includes('lend') || 
        description.includes('borrow') || 
        description.includes('short') || 
        description.includes('derivative') ||
        description.includes('margin') ||
        description.includes('leverage')) {
      advancedDeFi++;
    }
  });

  const totalTools = jupiterSwaps + limitOrders + dcaCount + multisigUse + portfolioTools + advancedDeFi;
  const txCount = Math.max(1, transactions.length);
  
  // Calculate diversity of tool usage (0-1 range)
  const toolTypes = [
    jupiterSwaps > 0, 
    limitOrders > 0, 
    dcaCount > 0, 
    multisigUse > 0, 
    portfolioTools > 0,
    advancedDeFi > 0
  ].filter(Boolean).length;
  
  const toolDiversity = toolTypes / 6; // 6 is the maximum number of tool types
  
  // Calculate usage ratio (tools used / total transactions)
  const usageRatio = totalTools / txCount;
  
  // Calculate weighted score based on tool usage and diversity
  let score = Math.min(100, Math.round((usageRatio * 50) + (toolDiversity * 50)));
  
  // Minimum score is 20
  score = Math.max(20, score);
  
  // For zero transactions, revert to base score
  if (txCount === 0) score = 20;
  
  return {
    aggregatorUse: jupiterSwaps,
    smartToolUse: limitOrders + dcaCount + multisigUse + portfolioTools + advancedDeFi,
    score,
    details: [
      { name: "Aggregator Swaps", count: jupiterSwaps },
      { name: "Limit Orders", count: limitOrders },
      { name: "DCA Usage", count: dcaCount },
      { name: "Multisig", count: multisigUse },
      { name: "Portfolio Tools", count: portfolioTools },
      { name: "Advanced DeFi", count: advancedDeFi }
    ].filter(detail => detail.count > 0)
  };
}

const StrategicToolUsage: React.FC<Props> = ({ transactions }) => {
  const { aggregatorUse, smartToolUse, score, details } = analyzeToolUsage(transactions);

  console.log("StrategicToolUsage Metrics:", { 
    aggregatorUse, 
    smartToolUse,
    score,
    detailsCount: details.length,
    transactionsCount: transactions.length 
  });

  return (
    <Card className="bg-muted shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Strategic Usage of Tools
          <span
            className={`ml-2 px-2 py-1 text-sm rounded ${
              score >= 90
                ? "bg-green-200 text-green-800"
                : score >= 70
                ? "bg-yellow-200 text-yellow-800"
                : score >= 30
                ? "bg-orange-200 text-orange-900"
                : "bg-red-200 text-red-800"
            }`}
          >
            Score: {score}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aggregator Usage:</span>
              <span className="font-medium">{aggregatorUse} trades</span>
            </div>
            <div className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Smart Tools Used:</span>
              <span className="font-medium">{smartToolUse} times</span>
            </div>
          </div>
          <div className="space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="text-sm">
                <span className="text-muted-foreground">{detail.name}:</span>{" "}
                <span className="font-medium">{detail.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Regular use of smart tools: 90–100</li>
            <li>Occasional use: 70–89</li>
            <li>Rarely used, mainly direct swaps: 30–69</li>
            <li>No smart tool usage: 0–29</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategicToolUsage;
