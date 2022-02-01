import DataLoader from "dataloader";
import { Users } from "../entities/User";

// [1, 78, 8, 9]
// [{id: 1, username: 'tim'}, {}, {}, {}]
export const createUserLoader = () => new DataLoader<number, Users>(async userIds => {
    const users = await Users.findByIds(userIds as number[]);
    const userIdToUser: Record<number, Users> = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    });

    return userIds.map((userId) => userIdToUser[userId]);
});