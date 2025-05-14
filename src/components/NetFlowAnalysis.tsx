
import React from "react";
import { ArrowDownSquare, ArrowUpSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: number | string;
  source?: string;
  destination?: string;
  type?: string;
};

type Props = {
  transactions: Transaction[];
  solToUsdcRate: number;
};

const NetFlowAnalysis: React.FC<Props> = ({ transactions, solToUsdcRate }) => {
  const calculateNetFlow = () => {
    if (!transactions || transactions.length === 0) {
      return { 
        inflow: 0, 
        outflow: 0, 
        netFlow: 0, 
        formattedInflow: '0', 
        formattedOutflow: '0',
        score: 0,
        netFlowRatio: 0
      };
    }

    let totalInflow = 0;
    let totalOutflow = 0;
    
    transactions.forEach(tx => {
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      if (!isNaN(amount)) {
        if (amount < 0) {
          totalOutflow += Math.abs(amount);
        } else if (amount > 0) {
          totalInflow += amount;
        }
      }
    });

    const netFlow = totalInflow - totalOutflow;
    const totalVolume = totalInflow + totalOutflow;
    const hasTransactions = totalVolume > 0;
    
    // Calculate net flow ratio for scoring
    const netFlowRatio = hasTransactions ? netFlow / totalVolume : 0;
    
    // Calculate score based on new algorithm
    let score = 0;
    
    if (hasTransactions) {
      // Implement new scoring algorithm:
      // 0.3 → Score 90–100 (Strong net inflow)
      // 0 to 0.3 → Score 60–89 (Mild accumulation)
      // -0.3 to 0 → Score 30–59 (Net outflow but not extreme)
      // < -0.3 → Score 0–29 (Heavy net drain)
      
      if (netFlowRatio >= 0.3) {
        // Score 90-100: Strong net inflow
        score = 90 + Math.min(10, Math.floor((netFlowRatio - 0.3) * 100));
      } else if (netFlowRatio >= 0) {
        // Score 60-89: Mild accumulation
        score = 60 + Math.min(29, Math.floor((netFlowRatio / 0.3) * 30));
      } else if (netFlowRatio >= -0.3) {
        // Score 30-59: Net outflow but not extreme
        score = 30 + Math.min(29, Math.floor(((netFlowRatio + 0.3) / 0.3) * 30));
      } else {
        // Score 0-29: Heavy net drain
        score = Math.max(0, Math.min(29, Math.floor((1 + netFlowRatio + 0.3) * 100)));
      }
    }
    
    // Cap score at 100
    score = Math.min(100, Math.max(0, Math.round(score)));
    
    // Formatting for display
    const formatValue = (val: number): string => {
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      if (val >= 1) return val.toFixed(1);
      return val.toFixed(3);
    };
    
    return {
      inflow: totalInflow,
      outflow: totalOutflow,
      netFlow,
      formattedInflow: formatValue(totalInflow),
      formattedOutflow: formatValue(totalOutflow),
      score,
      netFlowRatio
    };
  };
  
  const { inflow, outflow, netFlow, formattedInflow, formattedOutflow, score, netFlowRatio } = calculateNetFlow();
  const totalVolume = inflow + outflow;
  const inflowPercentage = inflow > 0 ? (inflow / totalVolume) * 100 : 0;
  const outflowPercentage = outflow > 0 ? (outflow / totalVolume) * 100 : 0;
  
  // Color based on net flow
  const netFlowColor = netFlow >= 0 ? "text-green-500" : "text-red-500";
  const netFlowPrefix = netFlow >= 0 ? "+" : "";
  const netFlowFormatted = netFlow === 0 ? "0" : `${netFlowPrefix}${netFlow.toFixed(2)}`;
  
  const formatUsdValue = (solAmount: number) => {
    if (!solToUsdcRate || solToUsdcRate <= 0) return '';
    const usdAmount = solAmount * solToUsdcRate;
    return usdAmount >= 1 ? 
      ` ($${usdAmount.toFixed(2)})` : 
      ` ($${usdAmount.toFixed(4)})`;
  };

  // Get a category label based on the net flow ratio
  const getNetFlowCategory = () => {
    if (netFlowRatio >= 0.3) return "Strong net inflow";
    if (netFlowRatio >= 0) return "Mild accumulation";
    if (netFlowRatio >= -0.3) return "Net outflow";
    return "Heavy net drain";
  };

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="NetFlowAnalysis">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg">Net Flow Analysis</h4>
        
        <span 
          className={`inline-block rounded px-3 py-1 text-sm font-bold ${
            score >= 90
              ? "bg-green-200 text-green-800"
              : score >= 60
              ? "bg-yellow-200 text-yellow-800"
              : score >= 30
              ? "bg-orange-200 text-orange-900"
              : "bg-red-200 text-red-800"
          }`}
          data-score={score}
        >
          Score: {score}/100
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ArrowDownSquare className="h-4 w-4 text-green-500" />
          <div>
            <div className="text-xs text-muted-foreground">Inflow</div>
            <div className="font-bold">{formattedInflow} SOL {formatUsdValue(inflow)}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpSquare className="h-4 w-4 text-red-500" />
          <div>
            <div className="text-xs text-muted-foreground">Outflow</div>
            <div className="font-bold">{formattedOutflow} SOL {formatUsdValue(outflow)}</div>
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Net Flow: <span className={netFlowColor + " font-semibold"}>{netFlowFormatted} SOL</span></span>
          <span>Ratio: <span className={netFlowColor + " font-semibold"}>{(netFlowRatio * 100).toFixed(1)}%</span></span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
          <div className="flex h-full">
            <div className="bg-green-500 h-full" style={{width: `${inflowPercentage}%`}}></div>
            <div className="bg-red-500 h-full" style={{width: `${outflowPercentage}%`}}></div>
          </div>
        </div>
        <div className="text-xs text-right mt-1 font-medium">{getNetFlowCategory()}</div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        <p>Score based on ratio: (Inflow-Outflow)/(Inflow+Outflow)</p>
        <p>≥0.3: 90-100 | 0 to 0.3: 60-89 | -0.3 to 0: 30-59 | &lt;-0.3: 0-29</p>
      </div>
    </div>
  );
};

export default NetFlowAnalysis;
