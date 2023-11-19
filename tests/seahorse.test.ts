// No imports needed: web3, anchor, pg and more are globally available

const parseSecretKey = (keyAsString: string) =>
  Uint8Array.from(keyAsString.split(",").map((v) => Number(v)));

// from https://github.com/Wealthineer/buildspace-solana-intro-client/blob/main/src/index.ts
const airdropSolIfNeeded = async (signer: web3.Keypair) => {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const balance = await connection.getBalance(signer.publicKey);
  console.log("Current balance is", balance / web3.LAMPORTS_PER_SOL, "SOL");

  // 1 SOL should be enough for almost anything you wanna do
  if (balance / web3.LAMPORTS_PER_SOL < 1) {
    // You can only get up to 2 SOL per request
    console.log("Airdropping 1 SOL");
    const airdropSignature = await connection.requestAirdrop(
      signer.publicKey,
      web3.LAMPORTS_PER_SOL
    );

    const latestBlockhash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    const newBalance = await connection.getBalance(signer.publicKey);
    console.log("New balance is", newBalance / web3.LAMPORTS_PER_SOL, "SOL");
  }
};

const keypairs = [
  {
    publicKey: "4AbW9uj6GW5gUYHJK8CyjXQ52JWY9UWwgy16suSnmypi",
    secretKey:
      "137,215,195,237,14,226,225,143,102,105,64,32,46,117,232,38,88,127,33,47,93,166,182,170,89,6,58,23,234,158,99,118,47,8,76,226,102,145,95,165,239,8,63,124,158,183,236,202,60,106,183,92,244,225,29,250,102,85,192,246,217,12,0,255",
  },
  {
    publicKey: "BTCVp6MnSKy3v7bGbZ7GrEbiDWdAQkvn52DrVxb1xdyw",
    secretKey:
      "18,38,206,215,16,87,23,208,5,225,159,127,70,152,22,90,82,71,50,122,253,29,187,245,131,131,239,171,109,202,126,47,214,157,144,233,35,8,144,165,187,75,40,192,53,189,0,14,45,219,71,235,81,175,136,50,89,174,142,116,101,172,81,58",
  },
];

const getTokenProgram = () =>
  new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const getATokenPK = () =>
  new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function findAssociatedTokenAddress(
  walletAddress: web3.PublicKey,
  tokenMintAddress: web3.PublicKey
): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      getTokenProgram().toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    getATokenPK()
  )[0];
}

type InitDummyKeyParams = {
  publicKey: string;
  secretKey: string;
};

const initDummyKey = async ({ publicKey, secretKey }: InitDummyKeyParams) => {
  const keyPairFromSecret = web3.Keypair.fromSecretKey(
    parseSecretKey(secretKey)
  );
  await airdropSolIfNeeded(keyPairFromSecret);

  return new web3.PublicKey(publicKey);
};

const initAllDummyKeys = async () => {
  return Promise.all(keypairs.map(async (keypair) => initDummyKey(keypair)));
};

const PUB_KEYS: web3.PublicKey[] = await initAllDummyKeys();


