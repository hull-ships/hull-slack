import getAccountChanges from "../../server/util/get-account-changes";
import _ from "lodash";

describe("Slack account segment left test", () => {
  // segments the user is currently in
  const userSegmentIds = [
    "5c460f417b5385471e00002f",
    "5c50a5737fdb2fd3bc0000ec",
  ];

  const notify_account_segments = [
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment1",
      synchronized_segment: "segment1",
    },
    {
      event: "ENTERED_ACCOUNT_SEGMENT",
      channel: "#testing-entered-segment3",
      synchronized_segment: "segment3",
    },
    {
      event: "LEFT_ACCOUNT_SEGMENT",
      channel: "#testing-left-segment-1",
      synchronized_segment: "segment1",
    },
    {
      event: "LEFT_ACCOUNT_SEGMENT",
      channel: "#testing-left-segment-3",
      synchronized_segment: "segment3",
    },
  ];

  const changes = {
    is_new: false,
    user: {},
    account: {},
    account_segments: {
      left: [
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

    expect(left.length).toBe(1);
    expect(left[0]).toBe("#testing-left-segment-1");

    expect(entered.length).toBe(0);

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Left segment "Smugglers"');
  });
});
