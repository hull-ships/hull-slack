import _ from "lodash";
import queries from "./queries";

module.exports = function fetchUser({ hull, search }) {
  const { email, name, id } = search;
  let params = {};
  if (id) params = queries.id(id);
  else if (email) params = queries.email(email);
  else if (name) params = queries.name(name);
  return hull.post("search/user_reports", params)
  .then(({ pagination = {}, data = [] }) => {
    const [user = {}] = data;
    if (!user.id) return Promise.reject();
    return hull.as(user.id).get("/me/segments")
    .then((segments) => { return { segments, pagination, user }; });
  }, (err) => console.log(err))
  .then(({ segments, pagination, user }) => {
    const groupedUser = hull.utils.groupTraits(_.omitBy(user, v => (v === null || v === "" || v === undefined)));
    return { hull, user: groupedUser, segments, pagination };
  }, (err) => console.log(err));
};
