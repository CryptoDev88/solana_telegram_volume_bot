import dotenv from 'dotenv'
dotenv.config()

import { ENV } from "@solana/spl-token-registry";
import { Connection, Keypair } from "@solana/web3.js";
import * as utils from './utils'

export const NOT_ASSIGNED = '- Not assigned -'

export const PAYMENT_ADDRESS = process.env.PAYMENT_ADDRESS

export const rankingEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

export const errorLog = (summary: string, error: any): void => {
    if (error?.response?.body?.description) {
        console.log('\x1b[31m%s\x1b[0m', `[error] ${summary} ${error.response.body.description}`);
    } else {
        console.log('\x1b[31m%s\x1b[0m', `[error] ${summary} ${error}`);
    }
};

export const parseError = (error: any): string => {
    let msg = '';
    try {
        error = JSON.parse(JSON.stringify(error));
        msg =
            error?.error?.reason ||
            error?.reason ||
            JSON.parse(error)?.error?.error?.response?.error?.message ||
            error?.response ||
            error?.message ||
            error;
    } catch (_error) {
        msg = error;
    }

    return msg;
};

export let FREE_TO_USE = Number(process.env.FREE_TO_USE)

export const TradingMonitorDuration = 24 * 60 * 60
export const Max_Sell_Count = 10
export const Swap_Fee_Percent = Number(process.env.BOT_FEE_PERCENT)
export const Default_Swap_Heap = 0.001

export const Mainnet = 'mainnet-beta'
export const Testnet = 'testnet'
export const Devnet = 'devnet'

export let web3Conn : Connection

export let quoteToken: any = {
	
    name: 'Taxable_Token',
    symbol: 'Taxable_Token',
    decimals: 9,
    address: "G4K78rjwcRRTZVjFZFYErzrpopYaDdg1tSkCsNxMdkXJ",
}

export let treasuryWallet: any

export const init = async () => {
}

export const setWeb3 = (conn: Connection) => {

	web3Conn = conn
}

export const getCluserApiType = () : string  => {

	switch (get_net_mode()) {
		case ENV.MainnetBeta: {

			return Mainnet;
		}

		case ENV.Testnet: {
			return Testnet;
		}

		case ENV.Devnet: {

			return Devnet
		}

		default: {

			return ''
		}
	}
}

export const get_bot_link = () => {

	return `https://t.me/${process.env.BOT_USERNAME}`
}

export const get_net_mode = () => {

	return Number(process.env.NET_MODE)
}

export const get_chainscan_url = (url: string): string => {

    let prefix = `https://solscan.io/${url}`;
    switch (get_net_mode()) {
        case ENV.MainnetBeta: {
            return prefix;
        }
        case ENV.Testnet: {
            return `${prefix}?cluster=testnet`;
        }
        case ENV.Devnet: {
            return `${prefix}?cluster=devnet`;
        }
    }

    return ''
};

export let start_volume_making : any
export let sell_volume_making : number = 30
export let boost_mode :  number = 6

export const setStart_VolumeMaking = (start: boolean) => {

	start_volume_making = start
}

export const setSell_VolumeMaking = (second: number) => {

	sell_volume_making = second
}

export const setBoostMode = (mode: number) => {

	boost_mode = mode
}

