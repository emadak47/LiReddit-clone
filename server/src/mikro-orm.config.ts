// import { DB_CONFIG, __PROD__ } from "./constants";
// import { Post } from "./entities/Post";
// import { Users } from "./entities/User";
// import { MikroORM } from "@mikro-orm/core";
// import path from "path";

// export default {
//     entities: [Post, Users],
//     type: "postgresql",
//     dbName: DB_CONFIG.DB1_NAME,
//     user: DB_CONFIG.USERNAME,
//     password: DB_CONFIG.PASSWORD,
//     debug: !__PROD__,
//     migrations: {
//         path: path.join(__dirname, './migrations'),
//         pattern: /^[\w-]+\d+\.[tj]s$/,
//     },
// } as Parameters<typeof MikroORM.init>[0];