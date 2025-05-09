
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, ArrowUpCircle, PercentIcon } from "lucide-react";

interface CollateralManagementProps {
  transactions: any[];
}

const CollateralManagement: React.FC<CollateralManagementProps> = ({ transactions }) => {
  const {
    score,
    avgLTV,
    topUpFrequency,
    scoreBand,
    scoreColor
  } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        score: 0,
        avgLTV: 0,
        topUpFrequency: 0,
        scoreBand: 'No Data',
        scoreColor: 'text-gray-400'
      };
    }

    // Find collateral-related transactions using Helius API data
    const collateralTransactions = transactions.filter(tx => {
      // Check transaction type from Helius API
      const isCollateralTx = 
        // Direct protocol interactions
        tx.source === 'SOLEND' ||
        tx.source === 'PORT' ||
        tx.source === 'MANGO' ||
        tx.source === 'FRANCIUM' ||
        // Transaction types from Helius
        tx.type === 'COLLATERAL' ||
        tx.type === 'BORROW' ||
        // Description based identification (fallback)
        (tx.description && tx.description.toLowerCase().includes('collateral'));

      // Log for debugging
      if (isCollateralTx) {
        console.log('Found collateral transaction:', {
          source: tx.source,
          type: tx.type,
          description: tx.description
        });
      }

      return isCollateralTx;
    });

    console.log(`Found ${collateralTransactions.length} collateral transactions`);

    // Calculate LTV from actual transaction data
    let totalLTV = 0;
    let ltvCount = 0;

    collateralTransactions.forEach(tx => {
      // Look for LTV in token transfers and account data
      if (tx.tokenTransfers) {
        const collateralValue = tx.tokenTransfers.reduce((total: number, transfer: any) => {
          if (transfer.tokenAmount && transfer.mint) {
            return total + parseFloat(transfer.tokenAmount);
          }
          return total;
        }, 0);

        if (collateralValue > 0) {
          // Calculate LTV based on collateral value and borrowed amount
          const borrowedAmount = tx.nativeTransfers?.[0]?.amount || 0;
          if (borrowedAmount > 0) {
            const ltv = (borrowedAmount / collateralValue) * 100;
            totalLTV += ltv;
            ltvCount++;
            console.log(`Calculated LTV for transaction: ${ltv}%`);
          }
        }
      }

      // Also check accountData for more detailed protocol-specific information
      if (tx.accountData) {
        tx.accountData.forEach((data: any) => {
          if (data.tokenBalanceChanges) {
            data.tokenBalanceChanges.forEach((change: any) => {
              if (change.userAccount === tx.source && change.mint) {
                console.log('Found token balance change in collateral transaction:', change);
              }
            });
          }
        });
      }
    });

    // Calculate metrics
    const avgLTV = ltvCount > 0 ? (totalLTV / ltvCount) : 0;
    const topUpFrequency = collateralTransactions.length;

    console.log(`Average LTV: ${avgLTV}%, Top-up frequency: ${topUpFrequency}`);

    // Calculate score based on metrics
    let calculatedScore = 0;
    let scoreBand = '';
    let scoreColor = '';

    if (avgLTV < 50 && topUpFrequency >= 5) {
      calculatedScore = 90 + Math.min(10, topUpFrequency);
      scoreBand = 'Excellent';
      scoreColor = 'text-green-600';
    } else if (avgLTV >= 50 && avgLTV < 70 && topUpFrequency >= 3) {
      calculatedScore = 60 + Math.min(29, Math.floor((70 - avgLTV) * 2));
      scoreBand = 'Good';
      scoreColor = 'text-emerald-500';
    } else if (avgLTV >= 70 && avgLTV < 85) {
      calculatedScore = 30 + Math.min(29, Math.floor((85 - avgLTV) * 2));
      scoreBand = 'Moderate';
      scoreColor = 'text-amber-500';
    } else {
      calculatedScore = Math.min(29, Math.floor((100 - avgLTV) / 2));
      scoreBand = 'Poor';
      scoreColor = 'text-red-500';
    }

    // If no collateral activity was found, set a default "No Data" state
    if (collateralTransactions.length === 0) {
      calculatedScore = 0;
      scoreBand = 'No Data';
      scoreColor = 'text-gray-400';
    }

    return {
      score: calculatedScore,
      avgLTV: avgLTV,
      topUpFrequency,
      scoreBand,
      scoreColor
    };
  }, [transactions]);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedLTV, setAnimatedLTV] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Animate the score
    if (score > 0) {
      const duration = 1200;
      const interval = 20;
      const steps = duration / interval;
      const increment = score / steps;
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [score]);

  useEffect(() => {
    // Animate the LTV
    if (avgLTV > 0) {
      const duration = 1500;
      const interval = 30;
      const steps = duration / interval;
      const increment = avgLTV / steps;
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= avgLTV) {
          setAnimatedLTV(avgLTV);
          clearInterval(timer);
        } else {
          setAnimatedLTV(current);
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [avgLTV]);

  useEffect(() => {
    // Animate the progress bar
    const duration = 1000;
    const interval = 20;
    const steps = duration / interval;
    const increment = score / steps;
    
    let progress = 0;
    const timer = setInterval(() => {
      progress += increment;
      if (progress >= score) {
        setAnimatedProgress(score);
        clearInterval(timer);
      } else {
        setAnimatedProgress(progress);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [score]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Collateral Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {score > 0 || scoreBand !== 'No Data' ? (
          <>
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className={`text-sm font-medium ${scoreColor}`}>{animatedScore}</span>
              </div>
              <Progress value={animatedProgress} className="h-2" />
              <span className="mt-1 text-xs text-center block font-medium text-muted-foreground">{scoreBand}</span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PercentIcon className="h-3.5 w-3.5" />
                  <span>Average LTV</span>
                </div>
                <span className="font-medium">{animatedLTV.toFixed(1)}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  <span>Top-up Frequency</span>
                </div>
                <span className="font-medium">{topUpFrequency}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No collateral activity detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollateralManagement;
