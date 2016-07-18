import _ from "lodash";
import Slack from "node-slack";
import buildAttachments from "./lib/build-attachments";
import getUserName from "./lib/get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}


export default function ({ message = {} }, { hull = {}, ship = {} }) {
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

  const user_url = urlFor(user, hull.configuration().organization);
  const slack = new Slack(url, { unfurl_links: true });
  const attachments = buildAttachments(message);

  function push(action = "was updated") {
    try {
      const name = getUserName(user);
      const data = { text: `<${user_url}|${name}> ${action}`, attachments };
      slack.send(data);
      hull.logger.info("update.post", { action, ..._.pick(user, "name", "id") });
    } catch (e) {
      hull.logger.error("update.error", e.stack);
    }
  }

  let pushAction = "";

  if (changes.is_new) {
    if (send_create) {
      pushAction = "was created";
    }
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

  if (pushAction) push(pushAction);

  return true;
}
