import Promise from "bluebird";
import { smartNotifierHandler } from "hull/lib/utils";
import updateUser from "../update-user";

export default function handler({ connectSlack }) {
  const update = updateUser.bind(undefined, connectSlack);
  return smartNotifierHandler({
    handlers: {
      "ship:update": (ctx, { hull = {}, ship = {} }) =>
        connectSlack({ hull, ship, force: true }),
      "user:update": (ctx, messages = []) => {
        messages.map(m => update(ctx, m));
        // Get 100 users every 100ms at most.
        ctx.smartNotifierResponse.setFlowControl({
          type: "next",
          size: 100,
          in: 100
        });
        return Promise.resolve();
      }
    }
  });
}
