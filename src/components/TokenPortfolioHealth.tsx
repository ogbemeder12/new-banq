
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CirclePercent, ChartPie } from "lucide-react";

interface TokenPortfolioHealthProps {
  transactions: any[];
}

interface TokenInfo {
  mint: string;
  balance: number;
  symbol?: string;
}

// List of well-known blue chip tokens on Solana
const BLUE_CHIP_TOKENS = new Set([
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
]);

// List of stablecoins on Solana
const STABLECOINS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

const TokenPortfolioHealth: React.FC<TokenPortfolioHealthProps> = ({ transactions }) => {
  const {
    score,
    scoreBand,
    scoreColor,
    tokens,
    tokenMetrics
  } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        score: 0,
        scoreBand: 'No Data',
        scoreColor: 'text-gray-400',
        tokens: [],
        tokenMetrics: { blueChipPercentage: 0, stablecoinRatio: 0 }
      };
    }

    console.log("Token Portfolio Health processing transactions:", transactions.length);

    // Calculate base metrics from transactions
    const tokenMap = new Map<string, TokenInfo>();
    let totalTokenValue = 0;

    // Process transactions to gather token data
    transactions.forEach(tx => {
      console.log("Processing transaction:", tx.signature?.substring(0, 6));
      
      // Process token transfers if available
      if (tx.tokenTransfers && Array.isArray(tx.tokenTransfers)) {
        tx.tokenTransfers.forEach((transfer: any) => {
          if (transfer.mint && (transfer.tokenAmount || transfer.amount)) {
            const amount = parseFloat(transfer.tokenAmount || transfer.amount || '0');
            const mint = transfer.mint;
            
            if (!isNaN(amount) && amount !== 0) {
              console.log(`Found token transfer: ${amount} ${transfer.tokenSymbol || mint}`);
              
              const existingToken = tokenMap.get(mint) || { 
                mint, 
                balance: 0, 
                symbol: transfer.tokenSymbol || mint.substring(0, 8) 
              };
              
              existingToken.balance += amount;
              tokenMap.set(mint, existingToken);
              totalTokenValue += Math.abs(amount);
            }
          }
        });
      }

      // Handle native SOL transfers
      if (tx.nativeTransfers && Array.isArray(tx.nativeTransfers)) {
        tx.nativeTransfers.forEach((transfer: any) => {
          if (transfer.amount) {
            const solAmount = parseFloat(transfer.amount) / 1_000_000_000; // Convert lamports to SOL
            if (!isNaN(solAmount) && solAmount !== 0) {
              const solMint = 'So11111111111111111111111111111111111111112';
              console.log(`Found SOL transfer: ${solAmount} SOL`);
              
              const existingToken = tokenMap.get(solMint) || { 
                mint: solMint, 
                balance: 0, 
                symbol: 'SOL' 
              };
              
              existingToken.balance += solAmount;
              tokenMap.set(solMint, existingToken);
              totalTokenValue += Math.abs(solAmount);
            }
          }
        });
      }
      
      // Handle direct amount field for transfers
      if (tx.amount && tx.currency) {
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
          
        if (!isNaN(amount) && amount !== 0) {
          // Determine mint address based on currency
          let mint = 'So11111111111111111111111111111111111111112'; // Default to SOL
          let symbol = tx.currency.toUpperCase();
          
          // Map common currency symbols to mint addresses
          if (symbol === 'USDC') {
            mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
          } else if (symbol === 'USDT') {
            mint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
          } else if (symbol === 'BONK') {
            mint = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
          }
          
          console.log(`Found direct transfer: ${amount} ${symbol}`);
          
          const existingToken = tokenMap.get(mint) || { 
            mint, 
            balance: 0, 
            symbol 
          };
          
          existingToken.balance += amount;
          tokenMap.set(mint, existingToken);
          totalTokenValue += Math.abs(amount);
        }
      }
    });

    console.log(`Processed ${tokenMap.size} unique tokens with total value ${totalTokenValue}`);

    // Calculate blue chip and stablecoin values
    let blueChipValue = 0;
    let stablecoinValue = 0;

    tokenMap.forEach((token) => {
      const absBalance = Math.abs(token.balance);
      if (BLUE_CHIP_TOKENS.has(token.mint)) {
        blueChipValue += absBalance;
        console.log(`Blue chip token: ${token.symbol || token.mint} with value ${absBalance}`);
      }
      if (STABLECOINS.has(token.mint)) {
        stablecoinValue += absBalance;
        console.log(`Stablecoin: ${token.symbol || token.mint} with value ${absBalance}`);
      }
    });

    const blueChipPercentage = totalTokenValue > 0 ? (blueChipValue / totalTokenValue) * 100 : 0;
    const stablecoinRatio = totalTokenValue > 0 ? (stablecoinValue / totalTokenValue) * 100 : 0;

    console.log(`Blue chip percentage: ${blueChipPercentage.toFixed(2)}%, Stablecoin ratio: ${stablecoinRatio.toFixed(2)}%`);

    // Extract metrics from other components' calculations
    const netFlowRatio = calculateNetFlowRatio(transactions);
    const retentionScore = calculateRetentionMetrics(transactions);
    const stabilityScore = calculateStabilityScore(transactions);

    console.log(`Metrics - Net flow: ${netFlowRatio.toFixed(2)}, Retention: ${retentionScore.toFixed(2)}, Stability: ${stabilityScore.toFixed(2)}`);

    // Calculate weighted final score
    const portfolioScore = calculatePortfolioScore(
      blueChipPercentage,
      stablecoinRatio,
      netFlowRatio,
      retentionScore,
      stabilityScore
    );

    const { scoreBand, scoreColor } = getScoreBanding(portfolioScore);

    return {
      score: Math.round(portfolioScore),
      scoreBand,
      scoreColor,
      tokens: Array.from(tokenMap.values()),
      tokenMetrics: {
        blueChipPercentage,
        stablecoinRatio
      }
    };
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ChartPie className="h-4 w-4" />
          Token Portfolio Health
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
                  <ChartPie className="h-3.5 w-3.5" />
                  <span>Blue-Chip %</span>
                </div>
                <span className="font-medium">{tokenMetrics.blueChipPercentage.toFixed(1)}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CirclePercent className="h-3.5 w-3.5" />
                  <span>Stablecoin Ratio</span>
                </div>
                <span className="font-medium">{tokenMetrics.stablecoinRatio.toFixed(1)}%</span>
              </div>
              
              {tokens.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium mb-2">Detected Tokens ({tokens.length})</p>
                  <div className="max-h-20 overflow-y-auto">
                    {tokens.map((token, index) => (
                      <div key={index} className="text-2xs flex justify-between py-0.5">
                        <span>{token.symbol || token.mint.substring(0, 6)+'...'}</span>
                        <span>{Math.abs(token.balance).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No token activity detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper functions for calculating metrics
const calculateNetFlowRatio = (transactions: any[]): number => {
  let totalInflow = 0;
  let totalOutflow = 0;

  transactions.forEach(tx => {
    const amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);

    if (!isNaN(amount)) {
      if (amount > 0) {
        totalInflow += amount;
      } else {
        totalOutflow += Math.abs(amount);
      }
    }
  });

  return totalInflow + totalOutflow === 0 ? 0 : 
    (totalInflow - totalOutflow) / (totalInflow + totalOutflow);
};

const calculateRetentionMetrics = (transactions: any[]): number => {
  if (!transactions || transactions.length < 2) return 0;

  const timestamps = transactions
    .map(tx => tx.timestamp)
    .sort((a, b) => a - b);

  const holdTimeInDays = (timestamps[timestamps.length - 1] - timestamps[0]) / (24 * 60 * 60);
  return Math.min(100, (holdTimeInDays / 30) * 100); // Score based on holding period up to 30 days
};

const calculateStabilityScore = (transactions: any[]): number => {
  if (!transactions || transactions.length < 2) return 0;

  let previousBalance = 0;
  let volatilitySum = 0;
  let count = 0;

  transactions.forEach(tx => {
    const amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);

    if (!isNaN(amount)) {
      if (previousBalance !== 0) {
        const changePercent = Math.abs((amount - previousBalance) / previousBalance) * 100;
        volatilitySum += changePercent;
        count++;
      }
      previousBalance = amount;
    }
  });

  const averageVolatility = count > 0 ? volatilitySum / count : 100;
  return Math.max(0, 100 - averageVolatility); // Higher stability = lower volatility
};

const calculatePortfolioScore = (
  blueChipPercentage: number,
  stablecoinRatio: number,
  netFlowRatio: number,
  retentionScore: number,
  stabilityScore: number
): number => {
  // Weighted scoring system
  const weights = {
    blueChip: 0.3,
    stablecoin: 0.2,
    netFlow: 0.2,
    retention: 0.15,
    stability: 0.15
  };

  const netFlowScore = ((netFlowRatio + 1) / 2) * 100; // Convert -1 to 1 range to 0-100

  return (
    (blueChipPercentage * weights.blueChip) +
    (stablecoinRatio * weights.stablecoin) +
    (netFlowScore * weights.netFlow) +
    (retentionScore * weights.retention) +
    (stabilityScore * weights.stability)
  );
};

const getScoreBanding = (score: number): { scoreBand: string; scoreColor: string } => {
  if (score >= 80) return { scoreBand: 'Excellent', scoreColor: 'text-green-600' };
  if (score >= 60) return { scoreBand: 'Good', scoreColor: 'text-emerald-500' };
  if (score >= 40) return { scoreBand: 'Moderate', scoreColor: 'text-amber-500' };
  if (score > 0) return { scoreBand: 'Poor', scoreColor: 'text-red-500' };
  return { scoreBand: 'No Data', scoreColor: 'text-gray-400' };
};

export default TokenPortfolioHealth;
