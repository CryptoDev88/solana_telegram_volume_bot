import assert from 'assert';
import dotenv from 'dotenv'
import * as utils from './utils'
import * as uniconst from './uniconst'
import * as afx from './global'
import { DelayDetector } from "./delay_detector"
import { sendMessage, executeCommand, OptionCode } from "./bot"
dotenv.config()

import * as swapBot from './swap'
import { PublicKey } from '@metaplex-foundation/js';
import { ComputeBudgetProgram, Keypair, SystemProgram } from '@solana/web3.js';

export const transferSOL = async (database: any, session: any, destWallet: string, amount: number) => {

    await swapBot.transferSOL(session, destWallet, amount, async (msg: string) => {

        await sendMessage(session.chatid, msg)

    }, async (swapResult: any) => {

        await database.addTrxHistory({
            chatid: session.chatid,
            solAmount: swapResult.solAmount,
            mode: swapResult.mode,
            trxId: swapResult.trxId,
        })
    })
}

export const transferToken = async (database: any, session: any, destWallet: string, tokenAddress: string, amount: number) => {

    await swapBot.transferToken(session, destWallet, tokenAddress, amount, async (msg: string) => {

        await sendMessage(session.chatid, msg)

    }, async (swapResult: any) => {

        await database.addTrxHistory({
            chatid: session.chatid,
            tokenAmount: swapResult.tokenAmount,
            mode: swapResult.mode,
            trxId: swapResult.trxId,
        })
    })
}