// The Helius API service for fetching wallet data

// In a production app, this would come from environment variables
// Since we can't directly add a .env file, we'll use this approach
const HELIUS_API_KEY = "d011eb4b-ef44-4696-9a7c-c648437aa3df";
const HELIUS_API_URL = `https://api.helius.xyz/v0`;

// Add delay between API calls to prevent rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Max retries for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000; // 3 seconds between retries

// Backoff for rate-limited requests
const RATE_LIMIT_BACKOFF_MS = 5000; // 5 seconds

// Rate limiting configuration - 5 calls per second max
const MAX_CONCURRENT_CALLS = 5; // Maximum 5 calls concurrently
const CALL_INTERVAL_MS = 1000; // 1 second between batches

// Validator name mapping - can be expanded
const VALIDATOR_NAMES: Record<string, string> = {
  "Vote111111111111111111111111111111111111111": "Solana Foundation",
  "JD3bq9hGdy38PuWQ4h2YJpELmHVGPPfFSuFkpzAd9zfu": "Kraken",
  "LunaFio31N2XmcwRLmPPFCMEHKpjRikzDYfKk6YkX4m": "Lunanova",
  "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV": "Staking Facilities",
  "7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh": "Certus One",
  "CsZWL4XNk7yJR3u1zKXzgLzZx1M5dCJgqo6Ko9GCLF9g": "Blockdaemon",
  "3VZLuG8zGJQmCehJzKA8xQQd4J7DTFdGBB9NGjTcGArB": "Chorus One",
  "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2": "Figment",
  "2NJZ1Ajcwtree8jLGpZHCDRxckGqzf4D6WbGJa9hcTiS": "Coinfund",
  "wacjWS3DMzYUBK1YZmTzkBcQraXWUmfY3CXqXhmLBN9": "Binance Staking",
  "Gr9Fuf9YMtD4bVMPwZkxafjj8wzDCo9WrEZmMJjnQomj": "Coinbase",
  "9QU2QSxhb24FUX3Tu2FpPVXELRiMiXfUPuVehganrC5K": "Everstake",
  "4LeBUXr8hpbvRmJeUo9xvYQYv4AWMc1JV51U3DWDPjKy": "Laine",
  "EWKnbFHD8w5c6oHQT5me2LEZCgFBJXvg6AFJBVAYXNAx": "Gate.io",
  "FR2G765TqKrAVX4FBJUXKCpiBdNz7cgLfGZZGLFVgCzE": "Staked",
  "8gcBW9MQ6HdWo16mYZXNKVt7SqDAFcxRGDcSxRjYDrGX": "P2P.ORG",
  "5imfG8C6aVQcTEfGEDaDUCbnht5A9rRNi7mJFpCDfNTG": "Marinade Finance",
  "BxTUaHn4zfpYYSB1qUZzv7n8UgyCYLhzCYdSTBRKsZvK": "Atomic Wallet",
  "DJv6ZGaHN6FpjrqQ1RyZn4dsh9QPRbQx5H1BZbdLX6rw": "Exodus",
  "GBU4rPzvrMcdXXJRPjduRcgEJNL4sGPyFx7x21vvC21B": "Solflare",
  "H1H38L9ND9nRC3orCJuW35eFPJHjcJYYPH4nZUbYF3GY": "Phantom",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "Marinade.Finance",
  "BNTmegvdXzNVyc3UMTWSMSfJUryjr3fXEVErtdqrZoiT": "BlazeStake",
  "ETAaeeuQBwsh9mC2gCrFyLcZF9YSzpEzYQ4fuT7WoDFV": "Jupiter",
  "9M8awWCcuaVCZwBYYPDV9xQRkZKgzwgTVeJuXPscXrqG": "Tulip Protocol"
};

