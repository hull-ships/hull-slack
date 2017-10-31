export default function clientMock() {
  const client = {
    logger: {
      info: (subject, data) => console.log(subject, data),
      debug: (subject, data) => console.log(subject, data),
      error: (subjet, data) => console.log(subjet, data)
    },
    asUser: () => client,
    configuration: () => ({
      organization: "funny.hullbeta.io",
      ship: "shipId",
      secret: "1234"
    })
  };
  return client;
}
