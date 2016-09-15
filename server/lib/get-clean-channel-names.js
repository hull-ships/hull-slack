import _ from "lodash";

export default function getCleanChannelNames(names = []) {
  return _.compact(
    _.uniq(
      _.map(names, name => name
        .toLowerCase()
        .replace('#', '')
        .replace(/\s+/g, '_')
        .substring(0, 21)
      )
    )
  );
}
