import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity, // gives us nice commands on entities
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Updoot } from "./Updoot";
import { Users } from "./User";

/**
 * typeorm entity
 */
@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({ type: "int", default: 0 })
    points!: number;
    
    @Field(() => Int, { nullable: true })
    voteStatus: number | null; // 1, -1 or null 

    @Field()
    @Column()
    creatorId: number;

    @Field()
    @ManyToOne(() => Users, (users) => users.posts)
    creator: Users;

    @OneToMany(() => Updoot, (updoot) => updoot.post)
    updoots: Updoot[];

    @Field(() => String)
    @CreateDateColumn()
    created_at: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updated_at: Date;
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