
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateOverallScore, getScoreColor, getScoreCategory, ScoreCategory } from "@/lib/scoreUtils";
import ScoreImprovementCard from "@/components/ScoreImprovementCard";

// Helper function to get component-specific score from DOM if available
const getComponentScore = (componentId: string): number | null => {
  try {
    // Find component by its data-component attribute and data-score attribute
    const element = document.querySelector(`[data-component="${componentId}"] [data-score]`);
    if (element && element.getAttribute('data-score')) {
      const score = parseInt(element.getAttribute('data-score') || '0', 10);
      return isNaN(score) ? null : score;
    }
    return null;
  } catch (e) {
    console.error(`Error getting score for ${componentId}:`, e);
    return null;
  }
};

export function ScoreInsights() {
  // Initialize with empty scores that will be filled with real component scores
  const [scores, setScores] = useState<ScoreCategory[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  
  // Effect to update scores from components when they're available
  useEffect(() => {
    const updateScores = () => {
      // Define the components we want to get scores from
      const componentScores: ScoreCategory[] = [
        { name: "Minimum Balance Stability", value: 0, component: "MinBalanceStability" },
        { name: "Net Flow Analysis", value: 0, component: "NetFlowAnalysis" },
        { name: "Transaction Patterns", value: 0, component: "TransactionPatterns" },
        { name: "Wallet Age & Longevity", value: 0, component: "WalletAgeLongevity" },
        { name: "Token Portfolio Health", value: 0, component: "TokenPortfolio" },
        { name: "Strategic Usage of Tools", value: 0, component: "StrategicToolUsage" },
        { name: "Basic Activity Level", value: 0, component: "BasicActivityLevel" },
        { name: "Retention Behavior", value: 0, component: "RetentionBehavior" },
        { name: "Borrowing Behavior", value: 0, component: "BorrowingBehavior" },
        { name: "Staking & Farming Engagement", value: 0, component: "StakingFarming" }
      ];
      
      let hasUpdates = false;
      
      // Check for component scores in the DOM
      componentScores.forEach((score, index) => {
        const componentScore = getComponentScore(score.component);
        if (componentScore !== null) {
          componentScores[index] = { ...score, value: componentScore };
          console.log(`Updated ${score.name} score to: ${componentScore}`);
          hasUpdates = true;
        }
      });
      
      // Update state only if we found any changes
      if (hasUpdates) {
        // Filter out components with zero scores (likely not found)
        const validScores = componentScores.filter(score => score.value > 0);
        setScores(validScores);
        
        // Calculate new overall score
        const newOverallScore = calculateOverallScore(validScores);
        setOverallScore(newOverallScore);
      }
    };
    
    // Run once on mount
    updateScores();
    
    // Also set up an interval to check periodically since components might load at different times
    const intervalId = setInterval(updateScores, 1000); // Check every second for more responsive updates
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);  
  
  // Get score color and category based on the overall score
  const scoreColor = getScoreColor(overallScore);
  const category = getScoreCategory(overallScore);
  
  return (
    <div className="space-y-4">
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardHeader>
          <CardTitle>Score Insights</CardTitle>
          <CardDescription>Your on-chain activity analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <span className={`font-bold ${scoreColor}`}>{overallScore}</span>
            </div>
            <Progress value={overallScore} className="h-2" />
            <p className="text-center mt-2 text-sm font-medium">
              {category} ({overallScore}/100)
            </p>
          </div>
          
          <div className="space-y-4">
            {scores.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center">
                  <span className={`font-medium ${getScoreColor(item.value)}`}>
                    {item.value}
                  </span>
                  <Progress 
                    value={item.value} 
                    className="w-16 h-1.5 ml-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <ScoreImprovementCard currentScore={overallScore} />
    </div>
  );
}
