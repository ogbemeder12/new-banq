
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

// The IDL for the mobile_wallet_program
const IDL = {
  "version": "0.1.0",
  "name": "mobile_wallet_program",
  "instructions": [
    {
      "name": "storeUser",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "mobile",
          "type": "string"
        },
        {
          "name": "wallet",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "newAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "UserData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mobile",
            "type": "string"
          },
          {
            "name": "wallet",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "NewAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

// Real program ID provided by the user
const PROGRAM_ID = new PublicKey("D29Nd3SqbFWbwSxetFFCAJ58ozYdMwdF75Z2ULzGBYGM");
const NETWORK = "devnet"; // Can be changed to "mainnet-beta" for production

/**
 * Helper function to ensure wallet has minimum SOL balance
 * @param publicKey The wallet public key to check and fund
 * @param signerKeypair Optional keypair to sign transactions
 */
export async function ensureMinimumBalance(
  publicKey: PublicKey,
  signerKeypair?: Keypair
): Promise<boolean> {
  try {
    // Connect to the Solana network
    const connection = new Connection(`https://api.${NETWORK}.solana.com`, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      disableRetryOnRateLimit: false
    });
    
    // Check current balance
    const balance = await connection.getBalance(publicKey);
    console.log(`Current wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // If balance is sufficient, return early
    if (balance >= LAMPORTS_PER_SOL * 0.02) {
      console.log("Wallet has sufficient funds");
      return true;
    }
    
    console.log("Wallet needs funds. Requesting airdrops...");
    
    // Three separate airdrop attempts with different amounts
    const airdropSizes = [0.05, 0.05, 0.05]; // Multiple smaller airdrops
    const results = [];
    
    for (let i = 0; i < airdropSizes.length; i++) {
      try {
        console.log(`Requesting airdrop ${i+1} of ${airdropSizes[i]} SOL`);
        
        // Request the airdrop
        const airdropSignature = await connection.requestAirdrop(
          publicKey,
          LAMPORTS_PER_SOL * airdropSizes[i]
        );
        
        // Wait for confirmation with timeout
        const confirmStart = Date.now();
        let confirmed = false;
        
        while (!confirmed && Date.now() - confirmStart < 30000) {
          const signatureStatus = await connection.getSignatureStatus(airdropSignature);
          if (signatureStatus.value && signatureStatus.value.confirmationStatus === "confirmed") {
            confirmed = true;
            console.log(`Airdrop ${i+1} confirmed:`, airdropSignature);
            results.push(true);
            break;
          }
          // Small delay between checks
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!confirmed) {
          console.log(`Airdrop ${i+1} timed out`);
          results.push(false);
        }
        
        // Pause between airdrops to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.warn(`Airdrop ${i+1} failed:`, err);
        results.push(false);
      }
    }
    
    // Check if any airdrops were successful
    if (results.some(result => result)) {
      // Check final balance after airdrops
      const newBalance = await connection.getBalance(publicKey);
      console.log(`New wallet balance after airdrops: ${newBalance / LAMPORTS_PER_SOL} SOL`);
      return newBalance >= LAMPORTS_PER_SOL * 0.01;
    } else {
      console.warn("All airdrops failed");
      return false;
    }
  } catch (error) {
    console.error("Error ensuring minimum balance:", error);
    return false;
  }
}

/**
 * Creates a PDA for a user that links their phone number to their wallet
 * @param phoneNumber The user's phone number
 * @param walletPublicKey The user's wallet public key
 * @param ownerKeypair The keypair that will sign the transaction
 */
export async function storeUserPhoneWallet(
  phoneNumber: string,
  walletPublicKey: PublicKey,
  ownerKeypair: Keypair
): Promise<string> {
  try {
    // Connect to the Solana network with increased timeout and commitment
    const connection = new Connection(`https://api.${NETWORK}.solana.com`, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      disableRetryOnRateLimit: false
    });
    
    // Check if we have enough balance after the airdrops
    const balance = await connection.getBalance(ownerKeypair.publicKey);
    console.log(`Current wallet balance before transaction: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < LAMPORTS_PER_SOL * 0.01) {
      console.error("Insufficient funds after airdrop attempts");
      throw new Error("Unable to get sufficient SOL for transaction. The devnet might be congested.");
    }
    
    // Create a wallet provider for Anchor with proper signing
    const wallet = {
      publicKey: ownerKeypair.publicKey,
      signTransaction: async (tx: Transaction) => {
        tx.partialSign(ownerKeypair);
        return tx;
      },
      signAllTransactions: async (txs: Transaction[]) => {
        return txs.map(tx => {
          tx.partialSign(ownerKeypair);
          return tx;
        });
      },
    };
    
    // Create a provider with proper options
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as any,
      { 
        commitment: "confirmed",
        preflightCommitment: "confirmed",
        skipPreflight: false
      }
    );
    
    // Create the program interface
    const program = new anchor.Program(IDL as any, PROGRAM_ID, provider);
    
    // Derive the PDA for the user account
    const [userPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user"),
        Buffer.from(phoneNumber)
      ],
      PROGRAM_ID
    );
    
    console.log(`Creating user PDA for phone: ${phoneNumber} and wallet: ${walletPublicKey.toString()}`);
    
    // Call the storeUser instruction with proper error handling and retry logic
    try {
      console.log("Sending transaction to create user PDA...");
      
      // Try with regular anchor method first
      let tx;
      try {
        tx = await program.methods
          .storeUser(phoneNumber, walletPublicKey)
          .accounts({
            user: userPDA,
            signer: ownerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([ownerKeypair])
          .rpc({ maxRetries: 3 }); // Add retries at the RPC level
      } catch (anchorError) {
        // If anchor method fails, fallback to sending transaction directly
        console.log("Anchor method failed, trying direct transaction...", anchorError);
        
        const transaction = await program.methods
          .storeUser(phoneNumber, walletPublicKey)
          .accounts({
            user: userPDA,
            signer: ownerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
        
        tx = await sendAndConfirmTransaction(
          connection, 
          transaction, 
          [ownerKeypair], 
          { commitment: 'confirmed' }
        );
      }
      
      console.log("Transaction signature:", tx);
      return tx;
    } catch (txError) {
      console.error("Transaction error:", txError);
      
      // Try to provide detailed error information
      if (txError instanceof Error) {
        if (txError.message.includes("429")) {
          throw new Error("Rate limit exceeded on Solana network. Try again later.");
        } else if (txError.message.includes("debit an account but found no record")) {
          throw new Error("Not enough SOL in wallet to pay for transaction fees.");
        } else if (txError.message.includes("blockhash not found")) {
          throw new Error("Transaction expired. Network may be congested.");
        } else if (txError.message.includes("timed out")) {
          throw new Error("Transaction confirmation timed out. Network may be congested.");
        }
      }
      
      throw txError;
    }
  } catch (error) {
    console.error("Error storing user data on-chain:", error);
    throw error;
  }
}

/**
 * Retrieves wallet information from a PDA based on a phone number
 * @param phoneNumber The phone number to lookup
 * @returns Wallet information if found
 */
export async function getWalletFromPhoneNumber(
  phoneNumber: string
): Promise<{ found: boolean; publicKey?: string }> {
  try {
    // Connect to the Solana network
    const connection = new Connection(`https://api.${NETWORK}.solana.com`);
    
    // Derive the PDA for the user account
    const [userPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user"),
        Buffer.from(phoneNumber)
      ],
      PROGRAM_ID
    );
    
    console.log(`Looking up PDA for phone: ${phoneNumber}`);
    
    // Try to fetch the account
    try {
      const account = await connection.getAccountInfo(userPDA);
      
      if (!account) {
        return { found: false };
      }
      
      // Create a dummy wallet for the provider
      const wallet = {
        publicKey: new PublicKey("11111111111111111111111111111111"),
        signTransaction: (tx: Transaction) => Promise.resolve(tx),
        signAllTransactions: (txs: Transaction[]) => Promise.resolve(txs),
      };
      
      // Create a provider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
      
      const program = new anchor.Program(IDL as any, PROGRAM_ID, provider);
      
      // Decode the account data
      const userData = program.coder.accounts.decode("UserData", account.data);
      
      return {
        found: true,
        publicKey: userData.wallet.toString()
      };
    } catch (error) {
      console.error("Error fetching account:", error);
      return { found: false };
    }
  } catch (error) {
    console.error("Error getting wallet from phone number:", error);
    return { found: false };
  }
}
