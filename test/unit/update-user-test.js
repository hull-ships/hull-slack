/* global describe, it */
import assert from "assert";

import updateUser from "../../server/update-user";
import botMock from "./support/bot-mock";
import clientMock from "./support/client-mock";

describe("Replacement function", function test() {
  const client = clientMock();

  it("should update user based on events notifications", done => {
    const bot = botMock();
    const connectSlack = () => bot;
    const users = [{
      changes: {},
      events: [{
        event: "sample event"
      }],
      user: {
        id: "12345",
        email: "test@email.com"
      }
    }];

    const ship = {
      private_settings: {
        notify_segments: [],
        notify_events: [{
          event: "sample event",
          channel: "#tests",
          liquidMessage: "Hello for event {{event.event}}"
        }],
        token: "asdf"
      }
    };

    updateUser(connectSlack, { client, ship }, users).then(() => {
      const call = bot.say.firstCall.args[0];
      assert.equal(call.channel, "t1");
      assert.equal(call.text, "*<https://dashboard.hullbeta.io/funny/users/12345|test@email.com>*\nHello for event sample event");
      done();
    });
  });

  it("should update user based on segments notifications", done => {
    const bot = botMock();
    const connectSlack = () => bot;

    const users = [{
      changes: {
        segments: {
          entered: [{
            name: "segmentA",
            id: "sa"
          }]
        }
      },
      events: [],
      user: {
        id: "12345",
        email: "test@email.com"
      }
    }];

    const ship = {
      private_settings: {
        notify_segments: [{
          segment: "sa",
          enter: true,
          channel: "#tests",
          liquidMessage: "Hello {{user.email}} for segment {{segment}}"
        }],
        notify_events: [],
        token: "asdf"
      }
    };

    updateUser(connectSlack, { client, ship }, users).then(() => {
      const call = bot.say.firstCall.args[0];
      assert.equal(call.channel, "t1");
      assert.equal(call.text, "*<https://dashboard.hullbeta.io/funny/users/12345|test@email.com>*\nHello test@email.com for segment segmentA");
      done();
    });
  });

  it("should properly send message to channel and private message to user", done => {
    const bot = botMock();
    const connectSlack = () => bot;

    const users = [{
      changes: {
        segments: {
          entered: [{
            name: "segmentB",
            id: "sas"
          }]
        }
      },
      events: [{
        event: "sample event2"
      }],
      user: {
        id: "123456",
        email: "test@email.com"
      }
    }];

    const ship = {
      private_settings: {
        notify_segments: [{
          segment: "sas",
          enter: true,
          channel: "#tests",
          liquidMessage: "Hello {{user.email}} for segment {{segment}}"
        }],
        notify_events: [{
          event: "sample event2",
          channel: "@rome",
          liquidMessage: "User just performed {{event.event}}"
        }],
        token: "asdf"
      }
    };

    updateUser(connectSlack, { client, ship }, users).then(() => {
      const firstCall = bot.say.firstCall.args[0];
      const secondCall = bot.say.secondCall.args[0];

      assert.equal(firstCall.channel, "abc"); // to rome
      assert.equal(firstCall.text, "*<https://dashboard.hullbeta.io/funny/users/123456|test@email.com>*\nUser just performed sample event2");

      assert.equal(secondCall.channel, "t1"); // to tests
      assert.equal(secondCall.text, "*<https://dashboard.hullbeta.io/funny/users/123456|test@email.com>*\nHello test@email.com for segment segmentB");

      done();
    });
  });

  it("should not notify when there is no enter od left checkbox checked", done => {
    const bot = botMock();
    const connectSlack = () => bot;

    const users = [{
      changes: {
        segments: {
          entered: [{
            name: "segmentC",
            id: "sass"
          }]
        }
      },
      events: [],
      user: {
        id: "1234"
      }
    }];

    const ship = {
      private_settings: {
        notify_segments: [{
          segment: "sas",
          channel: "#tests",
          liquidMessage: "Hello for segment {{segment}}"
        }],
        notify_events: [],
        token: "asdf"
      }
    };

    updateUser(connectSlack, { client, ship }, users).then(() => {
      assert(bot.say.notCalled);
      done();
    });
  });

  it("should send error message if something bad happen", done => {
    const bot = botMock(false);
    const connectSlack = () => bot;

    const users = [{
      changes: {
        segments: {
          entered: [{
            name: "segmentC",
            id: "sass"
          }]
        }
      },
      events: [],
      user: {
        id: "1234"
      }
    }];

    const ship = {
      private_settings: {
        notify_segments: [{
          segment: "sass",
          enter: true,
          channel: "#tests",
          liquidMessage: "Hello for segment {{segment}}"
        }],
        notify_events: [],
        token: "asdf"
      }
    };

    updateUser(connectSlack, { client, ship }, users).then(() => {
      assert(bot.startPrivateConversation.calledOnce);
      done();
    });
  });
});
