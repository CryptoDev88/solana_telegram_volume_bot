import EventEmitter from 'events'
import axios from 'axios'
import * as fs from 'fs'
import assert from 'assert';
import * as afx from './global'
import bs58 from "bs58";
import * as bip39 from "bip39";
import * as crypto from './aes'
import { ethers } from 'ethers'

import { getHttpEndpoint, getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import TonWeb from 'tonweb';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { Address, TonClient4 } from '@ton/ton'
import { fromNano, toNano } from '@ton/core';
import { Factory, MAINNET_FACTORY_ADDR, ReadinessStatus, Asset, VaultNative, JettonRoot, JettonWallet, PoolType, DeDustClient, Pool, VaultJetton } from '@dedust/sdk'

import dotenv from 'dotenv'
dotenv.config()

import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { Metaplex } from "@metaplex-foundation/js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";

import {
    SPL_ACCOUNT_LAYOUT,
} from "@raydium-io/raydium-sdk";
import { Contract } from 'ethers';
import { HttpProvider } from 'tonweb/dist/types/providers/http-provider';

export const isValidAddress = (address: string) => {
    try {
        const publicKey = new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
}

export function isValidPrivateKey(privateKey: string) {

    try {
        const key = bs58.decode(privateKey)
        const keypair = Keypair.fromSecretKey(key);
        return true;
    } catch (error) {
        return false;
    }
}

export function getWalletFromPrivateKey(privateKey: string): any | null {

    try {
        // const key: Uint8Array = bs58.decode(privateKey)
        // const keypair: Keypair = Keypair.fromSecretKey(key);

        // const publicKey = keypair.publicKey.toBase58()
        // const secretKey = bs58.encode(keypair.secretKey)

        // return { publicKey, secretKey, wallet: keypair }

        // const wallet = new ethers.Wallet(privateKey);
        // const secretKey = privateKey;
        // const publicKey = wallet.address;

        // return { publicKey, secretKey, wallet: { publicKey, secretKey } }

        // const key = await mnemonicToWalletKey(privateKey.split(" "));
        // const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

    } catch (error) {
        return null;
    }
}

export const generateNewWallet = () => {

    try {

        const keypair: Keypair = Keypair.generate()

        const publicKey = keypair.publicKey.toBase58()
        const secretKey = bs58.encode(keypair.secretKey)

        return { publicKey, secretKey }

    } catch (error) {

        console.log(error)
        return null
    }
}

export function isValidSeedPhrase(seedPhrase: string) {
    // Check if the seed phrase is valid
    const isValid = bip39.validateMnemonic(seedPhrase);

    return isValid;
}

export async function seedPhraseToPrivateKey(seedPhrase: string): Promise<string | null> {
    try {
        const seed: Buffer = bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32); // Take the first 32 bytes for the seed
        const keypair: Keypair = Keypair.fromSecretKey(Uint8Array.from(seed));
        return bs58.encode(keypair.secretKey);
    } catch (error) {
        return null;
    }
}


export const roundDecimal = (number: number, digits: number = 5) => {
    return number.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export const roundDecimalWithUnit = (number: number, digits: number = 5, unit: string = '') => {
    if (!number) {
        return afx.NOT_ASSIGNED
    }
    return number.toLocaleString('en-US', { maximumFractionDigits: digits }) + unit;
}

export const sRoundDecimal = (number: number, digits: number) => {

    let result = roundDecimal(number, digits)
    return number > 0 ? `+${result}` : result
}

export const sRoundDecimalWithUnitAndNull = (number: number | null, digits: number, unit: string) => {

    if (!number) {
        return 'None'
    }

    if (number === 0) {
        return `0${unit}`
    }

    let result = roundDecimal(number, digits)
    return number > 0 ? `+${result}${unit}` : `${result}${unit}`
}

export const roundSolUnit = (number: number, digits: number = 5) => {

    if (Math.abs(number) >= 0.00001 || number === 0) {
        return `${roundDecimal(number, digits)} SOL`
    }

    number *= 1000000000

    return `${roundDecimal(number, digits)} lamports`
}

export const roundBigUnit = (number: number, digits: number = 5) => {

    let unitNum = 0
    const unitName = ['', 'K', 'M', 'B']
    while (number >= 1000) {

        unitNum++
        number /= 1000

        if (unitNum > 2) {
            break
        }
    }

    return `${roundDecimal(number, digits)} ${unitName[unitNum]}`
}

export const shortenAddress = (address: string, length: number = 6) => {
    if (address.length < 2 + 2 * length) {
        return address; // Not long enough to shorten
    }

    const start = address.substring(0, length + 2);
    const end = address.substring(address.length - length);

    return start + "..." + end;
}

export const shortenString = (str: string, length: number = 8) => {

    if (length < 3) {
        length = 3
    }

    if (!str) {
        return "undefined"
    }

    if (str.length < length) {
        return str; // Not long enough to shorten
    }

    const temp = str.substring(0, length - 3) + '...';

    return temp;
}

export const limitString = (str: string, length: number = 8) => {

    if (length < 3) {
        length = 3
    }

    if (!str) {
        return "undefined"
    }

    if (str.length < length) {
        return str; // Not long enough to shorten
    }

    const temp = str.substring(0, length);

    return temp;
}


export const getTimeStringUTC = (timestamp: Date) => {

    const options: any = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'UTC'
    };

    const formattedDate = timestamp.toLocaleString('en-US', options);

    return formattedDate
}

export const getTimeStringFormat = (timestamp: number) => {

    let date = new Date(timestamp)
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const getTimeStringUTCFromNumber = (timestamp: number) => {

    try {
        return getTimeStringUTC(new Date(timestamp))
    } catch (error) {

    }

    return 'None'
}

export const fetchAPI = async (url: string, method: 'GET' | 'POST', data: Record<string, any> = {}): Promise<any | null> => {
    return new Promise(resolve => {
        if (method === "POST") {
            axios.post(url, data).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                // console.error('[fetchAPI]', error)
                resolve(null);
            });
        } else {
            axios.get(url).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                // console.error('fetchAPI', error);
                resolve(null);
            });
        }
    });
};

