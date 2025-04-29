
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle, Clock } from "lucide-react";

interface BorrowingBehaviorProps {
  transactions: any[];
}

const BorrowingBehavior: React.FC<BorrowingBehaviorProps> = ({ transactions }) => {
  const {
    score,
    repaymentRatio,
    liquidationCount,
    creditUsageFrequency,
    scoreBand,
    scoreColor
  } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        score: 0,
        repaymentRatio: 0,
        liquidationCount: 0,
        creditUsageFrequency: 0,
        scoreBand: 'No Data',
        scoreColor: 'text-gray-400'
      };
    }

    console.log('Analyzing DeFi lending behavior from transactions:', transactions.length);

    // Enhanced DeFi lending transaction detection using Helius API data
    const lendingTransactions = transactions.filter(tx => {
      // Look for specific DeFi lending indicators from Helius API
      const isDeFiLendingTx = 
        tx.type === 'BORROW' || 
        tx.type === 'REPAY' || 
        tx.type === 'LIQUIDATE' ||
        (tx.description && (
          tx.description.toLowerCase().includes('borrow') ||
          tx.description.toLowerCase().includes('repay') ||
          tx.description.toLowerCase().includes('liquidat') ||
          tx.description.toLowerCase().includes('lending') ||
          tx.description.toLowerCase().includes('loan')
        )) ||
        (tx.source && [
          'SOLEND', 
          'PORT', 
          'LARIX', 
          'MANGO', 
          'FRANCIUM'
        ].some(platform => tx.source.toUpperCase().includes(platform)));
      
      return isDeFiLendingTx;
    });

    console.log(`Found ${lendingTransactions.length} DeFi lending transactions`);

    // Extract specific transaction types
    const borrowTransactions = lendingTransactions.filter(tx => 
      tx.type === 'BORROW' || 
      tx.description?.toLowerCase().includes('borrow')
    );
    
    const repayTransactions = lendingTransactions.filter(tx => 
      tx.type === 'REPAY' || 
      tx.description?.toLowerCase().includes('repay')
    );
    
    const liquidationTransactions = lendingTransactions.filter(tx => 
      tx.type === 'LIQUIDATE' || 
      tx.description?.toLowerCase().includes('liquidat')
    );

    const totalBorrows = borrowTransactions.length;
    const totalRepayments = repayTransactions.length;
    const totalLiquidations = liquidationTransactions.length;
    
    // Calculate metrics
    const repaymentRatio = totalBorrows > 0 ? totalRepayments / totalBorrows : 1;
    const liquidationCount = totalLiquidations;
    const creditUsageFrequency = lendingTransactions.length;

    console.log(`Repayment ratio: ${repaymentRatio}, Liquidation count: ${liquidationCount}, Credit usage: ${creditUsageFrequency}`);
    
    // Scoring logic
    let calculatedScore = 0;
    let scoreBand = '';
    let scoreColor = '';

    if (liquidationCount === 0 && repaymentRatio >= 1.0) {
      calculatedScore = 90 + Math.min(10, creditUsageFrequency * 2);
      scoreBand = 'Excellent';
      scoreColor = 'text-green-600';
    } else if (liquidationCount <= 2 && repaymentRatio > 0.8) {
      calculatedScore = 70 + Math.min(19, Math.floor((repaymentRatio - 0.8) * 100));
      scoreBand = 'Good';
      scoreColor = 'text-emerald-500';
    } else if (creditUsageFrequency > 3 && repaymentRatio >= 0.5 && repaymentRatio <= 0.8) {
      calculatedScore = 40 + Math.min(29, Math.floor((repaymentRatio - 0.5) * 100));
      scoreBand = 'Moderate';
      scoreColor = 'text-amber-500';
    } else {
      calculatedScore = Math.min(39, Math.floor(repaymentRatio * 100));
      scoreBand = 'Poor';
      scoreColor = 'text-red-500';
    }

    // If no lending activity was found, set a default "No Data" state
    if (lendingTransactions.length === 0) {
      calculatedScore = 0;
      scoreBand = 'No Data';
      scoreColor = 'text-gray-400';
    }

    console.log(`Calculated borrowing behavior score: ${calculatedScore}, band: ${scoreBand}`);
    
    return {
      score: calculatedScore,
      repaymentRatio: repaymentRatio * 100, // Convert to percentage
      liquidationCount,
      creditUsageFrequency,
      scoreBand,
      scoreColor
    };
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Borrowing Behavior (DeFi)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {score > 0 || scoreBand !== 'No Data' ? (
          <>
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className={`text-sm font-medium ${scoreColor}`}>{score}</span>
              </div>
              <Progress value={score} className="h-2" />
              <span className="mt-1 text-xs text-center block font-medium text-muted-foreground">{scoreBand}</span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Loan Repayment Rate</span>
                </div>
                <span className="font-medium">{repaymentRatio.toFixed(0)}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Liquidations</span>
                </div>
                <span className="font-medium">{liquidationCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Lending Interactions</span>
                </div>
                <span className="font-medium">{creditUsageFrequency}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No lending activity detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BorrowingBehavior;
