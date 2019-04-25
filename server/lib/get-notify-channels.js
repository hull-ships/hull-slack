//@noflow
import _ from "lodash";

export default function getSlackChannels(ship = {}) {
  const { private_settings = {} } = ship;
  if (!private_settings) return [];

  const { notify_events = [] } = private_settings;
  if (!notify_events) return [];

  return _.map(_.concat(notify_events), "channel");
}
