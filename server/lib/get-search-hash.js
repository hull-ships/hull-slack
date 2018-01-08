import _ from "lodash";

export default function getSearchHash(type, message) {
  console.log("get Search Hash", type, message);
  const { match = [] } = message;
  if (type === "domain") {
    const [, , , domain, rest] = match;
    return _.pickBy({ domain, rest }, v => !!v);
  }

  if (type === "email") {
    const [, , , email, rest] = match;
    return _.pickBy({ email, rest }, v => !!v);
  }

  if (type === "id") {
    const [, id, rest] = match;
    return { id, rest };
  }

  const [, name] = match;
  return { name };
}
