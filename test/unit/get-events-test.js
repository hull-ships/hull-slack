import getEvents from "../../server/util/get-events";
import _ from "lodash";

describe("Slack user segment entered test", () => {
  const events = [
    {
      properties: {
        PropertyName: "",
        event: "Test Event",
      },
      event_id: "20fe27f6-efa0-47c3-ae2b-6499bb4441c9",
      user_id: "5bd329d4e2bcf3eeaf000084",
      event_source: "",
      app_name: "",
      event: "Test Event",
      event_type: "track",
      context: {},
      anonymous_id: null,
      ship_id: null,
      created_at: "",
      session_id: null,
      app_id: "",
    },
  ];

  it("user and account segments match synchronized user and account segments", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["5c460f417b5385471e00002f"],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(1);
    expect(triggered[0]).toBe("#testing");

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Performed "Test Event"');
  });

  it("user matches synchronized user segments and account does not match account synchronized segments", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["5c460f417b5385471e00002f"],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(0);
    expect(messages.length).toBe(0);
  });

  it("User segments do not match synchronized segments, but account segments match synchronized account segments", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["synchronizedUserSegment"],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(0);
    expect(messages.length).toBe(0);
  });

  it("Neither user nor accounts match synchronized segments", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["synchronizedUserSegment"],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(0);
    expect(messages.length).toBe(0);
  });

  it("No user or account segments are defined on the entities", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["synchronizedUserSegment"],
      },
    ];

    const userSegmentIds = [];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(0);
    expect(messages.length).toBe(0);
  });

  it("All synchronized segment defined, should not filter any user", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: ["ALL"],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(1);
    expect(triggered[0]).toBe("#testing");

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Performed "Test Event"');
  });

  it("synchronized segments are undefined, should not filter any user", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: undefined,
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(1);
    expect(triggered[0]).toBe("#testing");

    expect(messages.length).toBe(1);
    expect(messages[0]).toBe('Performed "Test Event"');
  });

  it("synchronized segments are empty, should filter all users", () => {
    const notify_events = [
      {
        event: "Test Event",
        channel: "#testing",
        synchronized_segments: [],
      },
    ];

    const userSegmentIds = [
      "5c460f417b5385471e00002f",
      "5c50a5737fdb2fd3bc0000ec",
    ];

    const response = getEvents(events, notify_events, userSegmentIds);

    const triggered = _.get(response, "triggered");
    const messages = _.get(response, "messages");

    expect(triggered.length).toBe(0);
    expect(messages.length).toBe(0);
  });
});
