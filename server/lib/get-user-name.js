module.exports = function getUserName(user = {}) {
  return user.name
    || user.email
    || [user.first_name, " ", user.last_name].join(" ")
    || "Unnamed User";
};
