
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  amount: number | string;
  currency?: string;
  signature?: string;
}

interface NetFlowProps {
  transactions: Transaction[];
  solToUsdcRate?: number; // Optional conversion rate for SOL to USDC
}

const NetFlowAnalysis = ({ transactions, solToUsdcRate = 0 }: NetFlowProps) => {
  console.log("NetFlowAnalysis received transactions:", transactions);
  console.log("Current SOL to USDC rate:", solToUsdcRate);
  
  // Helper function to convert any transaction amount to SOL
  const convertToSol = (tx: Transaction): number => {
    try {
      // Handle both string and number amount formats
      const amount = typeof tx.amount === 'string' ? 
        parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
        (typeof tx.amount === 'number' ? tx.amount : 0);
      
      if (isNaN(amount) || amount === 0) return 0;
      
      // Default all amounts to USDC if not specified, then convert to SOL
      const currency = tx.currency?.toUpperCase() || 'USDC'; // Assume USDC by default if not specified
      
      // If it's already in SOL, return as is
      if (currency === 'SOL') return amount;
      
      // Convert all amounts (USDC or any other) to SOL if we have a valid rate
      if (solToUsdcRate > 0) {
        const amountInSol = amount / solToUsdcRate;
        console.log(`Converted ${amount} ${currency} to ${amountInSol} SOL (rate: ${solToUsdcRate})`);
        return amountInSol;
      }
      
      // Default case - return original amount (should be handled better in production)
      return amount;
    } catch (error) {
      console.error("Error converting transaction amount:", error);
      return 0;
    }
  };
  
  const calculateNetFlow = (transactions: Transaction[]) => {
    let totalInflow = 0;
    let totalOutflow = 0;

    // Only proceed if we have actual transaction data
    if (!transactions || transactions.length === 0) {
      console.log("No transaction data available for NetFlowAnalysis");
      return {
        netFlowRatio: 0,
        score: 0,
        totalInflow: 0,
        totalOutflow: 0,
        hasData: false
      };
    }

    transactions.forEach(tx => {
      try {
        // Convert the transaction amount to SOL
        const amountInSol = convertToSol(tx);
        
        // Skip if amount is 0
        if (amountInSol === 0) return;
        
        // If amount is positive, it's an inflow, otherwise it's an outflow
        if (amountInSol > 0) {
          totalInflow += amountInSol;
          console.log(`Added inflow: +${amountInSol}, total inflow now: ${totalInflow}`);
        } else if (amountInSol < 0) {
          totalOutflow += Math.abs(amountInSol);
          console.log(`Added outflow: ${amountInSol}, total outflow now: ${totalOutflow}`);
        }
      } catch (error) {
        console.error("Error processing transaction in NetFlowAnalysis:", error);
      }
    });

    console.log(`Total inflow: ${totalInflow}, Total outflow: ${totalOutflow}`);

    // Calculate net flow only if there are valid transactions with flow data
    if (totalInflow === 0 && totalOutflow === 0) {
      return {
        netFlowRatio: 0,
        score: 10, // Assign minimal score instead of zero when no flow data
        totalInflow,
        totalOutflow,
        hasData: transactions.length > 0 // Mark as having data if we have transactions
      };
    }

    // Prevent division by zero
    const netFlowRatio = (totalInflow + totalOutflow) === 0 ? 0 :
      (totalInflow - totalOutflow) / (totalInflow + totalOutflow);

    console.log(`Net flow ratio: ${netFlowRatio}`);

    let score = 0;
    if (netFlowRatio > 0.3) {
      score = 90 + (netFlowRatio - 0.3) * 33.33; // Scale from 90-100
    } else if (netFlowRatio >= 0) {
      score = 60 + (netFlowRatio / 0.3) * 29; // Scale from 60-89
    } else if (netFlowRatio >= -0.3) {
      score = 30 + ((netFlowRatio + 0.3) / 0.3) * 29; // Scale from 30-59
    } else {
      score = Math.max(0, 29 + (netFlowRatio + 0.3) * 96.67); // Scale from 0-29
    }

    return {
      netFlowRatio,
      score: Math.min(100, Math.max(0, Math.round(score))),
      totalInflow,
      totalOutflow,
      hasData: true
    };
  };

  const { netFlowRatio, score, totalInflow, totalOutflow, hasData } = calculateNetFlow(transactions);

  const getScoreCategory = (score: number) => {
    if (score >= 90) return "Strong net inflow";
    if (score >= 60) return "Mild accumulation";
    if (score >= 30) return "Net outflow but not extreme";
    return "Heavy net drain";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 60) return "text-emerald-400";
    if (score >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Flow Analysis</CardTitle>
        <CardDescription>Understanding volume of money in vs money out</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {hasData ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Flow Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
                </div>
                <Progress value={score} className="h-2" />
                <p className={`text-sm ${getScoreColor(score)} font-medium text-center mt-1`}>
                  {getScoreCategory(score)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-500">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Inflow</span>
                  </div>
                  <p className="text-xl font-bold">
                    <strong>{totalInflow.toFixed(4)} SOL</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-500">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Outflow</span>
                  </div>
                  <p className="text-xl font-bold">
                    <strong>{totalOutflow.toFixed(4)} SOL</strong>
                  </p>
                </div>
              </div>

              {totalInflow === 0 && totalOutflow > 0 && (
                <div className="mt-2 text-sm text-yellow-600 italic">
                  ⚠️ Wallet is sending funds using previous balance. No recent inflows.
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Net Flow Ratio: {(netFlowRatio * 100).toFixed(1)}%
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transaction flow data detected in API results.</p>
              <p className="text-sm text-muted-foreground mt-2">Please try fetching more transactions.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NetFlowAnalysis;
