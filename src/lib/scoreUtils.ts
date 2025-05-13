
// Utility functions and constants for score handling

// This interface represents a score category with its name, current value and component reference
export interface ScoreCategory {
  name: string;
  value: number;
  component: string;
}

// Calculate the overall score as an average of all component scores
export const calculateOverallScore = (scores: ScoreCategory[]): number => {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((total, score) => total + score.value, 0);
  return Math.round(sum / scores.length);
};

// Get a score color based on value
export const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

// Get a score category based on value
export const getScoreCategory = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
};
