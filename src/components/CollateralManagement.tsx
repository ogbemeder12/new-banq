
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

    // Calculate score based on new algorithm:
    // Avg. LTV < 50%, frequent collateral management: 90–100
    // LTV 50–70%, occasional management: 60–89
    // LTV 70–85%, minimal top-ups: 30–59
    // LTV > 85% often, no top-ups: 0–29
    
    let calculatedScore = 0;
    let scoreBand = '';
    let scoreColor = '';

    // Define what counts as frequent/occasional/minimal top-ups
    const isFrequentTopUp = topUpFrequency >= 5;
    const isOccasionalTopUp = topUpFrequency >= 3 && topUpFrequency < 5;
    const isMinimalTopUp = topUpFrequency >= 1 && topUpFrequency < 3;
    const hasNoTopUps = topUpFrequency === 0;

    if (avgLTV < 50 && isFrequentTopUp) {
      // Avg. LTV < 50%, frequent collateral management: 90–100
      calculatedScore = 90 + Math.min(10, topUpFrequency - 4);
      scoreBand = 'Excellent';
      scoreColor = 'text-green-600';
    } else if (avgLTV < 50 && (isOccasionalTopUp || isMinimalTopUp)) {
      // Good but not excellent (LTV good but not frequent enough top-ups)
      calculatedScore = 85;
      scoreBand = 'Very Good';
      scoreColor = 'text-green-600';
    } else if (avgLTV >= 50 && avgLTV < 70 && (isFrequentTopUp || isOccasionalTopUp)) {
      // LTV 50–70%, occasional management: 60–89
      const baseScore = 60;
      const ltvFactor = (70 - avgLTV) / 20; // 0-1 scale for LTV between 50-70%
      const topUpFactor = isFrequentTopUp ? 1 : 0.7; // Bonus for frequency
      calculatedScore = baseScore + Math.round(29 * ltvFactor * topUpFactor);
      scoreBand = 'Good';
      scoreColor = 'text-emerald-500';
    } else if (avgLTV >= 70 && avgLTV < 85 && (isOccasionalTopUp || isMinimalTopUp)) {
      // LTV 70–85%, minimal top-ups: 30–59
      const baseScore = 30;
      const ltvFactor = (85 - avgLTV) / 15; // 0-1 scale for LTV between 70-85%
      const topUpFactor = isOccasionalTopUp ? 1 : 0.7; // Bonus for frequency
      calculatedScore = baseScore + Math.round(29 * ltvFactor * topUpFactor);
      scoreBand = 'Moderate';
      scoreColor = 'text-amber-500';
    } else if (avgLTV >= 85 || hasNoTopUps) {
      // LTV > 85% often, no top-ups: 0–29
      const baseScore = 0;
      const ltvFactor = Math.max(0, Math.min(1, (100 - avgLTV) / 15)); // 0-1 scale for LTV above 85%
      const topUpBonus = !hasNoTopUps ? 5 : 0; // Small bonus for any top-ups
      calculatedScore = baseScore + Math.round(29 * ltvFactor) + topUpBonus;
      scoreBand = 'Poor';
      scoreColor = 'text-red-500';
    } else {
      // Fallback for edge cases
      const estimatedScore = Math.max(15, 100 - avgLTV - (5 * (5 - topUpFrequency)));
      calculatedScore = Math.min(95, Math.max(10, estimatedScore));
      
      if (calculatedScore >= 70) {
        scoreBand = 'Good';
        scoreColor = 'text-emerald-500';
      } else if (calculatedScore >= 40) {
        scoreBand = 'Moderate';
        scoreColor = 'text-amber-500';
      } else {
        scoreBand = 'Poor';
        scoreColor = 'text-red-500';
      }
    }

    // If no collateral activity was found, set a default "No Data" state
    if (collateralTransactions.length === 0) {
      calculatedScore = 0;
      scoreBand = 'No Data';
      scoreColor = 'text-gray-400';
    }

    // Ensure score is in valid range
    calculatedScore = Math.min(100, Math.max(0, Math.round(calculatedScore)));

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
    } else {
      setAnimatedScore(0);
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
    } else {
      setAnimatedLTV(0);
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

  // Define descriptions for each score range
  const getLTVDescription = () => {
    if (avgLTV < 50) return "Low risk (<50%)";
    if (avgLTV < 70) return "Medium risk (50-70%)";
    if (avgLTV < 85) return "High risk (70-85%)";
    return "Very high risk (>85%)";
  };

  const getTopUpDescription = () => {
    if (topUpFrequency >= 5) return "Frequent management";
    if (topUpFrequency >= 3) return "Regular management";
    if (topUpFrequency >= 1) return "Minimal management";
    return "No active management";
  };

  return (
    <Card data-component="CollateralManagement">
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
              <Progress value={animatedProgress} className="h-2" data-score={score} />
              <span className="mt-1 text-xs text-center block font-medium text-muted-foreground">{scoreBand}</span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PercentIcon className="h-3.5 w-3.5" />
                  <span>Average LTV</span>
                </div>
                <span className="font-medium">{animatedLTV.toFixed(1)}% <span className="text-xs font-normal text-muted-foreground">({getLTVDescription()})</span></span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  <span>Top-up Frequency</span>
                </div>
                <span className="font-medium">{topUpFrequency} <span className="text-xs font-normal text-muted-foreground">({getTopUpDescription()})</span></span>
              </div>

              <div className="pt-3 text-xs text-muted-foreground mt-2">
                <p>LTV &lt;50% + frequent management: 90-100</p>
                <p>LTV 50-70% + occasional management: 60-89</p>
                <p>LTV 70-85% + minimal management: 30-59</p>
                <p>LTV &gt;85% or no management: 0-29</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No collateral activity detected</p>
            <p className="text-xs text-muted-foreground mt-2">Score based on LTV and collateral management frequency</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollateralManagement;
