
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const AppInstructions = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed right-4 top-4 z-50">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Open Instructions</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>How to Use the Wallet Lookup</SheetTitle>
          <SheetDescription>
            Follow these steps to analyze a Solana wallet
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-medium mb-2">1. Enter Wallet Address</h3>
            <p className="text-sm text-muted-foreground">
              Input a Solana wallet address in the search field or use the example wallet button for testing.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">2. View Wallet Analytics</h3>
            <p className="text-sm text-muted-foreground">
              After lookup, you'll see various metrics:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Current wallet balance</li>
              <li>Token portfolio health score</li>
              <li>Blue-chip token percentage</li>
              <li>Stablecoin ratio</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">3. Transaction History</h3>
            <p className="text-sm text-muted-foreground">
              Switch to the Transaction History tab to view recent transactions and their details.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">4. Staking Activities</h3>
            <p className="text-sm text-muted-foreground">
              Check the Staking Activities tab to see staking-related transactions.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppInstructions;
