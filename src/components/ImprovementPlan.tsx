
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Shield,
  AlertCircle,
  CreditCard,
  Wallet,
  Repeat,
  BarChart3
} from "lucide-react";
import ScoreImprovementCard from "./ScoreImprovementCard";

interface ScoreMetric {
  title: string;
  description: string;
  score: string;
  percentage: number;
}

interface ImprovementPlanProps {
  creditScore: number | null;
  scoreMetrics: ScoreMetric[];
  onActionClick?: () => void;
}

const ImprovementPlan: React.FC<ImprovementPlanProps> = ({ creditScore, scoreMetrics, onActionClick }) => {
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const weakestAreas = [...scoreMetrics].sort((a, b) => a.percentage - b.percentage).slice(0, 2);
  
  // Get personalized recommendations based on the score metrics
  const getRecommendations = () => {
    const recommendations = [];
    
    // Payment History recommendations
    const paymentHistory = scoreMetrics.find(metric => metric.title === "Payment History");
    if (paymentHistory && paymentHistory.percentage < 80) {
      recommendations.push({
        title: "Improve Payment History",
        description: "Ensure all transactions are successful by maintaining sufficient SOL for gas fees.",
        impact: "high" as const,
        difficulty: "easy" as const,
        actionLabel: "Learn more",
        icon: <Clock className="h-6 w-6" />,
      });
    }
    
    // Credit Utilization recommendations
    const creditUtilization = scoreMetrics.find(metric => metric.title === "Credit Utilization");
    if (creditUtilization && creditUtilization.percentage < 70) {
      recommendations.push({
        title: "Reduce Credit Utilization",
        description: "Keep more SOL in reserve and maintain a balanced outflow-to-inflow ratio.",
        impact: "high" as const, 
        difficulty: "moderate" as const,
        actionLabel: "Balance your wallet",
        icon: <TrendingUp className="h-6 w-6" />,
      });
    }
    
    // Account Age recommendations
    const accountAge = scoreMetrics.find(metric => metric.title === "Account Age");
    if (accountAge && accountAge.percentage < 90) {
      recommendations.push({
        title: "Increase Account Age",
        description: "Continue using this wallet consistently over time. Age is a major factor.",
        impact: "medium" as const,
        difficulty: "hard" as const,
        actionLabel: "Set reminders",
        icon: <Calendar className="h-6 w-6" />,
      });
    }
    
    // Recent Inquiries recommendations
    const recentInquiries = scoreMetrics.find(metric => metric.title === "Recent Inquiries");
    if (recentInquiries && recentInquiries.percentage < 75) {
      recommendations.push({
        title: "Reduce Recent Inquiries",
        description: "Limit the number of different addresses you interact with in a short period.",
        impact: "medium" as const,
        difficulty: "easy" as const,
        actionLabel: "Plan interactions",
        icon: <AlertCircle className="h-6 w-6" />,
      });
    }
    
    // Credit Mix recommendations
    const creditMix = scoreMetrics.find(metric => metric.title === "Credit Mix");
    if (creditMix && creditMix.percentage < 70) {
      recommendations.push({
        title: "Diversify Credit Mix",
        description: "Use your wallet for various transaction types and interact with different tokens.",
        impact: "medium" as const,
        difficulty: "moderate" as const,
        actionLabel: "Explore token options",
        icon: <CreditCard className="h-6 w-6" />,
      });
    }
    
    // General recommendations
    recommendations.push({
      title: "Maintain a Safety Buffer",
      description: "Always keep enough SOL for gas fees to avoid failed transactions.",
      impact: "high" as const,
      difficulty: "easy" as const,
      actionLabel: "Calculate your buffer",
      icon: <Shield className="h-6 w-6" />,
    });
    
    recommendations.push({
      title: "Regular Activity",
      description: "Consistent, regular wallet activity improves your score over time.",
      impact: "medium" as const,
      difficulty: "easy" as const,
      actionLabel: "Set up recurring activity",
      icon: <Repeat className="h-6 w-6" />,
    });
    
    recommendations.push({
      title: "Monitor Your Score",
      description: "Track your DeFi credit score monthly to see improvements and catch issues.",
      impact: "low" as const,
      difficulty: "easy" as const,
      actionLabel: "Set monthly reminder",
      icon: <BarChart3 className="h-6 w-6" />,
    });
    
    return recommendations;
  };

  const recommendations = getRecommendations();
  const displayRecommendations = showAllRecommendations 
    ? recommendations 
    : recommendations.slice(0, 3);

  // Calculate the number of different recommendation levels
  const highImpactCount = recommendations.filter(r => r.impact === "high").length;
  const mediumImpactCount = recommendations.filter(r => r.impact === "medium").length;
  const lowImpactCount = recommendations.filter(r => r.impact === "low").length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-[#1a1130] border-purple-900/50">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Your Improvement Plan</h3>
          
          {creditScore && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-400">Current Score</span>
                <span className="text-purple-400">{creditScore} / 850</span>
              </div>
              <Progress 
                value={(creditScore / 850) * 100} 
                className="h-2 bg-purple-900/30"
              />
            </div>
          )}
          
          {weakestAreas.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-gray-300">Focus Areas:</h4>
              {weakestAreas.map((area, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{area.title}</span>
                  <span className={
                    area.score === "Excellent" ? "text-green-400" :
                    area.score === "Good" ? "text-blue-400" :
                    area.score === "Fair" ? "text-yellow-400" :
                    "text-red-400"
                  }>{area.score}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 mt-4 text-xs">
            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30">
              {highImpactCount} High Impact
            </Badge>
            <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-500/30">
              {mediumImpactCount} Medium Impact
            </Badge>
            <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30">
              {lowImpactCount} Low Impact
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-3">
        {displayRecommendations.map((recommendation, index) => (
          <ScoreImprovementCard
            key={index}
            title={recommendation.title}
            description={recommendation.description}
            impact={recommendation.impact}
            difficulty={recommendation.difficulty}
            actionLabel={recommendation.actionLabel}
            onAction={onActionClick}
            icon={recommendation.icon}
          />
        ))}
      </div>
      
      {recommendations.length > 3 && (
        <Button 
          variant="outline" 
          className="w-full mt-2 border-purple-500 text-purple-400 hover:bg-purple-900/20"
          onClick={() => setShowAllRecommendations(!showAllRecommendations)}
        >
          {showAllRecommendations ? "Show Less" : `Show ${recommendations.length - 3} More Recommendations`}
        </Button>
      )}
    </div>
  );
};

export default ImprovementPlan;
