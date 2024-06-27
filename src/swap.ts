import assert from 'assert';
import dotenv from 'dotenv'
import * as utils from './utils'
import * as uniconst from './uniconst'
import * as afx from './global'
import { DelayDetector } from "./delay_detector"
dotenv.config()
import { PublicKey, Keypair, VersionedTransaction, SystemProgram, AddressLookupTableAccount, TransactionMessage, TransactionSignature, ComputeBudgetProgram, TransactionInstruction, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint, createMint, getOrCreateAssociatedTokenAccount, transfer, createTransferInstruction } from "@solana/spl-token";
import { Signer } from '@metaplex-foundation/js';

export interface BotFee {
    swapOrgFee: number,
    refRewardFee: number,
    swapFee: number,
}

export const calcFee = (amount: number, session: any, rewardAvailable: boolean) : BotFee => {

    const swapOrgFee = amount * afx.Swap_Fee_Percent / 100.0
    let refRewardFee

    if (rewardAvailable && session.referredBy) {

        const now = new Date().getTime()

        let monthSpent = 0
        if (session.referredTimestamp) {
            monthSpent = (now - session.referredTimestamp) / (1000 * 60 * 60 * 24 * 30)
        }
        
        let rewardPercent = 10
        if (monthSpent > 2) {
            rewardPercent = 10
        } else if (monthSpent > 1) {
            rewardPercent = 20
        } else {
            rewardPercent = 30
        }

        refRewardFee = swapOrgFee * rewardPercent / 100.0
    } else {
        refRewardFee = 0
    }

    const swapFee = swapOrgFee - refRewardFee

    return { swapOrgFee, refRewardFee, swapFee }
}

export const transferSOL = async (session: any, destWallet: string, amount: number, sendMsg:Function, callback: Function) => {

    const pkey = utils.decryptPKey(session.pkey)
	const walletInfo: any | null = utils.getWalletFromPrivateKey(pkey)
    if (!walletInfo) {
        sendMsg(`❗ Transfer failed: Invalid wallet.`)
        return false
    }

    const wallet: Keypair = walletInfo.wallet

    const txInstructions : TransactionInstruction[] = []

    const transferInst = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(destWallet),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
    txInstructions.push(transferInst)

    // const priorityInst = ComputeBudgetProgram.setComputeUnitPrice({
    //     microLamports: Math.floor(session.trxPriorityAmount * (LAMPORTS_PER_SOL) * (10 ** 6) / 1400000)
    // });

    // txInstructions.push(priorityInst)
    
    const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: (await afx.web3Conn.getLatestBlockhash()).blockhash,
        instructions: txInstructions
    }).compileToV0Message();

    const trx = new VersionedTransaction(messageV0)

    const ret = await sendAndConfirmTransactions(wallet, trx, sendMsg)
    if (ret) {

        let swapResult = {
            solAmount: amount,
            mode: 'sol transfer',
            address: destWallet,
            trxId: ret
        }
        swapResult.trxId = ret
        callback(swapResult)
    }

    return (ret != null)
}


export const transferToken = async (session: any, destWallet: string, tokenAddress: string, amount: number, sendMsg:Function, callback: Function) => {

    const pkey = utils.decryptPKey(session.pkey)
	const walletInfo: any | null = utils.getWalletFromPrivateKey(pkey)
    if (!walletInfo) {
        sendMsg(`❗ Transfer failed: Invalid wallet.`)
        return false
    }

    const wallet: Keypair = walletInfo.wallet

    const tokenAddressPubKey = new PublicKey(tokenAddress);
    const recipientAddress = new PublicKey(destWallet);
    const addRecipientToAcct = await getOrCreateAssociatedTokenAccount(
      afx.web3Conn,
      wallet,
      tokenAddressPubKey,
      recipientAddress
    );
    const addSenderToAcct = await getOrCreateAssociatedTokenAccount(
        afx.web3Conn,
        wallet,
        tokenAddressPubKey,
        wallet.publicKey
    );
    
    // const priorityInst = ComputeBudgetProgram.setComputeUnitPrice({
    //     microLamports: calcTrxPriorityAmount(session)
    // });

    const txInstructions : TransactionInstruction[] = []
    txInstructions.push(
        createTransferInstruction(addSenderToAcct.address, addRecipientToAcct.address, wallet.publicKey, amount * (10 ** 9), [], TOKEN_2022_PROGRAM_ID)
    )
    
    const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: (await afx.web3Conn.getLatestBlockhash()).blockhash,
        instructions: txInstructions
    }).compileToV0Message();

    const trx = new VersionedTransaction(messageV0)

    const ret = await sendAndConfirmTransactions(wallet, trx, sendMsg)
    if (ret) {

        let swapResult = {
            tokenAmount: amount,
            mode: 'token transfer',
            address: destWallet,
            trxId: ret
        }
        swapResult.trxId = ret
        callback(swapResult)
    }

    return (ret != null)
}

export const sendAndConfirmTransactions = async (payer: Keypair, tx: VersionedTransaction | Transaction, sendMsg: Function) : Promise<TransactionSignature | null> => {
    const connection = afx.web3Conn
    assert(connection)
    const signer: Signer = {
        publicKey: payer.publicKey,
        secretKey: payer.secretKey
    }
    
    if (tx instanceof VersionedTransaction) {
        tx.sign([signer]);
    } else {
        tx.recentBlockhash = (
            await connection.getLatestBlockhash()
          ).blockhash;
        tx.sign(signer);
    }
    sendMsg("⌛ Sending Transaction ...")
    const rawTransaction = tx.serialize();
    let delayDetector = new DelayDetector()

    while (true) {
        try {
            const txid = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: false,
                preflightCommitment: 'singleGossip',
                maxRetries: 2
            });
            let res = await connection.confirmTransaction(txid);
            if (res.value.err) {
                console.log(res.value.err)
                sendMsg(`❗ Failed to confirm transaction.
<code>${afx.get_chainscan_url('tx/' + txid)}</code>`);
                break;
            }
            sendMsg(`✅ Transaction has been confirmed.
<code>${afx.get_chainscan_url('tx/' + txid)}</code>`)
            return txid;
        } catch (error) {

            if (delayDetector.estimate(false) >= 2 * 60 * 1000) {

                sendMsg(`❗ Transaction has been timed out`)

                return null
            }

            await utils.sleep(1000);
        }
    }

    return null;
};
