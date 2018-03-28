import slackdown from "slackdown";

export default function previewHandler(req, res) {
  if (!req.body.preview) return res.send("No Message received");
  const msg = slackdown.parse(req.body.preview).replace(/\n/g, "<br/>");
  console.log(msg);
  return res.send(msg);
}
