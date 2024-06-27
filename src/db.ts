import mongoose from "mongoose";

export const User = mongoose.model(
    "User",
    new mongoose.Schema({
        chatid: String,
        username: String,
        admin: Number,
        vip: Number,
        type: String,
        solCredit: Number,
        tokenCredit: Number,
        buyConfigLeft: Number,
        buyConfigRight: Number,
        sellConfigLeft: Number,
        sellConfigRight: Number,
        wallet: String,
        tokenAddress: String,
        poolAddress: String,
        pkey: String,
        referredBy: String,
        referredTimestamp: Number,
        referralCode: String,
        timestamp: Number,
        subWallets: Array<String>,
    })
);

export const Admin = mongoose.model(
    "Admin",
    new mongoose.Schema({
        name: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        permission: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    })
);

export const Zombie = mongoose.model(
    "Zombie",
    new mongoose.Schema({
        zombies: {
            type: Array<String>,
            required: true,
        },
    })
);

const TrxHistory = mongoose.model('Trx_History', new mongoose.Schema({
    chatid: String,
    solAmount: Number,
    tokenAmount: Number,
    mode: String,
    trxId: String,
    timestamp: Number,
}));

  
export const init = () => {
    return new Promise(async (resolve: any, reject: any) => {
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASS;
        const dbName = process.env.DB_NAME;
        const dbHost1 = process.env.DB_HOST1; // or the appropriate host if different
        const dbHost2 = process.env.DB_HOST2; // or the appropriate host if different
        const dbHost3 = process.env.DB_HOST3; // or the appropriate host if different
        const dbHost4 = process.env.DB_HOST4; // or the appropriate host if different
        const dbPort = '27017'; // or the appropriate port if different

        const mongoURI = `mongodb://${dbUser}:${dbPassword}@${dbHost1}.${dbHost2}.${dbHost3}.${dbHost4}:${dbPort}/${dbName}?authSource=admin`;

        mongoose
            .connect(mongoURI)
            .then(() => {
                console.log(`Connected to MongoDB "${process.env.DB_NAME}"...`);

                resolve();
            })
            .catch((err) => {
                console.error("Could not connect to MongoDB...", err);
                reject();
            });
    });
};

export const updateZombies = (params: any) => {
    return new Promise(async (resolve, reject) => {
        Zombie.findOne().then(async (zombie: any) => {
            if (!zombie) {
                zombie = new Zombie();
            }

            zombie.zombies.push(params);

            await zombie.save();

            resolve(zombie);
        });
    });
};

export const updateUser = (params: any) => {
    return new Promise(async (resolve, reject) => {
        User.findOne({ chatid: params.chatid }).then(async (user: any) => {
            if (!user) {
                user = new User();
            }

            user.chatid = params.chatid;
            user.username = params.username;
            user.permit = params.permit;
            user.type = params.type;
            user.admin = params.admin;
            user.vip = params.vip;

            user.solCredit = params.solCredit;
            user.tokenCredit = params.tokenCredit;
            user.buyConfigLeft = params.buyConfigLeft;
            user.buyConfigRight = params.buyConfigRight;
            user.sellConfigLeft = params.sellConfigLeft;
            user.sellConfigRight = params.sellConfigRight;
            user.wallet = params.wallet;
            user.tokenAddress = params.tokenAddress;
            user.poolAddress = params.poolAddress;
            user.pkey = params.pkey;
            user.referredBy = params.referredBy;
            user.referralCode = params.referralCode;
            user.referredTimestamp = params.referredTimestamp;
            user.subWallets = params.subWallets;

            await user.save();

            resolve(user);
        });
    });
};

export const removeUser = (params: any) => {
    return new Promise((resolve, reject) => {
        User.deleteOne({ chatid: params.chatid }).then(() => {
            resolve(true);
        });
    });
};

export async function selectUsers(params: any = {}) {
    return new Promise(async (resolve, reject) => {
        User.find(params).then(async (users) => {
            resolve(users);
        });
    });
}

export async function countUsers(params: any = {}) {
    return new Promise(async (resolve, reject) => {
        User.countDocuments(params).then(async (users) => {
            resolve(users);
        });
    });
}

export async function selectUser(params: any) {
    return new Promise(async (resolve, reject) => {
        User.findOne(params).then(async (user) => {
            resolve(user);
        });
    });
}

export async function updateUserCredit(params: any, query: any) {
    return new Promise(async (resolve, reject) => {
        User.updateOne(params, query).then(async (user) => {
            resolve(user);
        });
    });
}

export async function addTrxHistory(params: any = {}) {

    return new Promise(async (resolve, reject) => {
  
      try {
  
        let item = new TrxHistory();
  
        item.chatid = params.chatid
        item.solAmount = params.solAmount
        item.tokenAmount = params.tokenAmount
        item.mode = params.mode
        item.trxId = params.trxId
        item.timestamp = new Date().getTime()
  
        await item.save();
  
        resolve(true);
  
      } catch (err) {
        resolve(false);
      }
    });
}