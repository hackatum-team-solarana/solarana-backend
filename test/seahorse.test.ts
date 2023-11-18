
// No imports needed: web3, anchor, pg and more are globally available

describe("Panel", async () => {
    // Generate the fizzbuzz account public key from its seeds
    const [tokenMintPk] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("token-mint"), pg.wallet.publicKey.toBuffer()],
      pg.PROGRAM_ID
    );
  
    const [panelPk] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("panel"), pg.wallet.publicKey.toBuffer()],
      pg.PROGRAM_ID
    );
  
    it("init", async () => {
      // Send transaction
      const aTokenPublicKey = new web3.PublicKey(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
      );
      const tokenProgramPK = new web3.PublicKey(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      );
      const recipientATA = web3.PublicKey.findProgramAddressSync(
        [
          pg.wallet.publicKey.toBuffer(),
          tokenProgramPK.toBuffer(),
          tokenMintPk.toBuffer(),
        ],
        aTokenPublicKey
      )[0];
  
      const transaction = new web3.Transaction();
  
      const instruction1 = await pg.program.methods
        .registerPanel()
        .accounts({
          panel: panelPk,
          owner: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          newTokenMint: tokenMintPk,
          tokenProgram: tokenProgramPK,
        })
        .instruction();
  
      const instruction2 = await pg.program.methods
        .ownerMintToken()
        .accounts({
          newRecipient: recipientATA,
          owner: pg.wallet.publicKey,
          tokenMint: tokenMintPk,
          tokenProgram: tokenProgramPK,
        })
        .instruction();
  
      transaction.add(instruction1, instruction2);
      transaction.recentBlockhash = (
        await pg.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = pg.wallet.publicKey;
      transaction.sign(pg.wallet.keypair);
  
      // Confirm transaction
      const signature = await pg.connection.sendRawTransaction(transaction.serialize(), {skipPreflight: true});
      console.log(signature)
      // Fetch the created account
      const panelAccount = await pg.program.account.panel.fetch(panelPk);
  
      console.log("Area per unit:", panelAccount.apu);
      console.log("Power:", panelAccount.power);
      console.log("Price per unit:", panelAccount.ppu);
      console.log("Units:", panelAccount.units);
      console.log("Age:", panelAccount.age);
    });
  
    /*
    it("doFizzbuzz", async () => {
      // Send transaction
      const txHash = await pg.program.methods
        .doFizzbuzz(new BN(6000))
        .accounts({
          fizzbuzz: fizzBuzzAccountPk,
        })
        .rpc();
  
      // Confirm transaction
      await pg.connection.confirmTransaction(txHash);
  
      // Fetch the fizzbuzz account
      const fizzBuzzAccount = await pg.program.account.fizzBuzz.fetch(
        fizzBuzzAccountPk
      );
  
      console.log("Fizz:", fizzBuzzAccount.fizz);
      assert(fizzBuzzAccount.fizz);
  
      console.log("Buzz:", fizzBuzzAccount.buzz);
      assert(fizzBuzzAccount.buzz);
  
      console.log("N:", fizzBuzzAccount.n.toString());
      assert.equal(fizzBuzzAccount.n, 0);
    });
    */
  });
