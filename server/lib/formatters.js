import _ from 'lodash';

function format(value, title) {
  return { title, value, short: true };
}
module.exports = {
  getUserName(user = {}) {
    return user.name
                || user.email
                || user.contact_email
                || user.first_name
                || user.last_name
                || 'Unnamed User';
  },
  formatAttachments(traits, name) {
    if (!_.size(traits)) { return []; }
    const o = {
      color: '#5AACFF'
    };
    if (traits.Picture) {
      o.thumb_url = traits.Picture;
      delete traits.Picture;
    }
    return {
      ...o,
      text: name,
      fallback: name,
      fields: _(traits).map(format).value()
    };
  },
  userUrl(user = {}, orgUrl) {
    const [namespace, domain, tld] = orgUrl.replace(/http(s)?:\/\//, '').split('.');
    return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
  },
};
