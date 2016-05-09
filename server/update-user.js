import _ from 'lodash';
import moment from 'moment';
import Slack from 'node-slack';
import cache from './lib/cache';


function colorFactory(){
  const COLORS=['#83D586', '#49A2E1', '#FF625A', '#E57831', '#4BC2B8'];
  var i = -1;
  var l = COLORS.length;
  return function(){
    i++;
    return COLORS[i%l];
  }
}
function getUserName(user = {}) {
  return user.name
    || user.email
    || [user.first_name, ' ', user.last_name].join(' ')
    || 'Unnamed User';
}
function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split('.');
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}
function format(user={}, segments={}){
  const u = {
    user: {
      ..._.pick(user,
        'phone',
        'address',
        'address_city',
        'address_country',
        'address_state',
        'sessions_count',
        'email'
        ),
      'created_at': moment(user.created_at).fromNow(),
      'first_seen_at': moment(user.first_seen_at).fromNow(),
      'last_seen_at': moment(user.last_seen_at).fromNow()
    },
    segments: _.map(segments,'name'),
    ..._.pickBy(user, _.isPlainObject),
  }
  return u;
}
function fieldsFromObject(ob){
  if(_.isArray(ob)){
    return _.map(ob, (title)=>{ return {title, short: true}});
  }
  return _.map(ob, (value,title)=>{ return {title, value, short: true }})
}

export default function ({ message={} }, { hull={}, ship={} }) {
  const { user={}, segments=[], changes={} } = message;
  const { private_settings={} } = ship;
  const {send_to_named_channel, send_update, send_creation, synchronized_segments=[], channel, username, icon_url, hook_url } = private_settings;
  const log = hull.utils.log;

  if (!hull || !user || !user.id || !ship || !ship.settings) { return false; }

  //changes with User change == update.
  if (_.size(changes.user) && send_update===false){
    log(`Skipping user udpate for ${user.id} because skipping updates`)
    return null ;
  }

  //changes without User change == creation.
  if (!_.size(changes.user) && send_creation===false){
    log(`Skipping user udpate for ${user.id} because skipping creation`)
    return null ;
  }

  const slackUser = format(user, segments);
  const url = urlFor(user, hull.configuration().organization);
  const segment_ids   = _.map(segments, 'id');
  const name = getUserName(user);

  //Don't update if we dont match one of the given segments
  if ( synchronized_segments.length > 0 && !_.intersection(segment_ids, synchronized_segments).length){
    log(`Skipping user update for ${user.id} because not matching any segment`);
    return false;
  }

  const color = colorFactory();
  const attachments = _.reduce(_.omit(slackUser, 'user'), function(atts, value, key){
    if(_.isObject(value)){
      atts.push({
        author_name: key,
        color: color(),
        fallback: key,
        fields: fieldsFromObject(value),
      });
    }
    return atts;
  }, [{
      author_name: name,
      color      : color(),
      fallback   : name,
      fields     : fieldsFromObject(slackUser.user),
      thumb_url  : user.picture
  }]);

  const slack = new Slack(hook_url, {
    unfurl_links: true, username, icon_url, hook_url
  });

  function push(channel){
    try { 
      let data = {
        text: `<${url}|${name}> was updated`,
        channel, 
        attachments
      }
      slack.send(data);
      log(`${name} - ${user.id} sent to slack on ${channel}`)
    } catch(e){
      log('Error', e.stack);
    }
  }

  if (!!send_to_named_channel){
    _.map(segments, (s)=> push(_.snakeCase(_.deburr(s.name))) )
    //if sending to named channels, also send to Channel only if defined.
    if (channel) { push(channel); }
  } else {
    //push to channel or default, at least once.
    push(channel);
  }
}
