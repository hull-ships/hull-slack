import sinon from "sinon";

export default function botMock(valid = true) {
  return {
    say: sinon.spy(() => {
      if (!valid) throw new Error("Something bad happen :(");
    }),
    api: {
      channels: {
        list: (u, callback) => callback(undefined, {
          ok: true,
          channels: [{
            name: "tests",
            id: "t1"
          }]
        }),
        create: (u, callback) => callback(undefined, {
          channel: {
            id: "bca",
            name: "yolo"
          }
        }),
        invite: (u, callback) => callback()
      },
      users: {
        list: (u, callback) => callback(undefined, {
          ok: true,
          members: [{
            name: "rome",
            id: "abc"
          }]
        })
      },
    },
    config: {
      bot_id: "bot"
    },
    startPrivateConversation: sinon.spy((u, callback) => callback(undefined, { say: () => {} }))
  };
}
