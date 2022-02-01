import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

interface NavBarProps { }

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const router = useRouter();
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery({
        pause: isServer(),
    });

    let body = null;

    // data is loading 
    if (fetching) {

        // user not loggod in 
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}> login </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link> register </Link>
                </NextLink>
            </>
        )
        // user is logged in 
    } else {
        body = (
            <Flex align="center">
                <NextLink href="/create-post">
                    <Button as={Link} mr={4}>create post</Button>
                </NextLink>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    onClick={async () => {
                        await logout();
                        router.reload();
                    }}
                    isLoading={logoutFetching}
                    variant="link"
                >
                    logout
                </Button>
            </Flex>
        )

    }

    return (
        <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
            <Flex flex={1} m="auto" align="center" maxW={800}>
                <NextLink href="/">
                    <Link>
                        <Heading>LiReddit</Heading>
                    </Link>
                </NextLink>
                <Box ml={"auto"}>{body}</Box>
            </Flex>
        </Flex>
    )
}

// since navbar is used in index and index renders server-side 
// it will make a request to get the current user from the next.js server 
// becasue navbar has the `useMeQuery` 
// but next.js server doesn't store a cookie to know the user
// we can set up a cookie but there is no need here 
// so to avoid that query running on the server we add the pause command 
// essentially, we are telling not to run on the server and the way 
// we could tell we are on the server, if the window variable is defined 
// (through isServer.ts)