import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchWalletBalance, fetchTransactionHistory, fetchStakingActivities } from "@/services/heliusService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ArrowRight, Share2, Copy, Download, CreditCard, LogOut } from "lucide-react";
import NetFlowAnalysis from "@/components/NetFlowAnalysis";
import RetentionBehavior from "@/components/RetentionBehavior";
import MinBalanceStability from "@/components/MinBalanceStability";
import BorrowingBehavior from "@/components/BorrowingBehavior";
import CollateralManagement from "@/components/CollateralManagement";
import TokenPortfolioHealth from "@/components/TokenPortfolioHealth";
import StakingFarmingEngagement from "@/components/StakingFarmingEngagement";
import TransactionPatternsConsistency from "@/components/TransactionPatternsConsistency";
import WalletAgeLongevity from '@/components/WalletAgeLongevity';
import StrategicToolUsage from '@/components/StrategicToolUsage';
import BasicActivityLevel from '@/components/BasicActivityLevel';
import ShareCreditScore from '@/components/ShareCreditScore';
import ImprovementPlan from "@/components/ImprovementPlan";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';

// Interface for our calculated metrics
interface ScoreMetric {
  title: string;
  description: string;
  score: string;
  percentage: number;
}

// Function to calculate payment history score based on transaction data
const calculatePaymentHistory = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Minimum Balance Stability",
      description: "How well you maintain reserves in your wallet",
      score: "No Data",
      percentage: 0
    };
  }

  // Count successful vs failed transactions
  const successfulTxns = transactions.filter(tx => !tx.err && tx.status !== "Failed").length;
  const totalTxns = transactions.length;
  const successRate = totalTxns > 0 ? (successfulTxns / totalTxns) * 100 : 0;
  
  // Determine score based on success rate
  let score = "Poor";
  let percentage = 0;
  
  if (successRate >= 98) {
    score = "95";
    percentage = 95;
  } else if (successRate >= 95) {
    score = "80";
    percentage = 80;
  } else if (successRate >= 90) {
    score = "60";
    percentage = 60;
  } else if (successRate >= 80) {
    score = "40";
    percentage = 40;
  } else {
    score = "20";
    percentage = 20;
  }
  
  return {
    title: "Minimum Balance Stability",
    description: "How well you maintain reserves in your wallet",
    score,
    percentage
  };
};

// Calculate credit utilization based on transaction history and balance
const calculateCreditUtilization = (transactions: any[], balance: number): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Net Flow Analysis",
      description: "Balance between inflows and outflows",
      score: "No Data",
      percentage: 0
    };
  }

  // Estimate outflows vs inflows over recent transactions
  const recentTxns = transactions.slice(0, Math.min(20, transactions.length));
  
  let totalOutflow = 0;
  let totalInflow = 0;
  
  recentTxns.forEach(tx => {
    const amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);
      
    if (amount < 0) {
      totalOutflow += Math.abs(amount);
    } else if (amount > 0) {
      totalInflow += amount;
    }
  });

  // Calculate utilization as outflow relative to total flow
  const totalFlow = totalOutflow + totalInflow;
  const utilization = totalFlow > 0 ? (totalOutflow / totalFlow) * 100 : 0;
  
  // Determine score based on utilization
  // Lower utilization is better (user isn't spending all their funds)
  let score = "50";
  let percentage = 50;
  
  if (utilization < 30) {
    score = "95";
    percentage = 95;
  } else if (utilization < 50) {
    score = "75";
    percentage = 75;
  } else if (utilization < 70) {
    score = "50";
    percentage = 50;
  } else if (utilization < 90) {
    score = "30";
    percentage = 30;
  } else {
    score = "10";
    percentage = 10;
  }
  
  return {
    title: "Net Flow Analysis",
    description: "Balance between inflows and outflows",
    score,
    percentage
  };
};

// Calculate account age based on transaction history
const calculateAccountAge = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Wallet Age & Longevity",
      description: "How long your wallet has been active",
      score: "No Data",
      percentage: 0
    };
  }

  // Find the oldest transaction timestamp
  let oldestTimestamp = Date.now() / 1000;
  transactions.forEach(tx => {
    const timestamp = tx.timestamp || tx.blockTime || 0;
    if (timestamp > 0 && timestamp < oldestTimestamp) {
      oldestTimestamp = timestamp;
    }
  });
  
  // Calculate age in days
  const currentTimestamp = Date.now() / 1000;
  const ageInDays = (currentTimestamp - oldestTimestamp) / (60 * 60 * 24);
  
  // Determine score based on age
  let score = "20";
  let percentage = 20;
  
  if (ageInDays >= 365) {
    // Over 1 year
    score = "90";
    percentage = 90;
  } else if (ageInDays >= 180) {
    // 6 months to 1 year
    score = "70";
    percentage = 70;
  } else if (ageInDays >= 90) {
    // 3-6 months
    score = "50";
    percentage = 50;
  } else if (ageInDays >= 30) {
    // 1-3 months
    score = "30";
    percentage = 30;
  } else {
    // Less than 1 month
    score = "10";
    percentage = 10;
  }
  
  return {
    title: "Wallet Age & Longevity",
    description: "How long your wallet has been active",
    score,
    percentage
  };
};

