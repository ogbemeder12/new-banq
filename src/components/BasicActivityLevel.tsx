
import React from "react";
import { Activity, ListFilter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
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

  const totalTransactions = transactions.length;
  let score = 0;

  // Calculate score based on transaction count
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
          >
            Score: {score}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Transactions:</span>
            <span className="font-medium">{totalTransactions}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>1000+ transactions: 100</li>
              <li>500–1000 transactions: 80</li>
              <li>100–500 transactions: 50</li>
              <li>10-99 transactions: 20</li>
              <li>&lt;10 transactions: 0</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicActivityLevel;
