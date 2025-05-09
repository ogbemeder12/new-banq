
import React from "react";
import PhoneVerification from "@/components/PhoneVerification";
import { useWallet } from "@/contexts/WalletContext";
import { WalletCreated } from "@/components/WalletCreated";
import { RecoveryPhrase } from "@/components/RecoveryPhrase";
import { Dashboard } from "@/components/Dashboard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

export default function Index() {
  const { step } = useWallet();

  // Render different components based on the step in the wallet creation process
  const renderCurrentStep = () => {
    switch (step) {
      case "phone":
      case "verification":
        return <PhoneVerification />;
      case "wallet-created":
        return <WalletCreated />;
      case "mnemonic":
        return <RecoveryPhrase />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <PhoneVerification />;  
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Solana Phone Wallet</h1>
          <Link to="/wallet-lookup">
            <Button variant="outline" size="sm">
              <SearchIcon className="w-4 h-4 mr-2" />
              Wallet Lookup
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{renderCurrentStep()}</div>
      </main>
      <footer className="border-t bg-card p-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Solana Phone Wallet
      </footer>
    </div>
  );
}
