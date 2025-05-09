
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ScoreImprovementCardProps {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  difficulty: "easy" | "moderate" | "hard";
  actionLabel?: string;
  onAction?: () => void;
  icon: React.ReactNode;
}

const ScoreImprovementCard: React.FC<ScoreImprovementCardProps> = ({
  title,
  description,
  impact,
  difficulty,
  actionLabel,
  onAction,
  icon,
}) => {
  const getImpactColor = () => {
    switch (impact) {
      case "high": return "bg-green-200 text-green-800";
      case "medium": return "bg-yellow-200 text-yellow-800";
      case "low": return "bg-blue-200 text-blue-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy": return "bg-green-200 text-green-800";
      case "moderate": return "bg-yellow-200 text-yellow-800";
      case "hard": return "bg-red-200 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <Card className="bg-[#2D1B4B] border-purple-900/50">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-none text-purple-400">
            {icon}
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{title}</h3>
              <div className="flex gap-1">
                <Badge variant="outline" className={getImpactColor()}>
                  {impact === "high" ? "High Impact" : impact === "medium" ? "Medium Impact" : "Low Impact"}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor()}>
                  {difficulty === "easy" ? "Easy" : difficulty === "moderate" ? "Moderate" : "Hard"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-300">{description}</p>
            {actionLabel && onAction && (
              <Button 
                onClick={onAction}
                variant="outline" 
                className="mt-2 border-purple-500 text-purple-400 hover:bg-purple-900/20 text-xs w-full flex justify-center items-center gap-1"
              >
                {actionLabel} <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreImprovementCard;
