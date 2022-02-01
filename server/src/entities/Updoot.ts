import { ObjectType } from "type-graphql";
import {
    BaseEntity, // gives us nice commands on entities
    Column,
    Entity,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { Post } from "./Post";
import { Users } from "./User";

// many to many: users <-> posts
// users -> updoot <- posts

/**
 * typeorm entity
 */
@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
    @Column({ type: "int" })
    value: number;

    @PrimaryColumn()
    userId: number;

    @ManyToOne(() => Users, (users) => users.updoots)
    users: Users;

    @PrimaryColumn()
    postId: number;

    @ManyToOne(() => Post, (post) => post.updoots, {
        onDelete: "CASCADE"
    })
    post: Post;
}

/**
 * mikro orm entity
 */
// @ObjectType()
// @Entity() 
// export class Post {
//     @Field()
//     @PrimaryKey() 
//     id!: number;

//     @Field(() => String)
//     @Property({type: 'date'})
//     created_at = new Date();

//     @Field(() => String)
//     @Property({type: 'date', onUpdate : ()=> new Date()})
//     updated_at = new Date();

//     @Field()
//     @Property({type: 'text'})
//     title!: string;
// }