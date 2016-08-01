module.exports = function getSearchHash(type, message) {
  const search = {};
  const { match = [] } = message;
  if (type === "email") {
    search.email = match[3];
    if (match[5]) {
      if (match[5] === "full") {
        search.full = true;
      } else {
        search.groups = match[5];
      }
    }
  } else if (type === "id") {
    search.id = match[1];
    search.groups = match[2];
  } else {
    search.name = match[1];
  }
  return search;
};
