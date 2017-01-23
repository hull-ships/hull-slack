import {expect} from 'chai';
import getUserName from "../server/lib/get-user-name";

describe("Get user name", function() {
	it("should get user name", function() {
		expect(getUserName({'email': 'email@email.com', 'name': 'userName'})).to.equal('userName');
		expect(getUserName({'email': 'email@email.com', 'first_name': 'firstName'})).to.equal('email@email.com');
		expect(getUserName({})).to.equal('Unnamed User');
    });
});