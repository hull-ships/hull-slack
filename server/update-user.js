import _ from 'lodash';
import _ from 'lodash';
// import Slack from 'node-slack';
import cache from './lib/cache';

export default function ({ message }, { hull, ship }) {
  const { user, segments } = message;

  if (!hull || !user || !user.id || !ship || !ship.settings) { return false; }

  const u = {
    user: _.pick(user, 'name', 'phone', 'address', ),
    ..._.pick(user, _.isPlainObject),
    segments: _.map(segments,'name')
  }

  console.log(u);

  cache(ship.id, '/search/user_reports/bootstrap', hull).then((properties) => {
  //   const url = userUrl(user, hull.configuration().orgUrl);
  //   const name = getUserName(user);
    
  //   const attachments = transform({
  //     format: formatAttachments,
  //     blacklist,
  //     properties,
  //     user
  //   });

  //   const s = flatten(segments, 'name');
  //   if (s) {
  //     attachments.push({
  //       title: 'Segments',
  //       color: '#ff6600',
  //       text: s
  //     });
  //   }
  //   new Slack(ship.settings.hook_url).send({
  //     ..._.omit(ship.settings, 'hook_url'),
  //     text: `<${url}|${name}> Updated`,
  //     unfurl_links: true,
  //     attachments
  //   });
    console.log(properties);
  }, log).catch(log);
}
