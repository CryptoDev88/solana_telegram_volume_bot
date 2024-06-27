import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Admin } from './src/db';

import dotenv from 'dotenv';
dotenv.config();

interface JwtPayload {
    id: string;
}

const opts: any = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.PASSPORT_SECRET_KEY;

export default function(passport: any) {
    passport.use(
        new JwtStrategy(opts, (jwt_payload: JwtPayload, done: any) => {
            Admin.findById(jwt_payload.id)
                .then((user: any) => {
                    if (user) {
                        return done(null, user);
                    }
                    return done(null, false);
                })
                .catch((err: any) => console.log(err));
        })
    );
}