import { WebClient } from "@slack/client";

export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const messages = [];
  let status = "ok";
  const reply = (s, m) => {
    console.log(ship.private_settings);
    res.json({ status: s, messages: m });
    client.put(`${req.hull.ship.id}/status`, { status: s, messages: m });
  };

  const {
    private_settings: {
      token,
      team_id,
      user_id,
      bot: { bot_user_id, bot_access_token, incoming_webhook }
    }
  } = ship;
  if (!bot_user_id && !bot_access_token && !team_id && !user_id && !token) {
    status = "warning";
    messages.push("Connector not configured. Please authenticate with Slack");
  } else if (
    !bot_user_id ||
    !bot_access_token ||
    !team_id ||
    !user_id ||
    !token
  ) {
    status = "error";
    messages.push("Invalid configuration, please authenticate again");
  }
  console.log(bot_user_id);

  // Early return if config incomplete;
  if (status !== "ok") return reply(status, messages);

  const web = new WebClient(token);
  const bot = new WebClient(bot_access_token);
  return web.api
    .test()
    .catch(err => {
      throw new Error(`Error accessing Slack API: ${err.message}`);
    })
    .then(() => web.auth.test())
    .catch(err => {
      throw new Error(`Error testing Slack Auth: ${err.message}`);
    })
    .then(() => bot.bots.info(bot_user_id))
    .catch(err => {
      throw new Error(`Error testing Bot config: ${err.message}`);
    })
    .then(() => reply(status, messages))
    .catch(err => {
      if (err) {
        status = "error";
        messages.push(err.message);
        reply(status, messages);
      }
    });
}
