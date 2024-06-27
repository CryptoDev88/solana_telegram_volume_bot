import express, { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Admin, User } from "../db";
import * as validator from "./validator";

dotenv.config();

interface User {
    name: string;
    email: string;
    password: string;
}

export default (): Router => {
    var router: Router = express.Router();

    router.post("/admin-add", async (req: Request, res: Response) => {
        const { errors, isValid } = validator.validateRegisterInput(req.body);
        if (!isValid) {
            return res.status(400).json(errors);
        }

        Admin.findOne({ email: req.body.email }).then((user: any) => {
            if (user) {
                return res.status(400).json({ email: "ID already exists" });
            } else {
                const newAdmin = new Admin({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                });

                newAdmin
                    .save()
                    .then((user: any) => {
                        return res
                            .status(200)
                            .json({
                                message:
                                    "User added successfully. Refreshing data...",
                            });
                    })
                    .catch((err: any) => console.log(err));
            }
        });
    });

    router.post("/admin-data", (req: Request, res: Response) => {
        Admin.find({})
            .select(["-password"])
            .then((admin: any) => {
                if (admin) {
                    return res.status(200).send(admin);
                }
            });
    });

    router.post("/admin-delete", (req: Request, res: Response) => {
        console.log("delete");
        Admin.deleteOne({ _id: req.body._id }).then((user: any) => {
            if (user) {
                return res
                    .status(200)
                    .json({
                        message:
                            "User deleted successfully. Refreshing data...",
                        success: true,
                    });
            }
        });
    });

    router.post("/admin-update", (req: Request, res: Response) => {
        const { errors, isValid } = validator.validateUpdateUserInput(req.body);
        if (!isValid) {
            return res.status(400).json(errors);
        }
        const _id = req.body._id;
        Admin.findOne({ _id }).then((user: any) => {
            if (user) {
                if (req.body.password !== "") {
                    let salt = bcrypt.genSaltSync(10);
                    let hash = bcrypt.hashSync(req.body.password, salt);
                    user.password = hash;
                }

                let update = {
                    name: req.body.name,
                    email: req.body.email,
                    password: user.password,
                };
                User.updateOne(
                    { _id: _id },
                    { $set: update },
                    function (err: any, result: any) {
                        if (err) {
                            return res
                                .status(400)
                                .json({ message: "Unable to update user." });
                        } else {
                            return res
                                .status(200)
                                .json({
                                    message:
                                        "User updated successfully. Refreshing data...",
                                    success: true,
                                });
                        }
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({ message: "Now user found to update." });
            }
        });
    });

    router.post("/login", (req: Request, res: Response) => {
        console.log("====================================");
        const { errors, isValid } = validator.validateLoginInput(req.body);
        if (!isValid) {
            console.log("fail", errors);

            return res.status(400).json(errors);
        }

        const email = req.body.email;
        const password = req.body.password;
        Admin.findOne({ email }).then((user: any) => {
            if (!user) {
                return res.status(404).json({ email: "ID not found" });
            }

            // bcrypt.compare(password, user.password).then(isMatch => {
            if (password === user.password) {
                // if (isMatch) {
                const payload = {
                    id: user.id,
                    name: user.name,
                    permission: user.permission,
                };

                const secretOrKey = process.env.PASSPORT_SECRET_KEY as jwt.Secret;
                jwt.sign(
                    payload,
                    secretOrKey,
                    {
                        expiresIn: 31556926, // 1 year in seconds
                    },
                    (err: any, token: any) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token,
                        });
                    }
                );
                // }
            } else {
                return res.status(400).json({ password: "Password incorrect" });
            }
        });
    });

    return router;
};
