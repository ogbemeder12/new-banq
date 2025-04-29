
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { Copy, ExternalLink, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardActions } from "@/components/DashboardActions";

export function Dashboard() {
  const { keypair, phoneNumber, step, pdaCreated, createUserPDA } = useWallet();
  const { toast } = useToast();
  const [retryLoading, setRetryLoading] = useState(false);

  if (step !== "dashboard" || !keypair) return null;

  const publicKey = keypair.publicKey.toString();
  const shortenedAddress = `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 6)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    toast({
      title: "Address copied",
      description: "Your wallet address has been copied to clipboard"
    });
  };

  const openExplorer = () => {
    window.open(`https://explorer.solana.com/address/${publicKey}?cluster=devnet`, '_blank');
  };

  const refreshBalance = () => {
    toast({
      title: "Balance refreshed",
      description: "Your balance has been updated"
    });
  };

  const retryPdaCreation = async () => {
    if (retryLoading) return;
    
    setRetryLoading(true);
    try {
      const result = await createUserPDA();
      if (result) {
        toast({
          title: "Success",
          description: "Your phone number is now linked to your wallet"
        });
      } else {
        toast({
          title: "Failed",
          description: "Could not link your phone number to your wallet. Please check console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error retrying PDA creation:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card className="bg-card text-card-foreground border-border shadow-lg overflow-hidden">
        <div className="h-3 solana-button-gradient w-full"></div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight flex justify-between items-center">
            <span className="solana-gradient">Solana Wallet</span>
            <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded-full">Devnet</span>
          </CardTitle>
          <CardDescription>
            Connected to {phoneNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Address</p>
              <div className="flex items-center space-x-2">
                <code className="text-sm font-mono">{shortenedAddress}</code>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={copyAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={openExplorer}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">0.00</p>
                <p className="text-muted-foreground">SOL</p>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8"
              onClick={refreshBalance}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className={`${pdaCreated ? "bg-green-500/10" : "bg-amber-500/10"} rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              {pdaCreated ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              )}
              <div>
                <p className={pdaCreated ? "text-green-600 dark:text-green-400 font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                  {pdaCreated ? "Phone + Wallet linked" : "Phone + Wallet not linked"}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {pdaCreated 
                    ? "Your phone number and wallet address are linked on-chain"
                    : "Failed to create PDA. You can retry linking your phone and wallet."
                  }
                </p>
                {!pdaCreated && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryPdaCreation} 
                    className="mt-2"
                    disabled={retryLoading}
                  >
                    {retryLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      "Retry Linking"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button className="w-full bg-muted text-foreground hover:bg-muted/80">
            Send
          </Button>
          <Button className="w-full solana-button-gradient shadow-md font-medium">
            Receive
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {keypair && <DashboardActions publicKey={publicKey} />}
        </CardContent>
      </Card>
    </div>
  );
}
