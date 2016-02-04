import _ from 'lodash';
import Slack from 'node-slack';
import humanize from './lib/humanize'
import { resolve, reduce } from './lib/enrichers';
import f from './lib/formatters';


const parse = function(hull, user, segments){
  user.segments = _.map(segments, (s)=>{ return s.name }).join(', ');
  const { formatters, formatGroup } = f;
  const groups = reduce(user, formatters);
  const promises = resolve(groups, hull, formatGroup, formatters);
  return Promise.all(promises);
}

export default function(notification={}, context={}){
  const { hull, ship } = context;
  const { user, segments } = notification.message;

  if(!user || !user.id || !ship || !ship.settings){ return false; }

  return parse(hull, user, segments).then((attachments)=>{
    const url = f.userUrl(user, hull.configuration().orgUrl);
    const name = user.name||user.email||user.contact_email||"User";

    new Slack(ship.settings.hook_url).send({
      ..._.omit(ship.settings, 'hook_url'),
      text: `${name} Updated: <${url}|See User>`,
      unfurl_links: true,
      attachments
    });
  }, (err)=>{
    console.log(err)
  }).catch((err)=>{
    console.log(err)
  });
}
