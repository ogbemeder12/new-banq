
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { Copy, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletCreated() {
  const { keypair, step, setStep } = useWallet();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!keypair || step !== "wallet-created") return null;

  const publicKey = keypair.publicKey.toString();
  const shortenedAddress = `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 6)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    toast({
      title: "Address copied",
      description: "Your wallet address has been copied to clipboard"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card text-card-foreground border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          <span className="solana-gradient">Wallet Created!</span>
        </CardTitle>
        <CardDescription className="text-center">
          Your Solana wallet has been successfully generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        <div className="p-5 rounded-full bg-muted/30 border border-solana-purple/20 animate-pulse-subtle">
          <svg width="60" height="60" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.033 50.066L98.5721 58.5673C97.9594 59.1809 97.0465 59.3601 96.2441 59.0249L72.9727 50.6533C72.3997 50.4328 72.0267 49.8982 72.0267 49.2909V22.9449C72.0267 21.7955 73.3575 21.1316 74.2327 21.8848L107.105 49.0214C107.535 49.3853 107.537 50.0376 107.033 50.066Z" fill="#9945FF"/>
            <path d="M21.2543 50.066L29.7151 58.5674C30.3278 59.1809 31.2407 59.3601 32.0431 59.0249L55.3144 50.6533C55.8875 50.4328 56.2605 49.8982 56.2605 49.2909V22.9449C56.2605 21.7955 54.9297 21.1316 54.0545 21.8848L21.1813 49.0214C20.7519 49.3853 20.7501 50.0376 21.2543 50.066Z" fill="#9945FF"/>
            <path d="M107.031 78.6756L98.5707 70.1744C97.958 69.5608 97.0451 69.3816 96.2427 69.7168L72.9714 78.0885C72.3984 78.3089 72.0253 78.8435 72.0253 79.4508V105.797C72.0253 106.946 73.3561 107.61 74.2313 106.857L107.104 79.7204C107.533 79.3565 107.535 78.7042 107.031 78.6756Z" fill="#14F195"/>
            <path d="M21.2543 78.6756L29.7151 70.1744C30.3278 69.5608 31.2407 69.3816 32.0431 69.7168L55.3144 78.0885C55.8875 78.3089 56.2605 78.8435 56.2605 79.4508V105.797C56.2605 106.946 54.9297 107.61 54.0545 106.857L21.1813 79.7204C20.7519 79.3565 20.7501 78.7042 21.2543 78.6756Z" fill="#14F195"/>
          </svg>
        </div>
        
        <div className="w-full space-y-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Your wallet address</p>
            <div className="flex items-center justify-center space-x-2">
              <code className="bg-muted/50 rounded px-3 py-1.5 text-sm font-mono break-all">
                {shortenedAddress}
              </code>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={copyAddress}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-secondary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setStep("mnemonic")} 
          className="w-full solana-button-gradient shadow-md font-medium"
        >
          View Recovery Phrase <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
