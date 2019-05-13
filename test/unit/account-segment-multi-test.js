import getAccountChanges from "../../server/util/get-account-changes";
import _ from "lodash";

describe("Slack account segment test", () => {
  // segments the user is currently in
  const userSegmentIds = [
    "5c460f417b5385471e00002f",
    "5c50a5737fdb2fd3bc0000ec",
  ];

  const notify_account_segments = [
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-3",
      synchronized_segment: "segment3",
    },
    {
      event: "LEFT_ACCOUNT_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment1",
    },
  ];

  const notify_account_segments_multi_channel = [
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-1-other-channel",
      synchronized_segment: "segment1",
    },
    {
      event: "LEFT_ACCOUNT_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment3",
    },
    {
      event: "LEFT_ACCOUNT_SEGMENT",
      channel: "#testing-left-segment-4",
      synchronized_segment: "segment4",
    },
  ];

  const notify_account_segments_multi_segment = [
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment-2",
      synchronized_segment: "segment2",
    },
  ];

  const changes = {
    is_new: false,
    user: {},
    account: {},
    account_segments: {
      entered: [
        {
          id: "segment1",
          name: "Smugglers",
          updated_at: "2019-04-24T17:54:46Z",
          type: "accounts_segment",
          created_at: "2018-11-29T10:46:39Z",
        },
        {
          id: "segment2",
          name: "Not Smugglers",
          updated_at: "2019-04-24T17:54:46Z",
          type: "accounts_segment",
          created_at: "2018-11-29T10:46:39Z",
        },
      ],
      left: [
        {
          id: "segment3",
          name: "Not Smugglers",
          updated_at: "2019-04-24T17:54:46Z",
          type: "accounts_segment",
          created_at: "2018-11-29T10:46:39Z",
        },
      ],
    },
    segments: {},
  };

  it("account is not yet in segment and enters it. Segment entered is synchronized in settings", () => {
    const response = getAccountChanges(changes, notify_account_segments);

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(1);
    expect(entered[0]).toBe("#testing-entered-segment-1");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(2);
    expect(messages[0]).toBe('Entered segments "Smugglers", "Not Smugglers"');
    expect(messages[1]).toBe('Left segment "Not Smugglers"');
  });

  it("account enters and leaves segments. Segments are synchronized in settings", () => {
    const response = getAccountChanges(
      changes,
      notify_account_segments_multi_channel
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(2);
    expect(entered[0]).toBe("#testing-entered-segment-1");
    expect(entered[1]).toBe("#testing-entered-segment-1-other-channel");

    expect(left.length).toBe(1);
    expect(left[0]).toBe("#testing-left-segment-1");

    expect(messages.length).toBe(2);
    expect(messages[0]).toBe('Entered segments "Smugglers", "Not Smugglers"');
    expect(messages[1]).toBe('Left segment "Not Smugglers"');
  });

  it("account enters multiple segments. Segments are synchronized in settings", () => {
    const response = getAccountChanges(
      changes,
      notify_account_segments_multi_segment
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(2);
    expect(entered[0]).toBe("#testing-entered-segment-1");
    expect(entered[1]).toBe("#testing-entered-segment-2");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(2);
    expect(messages[0]).toBe('Entered segments "Smugglers", "Not Smugglers"');
    expect(messages[1]).toBe('Left segment "Not Smugglers"');
  });
});
