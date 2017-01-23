import {expect} from 'chai';
import flag from "../server/lib/flags";

describe("Get flag code", function() {
	it("gets flag code", function() {
		expect(flag("uganda")).to.equal(":flag-ug:");
		expect(flag("spain")).to.equal(":flag-es:");
		expect(flag("turks and caicos islands")).to.equal(":flag-tc:");
		expect(flag("unknown")).to.equal(":house:");
    });
});