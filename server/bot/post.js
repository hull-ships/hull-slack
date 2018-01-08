import Hull from "hull";
import ack from "./ack";
import getMessageLogData from "../lib/get-log-data";
import getPayload from "../lib/payload";
import getSearchHash from "../lib/get-search-hash";
import fetchUser from "../hull/fetch-user";
import fetchAccount from "../hull/fetch-account";
import { reply, sad } from "./utils";

export default function post(field = "email", options = {}) {
  const { type = "user" } = options;
  return function postSubject(bot, msg) {
    ack(bot, msg, "mag_right");
    const search = getSearchHash(field, msg);
    const { whitelist, actions, hullConfig } = bot.config;
    const hull = new Hull(hullConfig);

    const msgdata = getMessageLogData(msg);
    hull.logger.info("bot.hear", { field, search, options, ...msgdata });

    const f = options.subject === "account" ? fetchAccount : fetchUser;

    return f({ hull, search, options })
      .then(({ subject, events, segments, pagination, message = "" }) => {
        if (!subject) {
          hull.logger.info(`${type}.fetch.fail`, { message, search, field });
          return `¯\\_(ツ)_/¯ ${message}`;
        }

        hull.logger.info(`${type}.fetch.success`, {
          ...msgdata,
          search,
          field
        });

        const { action = {} } = options;
        const payload = {
          hull,
          type,
          subject,
          events,
          segments,
          actions,
          pagination,
          whitelist
        };

        if (action.name === "expand") {
          // if there is a search, set group name to search,
          // else set to action value;
          payload.group =
            search.rest === "full" ? "traits" : search.rest || action.value;
        }

        const res = getPayload(payload);
        hull.logger.debug(`outgoing.${type}.reply`, res);
        if (pagination.total > 1)
          res.text = `Found ${pagination.total} ${type}s, Showing ${res.text}`;
        return res;
      })
      .then(reply.bind(undefined, hull, bot, msg))
      .catch(err => {
        hull.logger.error(`${type}.post.error`, {
          message: msg,
          error: err.message
        });
        sad(hull, bot, msg, err);
      });
  };
}
