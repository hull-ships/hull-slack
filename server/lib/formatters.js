import _ from 'lodash';
import moment from 'moment';
import humanize from './humanize';

const formatters = {
  hide: /(id)|.*(_id)$/,
  group: [
    { prefix: 'traits',         name:'Traits'},
    { prefix: 'segments',       name:'Segments'},
    { prefix: 'facebook',       name:'Facebook'},
    { prefix: 'actions',        hide: true },
    { prefix: 'form',           hide: true },
    { prefix: 'first_session',  hide: true },
    { prefix: 'latest_session', hide: true },
    { prefix: 'signup_session', hide: true }
  ],
  rename: {
    'signup_session_initial_url': 'signup_url'
  },
  format:[
    {
      pattern: /_at$/,
      format(val){ return moment(val).format('dd, MM, Do, YYYY, HH:mm');; }
    }
  ]
}

function fields(obj){
  return _.map(obj,(value, title)=>{
    return { title, value, short: true }
  })
}
function displayName(prefix, fallback='User Details'){
  return (_.find(formatters.group, { prefix })||{}).name || fallback;
}
function displayPlatformName(name=''){
  return name.replace(/platforms\//,'');
}

module.exports = {
  formatters: formatters,

  userUrl(user={}, orgUrl){
    const [namespace, domain, tld] = orgUrl.replace(/http(s)?:\/\//,'').split('.');
    return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
  },

  formatGroup(group, name, section){
    name = section ? `${humanize(section.type)}: ${section.name}` : displayName(name);
    return {
      text: name,
      fields: fields(group),
      fallback: name,
      color: "#5AACFF"
    }
  }
}
