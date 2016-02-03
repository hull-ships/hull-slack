import _ from 'lodash';
import Slack from 'node-slack';
import humanize from './lib/humanize'
import { resolve, reduce } from './lib/formatters';
import slackFormat from './lib/slack-formatters';


const parse = function(hull, user, segments){
  user.segments = _.map(segments, (s)=>{ s.name }).join(', ');
  
  const { formatter, attachement } = slackFormat;
  const groups = reduce(user, formatter);
  const promises = resolve(groups, hull, attachement, formatter);
  return Promise.all(promises);
}

export default function(notification={}, context={}){
  const { hull, ship } = context;
  const { user, segments } = notification.message;

  if(!user || !user.id || !ship || !ship.settings){ return false; }

  return parse(hull, user, segments).then((attachments)=>{
    const slack = new Slack(ship.settings.hook_url);
    const url = slackFormat.userUrl(user, hull.configuration().orgUrl);
    const name = user.name||user.email||user.contact_email||"User";
    slack.send({
      ..._.omit(ship.settings, 'hook_url'),
      text: `${name} Updated: <${url}|See User>`,
      unfurl_links: true,
      attachments
    });
  }, (err)=>{
    console.log(err)
  });
}
