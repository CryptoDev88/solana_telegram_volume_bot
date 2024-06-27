import dotenv from 'dotenv'
dotenv.config()

import * as database from './db'
import * as privateBot from './bot_private'
import * as afx from './global'
import * as utils from './utils'
import axios from 'axios'

import TelegramBot from 'node-telegram-bot-api'
import { mnemonicToPrivateKey } from "@ton/crypto";
import { fromNano, WalletContractV4 } from "@ton/ton";
import { getHttpEndpoint, getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address, TonClient4 } from '@ton/ton'

export const COMMAND_START = 'start'

export enum OptionCode {
	BACK = -100,
	CLOSE,
	TITLE,
	WELCOME = 0,
	MAIN_MENU,
	GENERATE_WALLETS,
	GENERATE_WALLETS_CONFIRM,
	DEPOSIT_TONS,
	DEPOSIT_TONS_CONFIRM,
	WITHDRAW_TONS,
	WITHDRAW_TONS_CONFIRM,
	WALLET_INFO,
	START_VOLUMEMAKING,
	STOP_VOLUMEMAKING,
	SELL_VOLUMEMAKING,
	SELL_VOLUMEMAKING_CONFIRM,
	BOOST_6H,
	BOOST_12H,
	BOOST_24H,
	MAIN_MYGAMES,
	MAIN_GAMES,
	MAIN_HELP,
	MAIN_WALLET,
	MAIN_REFERRAL,
	MAIN_REFRESH,
	MAIN_WALLET_SIGN,
	WALLET_DEPOSIT_SOL,
	WALLET_DEPOSIT_TOKEN,
	WALLET_WITHDRAW_ALL,
	WALLET_WITHDRAW_X_SOL,
	WALLET_WITHDRAW_X_TOKEN,
	WALLET_WITHDRAW_CONFIRM,
	WALLET_RESET_WALLET,
	WALLET_EXPORT_KEY,
	WALLET_REFRESH,
	WALLET_RESET_WALLET_CONFIRM,
	WALLET_IMPORT_KEY,
	WALLET_IMPORT_KEY_CONFIRM,
	WALLET_EXPORT_KEY_CONFIRM,
	TOKEN_IMPORT_ADDRESS,
	TOKEN_IMPORT_ADDRESS_CONFIRM,

	GAME_CREATE,
	GAME_DETAIL,
	GAME_BETTING_UP,
	GAME_BETTING_DOWN,
	GAME_PREV,
	GAME_NEXT,
	GAME_NEW_CONFIRM,
	MONITOR_DEPOSIT,
}

export enum StateCode {
	IDLE = 1000,
	WAIT_SET_WALLET_WITHDRAW_ADDRESS,
	WAIT_SET_WALLET_WITHDRAW_AMOUNT,
	WAIT_SET_NEW_GAME_DESC,
	WAIT_SET_TOKEN_DECIMAL,
	OPENBOOK_SET_QUOTE_ADDRESS,
	WAIT_SET_NEW_TOKEN_METADATA_URL,
	OPENBOOK_SET_MINIMUM_ORDER_SIZE,
	WAIT_SET_NEW_TOTAL_SUPPLY,
	OPENBOOK_SET_MINIMUM_PRICE_TICKET_SIZE,
	WAIT_SET_NEW_TOKEN_CONFIRM,
	WAIT_SET_WALLET_DEPOSIT_PAYER_ADDRESS,
	WAIT_SET_WALLET_DEPOSIT_X_AMOUNT,
	WAIT_SET_WALLET_IMPORT_PKEY,
	WAIT_SET_TOKEN_ADDRESS,
	WAIT_SET_TOKEN_IMPORT,
	WAIT_DEPOSIT_TON,
	WAIT_GENERATE_WALLET,
	WAIT_START_VOLUMEMAKING,
	WAIT_STOP_VOLUMEMAKING,
	WAIT_SELL_VOLUMEMAKING
}

export let bot: TelegramBot
export let myInfo: TelegramBot.User
export const sessions = new Map()
export const stateMap = new Map()

