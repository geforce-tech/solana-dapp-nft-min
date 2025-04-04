use anchor_lang::prelude::*;

pub mod mint;
pub mod purchase;

use mint::*;
use purchase::*;

declare_id!("EYMs5Mm5vTuUjxR9R5AvAZCBDK5SJc9tDXVa164ZxSbc");

#[program]
pub mod share_nft {
    use super::*;

    pub fn mint(
        ctx: Context<MintNFT>,
        name: String,
        symbol: String,
        uri: String,
        purchase_lamports: u64,
    ) -> Result<()> {
        mint::mint(ctx, name, symbol, uri, purchase_lamports)
    }

    pub fn purchase(ctx: Context<PurchaseNft>, purchase_lamports: u64) -> Result<()> {
        purchase::purchase(ctx, purchase_lamports)
    }
}