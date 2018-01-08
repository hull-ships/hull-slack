module.exports = function getUserName(
  { name, domain, email, first_name, last_name },
  type = "user"
) {
  return (
    name ||
    (type === "account"
      ? domain
      : [first_name, " ", last_name].join(" ") || email) ||
    `Unnamed ${type}`
  );
};
