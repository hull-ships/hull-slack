import _ from "lodash";
import Slack from "node-slack";
import userPayload from "./lib/user-payload";

export default function (connectSlack, { message = {} }, { hull = {}, ship = {} }) {
  connectSlack({ hull, ship });
  const { user = {}, segments = [], changes = {} } = message;
  const { private_settings = {} } = ship;
  const { incoming_webhook = {}, send_update, send_create, send_enter, send_left, synchronized_segments = [] } = private_settings;

  hull.logger.info("update.process");

  const { url } = incoming_webhook;

  if (!hull || !user.id || !url) { return false; }

  const segment_ids = _.map(segments, "id");

  // Don"t update if we dont match one of the given segments
  if (synchronized_segments.length > 0 && !_.intersection(segment_ids, synchronized_segments).length) {
    hull.logger.info("update.skip", { id: user.id, reason: "not matching any segments" });
    return false;
  }

  let pushAction;

  if (changes.is_new) {
    if (send_create) pushAction = "was created";
  } else if (send_update) {
    pushAction = "was updated";
  } else if (_.size(changes.segments)) {
    const { entered = {}, left = {} } = changes.segments;
    if (send_enter && _.size(entered)) {
      const names = _.map(entered, "name");
      pushAction = ` - Entered segment${names.length > 1 ? "s" : ""} ${names.join(", ")}`;
    }
    if (send_left && _.size(left)) {
      const names = _.map(left, "name");
      pushAction = `${pushAction} - Left segment${names.length > 1 ? "s" : ""} ${names.join(", ")}`;
    }
  }

  try {
    if (pushAction) {
      new Slack(url, { unfurl_links: true }).send(userPayload(message, hull, pushAction));
      hull.logger.info("update.post", { action: pushAction, ..._.pick(user, "name", "id") });
    } else {
      hull.logger.info("update.skip", { action: "no matched action", ..._.pick(user, "name", "id") });
    }
  } catch (e) {
    hull.logger.error("update.error", e.stack);
  }

  return true;
}
