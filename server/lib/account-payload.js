//@noflow
import _ from "lodash";
import buildAttachments from "./build-attachments";
import entityUtils from "../util/entity-utils";

function urlFor(account = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/accounts/${
    account.id
  }`;
}

const getActions = (account, traits, actions, group = "") => ({
  title: `Actions for ${account.domain}`,
  fallback: "Can't show message actions",
  attachment_type: "default",
  mrkdwn_in: ["text", "fields", "pretext"],
  callback_id: account.id,
  actions: [
    ..._.map(
      _.filter(
        actions,
        a => a.label !== "" && a.property !== "" && a.value !== "",
        a => {
          return {
            name: "trait",
            value: JSON.stringify({
              [a.property.replace(/^account\./, "")]: entityUtils.cast(a.value),
            }),
            text: a.label,
            type: "button",
          };
        }
      )
    ),
    {
      name: "expand",
      style: group === "traits" ? "primary" : "default",
      value: "traits",
      text: "Show all attributes",
      type: "button",
    },
  ],
});

module.exports = function accountPayload({
  hull,
  account = {},
  account_segments = {},
  changes = [],
  actions = [],
  account_whitelist = [],
  message = "",
  group = "",
}) {
  const account_url = urlFor(account, hull.configuration().organization);
  const w = group ? [] : account_whitelist;
  const atts = buildAttachments({
    entity: account,
    entity_segments: account_segments,
    entity_changes: changes,
    pretext: message,
    entity_whitelist: w,
    targetEntity: "account",
  });
  const name = entityUtils.getDomainName(account);
  const attachments = _.values(_.pick(atts, "segments", "changes"));

  if (group && group !== "traits") {
    const t = _.filter(
      atts.traits,
      traitGroup => traitGroup.fallback.toLowerCase() === group.toLowerCase()
    );
    attachments.push(...t);
  } else {
    attachments.push(...atts.traits);
  }
  attachments.unshift(atts.account);

  attachments.push(
    getActions(account, atts.traits, atts.events, actions, group)
  );

  return {
    text: `*<${account_url}|${name}>*`,
    attachments,
  };
};
