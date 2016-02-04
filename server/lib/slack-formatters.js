import _ from 'lodash';
import moment from 'moment';

function fields(obj){
  return _.map(obj,(value, title)=>{
    return { title, value, short: true }
  })
}
module.exports = {
  formatter: {
    hide: /(id)|.*(_id)$/,
    group: [
      { prefix: 'traits',         name:'Traits'},
      { prefix: 'segments',       name:'Segments'},
      { prefix: 'facebook',       name:'Facebook'},
      { prefix: 'actions',        hide: true },
      { prefix: 'first_session',  hide: true },
      { prefix: 'latest_session', hide: true },
      { prefix: 'signup_session', hide: true}
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
  },

  userUrl(user={}, orgUrl){
    const [namespace, domain, tld] = orgUrl.replace(/http(s)?:\/\//,'').split('.');
    return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
  },

  attachement(obj, text){
    return {
      text,
      fields: fields(obj),
      fallback: text,
      color: "#5AACFF"
    }
  }

}
