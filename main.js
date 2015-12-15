///////////////////////////////////////////////////////////
// Include
var MySQL = require("mysql");
var Helper = require("./helperfunctions.js");

///////////////////////////////////////////////////////////
// Private vars
var vConnection = null; // Mysql Connection object
var vTableList = null; // List of available tables
var vExports = {}; // Exported at the end

///////////////////////////////////////////////////////////
// Available functions

vExports.Connect = function(pOptions, pCallBack) {
	vExports.Close();
	vConnection = MySQL.createConnection(pOptions);

	vConnection.connect(function(pError){
		if(pError){
			throw new Error("Connection error: " + pError);
		}

		pCallBack("success");
	});
}

vExports.Select = function(pTable, pColumns, pCallBack){
	var vColumns = [], vTable = "";
	if(pColumns === "*"){
		vColumns = ["*"];
	}else {
		throw new Error("Not implemented column level select");
		// TODO: Implement column level selects...
	}

	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);

		// TODO: Run the actual select
		Query("SELECT * FROM " + vTableName, function(pRows, pFields){
			pRows.forEach(function(pRow, pRowIndex){
				pFields.forEach(function(pColumn, pColumnIndex){
					console.log(pColumn.name + ": " + pRow[pColumn.name]);
				});
			})
			pCallBack();
		});
	});
}

vExports.Close = function(){
	if(vConnection){
		vConnection.end();
		vConnection = null;
	}
}

///////////////////////////////////////////////////////////
// Private functions
function GetTableList(pCallBack){
	if(!vTableList){
		Query("SHOW TABLES", function(pRows, pFields){
			vTableList = [];

			//TODO: Use RowLoop function
			pRows.forEach(function(pRow, pRowIndex){
				pFields.forEach(function(pColumn, pColumnIndex){
					vTableList[vTableList.length] = pRow[pColumn.name];
				});
			})
			if(pCallBack)pCallBack();
		});
	}else{
		if(pCallBack)pCallBack();
	}
}

function Query(pQuery, pCallBack){
	vConnection.query(pQuery, function(pError, pRows, pFields){
		if(pError){
			throw new Error("Table listing error: " + pError);
		}

		pCallBack(pRows, pFields);
	});
}

// TODO: Finish this function
function RowLoop(pRows, pFields, pFunction){
	pRows.forEach(function(pRow, pRowIndex){
		pFields.forEach(function(pColumn, pColumnIndex){
			pFunction(pRow, pColumn.name);
		});
	})
}

module.exports = vExports;
