import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WalletLookup from "./pages/WalletLookup";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { WalletProvider } from "./contexts/WalletContext";
import { Images } from "lucide-react";
import MyMeme from "./components/MyMeme.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}> 
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/wallet-lookup" replace />} />
            {/* <Route path="/" element={<Navigate to="/signin" replace />} /> */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/wallet-lookup" element={<WalletLookup />} />
            <Route path="/index" element={<Index />} />
            <Route path="/my-memes" element={<MyMeme />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
