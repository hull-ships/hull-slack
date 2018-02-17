import slackdown from "slackdown";

export default function previewHandler(req, res) {
  console.log(req.body)
  if (!req.body.preview) {
    return res.send("No Message received");
  }
  return res.send(slackdown.parse(req.body.preview));
}
