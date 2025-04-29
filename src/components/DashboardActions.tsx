
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Upload, 
  History, 
  KeyRound, 
  Droplets, 
  ExternalLink,
  ShieldAlert,
  QrCode,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useWallet } from "@/contexts/WalletContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface DashboardActionsProps {
  publicKey: string;
}

export function DashboardActions({ publicKey }: DashboardActionsProps) {
  const { toast } = useToast();
  const { mnemonic } = useWallet();
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  
  const handleAction = (action: string) => {
    toast({
      title: `${action} requested`,
      description: `The ${action.toLowerCase()} feature will be available soon.`
    });
  };

  const openExplorer = () => {
    window.open(`https://explorer.solana.com/address/${publicKey}?cluster=devnet`, '_blank');
  };
  
  const requestAirdrop = async () => {
    setAirdropLoading(true);
    try {
      const connection = new Connection("https://api.devnet.solana.com");
      const publicKeyObj = new PublicKey(publicKey);
      
      const signature = await connection.requestAirdrop(
        publicKeyObj,
        LAMPORTS_PER_SOL // Request 1 SOL
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      toast({
        title: "Airdrop successful",
        description: "1 SOL has been airdropped to your wallet"
      });
    } catch (error) {
      console.error("Airdrop error:", error);
      toast({
        title: "Airdrop failed",
        description: "Could not request SOL. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setAirdropLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
          >
            <KeyRound className="h-4 w-4" />
            <span>View Recovery Phrase</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recovery Phrase</DialogTitle>
            <DialogDescription>
              Keep these 12-24 words safe. They can be used to recover your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div className={`grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg border ${showPhrase ? 'border-purple-500/30' : 'border-muted-foreground/30'}`}>
              {!showPhrase && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/90 backdrop-blur-sm rounded-lg z-10">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPhrase(true)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Show Recovery Phrase
                  </Button>
                </div>
              )}
              
              {mnemonic.map((word, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
          </div>
          
          {showPhrase && (
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPhrase(false)}
                className="text-xs flex items-center gap-1"
              >
                <EyeOff className="h-3 w-3" />
                Hide
              </Button>
            </div>
          )}
          
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-purple-500">WARNING:</span> Never share your recovery phrase with anyone. Anyone with this phrase can take control of your wallet.
            </p>
          </div>
          
          <DialogClose asChild>
            <Button className="w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={requestAirdrop}
        disabled={airdropLoading}
      >
        {airdropLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-secondary" />
            <span>Requesting SOL...</span>
          </>
        ) : (
          <>
            <Droplets className="h-4 w-4 text-secondary" />
            <span>Request SOL from Faucet</span>
          </>
        )}
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => handleAction("Transaction History")}
      >
        <History className="h-4 w-4" />
        <span>View Transaction History</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={openExplorer}
      >
        <ExternalLink className="h-4 w-4" />
        <span>View on Solana Explorer</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => handleAction("Backup Wallet")}
      >
        <Download className="h-4 w-4" />
        <span>Backup Wallet</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => handleAction("Import Tokens")}
      >
        <Upload className="h-4 w-4" />
        <span>Import Tokens</span>
      </Button>

      <Button 
        variant="outline" 
        className="w-full justify-start gap-2 text-amber-500"
        onClick={() => handleAction("Security Settings")}
      >
        <ShieldAlert className="h-4 w-4" />
        <span>Security Settings</span>
      </Button>

      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => handleAction("QR Code")}
      >
        <QrCode className="h-4 w-4" />
        <span>Show Wallet QR Code</span>
      </Button>
    </div>
  );
}
