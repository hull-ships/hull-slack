import getAccountChanges from "../../server/util/get-account-changes";
import _ from "lodash";

describe("Slack user segment entered test", () => {
  // segments the user is currently in
  const userSegmentIds = [
    "5c460f417b5385471e00002f",
    "5c50a5737fdb2fd3bc0000ec",
  ];

  const notify_account_segments = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-3",
      synchronized_segment: "segment3",
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment1",
    },
  ];

  const notify_account_segments_undefined = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: undefined,
    },
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-1-other-channel",
      synchronized_segment: undefined,
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment1",
    },
  ];

  const notify_account_segments_multi_channel = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-entered-segment-1-other-channel",
      synchronized_segment: "segment1",
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment1",
    },
  ];

  const notify_events_all_segments = [
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-all-entered-1",
      synchronized_segment: "ALL",
    },
    {
      event: "ENTERED_USER_SEGMENT",
      channel: "#testing-all-entered-2",
      synchronized_segment: "ALL",
    },
    {
      event: "LEFT_USER_SEGMENT",
      channel: "#testing-all-left",
      synchronized_segment: "ALL",
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

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("account is not yet in segment and enters it. Segment entered is undefined in synchronized segments settings", () => {
    const response = getAccountChanges(
      changes,
      notify_account_segments_undefined
    );

    const entered = _.get(response, "entered");
    const left = _.get(response, "left");
    const messages = _.get(response, "messages");

    expect(entered.length).toBe(2);
    expect(entered[0]).toBe("#testing-entered-segment-1");
    expect(entered[1]).toBe("#testing-entered-segment-1-other-channel");

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it("account is not yet in segment and enters it. Segment entered is in synchronized segments settings for multiple channels", () => {
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

    expect(left.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Entered segment "Smugglers"');
  });

  it(
    "account is not yet in segment and enters it. Segment entered is in defined as 'ALL' " +
      "synchronized segments settings for multiple channels",
    () => {
      const response = getAccountChanges(changes, notify_events_all_segments);

      const entered = _.get(response, "entered");
      const left = _.get(response, "left");
      const messages = _.get(response, "messages");

      expect(entered.length).toBe(2);
      expect(entered[0]).toBe("#testing-all-entered-1");
      expect(entered[1]).toBe("#testing-all-entered-2");

      expect(left.length).toBe(0);

      expect(messages.length).toBe(1);
      expect(messages[0]).toBe('Entered segment "Smugglers"');
    }
  );
});
