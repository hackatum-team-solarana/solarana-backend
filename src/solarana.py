# solarana
# Built with Seahorse v0.1.1
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *
# import utils

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('6X6MoaaQDpcGDgtXzCwQgwzinS6tUoZdAHcu4kqhNvho')


class Panel(Account):
  region: u8
  areaPerUnit: f64
  powerPerUnit: f64
  pricePerUnit: u64    # in cents
  units: u64
  age: u64
  owner: Pubkey


@instruction
def register_panel(owner: Signer, new_panel: Empty[Panel], random_str: str):
  panel = new_panel.init(
    payer = owner, 
    seeds = ['panel', owner, random_str]
  )


@instruction
def initialize_panel(panel: Panel, region: u8, areaPerUnit: f64, powerPerUnit: f64, pricePerUnit: u64, age: u64):
  panel.region = region
  panel.areaPerUnit = areaPerUnit
  panel.powerPerUnit = powerPerUnit
  panel.pricePerUnit = pricePerUnit
  panel.units = 100
  panel.age = age
  print(panel)


@instruction
def init_token_mint(signer: Signer, new_token_mint: Empty[TokenMint], random_str: str):
  new_token_mint.init(
    payer = signer,
    seeds = ['token-mint', signer, random_str],
    decimals = 0,
    authority = signer
  )


@instruction
def owner_mint_token(token_mint: TokenMint, new_recipient: Empty[TokenAccount], owner: Signer):
  recipient = new_recipient.init(
    payer = owner, 
    associated = True,
    mint = token_mint, 
    authority = owner
  )

  print("Before mint Owner token : ", recipient.amount)

  token_mint.mint(
    authority = owner,
    to = recipient,
    amount = u64(100)  # 100 %
  )
  
  print("After mint Owner token : ", recipient.amount)


@instruction
def init_empty_account(token_mint: TokenMint, new_recipient: Empty[TokenAccount], owner: Signer):
  recipient = new_recipient.init(
    payer = owner, 
    associated = True,
    mint = token_mint, 
    authority = owner
  )


@instruction
def get_panel(signer: Signer, signer_token_account: TokenAccount, recipient: TokenAccount, amount: u64):
  signer_token_account.transfer(
    authority = signer,
    to = recipient,
    amount = amount
  )

  print(f"{amount} panel units transfered from {signer} to {recipient}")


@instruction
def init_token_account(signer: Signer, signer_token: TokenAccount, token_mint: TokenMint, recipient_token: TokenAccount, amount: u64):
  # recipient_token = recipient_token.init(
  #   payer = signer,
  #   mint = token_mint,
  #   authority = signer,
  #   associated = True
  # )
  
  signer_token.transfer(
    authority = signer,
    to = recipient_token,
    amount = amount
  )
