// import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createUserLoader } from "./utils/createUserLoaders";

export type MyContext = {
    // em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>; // needed by mikroorm 
    req: Request & { session: Session };
    res: Response;
    redis: Redis;
    userLoader: ReturnType<typeof createUserLoader>;
    updootLoader: ReturnType<typeof createUpdootLoader>
}

declare module 'express-session' {
    interface SessionData {
        userId: number, 
        dummy: string,

    }
}