export const stateMap_setFocus = (chatid: string, state: any, data: any = {}) => {

	let item = stateMap.get(chatid)
	if (!item) {
		item = stateMap_init(chatid)
	}

	if (!data) {
		let focusData = {}
		if (item.focus && item.focus.data) {
			focusData = item.focus.data
		}

		item.focus = { state, data: focusData }
	} else {
		item.focus = { state, data }
	}

	stateMap.set(chatid, item)
}

export const stateMap_getFocus = (chatid: string) => {
	const item = stateMap.get(chatid)
	if (item) {
		let focusItem = item.focus
		return focusItem
	}

	return null
}

export const stateMap_init = (chatid: string) => {

	let item = {
		focus: { state: StateCode.IDLE, data: { sessionId: chatid } },
		message: new Map()
	}

	stateMap.set(chatid, item)

	return item
}

export const stateMap_setMessage_Id = (chatid: string, messageType: number, messageId: number) => {

	let item = stateMap.get(chatid)
	if (!item) {
		item = stateMap_init(chatid)
	}

	item.message.set(`t${messageType}`, messageId)
	//stateMap.set(chatid, item)
}

export const stateMap_getMessage = (chatid: string) => {
	const item = stateMap.get(chatid)
	if (item) {
		let messageItem = item.message
		return messageItem
	}

	return null
}

export const stateMap_getMessage_Id = (chatid: string, messageType: number) => {
	const messageItem = stateMap_getMessage(chatid)
	if (messageItem) {

		return messageItem.get(`t${messageType}`)
	}

	return null
}

export const stateMap_get = (chatid: string) => {
	return stateMap.get(chatid)
}

export const stateMap_remove = (chatid: string) => {
	stateMap.delete(chatid)
}

export const stateMap_clear = () => {
	stateMap.clear()
}

const json_buttonItem = (key: string, cmd: number, text: string) => {
	return {
		text: text,
		callback_data: JSON.stringify({ k: key, c: cmd }),
	}
}

const json_url_buttonItem = (text: string, url: string) => {
	return {
		text: text,
		url: url,
	}
}

const json_webapp_buttonItem = (text: string, url: any) => {
	return {
		text: text,
		web_app: {
			url
		}
	}
}

export const removeMenu = async (chatId: string, messageType: number) => {

	const msgId = stateMap_getMessage_Id(chatId, messageType)

	if (msgId) {

		try {

			await bot.deleteMessage(chatId, msgId)

		} catch (error) {
			//afx.errorLog('deleteMessage', error)
		}
	}
}

