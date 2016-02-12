import _ from 'lodash';
import moment from 'moment';

const DEFAULTS = {
  string: '',
  number: 0,
  boolean: 'False'
};

const FORMAT = {
  date(d) {
    if (!d) { return 'Never'; }
    return moment(d).format('dd, MM, Do, YYYY, HH:mm');
  }
};

function noop(v) {return v;}

export default function ({ properties = {}, user = {}, format, blacklist = [] }) {
  const filtered = _.omit(user, blacklist);
  const groups = _(properties.tree)
    .keyBy((c) => c.text)
    .pick(['User', 'Traits'])
    .reduce((group, section) => {
      group[section.text] = _.reduce(section.children, (memo, child) => {
        if (filtered.hasOwnProperty(child.id)) {
          const formatter = FORMAT[child.type] || noop;
          memo[child.text] = formatter(
            filtered[child.id]
            || child.default
            || DEFAULTS[child.type]
          );
        }
        return memo;
      }, {});
      return group;
    }, {});
  return _.map(groups, format);
}
