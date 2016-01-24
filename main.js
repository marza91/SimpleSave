///////////////////////////////////////////////////////////
// Include
var MySQL = require("mysql");
var Helper = require("./helperfunctions.js");

///////////////////////////////////////////////////////////
// Private vars
var vConnection = null; // Mysql Connection object
var vConnectionOptions = null; // Connection options for reference
var vTableList = null; // List of available tables
var vTableColumns = {}; // List of table columns
var vExports = {}; // Exported at the end

///////////////////////////////////////////////////////////
// Available functions

vExports.Connect = function(pOptions, pCallBack) {
	vConnectionOptions = pOptions;
	vExports.Close();
	vConnection = MySQL.createConnection(vConnectionOptions);

	vConnection.connect(function(pError){
		if(pError){
			throw new Error("Connection error: " + pError);
		}

		pCallBack("success");
	});
}

vExports.Select = function(pTable, pColumns, pCallBack){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) throw new Error("Invalid table name!");

		if(pColumns === "*"){
			Query("SELECT * FROM " + vTableName, pCallBack);
		}else{
			if(typeof pColumns === "string") {
				pColumns = [pColumns];
			}

			GetColumList(vTableName, function(){
				var vColumns = [];
				pColumns.forEach(function(pColumn){
					var vColumn = Helper.VerifyField(pColumn, vTableColumns[vTableName]);
					if(!vColumn) throw new Error("Invalid column!")
					vColumns[vColumns.length] = vColumn;
				});
				Query("SELECT " + vColumns.join(", ") + " FROM " + vTableName, pCallBack);
			});
		}
	});
}

vExports.Insert = function(pTable, pData, pCallBack){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) throw new Error("Invalid table name!");

		GetColumList(vTableName, function(){
			/*vData = {
				name: "my project",
				description: "hahahaha"
			}*/

			var vKeys = Object.keys(pData);

			var vColumns = [];
			vKeys.forEach(function(pColumn){
				var vColumn = Helper.VerifyField(pColumn, vTableColumns[vTableName]);
				if(!vColumn) throw new Error("Invalid column!")
				vColumns[vColumns.length] = vColumn;
			});
			//TODO: Verify/sanitize data
			var vData = [];
			vColumns.forEach(function(pColumn){
				vData[vData.length] = pData[pColumn];
			});

			var sql = "INSERT INTO " + vTableName + "(" + vColumns.join(", ") + ")" +
						"VALUES('" + vData.join("', '") + "')";

			Query(sql, pCallBack);
		});
	});
}

vExports.Update = function(pTable){
	throw new Error("Not implemented!")
}

vExports.Delete = function(pTable){
	throw new Error("Not implemented!")
}

vExports.Execute = function(pProcedure){
	throw new Error("Not implemented!")
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
		Query("SHOW TABLES", function(pResultSet){
			vTableList = [];

			pResultSet.Rows.forEach(function(pRow, pRowIndex){
				pResultSet.Columns.forEach(function(pColumn, pColumnIndex){
					vTableList[vTableList.length] = pRow[pColumn]; //Column name will be like "Tables_in_tablename"
				});
			})
			if(pCallBack)pCallBack();
		});
	}else{
		if(pCallBack)pCallBack();
	}
}

function GetColumList(pTable, pCallBack){
	if(vTableColumns[pTable]){
		pCallBack();
	}else {
		Query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
	 			vConnectionOptions.database + "' AND `TABLE_NAME`='" + pTable + "';", function(pResultSet){

			vDef = [];
			pResultSet.Rows.forEach(function(pRow, pRowIndex){
				vDef[vDef.length] = pRow.COLUMN_NAME;
			});
			vTableColumns[pTable] = vDef;
			pCallBack();
		});

	}
}

function Query(pQuery, pCallBack){
	vConnection.query(pQuery, function(pError, pRows, pFields){
		if(pError){
			throw new Error("Table listing error: " + pError);
		}
		pCallBack(CreateResultSet(pRows, pFields));
	});
}

function CreateResultSet(pRows, pFields){
	var vRS = {
		Rows: pRows,
		Columns: []
	}
	if(pFields){
		pFields.forEach(function(pColumn, pColumnIndex){
			vRS.Columns[vRS.Columns.length] = pColumn.name;
		});
	}
	return vRS;
}
module.exports = vExports;
