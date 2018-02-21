//@noflow
module.exports = function getSearchHash(type, message) {
  const search = {};
  const { match = [] } = message;
  if (type === "email") {
    search.email = match[3];
    if (match[4]) search.rest = match[4];
    return search;
  }

  if (type === "id") {
    search.id = match[1];
    search.rest = match[2];
  } else {
    search.name = match[1];
  }
  return search;
};
