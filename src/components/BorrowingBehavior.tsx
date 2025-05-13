
import React from "react";
import { PiggyBank, Landmark, DollarSign } from "lucide-react";

type Transaction = {
  signature?: string;
  timestamp?: number;
  blockTime?: number;
  amount?: number | string;
  source?: string;
  destination?: string;
  description?: string;
  type?: string;
};

type Props = {
  transactions: Transaction[];
};

const BorrowingBehavior: React.FC<Props> = ({ transactions }) => {
  // Calculate metrics based on transactions
  const calculateMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return { 
        hasBorrowActivity: false, 
        loanCount: 0,
        repaymentCount: 0,
        borrowedAmount: 0,
        repaidAmount: 0,
        loanToValueRatio: 0,
        score: 40
      };
    }
    
    // Look for transactions that appear to be loan-related
    // This is simplified - in reality would need more sophisticated pattern matching
    const loanTransactions = transactions.filter(tx => {
      const description = (tx.description || '').toLowerCase();
      const type = (tx.type || '').toLowerCase();
      
      return description.includes('borrow') || 
             description.includes('loan') ||
             description.includes('lend') ||
             description.includes('repay') ||
             type.includes('borrow') ||
             type.includes('loan') ||
             type.includes('repay');
    });
    
    // Count borrows vs repayments
    const borrowTxs = loanTransactions.filter(tx => {
      const description = (tx.description || '').toLowerCase();
      const type = (tx.type || '').toLowerCase();
      
      return description.includes('borrow') || 
             description.includes('loan') ||
             type.includes('borrow');
    });
    
    const repayTxs = loanTransactions.filter(tx => {
      const description = (tx.description || '').toLowerCase();
      const type = (tx.type || '').toLowerCase();
      
      return description.includes('repay') || 
             type.includes('repay');
    });
    
    // Calculate borrowed and repaid amounts
    const calculateTotalAmount = (txs: Transaction[]) => {
      return txs.reduce((sum, tx) => {
        const amount = typeof tx.amount === 'string' ? 
          parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
          (typeof tx.amount === 'number' ? tx.amount : 0);
          
        return sum + (isNaN(amount) ? 0 : Math.abs(amount));
      }, 0);
    };
    
    const borrowedAmount = calculateTotalAmount(borrowTxs);
    const repaidAmount = calculateTotalAmount(repayTxs);
    
    // Check for lending protocol interactions
    const lendingProtocols = [
      'solend',
      'port',
      'jet',
      'aave',
      'mango',
      'compound'
    ];
    
    // Check for patterns indicating lending protocol usage
    const lendingProtocolUsage = transactions.some(tx => {
      const description = (tx.description || '').toLowerCase();
      const source = (tx.source || '').toLowerCase();
      const destination = (tx.destination || '').toLowerCase();
      
      return lendingProtocols.some(protocol => 
        description.includes(protocol) || 
        source.includes(protocol) || 
        destination.includes(protocol)
      );
    });
    
    // Determine if there's any borrowing activity
    const hasBorrowActivity = loanTransactions.length > 0 || lendingProtocolUsage;
    
    // Calculate loan-to-value ratio (approximation)
    const loanToValueRatio = borrowedAmount > 0 && repaidAmount > 0 ?
      (borrowedAmount - repaidAmount) / borrowedAmount : 
      borrowedAmount > 0 ? 1 : 0;
    
    // Calculate score
    let score = 40; // Base score
    
    if (!hasBorrowActivity) {
      // No borrowing can be neutral to positive
      score = 50;
    } else {
      // With borrowing activity, score based on repayment behavior
      const repaymentRatio = borrowedAmount > 0 ? Math.min(repaidAmount / borrowedAmount, 1) : 0;
      
      if (repaymentRatio >= 0.95) score = 90; // Excellent, fully repaid
      else if (repaymentRatio >= 0.8) score = 80; // Very good, most repaid
      else if (repaymentRatio >= 0.6) score = 70; // Good
      else if (repaymentRatio >= 0.4) score = 60; // Above average
      else if (repaymentRatio >= 0.2) score = 50; // Average
      else if (repaymentRatio > 0) score = 40; // Below average
      else score = 30; // Poor, no repayments
    }
    
    return { 
      hasBorrowActivity,
      loanCount: borrowTxs.length,
      repaymentCount: repayTxs.length,
      borrowedAmount,
      repaidAmount,
      loanToValueRatio,
      score
    };
  };
  
  const { 
    hasBorrowActivity, 
    loanCount, 
    repaymentCount, 
    borrowedAmount, 
    repaidAmount,
    score
  } = calculateMetrics();
  
  // Calculate repayment ratio for the progress display
  const repaymentRatio = borrowedAmount > 0 ? 
    Math.min((repaidAmount / borrowedAmount) * 100, 100) : 0;
    
  // Format amounts for display
  const formatAmount = (amount: number): string => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
    return amount.toFixed(2);
  };

  return (
    <div className="border rounded-lg p-4 bg-muted shadow" data-component="BorrowingBehavior">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Borrowing Behavior
        </h4>
        
        <span 
          className={`inline-block rounded px-3 py-1 text-sm font-bold ${
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
          Score: {score}/100
        </span>
      </div>
      
      {hasBorrowActivity ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-background/50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-muted-foreground">Borrowed</h5>
                <PiggyBank className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold">{formatAmount(borrowedAmount)}</p>
              <p className="text-xs text-muted-foreground">{loanCount} transactions</p>
            </div>
            
            <div className="bg-background/50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-medium text-muted-foreground">Repaid</h5>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xl font-bold">{formatAmount(repaidAmount)}</p>
              <p className="text-xs text-muted-foreground">{repaymentCount} transactions</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">Repayment Progress</span>
              <span className="text-xs font-medium">{repaymentRatio.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full">
              <div 
                className={`h-full rounded-full ${
                  repaymentRatio >= 80 ? "bg-green-500" : 
                  repaymentRatio >= 50 ? "bg-amber-500" : 
                  "bg-red-500"
                }`}
                style={{ width: `${repaymentRatio}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>
              On-time loan repayments improve your credit score. Repaying loans early or in full 
              can significantly boost your borrowing power.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-background/50 p-4 rounded-md text-center">
          <p className="text-sm">No borrowing activity detected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Responsible borrowing with on-time repayments can help improve your credit score
          </p>
        </div>
      )}
    </div>
  );
};

export default BorrowingBehavior;
