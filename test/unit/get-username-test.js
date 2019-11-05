import entityUtils from "../../server/util/entity-utils";
import _ from "lodash";

describe("Slack user name test", () => {
  const hullUser = {
    email: "firstName@company.com",
    name: "FirstName LastName",
    last_name: "LastName",
    first_name: "FirstName",
  };

  it("should return FirstName LastName", () => {
    const user = _.cloneDeep(hullUser);
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("FirstName LastName");
  });

  it("should return firstName@company.com", () => {
    const user = _.cloneDeep(hullUser);
    _.unset(user, "name");
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("firstName@company.com");
  });

  it("should return FirstName LastName", () => {
    const user = _.cloneDeep(hullUser);
    _.unset(user, "name");
    _.unset(user, "email");
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("FirstName LastName");
  });

  it("should return LastName", () => {
    const user = _.cloneDeep(hullUser);
    _.unset(user, "name");
    _.unset(user, "email");
    _.unset(user, "first_name");
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("LastName");
  });

  it("should return FirstName", () => {
    const user = _.cloneDeep(hullUser);
    _.unset(user, "name");
    _.unset(user, "email");
    _.unset(user, "last_name");
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("FirstName");
  });

  it("should return Unnamed User", () => {
    const user = _.cloneDeep(hullUser);
    _.unset(user, "name");
    _.unset(user, "email");
    _.unset(user, "last_name");
    _.unset(user, "first_name");
    const userName = entityUtils.getUserName(user);

    expect(userName).toBe("Unnamed User");
  });
});
