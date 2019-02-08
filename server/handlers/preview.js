import slackdown from "slackdown";
import Liquid from "liquid-node";

export default function previewHandlerFactory() {
  const engine = new Liquid.Engine();
  return function preview(req, res) {
    if (!req.body.content) return res.send("No Message received");
    const { content, data } = req.body;
    engine
      .parseAndRender(content, data)
      .then(result => slackdown.parse(result))
      .then(slackdownFormatted => res.send(slackdownFormatted))
      .catch(err => {
        res.json({ error: err.message });
        throw err;
      });
    return true;
  };
}
