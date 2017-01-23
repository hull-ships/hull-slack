import {expect} from 'chai';
import getHash from "../server/lib/get-search-hash";

describe("Get search hash", function() {
	it("should get search hash", function() {
		expect(getHash("id", {match:[1, 2, 3, 4]})).to.eql({ id: 2, rest: 3 });
		expect(getHash("email", {match:[1, 2, 3, 4]})).to.eql({ email: 4 });
    });
});