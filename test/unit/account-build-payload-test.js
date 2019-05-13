import buildAttachments from "../../server/lib/build-attachments";
import _ from "lodash";
const ClientMock = require("../mocks/client-mock");
import accountPayload from "../../server/lib/account-payload";
const slackFixture = require("../fixtures/account-build-payload-test");

describe("Build account attachment to send to slack", () => {
  const message = slackFixture.message;
  const slackMessage = slackFixture.slackMessage;
  const account_whitelist =
    slackFixture.connector.private_settings.account_whitelist;
  const account_actions =
    slackFixture.connector.private_settings.account_actions;

  const expectedPayload = {
    text:
      "*<https://dashboard.fakeDomain.io/fakeOrgId/accounts/5cc8c22e03f8923da5000648|thehullcompany.com>*",
    attachments: [
      {
        mrkdwn_in: ["text", "fields", "pretext"],
        pretext: 'Entered segment "Segment1"',
        fallback: "thehullcompany.com",
        color: "#83D586",
        fields: [],
        footer: ":eyeglasses: May 3rd 2019, 2:58:47 pm",
      },
      {
        author_name: ":busts_in_silhouette: Segments",
        text: "Segment3, Segment2, Segment1",
        fallback: "Segments: Segment3, Segment2, Segment1",
        color: "#49A2E1",
        fields: [],
      },
      {},
      {
        mrkdwn_in: ["text", "fields", "pretext"],
        author_name: ":globe_with_meridians: Outreach",
        text: "*Custom1*: custom1-val\n*Custom2*: custom2-val",
        color: "#FF625A",
        fallback: "outreach",
      },
      {
        title: "Actions for thehullcompany.com",
        fallback: "Can't show message actions",
        attachment_type: "default",
        mrkdwn_in: ["text", "fields", "pretext"],
        callback_id: "5cc8c22e03f8923da5000648",
        actions: [
          {
            name: "expand",
            style: "default",
            value: "traits",
            text: "Show all attributes",
            type: "button",
          },
        ],
      },
    ],
  };

  it("build user attachment", () => {
    let hull = ClientMock();
    const payload = accountPayload({
      ...message,
      hull,
      account_actions,
      message: slackMessage,
      account_whitelist,
    });

    expect(_.get(payload, "text")).toBe(_.get(expectedPayload, "text"));
    expect(_.get(payload, "text")).toBe(_.get(expectedPayload, "text"));
  });
});
