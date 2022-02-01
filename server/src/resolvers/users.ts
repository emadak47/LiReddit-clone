import { v4 } from "uuid";
import argon2 from "argon2";
import { MyContext } from "../types";
import { getConnection } from "typeorm";
import { Users } from "../entities/User";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { 
    Arg,
    Ctx, 
    Field, 
    FieldResolver, 
    Mutation, 
    ObjectType, 
    Query, 
    Resolver, 
    Root
} from "type-graphql";
// import { EntityManager } from "@mikro-orm/postgresql";

@ObjectType() // what we return 
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
    @Field(() => Users, { nullable: true })
    users?: Users;
}


@Resolver(Users)
export class UserResolver {
    @FieldResolver(() => String) 
    email(
        @Root() users: Users,
        @Ctx() { req }: MyContext
    ) {
        // this is the current user and it's ok to show them their email 
        if (req.session.userId == users.id) {
            return users.email;
        } 

        // the current user wants to see someone else's email 
        return "";
    }


    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { req, redis }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater than 2"
                    }
                ]
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "token expired"
                    }
                ]
            };
        }

        // const users = await em.findOne(Users, {id: parseInt(userId)});
        const userIdNum = parseInt(userId);
        const users = await Users.findOne(userIdNum);
        if (!users) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "user no longer exists"
                    }
                ]
            };
        }

        // users.password = await argon2.hash(newPassword);
        // await em.persistAndFlush(users);
        Users.update({ id: userIdNum }, {
            password: await argon2.hash(newPassword)
        });

        await redis.del(key);
        // optional: log in user after change password 
        req.session.userId = users.id;

        return { users };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        // const users = await em.findOne(Users, { email });
        const users = await Users.findOne({ where: { email } }); // cuz email isn't the primary key, had to use where 
        if (!users) {
            // the email is not in the db
            return true; // do nothing 
        }

        const token = v4();
        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            users.id,
            "ex",
            1000 * 60 * 60 * 24 * 3  // 3 days
        );
        sendEmail(
            email,
            `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
        );
        return true;
    }

    @Query(() => Users, { nullable: true })
    me(
        @Ctx() { req }: MyContext
    ) {
        if (!req.session.userId) return null;

        // return await em.findOne(Users, { id: req.session.userId });
        return Users.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, // specify the type if it throws an error
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) return { errors };

        const hashedPassword = await argon2.hash(options.password);
        let users;
        try {
            /**
             * typeorm 
             * e.x below shows how to use query builder
             * alternative: Users.create({}).save()
             */
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(Users)
                .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword
                })
                .returning("*")
                .execute();
            users = result.raw[0];
            /**
             * mikroorm 
             */
            // const reresolvet = await (em as EntityManager)
            //     .createQueryBuilder(Users)
            //     .getKnexQuery()
            //     .insert({
            //         username: options.username,
            //         email: options.email,
            //         password: hashedPassword,
            //         created_at: new Date(),
            //         updated_at: new Date()
            //     })
            //     .returning("*");
            // users = reresolvet[0];
        } catch (err) {
            if (err.code === "23505") {
                return {
                    errors: [{
                        field: "username",
                        message: "username already taken"
                    }]
                };
            }
        }
        // keep the user logged in after registeration
        req.session.userId = users.id;

        return { users };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        // const users = await em.findOne(
        //     Users,
        //     usernameOrEmail.includes("@")
        //         ? { email: usernameOrEmail }
        //         : { username: usernameOrEmail }
        // );
        const users = await Users.findOne(
            usernameOrEmail.includes("@")
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }
        )
        if (!users) { // if user don't exist in DB, return the error
            return {
                errors: [{
                    field: "usernameOrEmail",
                    message: "username doesn't exits",
                }]
            };
        }
        const valid = await argon2.verify(users.password, password);
        if (!valid) {
            return {
                errors: [{
                    field: "password",
                    message: "incorrect password",
                }]
            }
        }

        req.session.userId = users.id;

        return { users };
    }

    @Query(() => [Users])
    async users() { return Users.find(); }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}