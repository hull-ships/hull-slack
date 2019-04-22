import _ from "lodash";
import humanize from "../lib/humanize";
import flattenForText from "./flatten-for-text";

const getAccountChanges = (changes, notify_account_segments) => {
  // Changes of Segments
  let messages = [];
  const entered = [];
  const left = [];

  if (
    changes &&
    changes.account_segments &&
    (changes.account_segments.entered || changes.account_segments.left)
  ) {
    messages = _.map(changes.account_segments, (values, action) => {
      const names = _.map(values, "name");
      const s = names.length > 1 ? "s" : "";
      return `${humanize(action)} segment${s} ${flattenForText(names)}`;
    });

    _.map(notify_account_segments, notify => {
      const { segment, channel, enter, leave } = notify;
      if (
        enter &&
        _.includes(_.map(changes.account_segments.entered, "id"), segment)
      ) {
        entered.push(channel);
      }
      if (
        leave &&
        _.includes(_.map(changes.account_segments.left, "id"), segment)
      ) {
        left.push(channel);
      }
    });
  }
  return { entered, left, messages };
};

module.exports = getAccountChanges;