// Calculate recent inquiries based on incoming transaction patterns
const calculateRecentInquiries = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Transaction Patterns",
      description: "Consistency of transaction activity",
      score: "No Data",
      percentage: 0
    };
  }

  // In the context of Solana, we can look at how many different addresses have
  // interacted with this wallet in the recent transactions (last 30 days)
  const currentTimestamp = Date.now() / 1000;
  const thirtyDaysAgo = currentTimestamp - (30 * 24 * 60 * 60);
  
  const recentTxns = transactions.filter(tx => {
    const timestamp = tx.timestamp || tx.blockTime || 0;
    return timestamp >= thirtyDaysAgo;
  });
  
  // Count unique addresses that have interacted with this wallet
  const uniqueAddresses = new Set();
  recentTxns.forEach(tx => {
    if (tx.source && tx.source !== tx.destination) {
      uniqueAddresses.add(tx.source);
    }
    if (tx.destination && tx.source !== tx.destination) {
      uniqueAddresses.add(tx.destination);
    }
  });
  
  const uniqueInteractions = uniqueAddresses.size;
  
  // Determine score based on unique interactions
  // Fewer unique interactions is better for credit scoring
  let score = "75";
  let percentage = 75;
  
  if (uniqueInteractions <= 3) {
    score = "95";
    percentage = 95;
  } else if (uniqueInteractions <= 10) {
    score = "75";
    percentage = 75;
  } else if (uniqueInteractions <= 20) {
    score = "50";
    percentage = 50;
  } else if (uniqueInteractions <= 30) {
    score = "30";
    percentage = 30;
  } else {
    score = "10";
    percentage = 10;
  }
  
  return {
    title: "Transaction Patterns",
    description: "Consistency of transaction activity",
    score,
    percentage
  };
};

// Calculate credit mix based on token diversity and transaction types
const calculateCreditMix = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Token Portfolio Health",
      description: "Diversity of assets in portfolio",
      score: "No Data",
      percentage: 0
    };
  }

  // Count unique token types and transaction types
  const uniqueTokens = new Set();
  const uniqueTxTypes = new Set();
  
  transactions.forEach(tx => {
    if (tx.currency) {
      uniqueTokens.add(tx.currency.toUpperCase());
    }
    if (tx.type) {
      uniqueTxTypes.add(tx.type);
    }
  });
  
  // Calculate a score based on diversity of tokens and transaction types
  const tokenDiversity = uniqueTokens.size;
  const txTypeDiversity = uniqueTxTypes.size;
  
  // Calculate a combined diversity score
  const diversityScore = tokenDiversity + txTypeDiversity;
  
  // Determine score based on diversity
  let score = "50";
  let percentage = 50;
  
  if (diversityScore >= 8) {
    score = "90";
    percentage = 90;
  } else if (diversityScore >= 5) {
    score = "75";
    percentage = 75;
  } else if (diversityScore >= 3) {
    score = "50";
    percentage = 50;
  } else if (diversityScore >= 2) {
    score = "30";
    percentage = 30;
  } else {
    score = "10";
    percentage = 10;
  }
  
  return {
    title: "Token Portfolio Health",
    description: "Diversity of assets in portfolio",
    score,
    percentage
  };
};

