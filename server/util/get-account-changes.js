// @flow

import _ from "lodash";
import humanize from "../lib/humanize";
import objectUtils from "./object-utils";

const segment_action_type = {
  entered: "entered",
  left: "left",
};

const segment_change_events = [
  {
    event: "ENTERED_ACCOUNT_SEGMENT",
    action: segment_action_type.entered,
    path: "account_segments.entered",
  },
  {
    event: "LEFT_ACCOUNT_SEGMENT",
    action: segment_action_type.left,
    path: "account_segments.left",
  },
];

const belongsToSegment = (entitySegmentIds, sync_segment) => {
  // sync_segment will be undefined if a manifest has not been refreshed
  if (sync_segment === undefined) {
    sync_segment = "ALL";
  }

  return sync_segment === "ALL" || _.includes(entitySegmentIds, sync_segment);
};

const getAccountChanges = (changes, notify_account_segments) => {
  // Changes of Segments
  let messages = [];
  let entered = [];
  let left = [];

  if (
    changes &&
    changes.account_segments &&
    (changes.account_segments.entered || changes.account_segments.left)
  ) {
    messages = _.map(changes.account_segments, (values, action) => {
      const names = _.map(values, "name");
      const s = names.length > 1 ? "s" : "";
      return `${humanize(action)} segment${s} ${objectUtils.flattenForText(
        names
      )}`;
    });

    // enter segment1 -> #channel1
    // enter segment2 -> #channel2
    entered = getNotifySegmentChannels(
      notify_account_segments,
      changes.account_segments,
      segment_action_type.entered
    );

    left = getNotifySegmentChannels(
      notify_account_segments,
      changes.account_segments,
      segment_action_type.left
    );
  }
  return { entered, left, messages };
};

const getNotifySegmentChannels = function(
  notify_segments: Array<Object>,
  segmentChanges: Object = {},
  action: string = segment_action_type.left
): Array<Object> {
  if (!_.size(segmentChanges)) {
    return [];
  }

  let segmentChangeIds = _.map(segmentChanges[action] || [], "id");

  if (!segmentChangeIds.length) {
    return [];
  }

  const segment_change_event = _.find(segment_change_events, e => {
    return e.action === action;
  });

  // get all notify_segments for a given action
  const filtered_notify_segments_by_action = _.filter(
    notify_segments,
    e => e.event === segment_change_event.event
  );

  // get all notify segments with the given action
  // and with a matching synchronized segment
  const filtered_notify_segments = _.filter(
    filtered_notify_segments_by_action,
    s => belongsToSegment(segmentChangeIds, s.synchronized_segment)
  );

  return _.map(filtered_notify_segments, "channel");
};

module.exports = getAccountChanges;