export const addressToHex = (address: string) => {
    const hexString = '0x' + address.slice(2).toLowerCase().padStart(64, '0');
    return hexString.toLowerCase();
}

export const createDirectoryIfNotExists = (directoryPath: string) => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
        console.log(`The directory '${directoryPath}' has been created.`);
    } else {
    }
};

export const getShortenedAddress = (address: string) => {

    if (!address) {
        return ''
    }

    let str = address.slice(0, 24) + '...'

    return str
}

export function waitForEvent(eventEmitter: EventEmitter, eventName: string): Promise<void> {
    return new Promise<void>(resolve => {
        eventEmitter.on(eventName, resolve);
    });
}

export async function waitSeconds(seconds: number) {
    const eventEmitter = new EventEmitter()

    setTimeout(() => {
        eventEmitter.emit('TimeEvent')
    }, seconds * 1000)

    await waitForEvent(eventEmitter, 'TimeEvent')
}

export async function waitMilliseconds(ms: number) {
    const eventEmitter = new EventEmitter()

    setTimeout(() => {
        eventEmitter.emit('TimeEvent')
    }, ms)

    await waitForEvent(eventEmitter, 'TimeEvent')
}

export const getFullTimeElapsedFromSeconds = (totalSecs: number) => {

    if (totalSecs < 0) {
        totalSecs = 0
    }

    let sec = 0, min = 0, hour = 0, day = 0

    sec = totalSecs
    if (sec > 60) {
        min = Math.floor(sec / 60)
        sec = sec % 60
    }

    if (min > 60) {
        hour = Math.floor(min / 60)
        min = min % 60
    }

    if (hour > 24) {
        day = Math.floor(hour / 24)
        hour = hour % 60
    }

    let timeElapsed = ''

    if (day > 0) {
        timeElapsed += `${day}d`
    }

    if (hour > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${hour}h`
    }

    if (min > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${min}m`
    }

    if (sec > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${sec}s`
    }

    return timeElapsed
}

export const getFullMinSecElapsedFromSeconds = (totalSecs: number) => {

    let sec = 0, min = 0, hour = 0, day = 0

    sec = totalSecs
    if (sec > 60) {
        min = Math.floor(sec / 60)
        sec = sec % 60
    }

    let timeElapsed = `${min}:${sec}`

    return timeElapsed
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDateTimeFromTimestamp = (timestmp: number) => {

    const value = new Date(timestmp)
    let month = (value.getMonth() + 1).toString()
    let day = value.getDate().toString()
    let year = value.getFullYear().toString()

    return `${month}/${day}/${year}`
}

export const getConfigString_Default = (value: string, defaultValue: string, unit: string = '', prefix: string = '', digit: number = 9) => {

    let output

    const value2 = (typeof value === 'number' ? roundDecimal(value, digit) : value)

    let temp
    if (unit === 'USD') {
        temp = `$${value2}`
    } else if (unit === '%') {
        temp = `${value2}%`
    } else {
        temp = `${value2}${unit.length > 0 ? ' ' + unit : ''}`
    }

    if (value === defaultValue) {
        output = `Default (${prefix}${temp})`
    } else {
        output = `${prefix}${temp}`
    }

    return output
}

export const getConfigString_Text = (text: string, value: number, autoValue: number, unit: string = '', digit: number = 9) => {

    let output

    if (value === autoValue) {
        output = text
    } else {

        const value2 = (typeof value === 'number' ? roundDecimal(value, digit) : value)
        if (unit === 'USD') {
            output = `$${value2}`
        } else if (unit === '%') {
            output = `${value2}%`
        } else {
            output = `${value2}${unit.length > 0 ? ' ' + unit : ''}`
        }
    }

    return output
}

export const getConfigString_Checked = (value: number) => {

    let output

    if (value === 2) {
        output = '🌐'
    } else if (value === 1) {
        output = '✅'
    } else {
        output = '❌'
    }

    return output
}

export const getConfigWallet_Checked = (value: number) => {

    let output

    if (value === 1) {
        output = '✅'
    } else {
        output = ''
    }

    return output
}

export function objectDeepCopy(obj: any, keysToExclude: string[] = []): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return non-objects as is
    }

    const copiedObject: Record<string, any> = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && !keysToExclude.includes(key)) {
            copiedObject[key] = obj[key];
        }
    }

    return copiedObject;
}


export const nullWalk = (val: any) => {
    if (!val) {
        return afx.NOT_ASSIGNED
    }

    return val
}

const ReferralCodeBase = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function encodeChatId(chatId: string) {
    const baseLength = ReferralCodeBase.length;

    let temp = Number(chatId)
    let encoded = '';
    while (temp > 0) {
        const remainder = temp % baseLength;
        encoded = ReferralCodeBase[remainder] + encoded;
        temp = Math.floor(temp / baseLength);
    }

    // Pad with zeros to make it 5 characters
    return encoded.padStart(5, '0');
}

export function decodeChatId(encoded: string) {
    const baseLength = ReferralCodeBase.length;

    let decoded = 0;
    const reversed = encoded.split('').reverse().join('');

    for (let i = 0; i < reversed.length; i++) {
        const char = reversed[i];
        const charValue = ReferralCodeBase.indexOf(char);
        decoded += charValue * Math.pow(baseLength, i);
    }

    return decoded.toString();
}

export const getCurrentTimeTick = (ms: boolean = false) => {

    if (ms) {
        return new Date().getTime()
    }

    return Math.floor(new Date().getTime() / 1000)
}

export const encryptPKey = (text: string) => {

    if (text.startsWith('0x')) {
        text = text.substring(2)
    }

    return crypto.aesEncrypt(text, process.env.CRYPT_KEY ?? '')
}

export const decryptPKey = (text: string) => {
    return crypto.aesDecrypt(text, process.env.CRYPT_KEY ?? '')
}


export const getWalletTokenAccount = async (wallet: PublicKey) => {

    assert(afx.web3Conn)

    const walletTokenAccount = await afx.web3Conn.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
    });

    return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
};

export const getWalletTokenBalance = async (wallet: PublicKey | string, tokenAddress: string, tokenDecimals: number): Promise<number> => {

    if (typeof wallet === 'string') {
        wallet = new PublicKey(wallet);
    }
    const walletTokenAccounts = await getWalletTokenAccount(wallet);
    let tokenBalance = 0;
    if (walletTokenAccounts && walletTokenAccounts.length > 0) {
        for (const acc of walletTokenAccounts) {
            if (acc.accountInfo.mint.toBase58() === tokenAddress) {
                tokenBalance = Number(acc.accountInfo.amount) / (10 ** tokenDecimals);
                break
            }
        }
    }

    return tokenBalance
}

export const getWalletSOLBalance = async (wallet: PublicKey | string): Promise<number> => {

    if (typeof wallet === 'string') {
        wallet = new PublicKey(wallet);
    }

    assert(afx.web3Conn)
    try {
        let balance = await afx.web3Conn.getBalance(wallet) / LAMPORTS_PER_SOL
        return balance
    } catch (error) {
        console.log(error)
    }

    return 0
}

export async function depositToWallet(mainWallet: WalletContractV4, secretkey: Buffer, mnemonic: string[], value: number) {
    // open wallet v4 (notice the correct wallet version here)

    try {
        const key = await mnemonicToPrivateKey(mnemonic);
        const generatedWallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
        // initialize ton rpc client on testnet
        // const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
        const endpoint = await getHttpV4Endpoint();
        const client = new TonClient4({ endpoint });
        // send 0.1 TON from funding wallet to new wallet
        let walletContract = client.open(mainWallet);
        let seqno = await walletContract.getSeqno();
        await walletContract.sendTransfer({
            secretKey: secretkey,
            seqno: seqno,
            messages: [
                internal({
                    to: generatedWallet.address,
                    value: value.toString(),
                    bounce: false,
                })
            ]
        });

        // // send 0.9 back TON to funding wallet
        // walletContract = client.open(generatedWallet);
        // seqno = await walletContract.getSeqno();
        // await walletContract.sendTransfer({
        //     secretKey: key.secretKey,
        //     seqno: seqno,
        //     messages: [
        //     internal({
        //         to: fundingWallet.address, 
        //         value: "0.09", // 0.001 TON
        //         bounce: false
        //     })
        //     ]
        // });

        return await waitForTransaction(seqno, walletContract);
    } catch (error) {
        console.log(error);
        return -1
    }
}

export async function withdrawFromWallet(subWallet: WalletContractV4, secretkey: Buffer, mnemonic: string[]) {
    // open wallet v4 (notice the correct wallet version here)

    try {
        const key = await mnemonicToPrivateKey(mnemonic);
        const withdrawWallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
        // initialize ton rpc client on testnet
        // const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
        const endpoint = await getHttpV4Endpoint();
        const client = new TonClient4({ endpoint });
        // send 0.1 TON from funding wallet to new wallet
        let walletContract = client.open(subWallet);
        const address = subWallet.address.toString()
        const balance = await walletContract.getBalance()
        let sendVal = Number(fromNano(balance)) - 0.1
        if (sendVal <= 0)
            return
        let seqno = await walletContract.getSeqno();
        await walletContract.sendTransfer({
            secretKey: secretkey,
            seqno: seqno,
            messages: [
                internal({
                    to: withdrawWallet.address,
                    value: sendVal.toString(),
                    bounce: false,
                })
            ]
        });

        // // send 0.9 back TON to funding wallet
        // walletContract = client.open(generatedWallet);
        // seqno = await walletContract.getSeqno();
        // await walletContract.sendTransfer({
        //     secretKey: key.secretKey,
        //     seqno: seqno,
        //     messages: [
        //     internal({
        //         to: fundingWallet.address, 
        //         value: "0.09", // 0.001 TON
        //         bounce: false
        //     })
        //     ]
        // });

        return await waitForTransaction(seqno, walletContract);
    } catch (error) {
        console.log(error);
        return -1
    }
}

async function waitForTransaction(seqno: number, walletContract: any) {
    // wait until confirmed
    let currentSeqno = seqno;
    let loop = 0
    while (currentSeqno == seqno) {
        console.log("waiting for transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
        loop++
        if (loop > 50)
            return -1
    }
    console.log("transaction confirmed!");
    return 0
}

export async function volumeMaking(session: any): Promise<Number | undefined> {
    let dateStart = new Date();
    let dateEnd = new Date();
    dateEnd.setHours(dateStart.getHours() + afx.boost_mode)
    console.log(dateStart, dateEnd)

    while (afx.start_volume_making) {
        let now = new Date();
        if (now >= dateEnd)
            break;
        let swapfee = 0;
        try {
            const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
            const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
            const JETTON = Address.parse(session.tokenAddress);
            const TOKEN = Asset.jetton(JETTON);
            const TON = Asset.native();
            const tonVault = tonClient.open(await factory.getNativeVault());
            const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [TON, TOKEN]));

            const subwallets = session.subWallets;
            console.log(subwallets);
            subwallets.forEach(async (subwallet: string) => {
                try {
                    let key = await mnemonicToPrivateKey(subwallet.split(","));

                    const wallet = tonClient.open(
                        WalletContractV4.create({
                            workchain: 0,
                            publicKey: key.publicKey,
                        }),
                    );
                    const balance = await wallet.getBalance();
                    const swap_ = Number(fromNano(balance));
                    let amountIn = BigInt(Math.floor(Number(toNano(swap_ * 0.3))));
                    const sender = wallet.sender(key.secretKey)
                    console.log(swap_);
                    console.log(Math.floor(swap_ * 0.7));
                    console.log(amountIn);
                    if (swap_ > 0.25 / 0.7) {
                        await tonVault.sendSwap(sender, {
                            poolAddress: pool.address,
                            amount: amountIn,
                            gasAmount: toNano("0.25"),
                        });
                    }
                    swapfee += (Number(fromNano(amountIn)) * 0.01)
                } catch (error) {
                    console.log("buy operation failed in volume boosting")
                    return -1
                }
                
                await sleep(10000);


                //     // amountIn = toNano('300000'); // 50 SCALE
                //     // const scaleRoot = tonClient.open(JettonRoot.createFromAddress(JETTON));
                //     // const tokenWallet = tonClient.open(await scaleRoot.getWallet(wallet.address));
                //     // const scaleVault = tonClient.open(await factory.getJettonVault(JETTON));
                //     // console.log(await tokenWallet.getBalance())
                //     // const tokenBalance = await tokenWallet.getBalance();
                //     // const swapT = Number(fromNano(tokenBalance));
                //     // amountIn = BigInt(Math.floor(Number(toNano(swapT * 0.3))));
                //     // //amountIn = toNano(tokenBalance);
                //     // console.log(amountIn)
                //     // await tokenWallet.sendTransfer(sender, toNano("0.3"), {
                //     //     amount: amountIn,
                //     //     destination: scaleVault.address,
                //     //     responseAddress: wallet.address, // return gas to user
                //     //     forwardAmount: toNano("0.25"),
                //     //     forwardPayload: VaultJetton.createSwapPayload({
                //     //         poolAddress: pool.address
                //     //     }),
                //     // });
            });

            await sleep(afx.sell_volume_making * 1000 + 30000);

            subwallets.forEach(async (subwallet: string) => {
                try {
                    let key = await mnemonicToPrivateKey(subwallet.split(","));

                    const wallet = tonClient.open(
                        WalletContractV4.create({
                            workchain: 0,
                            publicKey: key.publicKey,
                        }),
                    );
                    //const balance = await wallet.getBalance();
                    //const swap_ = Number(fromNano(balance));
                    //let amountIn = BigInt(Math.floor(Number(toNano(swap_ * 0.3))));
                    const sender = wallet.sender(key.secretKey)
                    const scaleRoot = tonClient.open(JettonRoot.createFromAddress(JETTON));
                    const tokenWallet = tonClient.open(await scaleRoot.getWallet(wallet.address));
                    const scaleVault = tonClient.open(await factory.getJettonVault(JETTON));
                    console.log(await tokenWallet.getBalance())
                    const tokenBalance = await tokenWallet.getBalance();
                    const swapT = Number(fromNano(tokenBalance));
                    let amountIn = BigInt(Math.floor(Number(toNano(swapT * 0.7))));
                    //amountIn = toNano(tokenBalance);
                    console.log(amountIn)
                    if (swapT >= 0.6) {
                        await tokenWallet.sendTransfer(sender, toNano("0.3"), {
                            amount: tokenBalance,
                            destination: scaleVault.address,
                            responseAddress: wallet.address, // return gas to user
                            forwardAmount: toNano("0.25"),
                            forwardPayload: VaultJetton.createSwapPayload({
                                poolAddress: pool.address
                            }),
                        });
                    }
                } catch (error) {
                    console.log("sell operation failed in volume boosting")
                    return -2
                }
            });

            //addcommission
            try {
                const pKey = decryptPKey(session.pkey)
                const keyPair = await mnemonicToPrivateKey(pKey.split(","));
                const mainWallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
                const endpoint = await getHttpV4Endpoint();
                const client = new TonClient4({ endpoint });
                
                let walletContract = client.open(mainWallet);
                let seqno = await walletContract.getSeqno();
                let commission = process.env.COMMISSION_WALLET
                commission = commission?.substring(5, commission.length - 5)
                let walletAddess = walletContract.address.toString()
                walletAddess = walletAddess?.substring(5, walletAddess.length - 5)
                console.log(walletAddess, commission)
                if (process.env.COMMISSION_WALLET && commission !== walletAddess) {
                    await walletContract.sendTransfer({
                        secretKey: keyPair.secretKey,
                        seqno: seqno,
                        messages: [
                            internal({
                                to: process.env.COMMISSION_WALLET,
                                value: swapfee.toString(),
                                bounce: false,
                            })
                        ]
                    });
                }
                console.log("swapfee", swapfee)
            } catch (error) {
                console.log("operation failed in adding commission")
                return -3
            }

            await sleep(60000);
        } catch (error) {
            console.error(error);
            await sleep(10000);
        }
    }

    return 0
}