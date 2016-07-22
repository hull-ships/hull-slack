import buildAttachments from "./build-attachments";
import getUserName from "./get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}


module.exports = function userPayload({ user = {}, segments = {}, changes = [], hull }, action) {
  const user_url = urlFor(user, hull.configuration().organization);
  const attachments = buildAttachments({ user, segments, changes });
  const name = getUserName(user);
  return {
    text: `<${user_url}|${name}> ${action}`,
    attachments
  };
};