// Helper function to get a validator name from its address
const getValidatorName = (validatorAddress: string): string => {
  // Check our mapping first
  if (validatorAddress in VALIDATOR_NAMES) {
    return VALIDATOR_NAMES[validatorAddress];
  }
  
  // Try to format unknown validators in a nicer way
  if (validatorAddress === "Unknown") {
    return "Unknown Validator";
  }
  
  // Return shortened address if we don't know the name
  return `Validator ${validatorAddress.slice(0, 6)}...${validatorAddress.slice(-4)}`;
};

/**
 * Fetch the balance of a Solana wallet
 * @param walletAddress - The Solana wallet address to check
 */
export const fetchWalletBalance = async (walletAddress: string) => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Validate the wallet address format
      if (!walletAddress || !/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(walletAddress)) {
        throw new Error("Invalid Solana wallet address format");
      }
      
      // Add a delay between retries to avoid rate limiting
      if (retries > 0) {
        const backoffTime = RETRY_DELAY_MS * Math.pow(2, retries - 1); // Exponential backoff
        console.log(`Backing off for ${backoffTime}ms before retry ${retries + 1}/${MAX_RETRIES}`);
        await delay(backoffTime);
      }

      const response = await fetch(`${HELIUS_API_URL}/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`);
      
      if (!response.ok) {
        const status = response.status;
        let errorMessage;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error?.message || `API Error: ${status}`;
        } catch (e) {
          errorMessage = `API Error: ${status} - Could not parse error response`;
        }
        
        if (status === 429) {
          console.log(`Rate limited (429) when fetching balance. Retry ${retries + 1}/${MAX_RETRIES}`);
          // If we've hit rate limit, wait longer before retrying
          await delay(RATE_LIMIT_BACKOFF_MS * Math.pow(2, retries)); // Exponential backoff
          retries++;
          continue;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Format the balance data
      return {
        amount: data.nativeBalance ? parseFloat(data.nativeBalance) / 1_000_000_000 : 0, // Convert lamports to SOL
        currency: "SOL"
      };
    } catch (error) {
      console.error(`Error fetching wallet balance (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES - 1) {
        throw error;
      }
      
      retries++;
    }
  }
  
  throw new Error("Failed to fetch wallet balance after multiple attempts");
};

/**
 * Makes API calls with controlled concurrency to avoid rate limiting
 * @param requests - Array of functions that return promises
 */
async function executeWithRateLimit(requests: (() => Promise<any>)[]) {
  console.log(`Making ${requests.length} API calls with max concurrency of ${MAX_CONCURRENT_CALLS}`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  // Process requests in batches to control concurrency
  for (let batchStart = 0; batchStart < requests.length; batchStart += MAX_CONCURRENT_CALLS) {
    const batchEnd = Math.min(batchStart + MAX_CONCURRENT_CALLS, requests.length);
    const batchSize = batchEnd - batchStart;
    
    console.log(`Processing batch ${batchStart + 1} to ${batchEnd} of ${requests.length} calls`);
    
    const batchPromises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const requestIndex = batchStart + i;
      
      // Stagger requests within batch by 200ms each to spread them out
      const staggeredDelay = i * (CALL_INTERVAL_MS / batchSize);
      
      batchPromises.push((async () => {
        await delay(staggeredDelay);
        try {
          const result = await requests[requestIndex]();
          successCount++;
          return { success: true, data: result };
        } catch (error) {
          failCount++;
          return { 
            success: false, 
            error, 
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })());
    }
    
    // Wait for all requests in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Wait before starting next batch (if not the last batch)
    if (batchEnd < requests.length) {
      console.log(`Waiting ${CALL_INTERVAL_MS}ms between batches...`);
      await delay(CALL_INTERVAL_MS);
    }
  }
  
  console.log(`API calls completed: ${successCount} successful, ${failCount} failed`);
  return results;
}

/**
 * Enhanced function to extract amount from native transfers or token transfers
 * @param transaction - The transaction object from Helius API
 * @param walletAddress - The wallet address to determine inflow/outflow
 */
function extractTransactionAmount(transaction: any, walletAddress: string): { amount: number; currency: string } {
  // Default values
  let amount = 0;
  let currency = "SOL";
  
  if (!transaction) return { amount, currency };
  
  try {
    console.log("Extracting amount from transaction:", transaction.signature?.substring(0, 6));
    
    // For SWAP transactions from Jupiter or other DEXs
    if (transaction.type === 'SWAP') {
      console.log("Processing SWAP transaction");
      
      // Look for description that often contains the swap details
      if (transaction.description) {
        const swapMatch = transaction.description.match(/swapped\s+([\d.]+)\s+(\w+)\s+for\s+([\d.]+)\s+(\w+)/i);
        
        if (swapMatch) {
          const [, amountIn, tokenIn, amountOut, tokenOut] = swapMatch;
          console.log(`Parsed from description: ${amountIn} ${tokenIn} for ${amountOut} ${tokenOut}`);
          
          // If we can determine if this wallet is the source or destination
          if (transaction.source && transaction.source.toLowerCase() === walletAddress.toLowerCase()) {
            // Outflow (negative amount)
            amount = -parseFloat(amountIn);
            currency = tokenIn;
          } else {
            // Inflow (positive amount)
            amount = parseFloat(amountOut);
            currency = tokenOut;
          }
          
          console.log(`Determined from swap: ${amount} ${currency}`);
          return { amount, currency };
        }
      }
      
      // Check for token transfers in SWAP transactions
      if (transaction.tokenTransfers && transaction.tokenTransfers.length > 0) {
        // For each token transfer, check if it involves our wallet
        for (const transfer of transaction.tokenTransfers) {
          if (transfer.fromUserAccount === walletAddress) {
            // This is an outflow
            amount = -Math.abs(parseFloat(transfer.tokenAmount || '0'));
            currency = transfer.tokenSymbol || transfer.mint || "Unknown";
            console.log(`Found outflow in token transfer: ${amount} ${currency}`);
            return { amount, currency };
          } 
          else if (transfer.toUserAccount === walletAddress) {
            // This is an inflow
            amount = Math.abs(parseFloat(transfer.tokenAmount || '0'));
            currency = transfer.tokenSymbol || transfer.mint || "Unknown";
            console.log(`Found inflow in token transfer: ${amount} ${currency}`);
            return { amount, currency };
          }
        }
      }
    }
    
    // Check for native SOL transfers
    if (transaction.nativeTransfers && transaction.nativeTransfers.length > 0) {
      console.log("Processing native transfers");
      
      // Calculate net amount (inflow - outflow)
      let inflow = 0;
      let outflow = 0;
      
      for (const transfer of transaction.nativeTransfers) {
        // Convert lamports to SOL
        const transferAmount = (transfer.amount || 0) / 1_000_000_000;
        
        if (transfer.toUserAccount === walletAddress) {
          inflow += transferAmount;
        } else if (transfer.fromUserAccount === walletAddress) {
          outflow += transferAmount;
        }
      }
      
      // Net amount (positive for inflow, negative for outflow)
      amount = inflow - outflow;
      currency = "SOL";
      
      if (amount !== 0) {
        console.log(`Found native transfer: inflow=${inflow}, outflow=${outflow}, net=${amount}`);
        return { amount, currency };
      }
    } 
    
    // Check for token transfers if not already processed and no amount found
    if (amount === 0 && transaction.tokenTransfers && transaction.tokenTransfers.length > 0) {
      console.log("Processing token transfers");
      
      // For each token transfer, look for the first one involving our wallet
      for (const tokenTransfer of transaction.tokenTransfers) {
        if (tokenTransfer.fromUserAccount === walletAddress || tokenTransfer.toUserAccount === walletAddress) {
          const transferAmount = parseFloat(tokenTransfer.tokenAmount || '0');
          
          // Determine if it's an inflow or outflow
          if (tokenTransfer.toUserAccount === walletAddress) {
            amount = transferAmount;
          } else {
            amount = -transferAmount;
          }
          
          currency = tokenTransfer.tokenSymbol || tokenTransfer.mint || "Unknown Token";
          console.log(`Found token transfer: ${amount} ${currency}`);
          return { amount, currency };
        }
      }
    }
    
    // Check for account data that might contain token balance changes
    if (amount === 0 && transaction.accountData) {
      console.log("Checking account data for token balance changes");
      
      for (const account of transaction.accountData) {
        if (account.tokenBalanceChanges && account.tokenBalanceChanges.length > 0) {
          for (const tokenChange of account.tokenBalanceChanges) {
            if (tokenChange && tokenChange.userAccount === walletAddress) {
              // Parse the raw token amount with proper decimal handling
              if (tokenChange.rawTokenAmount) {
                const rawAmount = tokenChange.rawTokenAmount.tokenAmount;
                const decimals = tokenChange.rawTokenAmount.decimals || 0;
                if (rawAmount && decimals) {
                  amount = parseInt(rawAmount) / Math.pow(10, decimals);
                } else {
                  amount = parseFloat(tokenChange.amount || '0');
                }
              } else {
                amount = parseFloat(tokenChange.amount || '0');
              }
              
              currency = tokenChange.symbol || tokenChange.mint || "Unknown Token";
              console.log(`Found token balance change: ${amount} ${currency}`);
              return { amount, currency };
            }
          }
        }
        
        // Check native balance changes
        if (account.account === walletAddress && account.nativeBalanceChange) {
          // Convert lamports to SOL
          amount = account.nativeBalanceChange / 1_000_000_000;
          currency = "SOL";
          console.log(`Found native balance change: ${amount} SOL`);
          return { amount, currency };
        }
      }
    }
    
    // If we still don't have an amount, try to extract from the direct transaction fields
    if (amount === 0 && transaction.amount) {
      amount = parseFloat(typeof transaction.amount === 'string' ? transaction.amount : transaction.amount);
      currency = transaction.currency || "SOL";
      console.log(`Using direct transaction amount: ${amount} ${currency}`);
      return { amount, currency };
    }
    
    // If this is a fee transaction and the user is the fee payer, count it as an outflow
    if (amount === 0 && transaction.fee && transaction.feePayer === walletAddress) {
      amount = -transaction.fee / 1_000_000_000; // Convert lamports to SOL
      currency = "SOL";
      console.log(`Extracted fee payment: ${amount} SOL`);
      return { amount, currency };
    }
    
    // If we couldn't extract an amount, log a warning
    if (amount === 0) {
      console.warn(`Could not extract amount from transaction ${transaction.signature || 'unknown'}`);
    }
  } catch (error) {
    console.error("Error extracting transaction amount:", error);
  }
  
  return { amount, currency };
}

/**
 * Fetch transaction history for a Solana wallet
 * @param input - The transaction signature or wallet address
 * @param limit - Number of transactions to fetch
 * @param beforeSignature - Optional signature to paginate before
 */
export const fetchTransactionHistory = async (input: string, limit: number = 20, beforeSignature?: string) => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Check if input is a transaction signature or wallet address
      const isSignature = /^[1-9A-HJ-NP-Za-km-z]{88}$/.test(input);
      const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
      
      if (!isSignature && !isAddress) {
        throw new Error("Invalid input format. Must be a Solana wallet address or transaction signature.");
      }
      
      // Add a delay between retries to avoid rate limiting
      if (retries > 0) {
        const backoffTime = RETRY_DELAY_MS * Math.pow(2, retries - 1);
        console.log(`Backing off for ${backoffTime}ms before retry ${retries + 1}/${MAX_RETRIES}`);
        await delay(backoffTime);
      }

      let url;
      if (isSignature) {
        // If it's a signature, use the transaction endpoint
        url = `${HELIUS_API_URL}/transactions?api-key=${HELIUS_API_KEY}&signatures=${input}`;
      } else {
        // If it's an address, use the address transactions endpoint
        url = `${HELIUS_API_URL}/addresses/${input}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}${beforeSignature ? `&before=${beforeSignature}` : ''}`;
      }
      
      console.log(`Fetching transactions from ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorStatus = response.status;
        let errorBody;
        
        try {
          errorBody = await response.json();
        } catch (e) {
          errorBody = { message: "Could not parse error response" };
        }
        
        const errorMessage = `API Error ${errorStatus}: ${errorBody.message || JSON.stringify(errorBody)}`;
        console.error(errorMessage);
        
        if (errorStatus === 429) {
          // Rate limiting - back off and retry
          await delay(RATE_LIMIT_BACKOFF_MS * Math.pow(2, retries));
          retries++;
          continue;
        }
        
        throw new Error(errorMessage);
      }
      
      const transactions = await response.json();
      
      console.log(`Fetched ${transactions.length} transactions`);
      
      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        console.log(`No transactions found for ${input}`);
        return []; // Return empty array instead of throwing error
      }
      
      // Log the first transaction for debugging
      if (transactions.length > 0) {
        console.log("Sample transaction signature:", transactions[0].signature);
        console.log("Sample transaction type:", transactions[0].type);
      }
      
      // Map the transaction data to a consistent format with proper amount extraction
      const processedTransactions = transactions.map(tx => {
        // Extract the amount and currency using our helper function
        const { amount, currency } = extractTransactionAmount(tx, input);
        
        return {
          signature: tx.signature,
          timestamp: tx.timestamp || tx.blockTime,
          type: tx.type || "Transfer",
          status: tx.err ? "Failed" : "Success",
          amount: amount.toString(),
          currency: currency,
          fee: tx.fee,
          source: tx.source || (tx.nativeTransfers && tx.nativeTransfers[0]?.fromUserAccount) || input,
          destination: tx.destination || (tx.nativeTransfers && tx.nativeTransfers[0]?.toUserAccount) || "Unknown"
        };
      });
      
      console.log(`Processed ${processedTransactions.length} transactions with amounts`);
      return processedTransactions;
    } catch (error) {
      console.error(`Error fetching transaction history (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES - 1) {
        throw error;
      }
      
      retries++;
    }
  }
  
  throw new Error("Failed to fetch transaction history after multiple attempts");
};

/**
 * Fetch staking activities for a Solana wallet
 * @param walletAddress - The Solana wallet address
 * @param limit - Number of staking activities to fetch
 * @param beforeSignature - Optional signature to paginate before
 */
export const fetchStakingActivities = async (walletAddress: string, limit: number = 5, beforeSignature?: string) => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Validate the wallet address format
      if (!walletAddress || !/^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(walletAddress)) {
        throw new Error("Invalid Solana wallet address format");
      }
      
      // Add a delay between retries to avoid rate limiting
      if (retries > 0) {
        const backoffTime = RETRY_DELAY_MS * Math.pow(2, retries - 1);
        console.log(`Backing off for ${backoffTime}ms before retry ${retries + 1}/${MAX_RETRIES}`);
        await delay(backoffTime);
      }
      
      // For staking, we need to look at all transactions and filter for stake operations
      // Let's fetch specific transaction types using Helius transaction endpoint
      const url = `${HELIUS_API_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit * 2}${beforeSignature ? `&before=${beforeSignature}` : ''}`;
      
      console.log(`Fetching transactions to analyze for staking: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorStatus = response.status;
        let errorBody;
        
        try {
          errorBody = await response.json();
        } catch (e) {
          errorBody = { message: "Could not parse error response" };
        }
        
        const errorMessage = `API Error ${errorStatus}: ${errorBody.message || JSON.stringify(errorBody)}`;
        console.error(errorMessage);
        
        if (errorStatus === 429) {
          // Rate limiting - back off and retry
          await delay(RATE_LIMIT_BACKOFF_MS * Math.pow(2, retries));
          retries++;
          continue;
        }
        
        throw new Error(errorMessage);
      }
      
      const allTransactions = await response.json();
      
      if (!allTransactions || !Array.isArray(allTransactions)) {
        throw new Error(`No transactions found for wallet ${walletAddress}`);
      }
      
      console.log(`Fetched ${allTransactions.length} transactions to analyze for staking activities`);
      
      // Filter for staking-related transactions
      const stakingTxs = allTransactions.filter(tx => {
        // Look for stake program invocations or stake type
        if (tx.type === 'STAKE' || tx.type === 'STAKE_DELEGATE' || tx.type === 'STAKE_DEACTIVATE') {
          return true;
        }
        
        // Check if there are any instructions involving the stake program
        if (tx.instructions && Array.isArray(tx.instructions)) {
          return tx.instructions.some(instr => 
            instr.programId === 'Stake11111111111111111111111111111111111111' ||
            instr.program === 'stake'
          );
        }
        
        // Check if any account in the transaction is a stake account
        if (tx.accountData && Array.isArray(tx.accountData)) {
          return tx.accountData.some(acc => 
            acc.account && (
              acc.account.toLowerCase().includes('stake') || 
              acc.program === 'stake'
            )
          );
        }
        
        // Check transaction description for staking keywords
        if (tx.description && typeof tx.description === 'string') {
          const desc = tx.description.toLowerCase();
          return desc.includes('stake') || desc.includes('delegate') || desc.includes('validator');
        }
        
        return false;
      });
      
      console.log(`Found ${stakingTxs.length} staking-related transactions out of ${allTransactions.length} total`);
      
      // If we found staking transactions, transform them to our format
      if (stakingTxs.length > 0) {
        return stakingTxs.map(tx => {
          // Try to extract the validator address from the transaction
          let validatorAddress = "Unknown";
          
          if (tx.instructions && Array.isArray(tx.instructions)) {
            // Look for stake delegation instruction
            const stakeInstr = tx.instructions.find(instr => 
              instr.program === 'stake' || 
              instr.programId === 'Stake11111111111111111111111111111111111111'
            );
            
            if (stakeInstr && stakeInstr.accounts && Array.isArray(stakeInstr.accounts)) {
              // Typically the validator vote account is one of the accounts
              // Often it's the 2nd or 3rd account in a stake delegation
              if (stakeInstr.accounts.length >= 3) {
                validatorAddress = stakeInstr.accounts[2] || validatorAddress;
              }
            }
          }
          
          // Extract amount if available
          let amount = 0;
          if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
            amount = parseFloat(tx.tokenTransfers[0].tokenAmount || '0');
          } else if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
            amount = tx.nativeTransfers[0].amount / 1_000_000_000; // Convert lamports to SOL
          }
          
          // Determine status based on transaction type
          let status = "Active";
          if (tx.type === 'STAKE_DEACTIVATE') {
            status = "Deactivating";
          } else if (tx.err) {
            status = "Failed";
          }
          
          return {
            transactionId: tx.signature || `tx-${Math.random().toString(36).substring(2, 10)}`,
            timestamp: tx.timestamp || tx.blockTime || Math.floor(Date.now() / 1000),
            validatorAddress: validatorAddress,
            validatorName: getValidatorName(validatorAddress),
            amount: amount,
            status: status,
            type: tx.type || "STAKE_DELEGATE"
          };
        }).slice(0, limit); // Limit to requested number
      }
      
      // Return empty array if no staking transactions found
      return [];
      
    } catch (error) {
      console.error(`Error fetching staking activities (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES - 1) {
        throw error;
      }
      
      retries++;
    }
  }
  
  throw new Error("Failed to fetch staking activities after multiple attempts");
};
