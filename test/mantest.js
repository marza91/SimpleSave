var util = require('util');
var vTestConnection = require("../main");

console.log("Password: ");
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
	vPasswd = text.replace(/(\r\n|\n|\r)/gm,"");

	vTestConnection.Connect({
		host     : "127.0.0.1",
		port     : "3307",
		user     : "testuser",
		password : vPasswd,
		database : "dev_useraccess"
	}, function(pStatus){
		vTestConnection.Select("secv_myuser", "*", function(pRows, pFields){
			pRows.forEach(function(pRow, pRowIndex){
				pFields.forEach(function(pColumn, pColumnIndex){
					console.log(pColumn.name + ": " + pRow[pColumn.name]);
				});
			})
			vTestConnection.Close();
			process.exit();
		});
	});

});
