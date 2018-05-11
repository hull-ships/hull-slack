//@noflow
import _ from "lodash";

export default function getSlackChannels(ship = {}) {
  const { private_settings: privateSettings = {} } = ship;
  if (!privateSettings) return [];

  const {
    notify_events: notifyEvents = [],
    notify_segments: notifySegments = []
  } = privateSettings;
  if (!notifyEvents && !notifySegments) return [];

  return _.map(_.concat(notifyEvents, notifySegments), "channel");
}
