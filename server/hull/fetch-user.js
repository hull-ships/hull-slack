import _ from "lodash";
import queries from "./queries";

/**
 * return { user, events, segments, pagination }
 */

module.exports = function fetchUser({ hull, search, options = {} }) {
  const { service, email, name, id } = search;
  let params = {};

  if (service) params = queries.service(`${service}:${id}`);
  else if (id) params = queries.id(id);
  else if (email) params = queries.email(email);
  else if (name) params = queries.name(name);

  const eventSearch = options.action && options.action.value === "events";

  hull.logger.info("outgoing.user.search", params);

  return hull
    .post("search/user_reports", params)

    .then(args => {
      const { pagination = {}, data = [] } = args;
      const [user] = data;
      if (!user || !user.id) throw new Error("User not found!");

      const q = [hull.asUser(user.id).get("/me/segments")];
      if (eventSearch) {
        const eventParams = search.rest
          ? queries.filteredEvents(user.id, search.rest)
          : queries.events(user.id);
        hull.logger.debug("outgoing.event.search", eventParams);
        q.push(hull.post("search/events", eventParams));
      }
      return Promise.all(q).then(([segments, events = {}]) => {
        if (eventSearch && !events.data.length) {
          throw new Error(
            `\nCouldn't find "${search.rest}" events for ${
              user.name
            } - Search is case-sensitive`
          );
        }

        if (!user) throw new Error("Couldn't find anyone!");

        return {
          subject: hull.utils.groupTraits(
            _.omitBy(user, v => v === null || v === "" || v === undefined)
          ),
          events: events.data,
          segments,
          pagination
        };
      });
    });
};
