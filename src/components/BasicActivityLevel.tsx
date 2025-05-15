
import React, { useState, useEffect } from "react";
import { Activity, ListFilter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: string | number;
  currency?: string;
};

type Props = {
  transactions: Transaction[];
};

function calculateActivityScore(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      score: 0
    };
  }

  console.log(`Calculating activity score based on ${transactions.length} transactions`);

  // Count total valid transactions
  const totalTransactions = transactions.length;
  
  // Calculate score based on Algorithm #9: Basic Activity Level
  let score = 0;
  
  if (totalTransactions >= 1000) {
    score = 100;
  } else if (totalTransactions >= 500) {
    score = 80;
  } else if (totalTransactions >= 100) {
    score = 50;
  } else if (totalTransactions >= 10) {
    score = 20;
  } else {
    score = 0;
  }

  return {
    totalTransactions,
    score
  };
}

const BasicActivityLevel: React.FC<Props> = ({ transactions }) => {
  const { totalTransactions, score } = calculateActivityScore(transactions);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedTransactions, setAnimatedTransactions] = useState(0);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  useEffect(() => {
    // Animate the score with real data
    if (score > 0) {
      const scoreDuration = 1000; // 1s for score animation
      const scoreInterval = 20; // Update every 20ms
      const scoreSteps = scoreDuration / scoreInterval;
      const scoreIncrement = score / scoreSteps;
      
      let currentScore = 0;
      const scoreTimer = setInterval(() => {
        currentScore += scoreIncrement;
        if (currentScore >= score) {
          setAnimatedScore(score);
          setAnimationCompleted(true);
          clearInterval(scoreTimer);
        } else {
          setAnimatedScore(Math.floor(currentScore));
        }
      }, scoreInterval);
      
      return () => clearInterval(scoreTimer);
    }
  }, [score]);
  
  useEffect(() => {
    // Animate the transaction count with real data
    if (totalTransactions > 0) {
      const txDuration = 1200; // 1.2s for transaction count animation
      const txInterval = 20; // Update every 20ms
      const txSteps = txDuration / txInterval;
      const txIncrement = totalTransactions / txSteps;
      
      let currentTx = 0;
      const txTimer = setInterval(() => {
        currentTx += txIncrement;
        if (currentTx >= totalTransactions) {
          setAnimatedTransactions(totalTransactions);
          clearInterval(txTimer);
        } else {
          setAnimatedTransactions(Math.floor(currentTx));
        }
      }, txInterval);
      
      return () => clearInterval(txTimer);
    }
  }, [totalTransactions]);

  console.log("BasicActivityLevel Metrics:", {
    totalTransactions,
    score
  });

  return (
    <Card className="bg-muted shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Basic Activity Level
          <span
            className={`ml-2 px-2 py-1 text-sm rounded ${
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
            Score: {animatedScore}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Transactions:</span>
            <span className="font-medium">{animatedTransactions}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>1000+ transactions: 100</li>
              <li>500–1000 transactions: 80</li>
              <li>100–500 transactions: 50</li>
              <li>10-99 transactions: 20</li>
              <li>{`<10 transactions: 0`}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicActivityLevel;
