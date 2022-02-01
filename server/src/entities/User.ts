import { Field, ObjectType } from "type-graphql";
import { 
    BaseEntity,
    Column, 
    CreateDateColumn, 
    Entity,  
    OneToMany, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn,  
} from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Users extends BaseEntity {
    @Field() 
    @PrimaryGeneratedColumn() 
    id!: number;

    @Field() 
    @Column({ unique: true })
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @OneToMany(() => Post, (post) => post.creator)
    posts: Post[];

    @OneToMany(() => Updoot, (updoot) => updoot.users)
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
// export class Users {
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
//     @Property({type: 'text', unique: true})
//     username!: string;

//     @Field()
//     @Property({type: 'text', unique: true})
//     email!: string;

//     @Property({type: 'text'}) //@Field() is removed to make it inaccessible 
//     password!: string;
// } 