import _ from "lodash";
import queries from "./queries";

/**
 * return { user, events, segments, pagination }
 */

module.exports = function fetchUser({ hull, search }) {
  const { domain, name, id } = search;
  let params = {};
  if (id) params = queries.id(id);
  else if (domain) params = queries.domain(domain);
  else if (name) params = queries.name(name);

  hull.logger.info("outgoing.account.search", params);

  return hull.post("search/account_reports", params).then(args => {
    const { pagination = {}, data = [] } = args;
    const [account] = data;
    if (!account || !account.id) throw new Error("Account not found!");

    return {
      subject: hull.utils.groupTraits(
        _.omitBy(account, v => v === null || v === "" || v === undefined)
      ),
      pagination
    };
  });
};
