import buildAttachments from "./build-attachments";
import getUserName from "./get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}


module.exports = function userPayload(message, hull, action) {
  const { user = {} } = message;

  const user_url = urlFor(user, hull.configuration().organization);
  const attachments = buildAttachments(message);
  const name = getUserName(user);
  return {
    text: `<${user_url}|${name}> ${action}`,
    attachments
  };


}
