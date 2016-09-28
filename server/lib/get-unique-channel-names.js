import _ from "lodash";

export default function getUniqueChannelNames(channels = []) {
  if (!channels.length) return [];
  const names = _.compact(_.uniq(channels));
  return _.map(names, name => name.toLowerCase().replace('#', '').replace(/\s+/g, '_').substring(0, 21));
}
