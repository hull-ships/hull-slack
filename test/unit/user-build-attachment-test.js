import buildAttachments from "../../server/lib/build-attachments";
import _ from "lodash";
const slackFixture = require("../fixtures/user-build-attachment-test");

describe("Build user attachment to send to slack", () => {
  const user = slackFixture.message.user;
  const segments = slackFixture.message.segments;
  const changes = slackFixture.message.changes;
  const events = slackFixture.message.events;
  const message = slackFixture.slackMessage;
  const whitelist = slackFixture.connector.private_settings.whitelist;

  it("build user attachment", () => {
    const atts = buildAttachments({
      entity: user,
      entity_segments: segments,
      entity_changes: changes,
      entity_segment_changes: changes.segments,
      entity_events: events,
      pretext: message,
      entity_whitelist: whitelist,
      targetEntity: "user",
    });

    const userPretext = _.get(atts, "user.pretext");
    const userFields = _.get(atts, "user.fields");
    const traits = _.get(atts, "traits")[0];
    const traitsText = _.get(traits, "text");
    const segmentField = _.get(atts, "segments.fields")[0];
    const segmentFieldTitle = _.get(segmentField, "title");
    const segmentFieldValue = _.get(segmentField, "value");
    const segmentText = _.get(atts, "segments.text");
    const segmentAuthorName = _.get(atts, "segments.author_name");
    const attchChanges = _.get(atts, "changes");
    const attchEvents = _.get(atts, "events");

    expect(userPretext).toBe('Entered segment "UserSegment1"');
    expect(traitsText).toBe(
      "*Custom1*: custom1-value\n*Custom2*: custom2-value"
    );
    expect(segmentFieldTitle).toBe(":inbox_tray: Entered segment");
    expect(segmentFieldValue).toBe("UserSegment1");
    expect(segmentText).toBe("UserSegment1, UserSegment2");
    expect(segmentAuthorName).toBe(":busts_in_silhouette: Segments");
    expect(_.keys(attchChanges).length).toBe(0);
    expect(_.keys(attchEvents).length).toBe(0);
    expect(_.keys(userFields).length).toBe(1);
    expect(userFields[0].value).toBe(":love_letter: andy@hull.com");
  });
});
