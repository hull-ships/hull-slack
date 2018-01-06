export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const messages = [];
  let status = 'ok';
  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
}
