import _ from "lodash";
import flattenForText from "../util/flatten-for-text";

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

const getEvents = (events, notify_events, userSegmentIds) => {
  const messages = [];
  const triggered = [];
  if (notify_events.length) {
    const event_names = _.map(events, "event");
    const event_hash = _.compact(
      _.uniq(
        _.map(notify_events, ({ event, channel, synchronized_segments }) => {
          if (
            _.includes(event_names, event) &&
            belongsToSegment(synchronized_segments, userSegmentIds)
          ) {
            triggered.push(channel);
            return event;
          }
          return undefined;
        })
      )
    );
    if (triggered.length) {
      messages.push(`Performed ${flattenForText(event_hash)}`);
    }
  }
  return { triggered, messages };
};

module.exports = getEvents;