// Function to calculate strategic tool usage score
const calculateStrategicToolUsage = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Strategic Usage of Tools",
      description: "How efficiently you use DeFi tools",
      score: "No Data",
      percentage: 0
    };
  }
  
  // Count different tool usages from transactions
  let jupiterSwaps = 0;
  let limitOrders = 0;
  let dcaCount = 0;
  let multisigUse = 0;
  let portfolioTools = 0;
  
  // Known program IDs for various tools
  const jupiterProgramIds = [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
  ];
  
  // Analyze each transaction for smart tool usage
  transactions.forEach(tx => {
    const description = (tx.description || '').toLowerCase();
    const source = (tx.source || '').toLowerCase();
    const programId = tx.programId || '';
    
    // Jupiter aggregator detection
    if (jupiterProgramIds.includes(programId) || 
        source.includes('jupiter') || 
        description.includes('jupiter')) {
      jupiterSwaps++;
    }

    // Limit orders detection
    if (description.includes('limit order') || 
        source.includes('serum') || 
        source.includes('openbook')) {
      limitOrders++;
    }

    // DCA tool usage
    if (description.includes('dca') || 
        description.includes('dollar cost')) {
      dcaCount++;
    }

    // Multisig detection
    if (source.includes('multisig') || 
        source.includes('squads')) {
      multisigUse++;
    }

    // Portfolio management tools
    if (source.includes('birdeye') || 
        source.includes('step.finance')) {
      portfolioTools++;
    }
  });

  // Calculate a score based on tool usage
  const totalTools = jupiterSwaps + limitOrders + dcaCount + multisigUse + portfolioTools;
  const totalTransactions = Math.max(1, transactions.length);
  const toolUtilizationRate = totalTools / totalTransactions;
  
  let score = "20";
  let percentage = 20;
  
  if (toolUtilizationRate >= 0.5) {
    score = "90";
    percentage = 90;
  } else if (toolUtilizationRate >= 0.3) {
    score = "70";
    percentage = 70;
  } else if (toolUtilizationRate >= 0.1) {
    score = "50";
    percentage = 50;
  } else if (toolUtilizationRate > 0) {
    score = "30";
    percentage = 30;
  }
  
  return {
    title: "Strategic Usage of Tools",
    description: "How efficiently you use DeFi tools",
    score,
    percentage
  };
};

// Function to calculate basic activity level
const calculateBasicActivityLevel = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Basic Activity Level",
      description: "Volume and frequency of transactions",
      score: "No Data",
      percentage: 0
    };
  }
  
  const totalTransactions = transactions.length;
  let score = "0";
  let percentage = 0;
  
  if (totalTransactions >= 1000) {
    score = "100";
    percentage = 100;
  } else if (totalTransactions >= 500) {
    score = "80";
    percentage = 80;
  } else if (totalTransactions >= 100) {
    score = "50";
    percentage = 50;
  } else if (totalTransactions >= 10) {
    score = "20";
    percentage = 20;
  }
  
  return {
    title: "Basic Activity Level",
    description: "Volume and frequency of transactions",
    score,
    percentage
  };
};

// Function to calculate retention behavior
const calculateRetentionBehavior = (transactions: any[]): ScoreMetric => {
  if (!transactions || transactions.length === 0) {
    return {
      title: "Retention Behavior",
      description: "How well you hold assets over time",
      score: "No Data",
      percentage: 0
    };
  }
  
  // Analyze inflows vs. outflows to determine retention
  let totalInflow = 0;
  let totalOutflow = 0;
  
  transactions.forEach(tx => {
    const amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);
      
    if (!isNaN(amount)) {
      if (amount < 0) {
        totalOutflow += Math.abs(amount);
      } else if (amount > 0) {
        totalInflow += amount;
      }
    }
  });
  
  // Calculate retention ratio (higher is better)
  const retentionRatio = totalInflow > 0 ? 
    (totalInflow - totalOutflow) / totalInflow : 0;
  
  let score = "30";
  let percentage = 30;
  
  if (retentionRatio >= 0.7) {
    score = "90";
    percentage = 90;
  } else if (retentionRatio >= 0.5) {
    score = "70";
    percentage = 70;
  } else if (retentionRatio >= 0.2) {
    score = "50";
    percentage = 50;
  } else if (retentionRatio > 0) {
    score = "40";
    percentage = 40;
  }
  
  return {
    title: "Retention Behavior",
    description: "How well you hold assets over time",
    score,
    percentage
  };
};

