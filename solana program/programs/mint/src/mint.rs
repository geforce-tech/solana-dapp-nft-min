use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
    CreateMetadataAccountsV3, Metadata,
};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata as MplMetadata},
    types::DataV2,
};

pub fn mint(
    ctx: Context<MintNFT>,
    name: String,
    symbol: String,
    uri: String,
    purchase_lamports: u64,
) -> Result<()> {
    msg!(
        "[+] Initiating transfer of {} lamports...",
        purchase_lamports
    );
    msg!(
        "[ ] Purchaser (sending lamports): {}",
        &ctx.accounts.signer.key()
    );
    msg!(
        "[ ] Seller (receiving lamports): {}",
        &ctx.accounts.seller.key()
    );
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
        ),
        purchase_lamports,
    )?;

    msg!("[+] Lamports transferred successfully.");

    msg!("Setp -1");

    // create mint account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.associated_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        },
    );

    msg!("Setp -2");
    token::mint_to(cpi_context, 1)?;

    msg!("Setp -3");
    // create metadata account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_authority: ctx.accounts.signer.to_account_info(),
            update_authority: ctx.accounts.signer.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    msg!("Setp -4");

    let data_v2 = DataV2 {
        name: name,
        symbol: symbol,
        uri: uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };
    msg!("Setp -5");

    create_metadata_accounts_v3(cpi_context, data_v2, false, true, None)?;
    msg!("Setp -6");

    //create master edition account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMasterEditionV3 {
            edition: ctx.accounts.master_edition_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            update_authority: ctx.accounts.signer.to_account_info(),
            mint_authority: ctx.accounts.signer.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            metadata: ctx.accounts.metadata_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    msg!("Setp -7");

    create_master_edition_v3(cpi_context, None)?;
    msg!("Setp -8");

    Ok(())
}
#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut, signer)]
    pub signer: AccountInfo<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub associated_token_account: UncheckedAccount<'info>,

    /// CHECK - address
    #[account(
        mut,
        address=MplMetadata::find_pda(&mint.key()).0,
    )]
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: address
    #[account(
        mut,
        address=MasterEdition::find_pda(&mint.key()).0,
    )]
    pub master_edition_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}