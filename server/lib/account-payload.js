//@noflow
import buildAttachments from "./build-attachments";
import entityUtils from "../util/entity-utils";

module.exports = function accountPayload({
  hull,
  account = {},
  account_segments = {},
  changes = [],
  account_whitelist = [],
  message = "",
  group = "",
}) {
  const targetEntity = "account";
  const account_url = entityUtils.urlFor({
    account,
    organization: hull.configuration().organization,
    entity: "account",
  });
  const w = group ? [] : account_whitelist;
  const atts = buildAttachments({
    entity: account,
    entity_segments: account_segments,
    entity_changes: changes,
    pretext: message,
    entity_whitelist: w,
    targetEntity: targetEntity,
  });

  const attachments = entityUtils.getAttachments(atts, group, targetEntity);

  const name = entityUtils.getDomainName(account);
  return {
    text: `*<${account_url}|${name}>*`,
    attachments,
  };
};