export const openMenu = async (chatId: string, messageType: number, menuTitle: string, json_buttons: any = []) => {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	return new Promise(async (resolve, reject) => {

		await removeMenu(chatId, messageType)

		try {

			let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, { reply_markup: keyboard, parse_mode: 'HTML', disable_web_page_preview: true });

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

export const openMessage = async (chatId: string, bannerId: string, messageType: number, menuTitle: string) => {

	return new Promise(async (resolve, reject) => {

		await removeMenu(chatId, messageType)

		let msg: TelegramBot.Message

		try {

			if (bannerId) {

				msg = await bot.sendPhoto(chatId, bannerId, { caption: menuTitle, parse_mode: 'HTML' });

			} else {

				msg = await bot.sendMessage(chatId, menuTitle, { parse_mode: 'HTML', disable_web_page_preview: true });
			}

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

async function switchMenu(chatId: string, messageId: number, title: string, json_buttons: any) {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	try {

		await bot.editMessageText(title, { chat_id: chatId, message_id: messageId, reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' })

	} catch (error) {
		afx.errorLog('[switchMenuWithTitle]', error)
	}
}


export const replaceMenu = async (chatId: string, messageId: number, messageType: number, menuTitle: string, json_buttons: any = []) => {

	const keyboard = {
		inline_keyboard: json_buttons,
		resize_keyboard: true,
		one_time_keyboard: true,
		force_reply: true
	};

	return new Promise(async (resolve, reject) => {

		try {

			await bot.deleteMessage(chatId, messageId)

		} catch (error) {
			//afx.errorLog('deleteMessage', error)
		}

		await removeMenu(chatId, messageType)

		try {

			let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, { reply_markup: keyboard, parse_mode: 'HTML', disable_web_page_preview: true });

			stateMap_setMessage_Id(chatId, messageType, msg.message_id)
			// console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
			resolve({ messageId: msg.message_id, chatid: msg.chat.id })

		} catch (error) {
			afx.errorLog('openMenu', error)
			resolve(null)
		}
	})
}

export const get_menuTitle = (sessionId: string, subTitle: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return 'ERROR ' + sessionId
	}

	let result = session.type === 'private' ? `@${session.username}'s configuration setup` : `@${session.username} group's configuration setup`

	if (subTitle && subTitle !== '') {

		//subTitle = subTitle.replace('%username%', `@${session.username}`)
		result += `\n${subTitle}`
	}

	return result
}

export const removeMessage = async (sessionId: string, messageId: number) => {

	if (sessionId && messageId) {
		try {
			await bot.deleteMessage(sessionId, messageId)
		} catch (error) {
			//console.error(error)
		}
	}
}

export const sendReplyMessage = async (chatid: string, message: string) => {
	try {

		let data: any = { parse_mode: 'HTML', disable_forward: true, disable_web_page_preview: true, reply_markup: { force_reply: true } }

		const msg = await bot.sendMessage(chatid, message, data)
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error) {

		afx.errorLog('sendReplyMessage', error)
		return null
	}
}

export const sendMessage = async (chatid: string, message: string, info: any = {}) => {
	try {

		let data: any = { parse_mode: 'HTML' }

		data.disable_web_page_preview = true
		data.disable_forward = true

		if (info && info.message_thread_id) {
			data.message_thread_id = info.message_thread_id
		}

		const msg = await bot.sendMessage(chatid, message, data)
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error: any) {

		if (error.response && error.response.body && error.response.body.error_code === 403) {
			info.blocked = true;
			if (error?.response?.body?.description == 'Forbidden: bot was blocked by the user') {
				database.removeUser({ chatid });
				sessions.delete(chatid);
			}
		}

		console.log(error?.response?.body)
		afx.errorLog('sendMessage', error)
		return null
	}
}

export const sendInfoMessage = async (chatid: string, message: string) => {

	let json = [
		[
			json_buttonItem(chatid, OptionCode.CLOSE, '✖️ Close')
		],
	]

	return sendOptionMessage(chatid, message, json)
}

export const sendOptionMessage = async (chatid: string, message: string, option: any) => {
	try {

		const keyboard = {
			inline_keyboard: option,
			resize_keyboard: true,
			one_time_keyboard: true,
		};

		const msg = await bot.sendMessage(chatid, message, { reply_markup: keyboard, disable_web_page_preview: true, parse_mode: 'HTML' });
		return { messageId: msg.message_id, chatid: msg.chat ? msg.chat.id : null }

	} catch (error) {
		afx.errorLog('sendOptionMessage', error)

		return null
	}
}

export const pinMessage = (chatid: string, messageId: number) => {
	try {

		bot.pinChatMessage(chatid, messageId)
	} catch (error) {
		console.error(error)
	}
}

export const checkWhitelist = (chatid: string) => {
	return true
}

export const getMainMenuMessage = async (sessionId: string): Promise<string> => {

	const session = sessions.get(sessionId)
	if (!session) {
		return ''
	}

	// You currently have <code>${utils.roundDecimal(session.solCredit, 8)} SOL</code>, <code>${utils.roundDecimal(session.tokenCredit, 8)} ${afx.quoteToken.symbol}</code> balance.To get started with betting, make deposit some SOL or ${afx.quoteToken.symbol} on Credit Menu

	console.log(session.wallet);
	const MESSAGE = `Welcome to ${process.env.BOT_TITLE}.

To get started, input your wallet and your token.

Your wallet address:<code>${session.wallet}</code> (tap to copy)
Your Token address:<code>${session.tokenAddress}</code> (tap to copy)
Your Pool address:<code>${session.poolAddress}</code> (tap to copy)`

	return MESSAGE;
}

export const json_main = (sessionId: string) => {

	const itemData = `${sessionId}:1`
	const json = [
		[
			json_buttonItem(itemData, OptionCode.TITLE, `🎖️ ${process.env.BOT_TITLE}`),
		],
		[
			json_buttonItem(itemData, OptionCode.WALLET_IMPORT_KEY, '💳 Wallet'),
		],
		[
			json_buttonItem(itemData, OptionCode.TOKEN_IMPORT_ADDRESS, '💳 Token:Pool'),
		],
		[
			json_buttonItem(itemData, OptionCode.GENERATE_WALLETS, '⏳ Generate Wallets'),
			json_buttonItem(itemData, OptionCode.WALLET_INFO, '💸 Wallet Info'),
		],
		[
			json_buttonItem(itemData, OptionCode.DEPOSIT_TONS, '🔀 Deposit'),
			json_buttonItem(itemData, OptionCode.WITHDRAW_TONS, '💰 Withdraw')
		],
		[
			afx.boost_mode == 6? json_buttonItem(itemData, OptionCode.BOOST_6H, '🟢 6h Boost') : json_buttonItem(itemData, OptionCode.BOOST_6H, '6h Boost'),
			afx.boost_mode == 12? json_buttonItem(itemData, OptionCode.BOOST_12H, '🟢 12h Boost') : json_buttonItem(itemData, OptionCode.BOOST_12H, '12h Boost'),
			afx.boost_mode == 24? json_buttonItem(itemData, OptionCode.BOOST_24H, '🟢 24h Boost') : json_buttonItem(itemData, OptionCode.BOOST_24H, '24h Boost')
		],
		[
			json_buttonItem(itemData, OptionCode.SELL_VOLUMEMAKING, '⚙️ Sell Operation')
		],
		[
			json_buttonItem(itemData, OptionCode.START_VOLUMEMAKING, '🟢 Start VolumeMaking'),
			json_buttonItem(itemData, OptionCode.STOP_VOLUMEMAKING, '🔴 Stop VolumeMaking')
		],
	]

	return { title: '', options: json };
}

export const json_wallet = async (sessionId: string) => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	let balance = await utils.roundDecimal(session.solCredit, 8)
	let tokenBalance = await utils.roundDecimal(session.tokenCredit, 8)

	let walletSolBalance = await utils.roundDecimal(await utils.getWalletSOLBalance(session.wallet), 8)
	let walletTokenBalance = await utils.roundDecimal(await utils.getWalletTokenBalance(session.wallet, afx.quoteToken.address, afx.quoteToken.decimals), 8)

	const title = `⬇️ Your credits:

SOL Credit: <code>${balance} SOL</code>
Token Credit: <code>${tokenBalance} ${afx.quoteToken.symbol}</code>

⬇️ Your wallet:

Address: <code>${session.wallet}</code>
SOL Balance: <code>${walletSolBalance} SOL</code>
Token Balance: <code>${walletTokenBalance} ${afx.quoteToken.symbol}</code>

Tap to copy the wallet address and send SOL and/or ${afx.quoteToken.symbol} to make your deposit.`

	const itemData = sessionId
	let json = [
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close')
		],
		// [
		// 	json_buttonItem(itemData, OptionCode.WALLET_DEPOSIT_SOL, `Deposit SOL`),
		// 	json_buttonItem(itemData, OptionCode.WALLET_DEPOSIT_TOKEN, `Deposit ${afx.quoteToken.symbol}`),
		// ],
		// [
		// 	json_buttonItem(itemData, OptionCode.WALLET_WITHDRAW_X_SOL, 'Withdraw X SOL'),
		// 	json_buttonItem(itemData, OptionCode.WALLET_WITHDRAW_X_TOKEN, `Withdraw X ${afx.quoteToken.symbol}`),
		// ],
		// [
		// 	json_buttonItem(itemData, OptionCode.WALLET_RESET_WALLET, 'Reset Wallet'),
		// 	json_buttonItem(itemData, OptionCode.WALLET_IMPORT_KEY, 'Import Wallet'),
		// ],
		// [
		// 	json_buttonItem(itemData, OptionCode.WALLET_EXPORT_KEY, 'Export Private Key'),
		// ],
		[
			json_buttonItem(itemData, OptionCode.WALLET_REFRESH, 'Refresh'),
		],

	]
	return { title: title, options: json };
}

export const json_confirm = async (sessionId: string, msg: string, btnCaption: string, btnId: number, itemData: string = '') => {

	const session = sessions.get(sessionId)
	if (!session) {
		return null
	}

	const title = msg

	let json = [
		[
			json_buttonItem(sessionId, OptionCode.CLOSE, '✖️ Close'),
			json_buttonItem(itemData, btnId, btnCaption)
		],

	]
	return { title: title, options: json };
}

export const openConfirmMenu = async (sessionId: string, msg: string, btnCaption: string, btnId: number, itemData: string = '') => {
	const menu: any = await json_confirm(sessionId, msg, btnCaption, btnId, itemData)
	if (menu) {
		await openMenu(sessionId, btnId, menu.title, menu.options)
	}
}

export const createSession = async (chatid: string, username: string, type: string) => {

	let session: any = {}

	session.chatid = chatid
	session.username = username
	session.type = type

	await setDefaultSettings(session)

	sessions.set(session.chatid, session)
	showSessionLog(session)

	return session;
}

export function showSessionLog(session: any) {

	if (session.type === 'private') {
		console.log(`@${session.username} user${session.wallet ? ' joined' : '\'s session has been created (' + session.chatid + ')'}`)
	} else if (session.type === 'group') {
		console.log(`@${session.username} group${session.wallet ? ' joined' : '\'s session has been created (' + session.chatid + ')'}`)
	} else if (session.type === 'channel') {
		console.log(`@${session.username} channel${session.wallet ? ' joined' : '\'s session has been created'}`)
	}
}

export const defaultConfig = {
	vip: 0,
}

export const setDefaultSettings = async (session: any) => {

	session.timestamp = new Date().getTime()
	session.solCredit = 0
	session.tokenCredit = 0

	session.referralCode = 'ref_' + utils.encodeChatId(session.chatid)

	// const wallet: any = utils.generateNewWallet()
	// session.wallet = wallet.publicKey
	// session.pkey = utils.encryptPKey(wallet.secretKey)
}

export let _command_proc: any = null
export let _callback_proc: any = null
export async function init(command_proc: any, callback_proc: any) {

	bot = new TelegramBot(process.env.BOT_TOKEN as string,
		{
			polling: true
		})

	bot.getMe().then((info: TelegramBot.User) => {
		myInfo = info
	});

	bot.on('message', async (message: any) => {

		// console.log(`========== message ==========`)
		// console.log(message)
		// console.log(`=============================`)

		const msgType = message?.chat?.type;
		if (msgType === 'private') {
			privateBot.procMessage(message, database);

		} else if (msgType === 'group' || msgType === 'supergroup') {

		} else if (msgType === 'channel') {

		}
	})

	bot.on('callback_query', async (callbackQuery: TelegramBot.CallbackQuery) => {
		// console.log('========== callback query ==========')
		// console.log(callbackQuery)
		// console.log('====================================')

		const message = callbackQuery.message;

		if (!message) {
			return
		}

		const option = JSON.parse(callbackQuery.data as string);
		let chatid = message.chat.id.toString();

		executeCommand(chatid, message.message_id, callbackQuery.id, option)
	})

	_command_proc = command_proc
	_callback_proc = callback_proc

	await database.init()
	const users: any = await database.selectUsers()

	let loggedin = 0
	let admins = 0
	for (const user of users) {

		let session = JSON.parse(JSON.stringify(user))
		session = utils.objectDeepCopy(session, ['_id', '__v'])

		if (session.wallet) {
			loggedin++
		}

		sessions.set(session.chatid, session)
		//showSessionLog(session)

		if (session.admin >= 1) {
			console.log(`@${session.username} user joined as ADMIN ( ${session.chatid} )`)
			admins++
		}
	}

	console.log(`${users.length} users, ${loggedin} logged in, ${admins} admins`)
}


export const reloadCommand = async (chatid: string, messageId: number, callbackQueryId: string, option: any) => {

	await removeMessage(chatid, messageId)
	executeCommand(chatid, messageId, callbackQueryId, option)
}

export const executeCommand = async (chatid: string, _messageId: number | undefined, _callbackQueryId: string | undefined, option: any) => {

	const cmd = option.c;
	const id = option.k;

	const session = sessions.get(chatid)
	if (!session) {
		return
	}
	let messageId = Number(_messageId ?? 0)
	let callbackQueryId = _callbackQueryId ?? ''

	const sessionId: string = chatid
	const stateData: any = { sessionId, messageId, callbackQueryId, cmd }

	try {

		if (cmd === OptionCode.MAIN_MENU) {

			stateMap_setFocus(chatid, StateCode.IDLE, { sessionId })

			const menu: any = await json_main(sessionId);

			let title: string = await getMainMenuMessage(sessionId)

			const popup = parseInt(id)
			if (menu) {
				if (popup)
					await openMenu(chatid, cmd, title, menu.options)
				else
					await switchMenu(chatid, messageId, title, menu.options)
			}

		} else if (cmd === OptionCode.GENERATE_WALLETS) {
			const msg = `⚠️ Are you sure you want to generate wallets?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.GENERATE_WALLETS_CONFIRM)

		} else if (cmd === OptionCode.GENERATE_WALLETS_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Please Input <b>Wallet Count</b>`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_GENERATE_WALLET, stateData)
		} else if (cmd === OptionCode.BOOST_6H) {
			if (afx.boost_mode !== 6) {
				if(afx.start_volume_making === true) {
					await sendReplyMessage(stateData.sessionId, `VolumeMaking is started. \n Please stop volumeMaking for changing boost mode`);
					return
				}
				afx.setBoostMode(6)
				executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.MAIN_MENU, k: 1 })
			}
		} else if (cmd === OptionCode.BOOST_12H) {
			if (afx.boost_mode !== 12) {
				if(afx.start_volume_making === true) {
					await sendReplyMessage(stateData.sessionId, `VolumeMaking is started. \n Please stop volumeMaking for changing boost mode`);
					return
				}
				afx.setBoostMode(12)
				executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.MAIN_MENU, k: 1 })
			}
		} else if (cmd === OptionCode.BOOST_24H) {
			if (afx.boost_mode !== 24) {
				if(afx.start_volume_making === true) {
					await sendReplyMessage(stateData.sessionId, `VolumeMaking is started. \n Please stop volumeMaking for changing boost mode`);
					return
				}
				afx.setBoostMode(24)
				executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.MAIN_MENU, k: 1 })
			}
		} else if (cmd === OptionCode.START_VOLUMEMAKING) {
			try {
				const response = await axios.get(`https://toncenter.com/api/v2/getTokenData?address=${session.poolAddress}`);
				if (response.status === 200) {
					const result = response.data?.result?.jetton_content?.data;
					if (result) {
						if (result.uri) {
							console.log("dedust");
							try {
								console.log("startMaking");
								await sendReplyMessage(stateData.sessionId, `VolumeBoosting is started`);
								afx.setStart_VolumeMaking(true);
								const ret = await utils.volumeMaking(session);
								if (ret === 0) {
									await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped successfully`);
								} else if (ret === -1) {
									await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped by buy operation \n please deposit more TON in wallets`);
								} else if (ret === -2) {
									await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped by sell operation \n please deposit more TON in wallets`);
								} else if (ret === -3) {
									await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped by adding commission \n please deposit more TON in main wallet`);
								}
								afx.setStart_VolumeMaking(false);
							} catch (error) {
								await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped by unspecified error`);
								afx.setStart_VolumeMaking(false);
								console.log(error);
							}
						} else {
							console.log("ston.fi");
						}
					}
				}
			} catch (error) {
				await sendReplyMessage(stateData.sessionId, `Can't get pool address`);
				console.log(error);
			}
		} else if (cmd === OptionCode.STOP_VOLUMEMAKING) {
			afx.setStart_VolumeMaking(false);
			await sendReplyMessage(stateData.sessionId, `VolumeBoosting is stopped`);
		} else if (cmd === OptionCode.SELL_VOLUMEMAKING) {
			const msg = `⚠️ Are you sure you want to set sell time?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.SELL_VOLUMEMAKING_CONFIRM)
		}  else if (cmd === OptionCode.SELL_VOLUMEMAKING_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Please Input <b>sell time(second)</b>`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SELL_VOLUMEMAKING, stateData)
		} else if (cmd === OptionCode.CLOSE) {

			await removeMessage(sessionId, messageId)

		} else if (cmd === OptionCode.MAIN_REFRESH) {

			executeCommand(chatid, messageId, callbackQueryId, { c: OptionCode.MAIN_MENU, k: 0 })

		} else if (cmd == OptionCode.DEPOSIT_TONS) {
			const msg = `⚠️ Are you sure you want to deposit Tons?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.DEPOSIT_TONS_CONFIRM)
		} else if (cmd == OptionCode.DEPOSIT_TONS_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Please Input <b>Ton Amount</b>`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_DEPOSIT_TON, stateData)
		} else if (cmd == OptionCode.WITHDRAW_TONS) {
			const msg = `⚠️ Are you sure you want to withdraw Tons?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.WITHDRAW_TONS_CONFIRM)
		} else if (cmd == OptionCode.WITHDRAW_TONS_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			sendMessage(stateData.sessionId, 'Please wait for withdraw');
			const wallets: Array<string> = session.subWallets
			for (let i = 0; i < wallets.length; i ++) {
				const wallet = wallets.at(i)
				if(!wallet)
					continue
				const pKey = utils.decryptPKey(session.pkey)
				const keyPair = await mnemonicToPrivateKey(wallet.split(","));
				const subwallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
				await utils.withdrawFromWallet(subwallet, keyPair.secretKey, pKey.split(","))
			}
			sendMessage(stateData.sessionId, 'Withdraw finished');
			executeCommand(sessionId, undefined, undefined, { c: OptionCode.MAIN_MENU, k: 1 })
		} else if (cmd == OptionCode.WALLET_IMPORT_KEY) {
			const msg = `⚠️ Are you sure you want to import wallet?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.WALLET_IMPORT_KEY_CONFIRM)

		} else if (cmd == OptionCode.WALLET_IMPORT_KEY_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Please Input your <b>Wallet Secret Words</b> \n ex: word1,word2,word3, ...`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_WALLET_IMPORT_PKEY, stateData)
			// executeCommand(stateData.sessionId, undefined, undefined, { c: OptionCode.MAIN_WALLET, k: `1` })
		} else if (cmd == OptionCode.WALLET_INFO) {
			const wallets: Array<string> = session.subWallets
			for (let i = 0; i < wallets.length; i ++) {
				const wallet = wallets.at(i)
				if(!wallet)
					continue;
				const keyPair = await mnemonicToPrivateKey(wallet.split(","));
				const subWallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 })
				const walletAddress = subWallet.address.toString()
				const endpoint = await getHttpV4Endpoint();
				const client = new TonClient4({ endpoint });
				// send 0.1 TON from funding wallet to new wallet
				let walletContract = client.open(subWallet);
				const walletBalance = await walletContract.getBalance()
				const balance = fromNano(walletBalance)
				const msg2 = `Wallet ${i+1} - <code>${wallet}</code> \n Address - <code>${walletAddress}</code> \n Balace - ${balance} Ton`

				await sendReplyMessage(stateData.sessionId, msg2);
			}
		} else if (cmd == OptionCode.TOKEN_IMPORT_ADDRESS) {
			const msg = `⚠️ Are you sure you want to import your Token:Pool?

			WARNING: This action is irreversible!`

			await openConfirmMenu(stateData.sessionId, msg, 'Confirm', OptionCode.TOKEN_IMPORT_ADDRESS_CONFIRM)

		} else if (cmd == OptionCode.TOKEN_IMPORT_ADDRESS_CONFIRM) {
			await removeMessage(stateData.sessionId, messageId)
			await sendReplyMessage(stateData.sessionId, `Please Input your <b>Token & Pool Address</b> \n ex: TokenAddress:PoolAddress`);
			stateMap_setFocus(stateData.sessionId, StateCode.WAIT_SET_TOKEN_IMPORT, stateData)
			// executeCommand(stateData.sessionId, undefined, undefined, { c: OptionCode.MAIN_WALLET, k: `1` })
		}

	} catch (error) {
		console.log(error)
		sendMessage(chatid, `😢 Sorry, there was some errors on the command. Please try again later 😉`)
		if (callbackQueryId)
			await bot.answerCallbackQuery(callbackQueryId, { text: `😢 Sorry, there was some errors on the command. Please try again later 😉` })
	}
}