const generatePanel = async () => {
  const randomString = (new BN(Math.random() * Math.pow(2, 32))).toString();

  const [panelPk] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("panel"),
      pg.wallet.publicKey.toBuffer(),
      Buffer.from(randomString)
      // Buffer.from("1"),
      // Buffer.from(randomInt.toString()),
    ],
    pg.PROGRAM_ID
  );
  console.log("panelPk", panelPk.toString());


  await pg.program.methods
      .registerPanel(randomString)
      .accounts({
        newPanel: panelPk,
        owner: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
  return panelPk;
}


describe("Panel", async () => {
  // Generate the fizzbuzz account public key from its seeds
  const [tokenMintPk] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("token-mint"), pg.wallet.publicKey.toBuffer()],
    pg.PROGRAM_ID
  );
  console.log("tokenMintPk", tokenMintPk.toString());

  /*const randomInt: BN = new BN(Math.random() * Math.pow(2, 32));
  console.log("randomInt:", randomInt);

  const [panelPk] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("panel"),
      pg.wallet.publicKey.toBuffer(),
      // Buffer.from("1"),
      // Buffer.from(randomInt.toString()),
    ],
    pg.PROGRAM_ID
  );*/

  const registerPanel = async () => {
    const panelPk = await generatePanel();
    console.log("panelPk", panelPk.toString());

    const tokenProgramPK = getTokenProgram();

    const panelDetails = {
      region: 7,
      apu: 23.3,
      power: 1230.5,
      ppu: new BN(1200),
      age: new BN(5),
    };

    // Send transaction
    const recipientATA = web3.PublicKey.findProgramAddressSync(
      [
        pg.wallet.publicKey.toBuffer(),
        tokenProgramPK.toBuffer(),
        tokenMintPk.toBuffer(),
      ],
      getATokenPK()
    )[0];

    const transaction = new web3.Transaction();

    /*const callRegisterPanel = await pg.program.methods
      .registerPanel(randomInt.toString())
      .accounts({
        newPanel: panelPk,
        owner: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    transaction.add(callRegisterPanel);*/

    const callInitializePanel = await pg.program.methods
      .initializePanel(
        panelDetails.region,
        panelDetails.apu,
        panelDetails.power,
        panelDetails.ppu,
        panelDetails.age
      )
      .accounts({
        panel: panelPk,
      })
      .instruction();

    const callInitTokenMint = await pg.program.methods
      .initTokenMint()
      .accounts({
        newTokenMint: tokenMintPk,
        signer: pg.wallet.publicKey,
      })
      .instruction();

    const callOwnerMintToken = await pg.program.methods
      .ownerMintToken()
      .accounts({
        newRecipient: recipientATA,
        owner: pg.wallet.publicKey,
        tokenMint: tokenMintPk,
        tokenProgram: tokenProgramPK,
      })
      .instruction();

    transaction.add(
      // callRegisterPanel,
      callInitializePanel,
      callInitTokenMint,
      callOwnerMintToken
    );
    transaction.recentBlockhash = (
      await pg.connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = pg.wallet.publicKey;
    transaction.sign(pg.wallet.keypair);

    // Send transaction
    const signature = await pg.connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: true }
    );
    console.log(signature);

    return panelPk;
  };

  it("register panel", async () => {
    const panelPk = await registerPanel();

    // Fetch the created account
    const panelAccount = await pg.program.account.panel.fetch(panelPk);
    console.log("Region", panelAccount.region);
    console.log("Area per unit:", panelAccount.areaPerUnit);
    console.log("Power:", panelAccount.powerPerUnit);
    console.log("Price per unit:", panelAccount.pricePerUnit);
    console.log("Units:", panelAccount.units);
    console.log("Age:", panelAccount.age);
  });

  // it("buy panel", async () => {
  //   const signerATA = web3.PublicKey.findProgramAddressSync(
  //     [
  //       pg.wallet.publicKey.toBuffer(),
  //       getTokenProgram().toBuffer(),
  //       tokenMintPk.toBuffer(),
  //     ],
  //     getATokenPK()
  //   )[0];
  //   console.log("signer ATA", signerATA.toString())

  //   const recipientATA = web3.PublicKey.findProgramAddressSync(
  //     [
  //       pg.wallet.publicKey.toBuffer(),
  //       getTokenProgram().toBuffer(),
  //       tokenMintPk.toBuffer(),
  //     ],
  //     getATokenPK()
  //   )
  //   console.log("recipient ATA", recipientATA.toString());

  //   const transaction = new web3.Transaction();

  //   console.log("tokenMint", tokenMintPk.toString());

  //   const callInitTokenMint = await pg.program.methods
  //     .initTokenMint()
  //     .accounts({
  //       newTokenMint: tokenMintPk,
  //       signer: pg.wallet.publicKey,
  //     })
  //     .instruction()

  //   console.log();
  //   console.log("newRecipiet", recipientATA.toString());
  //   console.log("tokenMi", tokenMintPk.toString());
  //   console.log("owner", pg.wallet.publicKey.toString());

  //   const callInitEmptyAccount = await pg.program.methods
  //     .initEmptyAccount()
  //     .accounts({
  //       newRecipient: recipientATA,
  //       tokenMint: tokenMintPk,
  //       owner: pg.wallet.publicKey,
  //       tokenProgram: getTokenProgram(),
  //       associatedTokenProgram: getATokenPK(),
  //       systemProgram: web3.SystemProgram.programId,
  //       // rent: web3.SYSVAR_RENT_PUBKEY
  //     })
  //     .rpc();

  //   const callGetPanel = await pg.program.methods
  //     .getPanel(new BN(17))
  //     .accounts({
  //       signerTokenAccount: signerATA,
  //       signer: pg.wallet.publicKey,
  //       recipient: recipientATA,
  //       tokenProgram: getTokenProgram()
  //     })
  //     .rpc();

  //   /*transaction.add(callInitEmptyAccount, callGetPanel);
  //   transaction.recentBlockhash = (
  //     await pg.connection.getLatestBlockhash()
  //   ).blockhash;
  //   transaction.feePayer = pg.wallet.publicKey;
  //   transaction.sign(pg.wallet.keypair);*/

  //   // Send transaction
  //   //const signature = await pg.connection.sendRawTransaction(transaction.serialize(), {skipPreflight: true});
  //   //console.log(signature)

  //   const panelAccount = await pg.program.account.panel.fetch(panelPk);
  //   console.log("Area per unit:", panelAccount.apu);
  //   console.log("Power:", panelAccount.power);
  //   console.log("Price per unit:", panelAccount.ppu);
  //   console.log("Units:", panelAccount.units);
  //   console.log("Age:", panelAccount.age);
  // });

  // it("test", async () => {
  //   const [tokenMintPk] = await web3.PublicKey.findProgramAddress(
  //     [Buffer.from("token-mint"), pg.wallet.publicKey.toBuffer()],
  //     pg.PROGRAM_ID
  //   );
  //   const signerTokenATA = findAssociatedTokenAddress(pg.wallet.publicKey, tokenMintPk);
  //   const recipientTokenATA = findAssociatedTokenAddress(new web3.PublicKey("4PamNizuUHWWbyCUuyNQDxxmYA16RLx7zQrdGFXj9L4u"), tokenMintPk)
  //   console.log("signertokenTAT", signerTokenATA.toString());

  //   // const test = await pg.program.methods
  //   //   .initTokenAccount()
  //   //   .accounts({
  //   //     associatedTokenProgram: getATokenPK(),
  //   //     signer: pg.wallet.publicKey,
  //   //     signerToken: signerTokenATA,
  //   //     tokenMint: tokenMintPk,
  //   //     tokenProgram: getTokenProgram(),
  //   //   })
  //   //   .rpc({
  //   //     skipPreflight: true,
  //   //   })

  //   //   console.log(test);

  //   const transaction = await pg.program.methods
  //     .initTokenAccount(new BN(1))
  //     .accounts({
  //       signer: pg.wallet.publicKey,
  //       tokenMint: tokenMintPk,
  //       recipientToken: recipientTokenATA,
  //       signerToken: signerTokenATA,
  //       tokenProgram: getTokenProgram()
  //     })
  //     .transaction()

  //   transaction.recentBlockhash = (
  //     await pg.connection.getLatestBlockhash()
  //   ).blockhash;
  //   transaction.feePayer = pg.wallet.publicKey;
  //   transaction.sign(pg.wallet.keypair);
  //   const signature = await pg.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });

  //   console.log(signature);
  // })
});