const WalletLookup = () => {
  const [input, setInput] = useState<string>("");
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stakingActivities, setStakingActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<{
    balance: boolean;
    transactions: boolean;
    staking: boolean;
  }>({
    balance: false,
    transactions: false,
    staking: false,
  });
  const [errors, setErrors] = useState<{
    transactions: string | null;
    staking: string | null;
  }>({
    transactions: null,
    staking: null,
  });
  const [activeTab, setActiveTab] = useState<string>("score");
  const [dataFetched, setDataFetched] = useState<{
    transactions: boolean;
    staking: boolean;
  }>({
    transactions: false,
    staking: false,
  });
  const [solToUsdcRate, setSolToUsdcRate] = useState<number>(0);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [scoreStatus, setScoreStatus] = useState<string>("Poor");
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const [scoreInsights, setScoreInsights] = useState<ScoreMetric[]>([]);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showLearnMoreInfo, setShowLearnMoreInfo] = useState<boolean>(false);
  const [showConnectWallet, setShowConnectWallet] = useState<boolean>(true);
  const { toast } = useToast();

  // Updated learn more function to also hide the wallet connection card
  const handleLearnMore = () => {
    setShowLearnMoreInfo(prev => !prev);
    setShowConnectWallet(false);
  };

  // Handle Get Started button click from the learn more section
  const handleGetStarted = () => {
    setShowLearnMoreInfo(false);
    setShowConnectWallet(true);
  };

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolToUsdcRate(data.solana.usd);
      } catch (error) {
        console.error('Failed to fetch SOL price', error);
        setSolToUsdcRate(0);
      }
    };

    fetchSolPrice();
  }, []);

  // Calculate score insights when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      // Calculate all the metrics
      const paymentHistory = calculatePaymentHistory(transactions);
      const creditUtilization = calculateCreditUtilization(transactions, balance?.amount || 0);
      const accountAge = calculateAccountAge(transactions);
      const recentInquiries = calculateRecentInquiries(transactions);
      const creditMix = calculateCreditMix(transactions);
      const strategicToolUsage = calculateStrategicToolUsage(transactions);
      const basicActivityLevel = calculateBasicActivityLevel(transactions);
      const retentionBehavior = calculateRetentionBehavior(transactions);
      
      // Update the score insights
      setScoreInsights([
        paymentHistory,
        creditUtilization,
        accountAge,
        recentInquiries,
        creditMix,
        strategicToolUsage,
        basicActivityLevel,
        retentionBehavior
      ]);
    }
  }, [transactions, balance]);

  useEffect(() => {
    // Calculate a synthetic credit score when transactions are loaded
    if (transactions.length > 0 && balance) {
      // This is a very simplified credit score calculation
      // In a real application, you'd have a more sophisticated model
      const txVolume = transactions.length;
      const txRecency = transactions[0]?.timestamp ? Date.now() / 1000 - transactions[0].timestamp : 0;
      const walletBalance = balance.amount;
      
      // Calculate a score between 100-850 based on these factors
      let score = 300; // Base score
      
      // More transactions = higher score (up to +150)
      score += Math.min(txVolume * 5, 150);
      
      // More recent transactions = higher score (up to +100)
      score += txRecency < 604800 ? 100 : txRecency < 2592000 ? 50 : 0;
      
      // Higher balance = higher score (up to +100)
      score += Math.min(walletBalance * 10, 100);
      
      // Now factor in our calculated metrics
      if (scoreInsights.length > 0) {
        // Calculate average percentage from our metrics
        const avgPercentage = scoreInsights.reduce((sum, metric) => sum + metric.percentage, 0) / scoreInsights.length;
        
        // Adjust score based on our calculated metrics (up to +/-100)
        const metricAdjustment = ((avgPercentage - 50) / 50) * 100;
        score += metricAdjustment;
      }
      
      // Cap at 850
      score = Math.min(Math.round(score), 850);
      
      setCreditScore(score);
      
      // Set status based on score ranges
      if (score < 300) setScoreStatus("Very Poor");
      else if (score < 450) setScoreStatus("Poor");
      else if (score < 600) setScoreStatus("Fair");
      else if (score < 750) setScoreStatus("Good");
      else setScoreStatus("Excellent");
      
      // Reset the animation state
      setAnimatedScore(0);
      setAnimationComplete(false);
    }
  }, [transactions, balance, scoreInsights]);
  
  // Enhanced animation effect for the score counter
  useEffect(() => {
    if (creditScore && animatedScore < creditScore) {
      // Calculate animation duration based on score
      const duration = 2000; // 2 seconds total animation
      const totalSteps = creditScore - animatedScore;
      const stepDuration = duration / totalSteps;
      
      const timer = setTimeout(() => {
        setAnimatedScore(prev => {
          const next = prev + Math.ceil((creditScore - prev) / 10);
          if (next >= creditScore) {
            setAnimationComplete(true);
            return creditScore;
          }
          return next;
        });
      }, 30);
      
      return () => clearTimeout(timer);
    }
  }, [creditScore, animatedScore]);
  
  const isTransactionSignature = (value: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{88}$/.test(value);
  };

  const isWalletAddress = (value: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    setBalance(null);
    setTransactions([]);
    setStakingActivities([]);
    setDataFetched({ transactions: false, staking: false });
    setErrors({ transactions: null, staking: null });
    setWalletConnected(false);
  };

  const setExampleWallet = () => {
    setInput("13dqNw1su2UTYPVvqP6ahV8oHtghvoe2k2czkrx9uWJZ");
  };

  const handleLookup = () => {
    if (!input) {
      toast({
        title: "Missing input",
        description: "Please enter a wallet address or transaction signature",
        variant: "destructive",
      });
      return;
    }

    if (isTransactionSignature(input)) {
      getTransactionHistory();
      setActiveTab("insights");
    } else if (isWalletAddress(input)) {
      getWalletBalance();
      getTransactionHistory();
      getStakingActivities();
      setDataFetched({ transactions: true, staking: true });
      setWalletConnected(true);
    } else {
      toast({
        title: "Invalid input",
        description: "Please enter a valid Solana wallet address or transaction signature",
        variant: "destructive",
      });
    }
  };

  const getWalletBalance = async () => {
    if (!input || !isWalletAddress(input)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, balance: true }));
      const data = await fetchWalletBalance(input);
      setBalance(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch wallet balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const getTransactionHistory = async () => {
    if (!input) {
      toast({
        title: "Missing input",
        description: "Please enter a wallet address or transaction signature",
        variant: "destructive",
      });
      return;
    }

    setErrors(prev => ({ ...prev, transactions: null }));

    try {
      setIsLoading(prev => ({ ...prev, transactions: true }));
      const data = await fetchTransactionHistory(input, isTransactionSignature(input) ? 1 : 50);
      setTransactions(data);
      setDataFetched(prev => ({ ...prev, transactions: true }));
    } catch (error) {
      let errorMessage = "Failed to fetch transaction history";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ ...prev, transactions: errorMessage }));
      
      toast({
        title: "Error",
        description: "Failed to fetch transaction history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const getStakingActivities = async () => {
    if (!input || !isWalletAddress(input)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    setErrors(prev => ({ ...prev, staking: null }));

    try {
      setIsLoading(prev => ({ ...prev, staking: true }));
      const data = await fetchStakingActivities(input, 5);
      setStakingActivities(data);
      setDataFetched(prev => ({ ...prev, staking: true }));
    } catch (error) {
      let errorMessage = "Failed to fetch staking activities";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ ...prev, staking: errorMessage }));
      
      toast({
        title: "Error",
        description: "Failed to fetch staking activities.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, staking: false }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to format transaction amounts with USDC to SOL conversion
  const formatTransactionAmount = (tx: any) => {
    if (!tx.amount) return '-';
    
    let amount = typeof tx.amount === 'string' ? 
      parseFloat(tx.amount.replace(/[^\d.-]/g, '')) : 
      (typeof tx.amount === 'number' ? tx.amount : 0);
    
    if (isNaN(amount)) return '-';
    
    const currency = (tx.currency || 'USDC').toUpperCase(); 
    
    if (solToUsdcRate > 0) {
      if (currency === 'USDC') {
        const amountInSol = amount / solToUsdcRate;
        return `${amountInSol.toFixed(4)} SOL (${amount.toFixed(2)} USDC)`;
      } else if (currency === 'SOL') {
        return `${amount.toFixed(4)} SOL`;
      } else {
        const amountInSol = amount / solToUsdcRate;
        return `${amountInSol.toFixed(4)} SOL (${amount.toFixed(2)} ${currency})`;
      }
    }
    
    return `${amount.toFixed(4)} ${currency}`;
  };

  // Add logout function to reset the wallet state
  const handleLogout = () => {
    setWalletConnected(false);
    setInput("");
    setBalance(null);
    setTransactions([]);
    setStakingActivities([]);
    setDataFetched({ transactions: false, staking: false });
    setErrors({ transactions: null, staking: null });
    setCreditScore(null);
    setAnimatedScore(0);
    setAnimationComplete(false);
    setScoreInsights([]);
    
    toast({
      title: "Logged out",
      description: "You have successfully disconnected your wallet"
    });
  };

  // Initial landing page before wallet connection
  if (!walletConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a061d] text-white">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-600 bg-clip-text text-transparent">
            Improve Your Finances With Branq
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Branq combines DeFi wallet analysis with traditional banking to give you a complete credit score and financial insights.
          </p>
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              // onClick={() => setWalletConnected(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-full flex items-center justify-center"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
              onClick={handleLearnMore}
            >
              Learn More
            </Button>
          </div>
        </div>

        {showLearnMoreInfo && (
          <Card className="w-full max-w-3xl mb-8 bg-[#1a1130] border-purple-900/50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">About Branq Credit Score</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">What is a DeFi Credit Score?</h3>
                  <p className="text-gray-300">
                    A DeFi credit score evaluates your on-chain financial behavior to create a numeric representation 
                    of your creditworthiness in the decentralized finance ecosystem. Unlike traditional credit scores, 
                    it analyzes blockchain transaction history, wallet activity, and DeFi protocol interactions.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">How Your Score is Calculated</h3>
                  <p className="text-gray-300">
                    Branq analyzes multiple factors from your Solana wallet activity:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                    <li><span className="text-purple-300">Payment History</span> - Successful vs. failed transactions</li>
                    <li><span className="text-purple-300">Credit Utilization</span> - Outflow to inflow ratio</li>
                    <li><span className="text-purple-300">Account Age</span> - Length of wallet history</li>
                    <li><span className="text-purple-300">Recent Inquiries</span> - Interactions with new addresses</li>
                    <li><span className="text-purple-300">Credit Mix</span> - Diversity of tokens and transaction types</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Benefits of Branq</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Access DeFi lending platforms with better terms</li>
                    <li>Qualify for higher credit limits with partner protocols</li>
                    <li>Receive personalized recommendations to improve your financial health</li>
                    <li>Build a portable, on-chain credit identity</li>
                    <li>Access traditional financial services with your DeFi score</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Privacy & Security</h3>
                  <p className="text-gray-300">
                    Branq only analyzes public on-chain data. We never request private keys or access 
                    to your wallet. Your data is processed securely, and you always maintain control 
                    over what information is shared with third-party services.
                  </p>
                </div>
                
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleGetStarted}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-full flex items-center justify-center"
                  >
                    Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Connection Card - Only show if showConnectWallet is true */}
        {showConnectWallet && (
          <Card className="w-full max-w-md bg-[#1a1130] border-purple-900/50">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                {/* <h2 className="text-2xl font-bold text-purple-300">Connect Your Wallet</h2> */}
                <p className="text-sm text-gray-400">Enter your Solana wallet to see your credit score</p>
              </div>

              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Enter Wallet Address</h3>
                  <p className="text-sm text-gray-400">Your wallet data is used to calculate your DeFi credit score</p>
                  <div className="relative">
                    <Input
                      placeholder="Solana Wallet Address"
                      value={input}
                      onChange={handleInputChange}
                      className="bg-[#2D1B4B] border-purple-900/50 text-white pl-10"
                    />
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">We only analyze public on-chain data and never request private keys</p>
                </div>

                <Button 
                  onClick={handleLookup}
                  disabled={isLoading.balance || isLoading.transactions}
                  className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                >
                  {isLoading.balance || isLoading.transactions ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      View Credit Score <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex-none bg-purple-900/50 rounded-full w-6 h-6 flex items-center justify-center text-purple-300">1</div>
                    <div className="text-gray-300">We analyze your DeFi transaction history</div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex-none bg-purple-900/50 rounded-full w-6 h-6 flex items-center justify-center text-purple-300">2</div>
                    <div className="text-gray-300">Calculate on-chain credit factors</div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex-none bg-purple-900/50 rounded-full w-6 h-6 flex items-center justify-center text-purple-300">3</div>
                    <div className="text-gray-300">Generate your DeFi credit score instantly</div>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={setExampleWallet} 
                    className="text-xs text-purple-400"
                  >
                    Use example wallet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Dashboard view after wallet connection
  return (
    <div className="min-h-screen bg-[#0a061d] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-purple-300">Wallet Analysis</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="text-sm border-purple-500 text-purple-400" 
                onClick={() => setWalletConnected(false)}
              >
                Change Wallet
              </Button>
              <Button 
                variant="outline" 
                className="text-sm border-red-500 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Logout
              </Button>
            </div>
          </div>
          
          <div className="bg-[#1a1130] rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Connected Wallet</p>
                <div className="flex items-center gap-2">
                  <code className="text-purple-300 font-mono">{truncateAddress(input)}</code>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    onClick={() => {
                      navigator.clipboard.writeText(input);
                      toast({ title: "Address copied" });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-[#1a1130] border-b border-purple-900/30 w-full justify-start rounded-t-lg rounded-b-none p-0">
            <TabsTrigger 
              value="score" 
              className="py-3 px-6 data-[state=active]:bg-[#2D1B4B] data-[state=active]:rounded-t-lg data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500"
            >
              Score
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="py-3 px-6 data-[state=active]:bg-[#2D1B4B] data-[state=active]:rounded-t-lg data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500"
            >
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="improve" 
              className="py-3 px-6 data-[state=active]:bg-[#2D1B4B] data-[state=active]:rounded-t-lg data-[state=active]:text-white data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500"
            >
              Improve
            </TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="mt-0">
            <Card className="bg-[#1a1130] border-0 rounded-t-none shadow-lg">
              <CardContent className="p-6">
                {isLoading.balance || isLoading.transactions ? (
                  <div className="flex justify-center items-center h-60">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                  </div>
                ) : creditScore ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-5xl font-bold mb-1 ${
                              scoreStatus === "Excellent" ? "text-green-500" :
                              scoreStatus === "Good" ? "text-blue-500" :
                              scoreStatus === "Fair" ? "text-yellow-500" :
                              "text-red-500"
                            } transition-all duration-300`}>
                              {animatedScore}
                            </div>
                            <div className="text-sm text-gray-400">{scoreStatus}</div>
                          </div>
                        </div>
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#2D1B4B" 
                            strokeWidth="8"
                          />
                          {/* Animated progress circle - making it more visible */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke={
                              scoreStatus === "Excellent" ? "#22c55e" :
                              scoreStatus === "Good" ? "#3b82f6" :
                              scoreStatus === "Fair" ? "#eab308" :
                              "#ef4444"
                            }
                            strokeWidth="8"
                            strokeDasharray="283"
                            strokeDashoffset={283 - ((animatedScore - 300) / 550) * 283}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
                          />
                          {/* Pulsing indicator dot that moves along the circle */}
                          {!animationComplete && (
                            <circle
                              cx="0"
                              cy="0"
                              r="4"
                              fill={
                                scoreStatus === "Excellent" ? "#22c55e" :
                                scoreStatus === "Good" ? "#3b82f6" :
                                scoreStatus === "Fair" ? "#eab308" : 
                                "#ef4444"
                              }
                              className="animate-pulse"
                              style={{
                                transform: `translate(50px, 50px) rotate(${((animatedScore - 300) / 550) * 360}deg) translate(0, -45px)`,
                              }}
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-400">
                      Score range: 300-850
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700 w-full flex items-center justify-center"
                        onClick={() => setActiveTab("insights")}
                      >
                        View Score Insights <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="border-purple-800 text-purple-300 hover:bg-purple-900/20 w-full flex items-center justify-center"
                        onClick={() => setShowShareModal(true)}
                      >
                        <Share2 className="mr-2 h-4 w-4" /> Share Score Card
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                    <p>No credit score available</p>
                    <Button className="mt-4" onClick={handleLookup}>
                      Load Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <Card className="bg-[#1a1130] border-0 rounded-t-none shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3 text-white">Score Insights</h2>
                <p className="text-sm text-gray-400 mb-6">Key elements that influence your score</p>
                
                {isLoading.transactions ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : errors.transactions ? (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <h4 className="font-semibold text-red-400">API Error</h4>
                    </div>
                    <p className="text-sm mt-2 text-red-200">Failed to fetch transaction data. Please try again.</p>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Real data-driven score insights */}
                    {scoreInsights.map((metric, index) => (
                      <ScoreInsightItem 
                        key={index}
                        title={metric.title}
                        description={metric.description}
                        score={metric.score}
                        percentage={metric.percentage}
                      />
                    ))}
                    
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 mt-4 flex items-center justify-center"
                      onClick={() => setActiveTab("improve")}
                    >
                      How to Improve <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No transaction data available to generate insights</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="improve" className="mt-0">
            <Card className="bg-[#1a1130] border-0 rounded-t-none shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2 text-white">Improve Your Score</h2>
                <p className="text-sm text-gray-400 mb-6">Recommendations to boost your rating</p>
                
                <div className="mb-6 p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                  <h3 className="text-center text-purple-400 font-medium mb-2">Create a profile to unlock personalized improvement plan</h3>
                  <p className="text-sm text-center text-gray-400">Your financial profile helps us provide tailored recommendations</p>
                </div>
                
                <div className="space-y-4">
                  <ImprovementCard 
                    title="Maintain Low Credit Utilization"
                    description="Keep your credit utilization below 30% to improve your score."
                    icon="chart"
                    color="blue"
                  />
                  
                  <ImprovementCard 
                    title="Continue Making On-Time Payments"
                    description="Your excellent payment history is positively impacting your score."
                    icon="check"
                    color="green"
                  />
                  
                  <ImprovementCard 
                    title="Increase Credit Age"
                    description="Keep older accounts open to improve your credit age factor."
                    icon="lock"
                    color="amber"
                  />
                  <Link className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-full flex items-center justify-center" to="/signup">
                    <button className="text-center">create profile</button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>




          <TabsContent value="transactions" className="hidden">
            <Card className="bg-[#1a1130] border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-white">Transaction History</h3>
                <p className="text-sm text-gray-400 mb-6">View recent transactions for this wallet</p>
                {isLoading.transactions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : errors.transactions ? (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <h4 className="font-semibold text-red-400">API Error</h4>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-80 bg-[#0a061d] p-3 rounded border border-purple-900/30 text-red-200">
                      {errors.transactions}
                    </pre>
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="rounded-md border border-purple-900/30 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-purple-900/30">
                        <TableRow className="hover:bg-purple-900/40 border-purple-900/30">
                          <TableHead className="text-purple-300">Transaction ID</TableHead>
                          <TableHead className="text-purple-300">Date</TableHead>
                          <TableHead className="text-purple-300">Type</TableHead>
                          <TableHead className="text-purple-300">Amount</TableHead>
                          <TableHead className="text-purple-300">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx, index) => (
                          <TableRow key={index} className="hover:bg-purple-900/20 border-purple-900/30">
                            <TableCell className="font-mono text-purple-300">{truncateAddress(tx.signature || tx.id)}</TableCell>
                            <TableCell>{formatDate(tx.timestamp || tx.blockTime)}</TableCell>
                            <TableCell>{tx.type || "Transfer"}</TableCell>
                            <TableCell>
                              {formatTransactionAmount(tx)}
                            </TableCell>
                            <TableCell>{tx.status || (tx.err ? "Failed" : "Success")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No transaction history available</p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-purple-800 text-purple-300 hover:bg-purple-900/20" 
                  onClick={getTransactionHistory} 
                  disabled={isLoading.transactions}
                >
                  {isLoading.transactions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Transactions (50 transactions)"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staking" className="hidden">
            <Card className="bg-[#1a1130] border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-white">Staking Activities</h3>
                <p className="text-sm text-gray-400 mb-6">View all staking activities for this wallet</p>
                
                {isLoading.staking ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : errors.staking ? (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-md p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <h4 className="font-semibold text-red-400">API Error</h4>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-80 bg-[#0a061d] p-3 rounded border border-purple-900/30 text-red-200">
                      {errors.staking}
                    </pre>
                  </div>
                ) : stakingActivities && stakingActivities.length > 0 ? (
                  <>
                    <StakingFarmingEngagement
                      stakingActivities={stakingActivities}
                      solToUsdcRate={solToUsdcRate}
                    />
                    <div className="rounded-md border border-purple-900/30 overflow-hidden mt-6">
                      <Table>
                        <TableHeader className="bg-purple-900/30">
                          <TableRow className="hover:bg-purple-900/40 border-purple-900/30">
                            <TableHead className="text-purple-300">Validator</TableHead>
                            <TableHead className="text-purple-300">Amount</TableHead>
                            <TableHead className="text-purple-300">Status</TableHead>
                            <TableHead className="text-purple-300">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stakingActivities.map((activity, index) => (
                            <TableRow key={index} className="hover:bg-purple-900/20 border-purple-900/30">
                              <TableCell className="font-mono text-purple-300">
                                {activity.validatorName || truncateAddress(activity.validatorAddress)}
                              </TableCell>
                              <TableCell>{activity.amount} SOL</TableCell>
                              <TableCell>{activity.status}</TableCell>
                              <TableCell>{formatDate(activity.timestamp || activity.blockTime)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No staking activities found for this wallet address</p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-purple-800 text-purple-300 hover:bg-purple-900/20" 
                  onClick={getStakingActivities} 
                  disabled={isLoading.staking}
                >
                  {isLoading.staking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Staking Activities"
                  )}
                </Button>

              </CardContent>
            </Card> 
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Share Credit Score Modal */}
      <ShareCreditScore 
        creditScore={creditScore}
        scoreStatus={scoreStatus}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

// Helper component for score insights, now using real data and numerical scores
const ScoreInsightItem = ({ title, description, score, percentage }: { 
  title: string; 
  description: string; 
  score: string;
  percentage: number;
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [percentage]);
  
  const getScoreColor = (scoreValue: string) => {
    const numericScore = parseInt(scoreValue) || 0;
    if (numericScore >= 90) return "text-green-400";
    if (numericScore >= 70) return "text-blue-400";
    if (numericScore >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = (scoreValue: string) => {
    const numericScore = parseInt(scoreValue) || 0;
    if (numericScore >= 90) return "bg-green-500";
    if (numericScore >= 70) return "bg-blue-500";
    if (numericScore >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className={`${getScoreColor(score)} font-medium`}>
          {score}
        </div>
      </div>
      <div className="h-1.5 w-full bg-purple-900/30 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor(score)} transition-all duration-1000 ease-out`} 
          style={{ width: `${animatedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Helper component for improvement cards
const ImprovementCard = ({ title, description, icon, color }: { 
  title: string; 
  description: string; 
  icon: string;
  color: string;
}) => {
  const getBgColor = () => {
    switch(color) {
      case "blue": return "bg-blue-900/20 border-blue-700/30";
      case "green": return "bg-green-900/20 border-green-700/30";
      case "amber": return "bg-amber-900/20 border-amber-700/30";
      default: return "bg-purple-900/20 border-purple-700/30";
    }
  };
  
  const getIconColor = () => {
    switch(color) {
      case "blue": return "text-blue-400";
      case "green": return "text-green-400";
      case "amber": return "text-amber-400";
      default: return "text-purple-400";
    }
  };
  
  const getIcon = () => {
    switch(icon) {
      case "chart": return (
        <div className={`${getIconColor()} h-6 w-6 flex-none`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        </div>
      );
      case "check": return (
        <div className={`${getIconColor()} h-6 w-6 flex-none`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        </div>
      );
      case "lock": return (
        <div className={`${getIconColor()} h-6 w-6 flex-none`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
      );
      default: return null;
    }
  };
  
  return (
    <div className={`p-4 rounded-lg ${getBgColor()} border`}>
      <div className="flex gap-4">
        {getIcon()}
        <div>
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletLookup;
