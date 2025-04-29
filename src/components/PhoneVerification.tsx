import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PhoneInput from "react-phone-number-input";
import { useWallet } from "@/contexts/WalletContext";
import { Loader2, Clock, InfoIcon, CopyIcon, CheckIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "react-phone-number-input/style.css";

export function PhoneVerification() {
  const { 
    phoneNumber, 
    setPhoneNumber, 
    step, 
    setStep, 
    setVerificationCode, 
    verifyCode, 
    generateKeypair,
    createUserPDA,
    linkingError,
    isLinkingWallet
  } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [mockCode, setMockCode] = useState("");
  const [copied, setCopied] = useState(false);

  const startCountdown = () => {
    setCountdown(60);
    setResendDisabled(true);
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const generateMockCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockCode(code);
    setVerificationCode(code);
    return code;
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(mockCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendVerification = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const code = generateMockCode();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep("verification");
      startCountdown();
      toast({
        title: "Mock verification code generated",
        description: "Use the displayed code to verify (no real SMS sent)"
      });
    } catch (err) {
      setError("Failed to generate verification code. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    
    setLoading(true);
    setError("");
    
    try {
      const code = generateMockCode();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      startCountdown();
      toast({
        title: "New mock code generated",
        description: "Use the new displayed code to verify (no real SMS sent)"
      });
    } catch (err) {
      setError("Failed to generate verification code. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationInput || verificationInput.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const isVerified = verificationInput === mockCode;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!isVerified) {
        setError("Invalid verification code. Please try again.");
        setLoading(false);
        return;
      }
      
      const newKeypair = generateKeypair();
      
      if (!newKeypair) {
        setError("Failed to generate wallet. Please try again.");
        setLoading(false);
        return;
      }
      
      setStep("wallet-created");

      toast({
        title: "Wallet generated successfully",
        description: "Creating your wallet and linking phone number..."
      });
      
      try {
        const pdaSuccess = await createUserPDA();
        
        if (pdaSuccess) {
          toast({
            title: "Phone linking successful",
            description: "Your phone number is now linked to your wallet"
          });
        } else {
          let errorMessage = "Your wallet was created, but phone linking failed.";
          if (linkingError) {
            errorMessage = `${errorMessage} ${linkingError}`;
          }
          
          toast({
            variant: "destructive",
            title: "Phone linking failed", 
            description: errorMessage
          });
        }
      } catch (pdaError) {
        console.error("PDA creation error:", pdaError);
        
        let errorMessage = "Your wallet was created, but phone linking failed.";
        if (linkingError) {
          errorMessage = `${errorMessage} ${linkingError}`;
        }
        
        toast({
          variant: "destructive",
          title: "Phone linking failed",
          description: errorMessage
        });
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <Card className="w-full max-w-md mx-auto bg-card text-card-foreground border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            <span className="solana-gradient">Solana Mobile Vault</span>
          </CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to verify and generate your Solana wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="phone-input-wrapper bg-background border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
              <PhoneInput
                international
                defaultCountry="US"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value || "")}
                className="PhoneInput"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSendVerification} 
            className="w-full solana-button-gradient shadow-md font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Code...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "verification") {
    return (
      <Card className="w-full max-w-md mx-auto bg-card text-card-foreground border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            <span className="solana-gradient">Verify Your Number</span>
          </CardTitle>
          <CardDescription className="text-center">
            Use the code below to verify {phoneNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between bg-muted p-3 rounded-md mb-3">
              <div className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Mock verification (no SMS sent)</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2" 
                onClick={copyCodeToClipboard}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mock-code-display">{mockCode}</div>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-wider mt-4"
            />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md mt-4">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">
                Note: After wallet creation, we'll attempt to link your phone number. 
                If linking fails due to network issues, your wallet will still be created successfully.
              </span>
            </div>
          </div>
          <div className="flex justify-center items-center">
            {resendDisabled && (
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <Clock className="h-4 w-4" />
                <span>Resend in {countdown}s</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={handleVerifyCode} 
            className="w-full solana-button-gradient shadow-md font-medium"
            disabled={loading || isLinkingWallet}
          >
            {loading || isLinkingWallet ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loading ? "Verifying..." : "Creating Wallet..."}
              </>
            ) : (
              "Verify & Create Wallet"
            )}
          </Button>
          <div className="flex w-full justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep("phone")}
              className="text-sm"
              disabled={loading || isLinkingWallet}
            >
              Change Phone Number
            </Button>
            <Button
              variant="ghost"
              onClick={handleResendCode}
              className="text-sm"
              disabled={loading || resendDisabled || isLinkingWallet}
            >
              {resendDisabled ? `Resend (${countdown}s)` : "Resend Code"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
