import _ from "lodash";

export default function getCompactChannelName(channel = "") {
  return channel.toLowerCase().replace("#", "").replace(/\s+/g, "_").substring(0, 21);
}
