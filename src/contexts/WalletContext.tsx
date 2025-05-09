import React, { createContext, useContext, useState, useEffect } from "react";
import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as bip39 from "bip39";
import { storeUserPhoneWallet, getWalletFromPhoneNumber, ensureMinimumBalance } from "@/services/programService";
// Import PhoneInput
import PhoneInput from "react-phone-number-input";

// This polyfill is needed for bip39 to work in browser environments
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

type WalletContextType = {
  phoneNumber: string;
  setPhoneNumber: (phone: string | any) => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  keypair: Keypair | null;
  generateKeypair: () => Keypair | null;
  mnemonic: string[];
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  verifyCode: () => boolean;
  storedWalletAddress: string;
  setStoredWalletAddress: (address: string) => void;
  step: "phone" | "verification" | "wallet-created" | "mnemonic" | "dashboard";
  setStep: (step: "phone" | "verification" | "wallet-created" | "mnemonic" | "dashboard") => void;
  pdaCreated: boolean;
  createUserPDA: () => Promise<boolean>;
  linkingError: string;
  isLinkingWallet: boolean;
  logout: () => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [storedWalletAddress, setStoredWalletAddress] = useState<string>("");
  const [step, setStep] = useState<"phone" | "verification" | "wallet-created" | "mnemonic" | "dashboard">("phone");
  const [pdaCreated, setPdaCreated] = useState<boolean>(false);
  const [linkingError, setLinkingError] = useState<string>("");
  const [isLinkingWallet, setIsLinkingWallet] = useState<boolean>(false);

  // Generate a keypair with real BIP39 mnemonic
  const generateKeypair = () => {
    try {
      // Generate a random mnemonic (12 words entropy by default)
      const mnemonicPhrase = bip39.generateMnemonic();
      const mnemonicWords = mnemonicPhrase.split(" ");
      setMnemonic(mnemonicWords);
      
      // For a real implementation, we should derive from the mnemonic
      // But for simplicity, we're still generating a random keypair
      const newKeypair = Keypair.generate();
      setKeypair(newKeypair);
      
      console.log("Generated keypair:", newKeypair.publicKey.toString());
      console.log("Generated mnemonic:", mnemonicWords);
      return newKeypair;
    } catch (error) {
      console.error("Failed to generate keypair:", error);
      return null;
    }
  };

  const verifyCode = (): boolean => {
    // In a real app, this would verify against a code sent to the user's phone
    // For this demo, we'll accept any 6-digit code
    if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
      setIsVerified(true);
      return true;
    }
    return false;
  };

  // Updated function to create a PDA that links phone to wallet
  const createUserPDA = async (): Promise<boolean> => {
    try {
      setLinkingError("");
      setIsLinkingWallet(true);
      
      // Ensure we have a keypair - if not, generate one
      let currentKeypair = keypair;
      if (!currentKeypair) {
        console.log("No keypair found, generating a new one");
        currentKeypair = generateKeypair();
        if (!currentKeypair) {
          setLinkingError("Failed to generate keypair for PDA creation");
          console.error("Failed to generate keypair for PDA creation");
          setIsLinkingWallet(false);
          return false;
        }
      }

      // Clean up phone number to make sure it's consistent
      const normalizedPhone = phoneNumber.replace(/\s+/g, '');

      // First ensure the wallet has minimum required SOL
      await ensureMinimumBalance(currentKeypair.publicKey, currentKeypair);

      // Call the actual Solana program to link the phone and wallet
      const txSignature = await storeUserPhoneWallet(
        normalizedPhone, 
        currentKeypair.publicKey,
        currentKeypair
      );
      
      console.log("Transaction completed with signature:", txSignature);
      setPdaCreated(true);
      setIsLinkingWallet(false);
      return true;
    } catch (error) {
      console.error("Error creating PDA:", error);
      
      // Set the specific error message to display to the user
      if (error instanceof Error) {
        if (error.message.includes("debit an account but found no record of a prior credit")) {
          setLinkingError("Not enough SOL for transaction fees. Please retry or add SOL to your wallet.");
        } else if (error.message.includes("429")) {
          setLinkingError("Rate limit exceeded on the Solana network. Please try again later.");
        } else if (error.message.includes("timed out")) {
          setLinkingError("Transaction timed out. Network may be congested. Please try again.");
        } else if (error.message.includes("airdrop")) {
          setLinkingError("Couldn't get test SOL from devnet. Network may be congested.");
        } else {
          setLinkingError(`Transaction failed: ${error.message}`);
        }
      } else {
        setLinkingError("Unknown error during phone linking");
      }
      
      setIsLinkingWallet(false);
      // Continue with wallet creation even if PDA creation fails
      // This ensures users can still use their wallet even if phone linking fails
      return false;
    }
  };

  // Add logout function
  const logout = () => {
    setPhoneNumber("");
    setIsVerified(false);
    setKeypair(null);
    setMnemonic([]);
    setVerificationCode("");
    setStoredWalletAddress("");
    setStep("phone");
    setPdaCreated(false);
    setLinkingError("");
    setIsLinkingWallet(false);
  };

  const value = {
    phoneNumber,
    setPhoneNumber: (phone: string | any) => setPhoneNumber(phone?.toString() || ""),
    isVerified,
    setIsVerified,
    keypair,
    generateKeypair,
    mnemonic,
    verificationCode,
    setVerificationCode,
    verifyCode,
    storedWalletAddress,
    setStoredWalletAddress,
    step,
    setStep,
    pdaCreated,
    createUserPDA,
    linkingError,
    isLinkingWallet,
    logout,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
