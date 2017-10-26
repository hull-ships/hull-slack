/* global describe, it */
import moment from "moment";
import assert from "assert";

import { replaceMarks } from "../../server/lib/user-payload";

describe("Replacement function", function test() {
  const channels = [{
    name: "hull",
    id: "0123"
  }];

  const members = [{
    name: "stephane",
    id: "0456"
  }];

  it("should properly replace user and event properties", () => {
    const payload = {
      user: {
        email: "test@email.com",
        lastSeenAt: moment().format()
      },
      event: {
        context: {
          ip: "8.8.8.8"
        }
      }
    };

    const message = "Hello user with email: {{user.email}} that was last seen at : {{user.lastSeenAt}}." +
      "event context ip : {{event.context.ip}}.";

    const expectedMessage = `Hello user with email: ${payload.user.email} that was last seen at : ${payload.user.lastSeenAt}.` +
      `event context ip : ${payload.event.context.ip}.`;

    assert.equal(replaceMarks(message, payload, channels, members), expectedMessage);
  });

  it("should properly replace with segment name", () => {
    const payload = {
      user: {
        email: "test@email.com"
      },
      segment: "custom"
    };

    const message = "Hello from {{segment}}";

    const expectedMessage = "Hello from custom";

    assert.equal(replaceMarks(message, payload, channels, members), expectedMessage);
  });

  it("should replace user properties and apply default one if some of them are absent", () => {
    const payload = {
      user: {
        email: "test@email.com"
      }
    };

    const message = "Hello user with name {{ user.name | Default Name }} and email {{user.email}}";

    const expectedMessage = `Hello user with name Default Name and email ${payload.user.email}`;

    assert.equal(replaceMarks(message, payload, channels, members), expectedMessage);
  });

  it("should properly replace channel annotations", () => {
    const message = "Hello user in channel #hull";

    const expectedMessage = `Hello user in channel <#${channels[0].id}>`;

    assert.equal(replaceMarks(message, {}, channels, members), expectedMessage);
  });

  it("should properly replace member annotation", () => {
    const message = "Hello @stephane";

    const expectedMessage = `Hello <@${members[0].id}>`;

    assert.equal(replaceMarks(message, {}, channels, members), expectedMessage);
  });

  it("should trim additional and messy spaces", () => {
    const payload = {
      user: {
        email: "email@test.com"
      }
    };

    const message = "Hello user with email {{         user.email            }} and default property : {{      user.yolo   |        Badass Message    }}.";

    const expectedMessage = `Hello user with email ${payload.user.email} and default property : Badass Message.`;

    assert.equal(replaceMarks(message, payload, channels, members), expectedMessage);
  });
});
