import "reflect-metadata"; // needed by mikroorm and typeorm 
// import microConfig from "./mikro-orm.config";
// import { MikroORM } from "@mikro-orm/core";
import cors from "cors";
import IORedis from "ioredis";
import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import { Post } from "./entities/Post";
import { Users } from "./entities/User";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/users";
import { HelloResolver } from "./resolvers/hello";
import { ApolloServer } from "apollo-server-express";
import { COOKIE_NAME, DB_CONFIG, __PROD__ } from "./constants";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoaders";
import { createUpdootLoader } from "./utils/createUpdootLoader";


const main = async () => {
    /**
     * typeorm connection 
     */
    const conn = await createConnection({
        type: "postgres",
        database: DB_CONFIG.DB2_NAME,
        username: DB_CONFIG.USERNAME,
        password: DB_CONFIG.PASSWORD,
        logging: true,
        synchronize: true, // automatic migration - good to set to true during dev
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, Users, Updoot]
    });
    await conn.runMigrations();

    // await Post.delete({});

    /**
     * mikro orm connection 
     */
    // const orm = await MikroORM.init(microConfig);
    // await orm.getMigrator().up(); // automatic migration (npx mikro-orm migration:create)

    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new IORedis();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        })
    );
    // session middleware needs to run before the apollo middleware
    app.use(
        session({
            name: COOKIE_NAME, // name of the cookie
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // in milliseconds - 10 years 
                httpOnly: true, // security - cannot be accessed through JS front end 
                secure: __PROD__, // cookie only works in https 
                // secure: true,
                sameSite: "lax" // csrf
            },
            saveUninitialized: false,
            secret: "ertpouergksdfng", // random string to sign the cookie 
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground
        ],
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ 
            req, 
            res, 
            redis, 
            userLoader: createUserLoader(), 
            updootLoader: createUpdootLoader()
        }), // accessible by all resolvers. Pass `em: orm.em` with mikro.orm
        introspection: !__PROD__
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });


    app.listen(4000, () => {
        console.log("server started on localhost:4000");
    });
}

main().catch(err => {
    console.error(err)
});
