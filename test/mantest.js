var expect = require("chai").expect;

var vTestConnection = require("../main"), vTestConnection;

expect(vTestConnection).to.be.an("object");

vTestConnection.Connect({
	host     : "127.0.0.1",
	port     : "3307",
	user     : "testuser",
	password : "Ar4bi4",
	database : "dev_useraccess"
}, function(pStatus){
	expect(pStatus).to.equal("success");

	vTestConnection.Select("secv_myuser", "*", function(pFields){

		console.log(pFields);

		vTestConnection.Close();
	});
});
