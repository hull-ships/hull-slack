//@noflow

function getUserName(user = {}) {
  return (
    user.name ||
    user.email ||
    [user.first_name, " ", user.last_name].join(" ") ||
    "Unnamed User"
  );
}

function getDomainName(account = {}) {
  return account.domain || "Unnamed Account";
}

module.exports = {
  getUserName,
  getDomainName,
};
