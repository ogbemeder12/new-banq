
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
        score: 0
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
    const hasTransactions = totalInflow > 0 || totalOutflow > 0;
    
    // Calculate score based on net flow - prefer positive ratios
    let score = 0;
    
    if (hasTransactions) {
      const totalVolume = totalInflow + totalOutflow;
      const netRatio = netFlow / (totalVolume || 1);
      
      if (netRatio >= 0.7) score = 90; // Extremely positive net flow (saving/accumulating)
      else if (netRatio >= 0.5) score = 85;
      else if (netRatio >= 0.3) score = 75;
      else if (netRatio >= 0.1) score = 65;
      else if (netRatio >= 0) score = 55; // Slightly positive
      else if (netRatio >= -0.2) score = 45; // Slightly negative
      else if (netRatio >= -0.4) score = 35;
      else if (netRatio >= -0.6) score = 25;
      else score = 15; // Very negative flow
    }
    
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
      score
    };
  };
  
  const { inflow, outflow, netFlow, formattedInflow, formattedOutflow, score } = calculateNetFlow();
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

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="NetFlowAnalysis">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg">Net Flow Analysis</h4>
        
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
          {totalVolume > 0 && <span>Total Volume: {(totalVolume).toFixed(2)} SOL</span>}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
          <div className="flex h-full">
            <div className="bg-green-500 h-full" style={{width: `${inflowPercentage}%`}}></div>
            <div className="bg-red-500 h-full" style={{width: `${outflowPercentage}%`}}></div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        <p>A positive net flow indicates more assets coming in than going out, which is generally favorable for your credit score.</p>
      </div>
    </div>
  );
};

export default NetFlowAnalysis;
