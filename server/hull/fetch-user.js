import _ from "lodash";
import queries from "./queries";

/**
 * return { user, events, segments, pagination }
*/

module.exports = function fetchUser({ hull, search }) {
  const { email, name, id } = search;
  let params = {};

  if (id) params = queries.id(id);
  else if (email) params = queries.email(email);
  else if (name) params = queries.name(name);


  console.log("SEARCHING", params);

  return hull.post("search/user_reports", params)

  .then(({ pagination = {}, data = [] }) => {
    const [user] = data;
    if (!user || !user.id) return Promise.resolve({});
    const eventParams = queries.events(user.id);

    return Promise.all([
      hull.as(user.id).get("/me/segments"),
      hull.post("search/events", eventParams)
    ])

    .then(([segments, events = {}]) => {
      const groupedUser = hull.utils.groupTraits(_.omitBy(user, v => (v === null || v === "" || v === undefined)));
      return { user: groupedUser, events: events.data, segments, pagination };
    }, (err) => console.log(err));
  }, (err) => console.log(err));
};
