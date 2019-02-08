//@noflow
export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings } = ship;
  const messages = [];
  let status = "ok";
  const send = () => {
    res.json({ messages, status });
    return client.put(`${req.hull.ship.id}/status`, { status, messages });
  };
  const {
    token,
    team_id,
    user_id,
    bot: { bot_user_id, bot_access_token } = {},
    notify_segments = [],
    notify_events = [],
  } = private_settings;

  if (!token) {
    messages.push(
      'Credentials are empty, Token isn\'t present, please authorize the app by clicking "Workspace"'
    );
    status = "error";
    return send();
  }
  if (!team_id || !user_id || !bot_user_id || !bot_access_token) {
    messages.push(
      "Authentication isn't properly setup. please re-authorize the app"
    );
    status = "error";
    return send();
  }

  if (!notify_segments.length && !notify_events.length) {
    messages.push(
      "No segments or events are set. No notifications will be sent"
    );
    status = "warning";
    return send();
  }

  return send();
}
