import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";

const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";
export function format(hash) {
  return _.map(
    hash,
    (v, key) => {
      let value = _.isBoolean(v) ? humanize(v.toString()) : v;
      value = _.isObject(v) ? JSON.stringify(value) : value;
      value = _.endsWith(key, "_at")
        ? moment(value).format(MOMENT_FORMAT)
        : value;
      return { key, title: humanize(key), value };
    },
    {}
  );
}
export function objectToFields(obj) {
  return _.map(obj, (value, title) => ({ title, value, short: true }));
}
export function objectToText(obj) {
  return _.join(
    _.map(format(_.omit(obj, "id")), p => `*${p.title}*: ${p.value}`),
    "\n"
  );
}
