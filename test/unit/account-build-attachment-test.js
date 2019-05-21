import buildAttachments from "../../server/lib/build-attachments";
import _ from "lodash";
const slackFixture = require("../fixtures/account-build-attachment-test");

describe("Build account attachment to send to slack", () => {
  const account = slackFixture.message.account;
  const segments = slackFixture.message.account_segments;
  const changes = slackFixture.message.changes;
  const events = slackFixture.message.events;
  const message = slackFixture.slackMessage;
  const whitelist = slackFixture.connector.private_settings.account_whitelist;

  it("build user attachment", () => {
    const atts = buildAttachments({
      entity: account,
      entity_segments: segments,
      entity_changes: changes,
      entity_segment_changes: changes.account_segments,
      entity_events: events,
      pretext: message,
      entity_whitelist: whitelist,
      targetEntity: "account",
    });

    const accountPretext = _.get(atts, "account.pretext");
    const accountFields = _.get(atts, "account.fields");
    const accountFallback = _.get(atts, "account.fallback");
    const traits = _.get(atts, "traits")[0];
    const traitsText = _.get(traits, "text");
    const traitsFallback = _.get(traits, "fallback");
    const segmentField = _.get(atts, "segments.fields")[0];
    const segmentFieldTitle = _.get(segmentField, "title");
    const segmentFieldValue = _.get(segmentField, "value");
    const segmentText = _.get(atts, "segments.text");
    const segmentAuthorName = _.get(atts, "segments.author_name");
    const attchChangesAuthorName = _.get(atts, "changes.author_name");
    const attchChangesText = _.get(atts, "changes.text");
    const attchEvents = _.get(atts, "events");

    expect(accountPretext).toBe('Left segment "UserSegment1"');
    expect(traitsText).toBe("*Custom1*: custom1-val\n*Custom2*: custom2-val");
    expect(traitsFallback).toBe("outreach");
    expect(segmentFieldTitle).toBe(":outbox_tray: Left segment");
    expect(segmentFieldValue).toBe("Segment1");
    expect(segmentText).toBe("Segment3, Segment2");
    expect(segmentAuthorName).toBe(":busts_in_silhouette: Segments");
    expect(accountFallback).toBe("thehullcompany.com");
    expect(attchChangesAuthorName).toBe(":chart_with_upwards_trend: Changes");
    expect(attchChangesText).toBe("*Name*: Old Name → New Name");
    expect(_.keys(attchEvents).length).toBe(0);
    expect(_.keys(accountFields).length).toBe(0);

  });

  it("test with segments and changes turned off", () => {
    const atts = buildAttachments({
      entity: account,
      entity_segments: segments,
      entity_changes: changes,
      entity_segment_changes: changes.account_segments,
      entity_events: events,
      pretext: message,
      entity_whitelist: whitelist,
      targetEntity: "account",
      options: { sendSegments: false, sendChanges: false },
    });

    expect(_.get(atts, "changes", null)).toBe(null);
    expect(_.get(atts, "segments", null)).toBe(null);
  });
});
