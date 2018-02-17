import Promise from "bluebird";
import { smartNotifierHandler } from "hull/lib/utils";
import updateUser from "../update-user";

export default function handler({ connectSlack }) {
  const update = updateUser.bind(undefined, connectSlack);
  return smartNotifierHandler({
    handlers: {
      "ship:update": (ctx, { hull = {}, ship = {} }) => {
        connectSlack({ hull, ship, force: true });
        return Promise.resolve();
      },
      "user:update": (ctx, messages = []) => {
        // Get 100 users every 100ms at most.
        ctx.smartNotifierResponse.setFlowControl({
          type: "next",
          size: 50,
          in: 1
        });
        return Promise.all(messages.map(m => update(ctx, m)));
      }
    }
  });
}
