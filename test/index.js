var expect = require("chai").expect;

var vModule = require("../main");

describe("#Module test", function(){
	it("Checks if module is loaded", function() {
		expect(vModule).to.be.an("object");
	});
	it("Check for module function", function() {
		expect(vModule.getAnArray).to.be.a("function");
	});
	it("Gets an array;", function(){
		expect(vModule.getAnArray()).to.be.an("array");
	});
});
