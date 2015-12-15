


var expect = require("chai").expect;

var simplesave = require("../main"), vTestConnection;

describe("#simplesave test", function(){
	it("Checks if module is loaded", function() {
		expect(simplesave).to.be.an("object");
	});
	it("Try a connection and select data", function() {
		vTestConnection = simplesave.NewConnection();
		expect(vTestConnection).to.be.an("object");

		vTestConnection.Connect({
			host     : "127.0.0.1",
			port     : "3307",
			user     : "testuser",
			password : "Ar4bi4",
			database : "dev_useraccess"
		}, function(pStatus){
			expect(pStatus).to.equal("success");

			vTestConnection.Select("somehting", "*", function(pErr, pData){
				expect(pErr).to.be.undefined;
				console.log(pData);
			});
		});
	});
});
