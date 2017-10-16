import _ from "lodash";
import moment from "moment";
import Hull from "hull";
import humanize from "./humanize";

const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";
module.exports = function format(hash) {
  return _.map(hash, (v, key) => {
    let value = _.isBoolean(v) ? humanize(v.toString()) : v;
    value = _.isObject(v) ? JSON.stringify(value) : value;
    value = _.endsWith(key, "_at") && moment.isMoment(value) ? moment(value).format(MOMENT_FORMAT) : value;

    try {
      const triedDate = moment(value);
      value = _.endsWith(key, "_at") && triedDate.isValid() ? triedDate.format(MOMENT_FORMAT) : value;
    } catch (err) {
      Hull.logger.debug("invalid date format for moment library", { value });
    }
    return { key, title: humanize(key), value };
  }, {});
};
