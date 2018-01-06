module.exports = function getSearchHash(type, message) {
  const search = {};
  const { match = [] } = message;
  const [, id, rest, email, emailRest] = match;
  if (type === "email") {
    if (email) search.email = email;
    if (rest) search.rest = emailRest;
    return search;
  }

  if (type === "id") {
    search.id = id;
    search.rest = rest;
  } else {
    search.name = id;
  }
  return search;
};
