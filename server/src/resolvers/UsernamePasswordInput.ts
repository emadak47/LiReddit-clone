import { Field, InputType } from "type-graphql";

// another way for passing multiple arguments 
// (instead of having one @Arg for each passed parameter)

@InputType() // what we use for arguments
export class UsernamePasswordInput {
    @Field()
    username: string;
    @Field()
    email: string;
    @Field()
    password: string;
}
