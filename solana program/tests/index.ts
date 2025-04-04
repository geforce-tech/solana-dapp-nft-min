import * as anchor from "@coral-xyz/anchor";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import type { Mint } from "../target/types/mint";
describe("Test", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Mint as anchor.Program<Mint>;
  
  it("Airdrop", async () => {
    // Fetch my balance
    const balance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`My balance is ${balance} lamports`);

    // Airdrop 1 SOL
    const airdropAmount = 1 * web3.LAMPORTS_PER_SOL;
    const txHash = await program.provider.connection.requestAirdrop(
      program.provider.publicKey,
      airdropAmount
    );

    // Confirm transaction
    await program.provider.connection.confirmTransaction(txHash);

    // Fetch new balance
    const newBalance = await program.provider.connection.getBalance(program.provider.publicKey);
    console.log(`New balance is ${newBalance} lamports`);

    // Assert balances
    assert(balance + airdropAmount === newBalance);
  });
});