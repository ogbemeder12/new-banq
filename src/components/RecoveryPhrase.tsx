
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import { Eye, EyeOff, Copy, Check, ArrowRight, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RecoveryPhrase() {
  const { mnemonic, step, setStep } = useWallet();
  const [showPhrase, setShowPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (step !== "mnemonic") return null;

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    toast({
      title: "Recovery phrase copied",
      description: "Your recovery phrase has been copied to clipboard"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    toast({
      title: "Success!",
      description: "Your wallet is now ready to use"
    });
    setStep("dashboard");
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card text-card-foreground border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          <span className="solana-gradient">Recovery Phrase</span>
        </CardTitle>
        <CardDescription className="text-center">
          Save these 12 words to recover your wallet in the future
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <Shield className="h-12 w-12 text-secondary opacity-80" />
        </div>
        
        <div className="relative">
          <div className={`grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg border ${showPhrase ? 'border-solana-purple/30' : 'border-muted-foreground/30'}`}>
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
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyMnemonic}
              className="text-xs flex items-center gap-1"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-secondary" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
        
        <div className="bg-solana-purple/10 border border-solana-purple/20 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-solana-purple">WARNING:</span> Never share your recovery phrase with anyone. Anyone with this phrase can take control of your wallet.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleContinue} 
          className="w-full solana-button-gradient shadow-md font-medium"
          disabled={!showPhrase}
        >
          I've Saved My Phrase <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
