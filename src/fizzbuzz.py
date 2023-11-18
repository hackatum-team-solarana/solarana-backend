# fizzbuzz
# Built with Seahorse v0.1.1
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('AeXvLr2HCKUSFAx9mjUqpeFf18nk3qhMNmCJBGUCUiX5')

class Panel(Account):
  apu: f64
  power: f64
  ppu: u64
  units: u64
  age: u64
  owner: Pubkey

@instruction
def register_panel(owner: Signer, panel: Empty[Panel], new_token_mint: Empty[TokenMint]):
  panel.init(
    payer = owner, 
    seeds = ['panel', owner]
  )

  token_mint = new_token_mint.init(
    payer = owner,
    seeds = ['token-mint', owner],
    decimals = 9,
    authority = owner
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
def get_panel(panel: Panel, apu: f64, power: f64, price: u64):
  pass
