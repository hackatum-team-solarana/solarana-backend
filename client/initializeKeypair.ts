console.log('Generating new keypair...');

const keypair = web3.Keypair.generate();
console.log("public key: ", keypair.publicKey.toString());
console.log("secret key: ", keypair.secretKey.toString());
