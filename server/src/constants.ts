import * as dotenv from "dotenv";
dotenv.config({path: ".env"});

export const __PROD__ = process.env.NODE_ENV === "production";

export const DB_CONFIG = {
    USERNAME: process.env.USERNAME, 
    PASSWORD: process.env.PASSWORD,
    DB1_NAME: process.env.DB1_NAME,
    DB2_NAME: process.env.DB2_NAME
}

export const COOKIE_NAME = "qid";
export const FORGET_PASSWORD_PREFIX = "forget-password: ";