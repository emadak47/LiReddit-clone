import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware
} from "type-graphql";
import { getConnection } from "typeorm";
import { MyContext } from "../types";
import { Updoot } from "../entities/Updoot";
import { Users } from "../entities/User";

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[]
    @Field()
    hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        return root.text.slice(0, 50);
    }

    @FieldResolver(() => Users)
    creator(
        @Root() post: Post,
        @Ctx() { userLoader }: MyContext
    ) {
        return userLoader.load(post.creatorId);
    }

    @FieldResolver(() => Int, { nullable: true }) 
    async voteStatus(
        @Root() post: Post,
        @Ctx() { req, updootLoader }: MyContext
    ) {
        if (!req.session.userId) { return null; }

        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId
        })

        return updoot ? updoot.value: null;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const { userId } = req.session;
        // await Updoot.insert({
        //     userId,
        //     postId,
        //     value: realValue,
        // });
        // can do this with await Post.update({})
        const updoot = await Updoot.findOne({ where: { postId, userId } });

        // the user voted on the post before and they changing their vote
        if (updoot && updoot.value !== realValue) {
            await getConnection().transaction(async (tm) => {
                await tm.query(`
                    update updoot
                    set value = $1 
                    where "postId" = $2 and "userId" = $3
                `, [realValue, postId, userId]);

                await tm.query(`
                    update post 
                    set points = points + $1 
                    where id = $2
                `, [2 * realValue, postId]);
            });
        } else if (!updoot) {
            // has never voted before
            await getConnection().transaction(async (tm) => {
                await tm.query(`
                    insert into updoot ("userId", "postId", value)
                    values ($1, $2, $3)
                `, [userId, postId, realValue]);

                await tm.query(`
                    update post 
                    set points = points + $1
                    where id = $2
                `, [realValue, postId]);
            });
        }
        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        // @Ctx() { em }: MyContext
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedPosts> {
        // return em.find(Post, {});
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];

        let cursorIdx = 3;
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(`
            select p.*
            from post p
            ${cursor ? `where p.created_at < $2` : ""}
            order by p.created_at DESC
            limit $1
        `,
            replacements
        );
        // const qb = getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("p")
        //     .innerJoinAndSelect(
        //         "p.creator",
        //         "u",
        //         'u.id = p."creatorId"'
        //     )
        //     .orderBy('p.created_at', "DESC")
        //     .take(realLimitPlusOne);

        // if (cursor) {
        //     qb.where('p.created_at < :cursor', {
        //         cursor: new Date(parseInt(cursor)),
        //     });
        // }

        // const posts = await qb.getMany();
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne
        };
    }

    @Query(() => Post, { nullable: true })
    post(
        @Arg("id", () => Int) id: number,
    ): // Promise<Post | null> // for mikroorm
        Promise<Post | undefined> {
        // return em.findOne(Post, { id });
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        // const post = em.create(Post, {title});
        // await em.persistAndFlush(post);
        // return post;
        return Post.create({
            ...input,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        /**
         * mikroorm 
         */
        // const post = await em.findOne(Post, {id});
        // if(!post) {
        //     return null;
        // }
        // if (typeof title !== 'undefined') {
        //     post.title = title;
        //     await em.persistAndFlush(post);
        // }
        // return post;

        /**
         * typeorm 
         */
        const result = await getConnection()
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where('id = :id and "creatorId" = :creatorId', {
                id,
                creatorId: req.session.userId
            })
            .returning("*")
            .execute()
        return result.raw[0];
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        // await em.nativeDelete(Post, { id });

        // not cascade way 
        // const post = await Post.findOne(id);
        // if (!post) { return false; }
        // if (post.creatorId !== req.session.userId) {
        //     throw new Error("not authorised");
        // }
        // await Updoot.delete({ postId: id });
        // await Post.delete({ id });

        await Post.delete({ id, creatorId: req.session.userId });
        return true;
    }
}