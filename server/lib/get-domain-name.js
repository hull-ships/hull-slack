//@noflow
module.exports = function getDomainName(account = {}) {
  return account.domain || "Unnamed Account";
};
