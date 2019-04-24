// @flow
import _ from "lodash";
import humanize from "../lib/humanize";
import flattenForText from "./flatten-for-text";

const segment_action_type = {
  enter: "enter",
  leave: "leave",
};

const segment_change_events = [
  {
    event: "ENTERED_USER_SEGMENT",
    type: segment_action_type.enter,
    path: "segments.entered",
  },
  {
    event: "LEFT_USER_SEGMENT",
    type: segment_action_type.leave,
    path: "segments.left",
  },
];

const belongsToSegment = (sync_segments, entitySegmentIds) => {
  // sync_segments will be undefined if a manifest has not been refreshed
  if (sync_segments === undefined) {
    sync_segments = ["ALL"];
  }

  return (
    _.includes(sync_segments, "ALL") ||
    _.intersection(sync_segments, entitySegmentIds).length > 0
  );
};

const getUserChanges = (changes, notify_segments, notify_events) => {
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

    // Processing segment changes as events:
    _.map(notify_events, notify => {
      let { event, synchronized_segments, channel } = notify;

      if (synchronized_segments === undefined) {
        synchronized_segments = ["ALL"];
      }

      const segment_change_event = _.find(segment_change_events, e => {
        return e.event === event;
      });

      if (segment_change_event !== undefined) {
        const action_type = segment_change_event.type;
        const segment_changes = _.get(changes, segment_change_event.path);

        if (
          segment_changes !== undefined &&
          belongsToSegment(synchronized_segments, _.map(segment_changes, "id"))
        ) {
          if (action_type === segment_action_type.enter) {
            entered.push(channel);
          } else if (action_type === segment_action_type.leave) {
            left.push(channel);
          }
        }
      }
    });
  }
  return { entered, left, messages };
};

module.exports = getUserChanges;
