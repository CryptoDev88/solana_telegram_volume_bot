
import * as bot from "./bot"
import * as afx from './global'
import { Connection, clusterApiUrl } from "@solana/web3.js";
import * as server from '../server'

import dotenv from 'dotenv'
dotenv.config()

const conn: Connection = new Connection(clusterApiUrl(afx.getCluserApiType() as any), "confirmed");

afx.setWeb3(conn)

bot.init(async (session: any, command: string, params: any, messageId: number) => {
    try {
        if (command === parseInt(command).toString()) {
        }
    } catch (error) {
    }
}, 
async (option: number, param: any) => {
})

afx.init()
server.start(bot);
