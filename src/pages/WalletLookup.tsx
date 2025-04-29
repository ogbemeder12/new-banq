import React, { useState, useEffect } from "react";
import AppInstructions from "@/components/AppInstructions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchWalletBalance, fetchTransactionHistory, fetchStakingActivities } from "@/services/heliusService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>("balance");
  const [dataFetched, setDataFetched] = useState<{
    transactions: boolean;
    staking: boolean;
  }>({
    transactions: false,
    staking: false,
  });
  const [solToUsdcRate, setSolToUsdcRate] = useState<number>(0);
  const { toast } = useToast();

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
      setActiveTab("transactions");
    } else if (isWalletAddress(input)) {
      getWalletBalance();
      setDataFetched({ transactions: false, staking: false });
      setTransactions([]);
      setStakingActivities([]);
      setErrors({ transactions: null, staking: null });
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
      toast({
        title: "Success",
        description: "Wallet balance fetched successfully",
      });
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
      const data = await fetchTransactionHistory(input, isTransactionSignature(input) ? 1 : 5);
      console.log("Fetched transactions:", data);
      setTransactions(data);
      setDataFetched(prev => ({ ...prev, transactions: true }));
      toast({
        title: "Success",
        description: `Fetched ${data.length} transaction${data.length === 1 ? '' : 's'} successfully`,
      });
    } catch (error) {
      let errorMessage = "Failed to fetch transaction history";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ ...prev, transactions: errorMessage }));
      
      toast({
        title: "Error",
        description: "Failed to fetch transaction history. See details in the transactions tab.",
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
      toast({
        title: "Success",
        description: `Fetched ${data.length} staking activities successfully`,
      });
    } catch (error) {
      let errorMessage = "Failed to fetch staking activities";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ ...prev, staking: errorMessage }));
      
      toast({
        title: "Error",
        description: "Failed to fetch staking activities. See details in the staking tab.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, staking: false }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "transactions" && !dataFetched.transactions) {
      getTransactionHistory();
    } else if (value === "staking" && !dataFetched.staking) {
      getStakingActivities();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto py-6">
      <AppInstructions />
      <h1 className="text-3xl font-bold mb-6">Solana Wallet Lookup</h1>
      
      <div className="mb-6">
        <Label htmlFor="input-field" className="mb-2 block">Enter Solana Wallet Address or Transaction Signature</Label>
        <div className="flex gap-3 mb-2">
          <Input
            id="input-field"
            placeholder="Enter wallet address or transaction signature..."
            value={input}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button onClick={handleLookup}>
            Lookup
          </Button>
        </div>
        <div className="text-right">
          <Button variant="link" size="sm" onClick={setExampleWallet} className="text-xs text-muted-foreground">
            Use example wallet
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex flex-col gap-5 md:flex-row justify-between ">
          <TabsTrigger value="balance">Wallet Balance</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="staking">Staking Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balance</CardTitle>
                <CardDescription>View the current balance of the wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading.balance ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : balance ? (
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <p className="text-4xl font-bold">
                      {balance.amount.toFixed(4)} {balance.currency}
                    </p>
                    <p className="text-muted-foreground mt-2">Current wallet balance</p>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <p className="text-muted-foreground">No balance data available</p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button variant="outline" className="w-full" onClick={getWalletBalance} disabled={isLoading.balance}>
                  {isLoading.balance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Balance"
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {transactions && transactions.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <BasicActivityLevel 
                  transactions={transactions}
                />
                <NetFlowAnalysis 
                  transactions={transactions} 
                  solToUsdcRate={solToUsdcRate} 
                />
                <RetentionBehavior 
                  transactions={transactions} 
                />
                <MinBalanceStability
                  transactions={transactions}
                  currentBalance={balance?.amount || 0}
                />
                <BorrowingBehavior
                  transactions={transactions}
                />
                <CollateralManagement 
                  transactions={transactions}
                />
                <TokenPortfolioHealth
                  transactions={transactions}
                />
              </div>
            )}

            {transactions && transactions.length > 0 && (
              <TransactionPatternsConsistency
                transactions={transactions}
                currentBalance={balance?.amount || 0}
              />
            )}

            {transactions && transactions.length > 0 && (
              <WalletAgeLongevity
                transactions={transactions}
              />
            )}

            {transactions && transactions.length > 0 && (
              <StrategicToolUsage
                transactions={transactions}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View recent transactions for this wallet</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.transactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : errors.transactions ? (
                <div className="bg-destructive/10 border border-destructive rounded-md p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h4 className="font-semibold text-destructive">API Error</h4>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-80 bg-background p-3 rounded border">
                    {errors.transactions}
                  </pre>
                  <p className="text-sm mt-2">The API call failed with the above error.</p>
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{truncateAddress(tx.signature || tx.id)}</TableCell>
                          <TableCell>{formatDate(tx.timestamp || tx.blockTime)}</TableCell>
                          <TableCell>{tx.type || "Transfer"}</TableCell>
                          <TableCell>
                            {tx.amount ? 
                              `${parseFloat(tx.amount).toFixed(4)} ${tx.currency || 'SOL'}` : 
                              '-'}
                          </TableCell>
                          <TableCell>{tx.status || (tx.err ? "Failed" : "Success")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center p-8 text-muted-foreground">No transaction history available</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={getTransactionHistory} disabled={isLoading.transactions}>
                {isLoading.transactions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh Transactions (5 transactions)"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="staking">
          <Card>
            <CardHeader>
              <CardTitle>Staking Activities</CardTitle>
              <CardDescription>View all staking activities for this wallet</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.staking ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : errors.staking ? (
                <div className="bg-destructive/10 border border-destructive rounded-md p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h4 className="font-semibold text-destructive">API Error</h4>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-80 bg-background p-3 rounded border">
                    {errors.staking}
                  </pre>
                  <p className="text-sm mt-2">The API call failed with the above error.</p>
                </div>
              ) : stakingActivities && stakingActivities.length > 0 ? (
                <>
                  <StakingFarmingEngagement
                    stakingActivities={stakingActivities}
                    solToUsdcRate={solToUsdcRate}
                  />
                  <div className="rounded-md border mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Validator</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stakingActivities.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
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
                <div className="text-center p-8 text-muted-foreground">
                  <p>No staking activities found for this wallet address</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={getStakingActivities} disabled={isLoading.staking}>
                {isLoading.staking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh Staking Activities"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletLookup;
