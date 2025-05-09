
import React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Twitter, Copy, Download } from "lucide-react";
import { X } from "lucide-react";

interface ShareCreditScoreProps {
  creditScore: number | null;
  scoreStatus: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareCreditScore: React.FC<ShareCreditScoreProps> = ({
  creditScore,
  scoreStatus,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [isImageLoaded, setIsImageLoaded] = useState(true);
  
  if (!isOpen) return null;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleCopy = () => {
    const scoreText = `My Branq Credit Score: ${creditScore} (${scoreStatus}) - Check yours at branq.xyz`;
    navigator.clipboard.writeText(scoreText);
    toast({
      title: "Copied to clipboard",
      description: "Your credit score has been copied to clipboard"
    });
  };

  const handleTweet = () => {
    const tweetText = `My Branq Credit Score: ${creditScore} (${scoreStatus}) - Check yours at branq.xyz`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
  };

  const handleSave = () => {
    // In a real app, this would generate and download an image
    toast({
      title: "Image saved",
      description: "Your credit score card has been saved"
    });
  };

  const getStatusColor = () => {
    switch(scoreStatus) {
      case "Excellent": return "text-green-500";
      case "Good": return "text-blue-500";
      case "Fair": return "text-yellow-500";
      case "Poor": 
      case "Very Poor": 
      default: return "text-red-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Share Your Credit Score</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <Card className="bg-[#2D1B4B] border-purple-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-[#3a2260] p-4 flex justify-between items-center">
              <span className="text-purple-400 font-bold text-xl">Branq</span>
              <span className={`text-2xl font-bold ${getStatusColor()}`}>{creditScore}</span>
            </div>
            
            <div className="relative">
              <img 
                src="/lovable-uploads/54a59eff-a033-4cb8-be43-c1dff8d72cfd.png"
                alt="Credit Score Image" 
                className="w-full h-48 object-cover"
                onError={() => setIsImageLoaded(false)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <p className="text-gray-400">Image failed to load</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className={`${getStatusColor()} font-medium`}>{scoreStatus}</span>
                <span className="text-gray-400 text-sm">branq.xyz</span>
              </div>
              <div className="text-gray-400 text-sm">{currentDate}</div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-4 gap-3">
          <Button 
            className="flex-1 bg-[#1d9bf0] hover:bg-[#1a8cd8] flex items-center justify-center gap-2"
            onClick={handleTweet}
          >
            <Twitter className="h-4 w-4" />
            Tweet
          </Button>
          <Button 
            className="flex-1 bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button 
            className="flex-1 bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2"
            onClick={handleSave}
          >
            <Download className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareCreditScore;
