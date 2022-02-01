import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import Router from "next/router";
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from "urql";
import { pipe, tap } from "wonka";
import { DeletePostMutationVariables, LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation, VoteMutationVariables } from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import gql from "graphql-tag";
import { isServer } from "./isServer";

const errorExchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(
        forward(ops$),
        tap(({ error }) => {
            if (error) {
                if (error?.message.includes("not authenticated")) {
                    Router.replace("/login"); // replaces current route instead of pushing 
                }
            }
        })
    )
}

function invalidateAllPosts(cache: Cache) {
    const allFields = cache.inspectFields("Query");
    const fieldInfos = allFields.filter(
        (info) => info.fieldName === "posts"
    );
    fieldInfos.forEach((fi) => {
        cache.invalidate("Query", "posts", fi.arguments || {});
    })
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
    let cookie = "";
    if (isServer()) { cookie = ctx?.req?.headers?.cookie; }

    return {
        url: "http://localhost:4000/graphql",
        fetchOptions: {
            credentials: "include" as const,
            headers: cookie
                ? { cookie }
                : undefined
        },
        exchanges:
            [
                dedupExchange,
                cacheExchange({
                    keys: {
                        PaginatedPosts: () => null
                    },
                    resolvers: {
                        Query: {
                            posts: cursorPagination(),
                        }
                    },
                    updates: {
                        Mutation: {
                            deletePost: (_result, args, cache, info) => {
                                cache.invalidate({
                                    __typename: "Post",
                                    id: (args as DeletePostMutationVariables).id
                                });
                            },
                            vote: (_result, args, cache, info) => {
                                const { postId, value } = args as VoteMutationVariables;
                                const data = cache.readFragment(
                                    gql`
                                    fragment _ on Post {
                                        id 
                                        points
                                    }
                                `,
                                    { id: postId } as any
                                );
                                if (data) {
                                    if (data.voteStatus == value) { return; }
                                    const newPoints = (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                                    cache.writeFragment(
                                        gql`
                                        fragment _ on Post {
                                            points
                                            voteStatus
                                        }
                                    `,
                                        { id: postId, points: newPoints, voteStatus: value } as any
                                    );
                                }
                            },
                            createPost: (_result, args, cache, info) => {
                                invalidateAllPosts(cache);
                            },
                            logout: (_result, _args, cache, _info) => {
                                betterUpdateQuery<LogoutMutation, MeQuery>(
                                    cache,
                                    { query: MeDocument },
                                    _result,
                                    () => ({ me: null })
                                )
                            },
                            login: (_result, _args, cache, _info) => {
                                betterUpdateQuery<LoginMutation, MeQuery>(
                                    cache,
                                    { query: MeDocument },
                                    _result,
                                    (result, query) => {
                                        if (result.login.errors) {
                                            return query;
                                        } else {
                                            return {
                                                me: result.login.users
                                            }
                                        }
                                    }
                                );
                                invalidateAllPosts(cache);
                            },
                            register: (_result, _args, cache, _info) => {
                                betterUpdateQuery<RegisterMutation, MeQuery>(
                                    cache,
                                    { query: MeDocument },
                                    _result,
                                    (result, query) => {
                                        if (result.register.errors) {
                                            return query;
                                        } else {
                                            return {
                                                me: result.register.users
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    }
                }),
                errorExchange,
                ssrExchange,
                fetchExchange
            ],
    }
};

const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;

        const allFields = cache.inspectFields(entityKey);
        const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
        const isInTheCache = cache.resolve(entityKey, fieldKey);
        let hasMore = true;
        info.partial = !isInTheCache;
        const resutls: string[] = [];
        fieldInfos.forEach((fi) => {
            const key = cache.resolve(entityKey, fi.fieldKey) as string;
            const data = cache.resolve(key, "posts") as string[];
            const _hasMore = cache.resolve(key, "hasMore");
            if (!_hasMore) { hasMore = _hasMore as boolean; }
            resutls.push(...data);
        });

        return {
            __typename: "PaginatedPosts",
            hasMore,
            posts: resutls
        };
    };
};