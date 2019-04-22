import _ from "lodash";
import humanize from "../lib/humanize";
import flattenForText from "./flatten-for-text";

const getUserChanges = (changes, notify_segments) => {
  // Changes of Segments
  let messages = [];
  const entered = [];
  const left = [];

  if (
    changes &&
    changes.segments &&
    (changes.segments.entered || changes.segments.left)
  ) {
    messages = _.map(changes.segments, (values, action) => {
      const names = _.map(values, "name");
      const s = names.length > 1 ? "s" : "";
      return `${humanize(action)} segment${s} ${flattenForText(names)}`;
    });

    _.map(notify_segments, notify => {
      const { segment, channel, enter, leave } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment)) {
        entered.push(channel);
      }
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment)) {
        left.push(channel);
      }
    });
  }
  return { entered, left, messages };
};

module.exports = getUserChanges;