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

vExports.Connect = function(pOptions, pCallBackSuccess, pCallBackError) {
	vConnectionOptions = pOptions;
	vExports.Close();
	vConnection = MySQL.createConnection(vConnectionOptions);

	vConnection.connect(function(pError){
		if(pError){
			pCallBackError("Connection error: " + pError);
		}

		pCallBackSuccess("success");
	});
};

vExports.Select = function(pTable, pColumns, pFilter, pCallBackSuccess, pCallBackError){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) return pCallBackError("Invalid table name!");

		GetColumList(vTableName, function(){
			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTableName, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}


			if(pColumns === "*"){
				Query("SELECT * FROM " + vTableName + vFilter, pCallBackSuccess, pCallBackError);

			}else {
				if(typeof pColumns === "string") {
					pColumns = [pColumns];
				}

				var vColumns = [];
				pColumns.forEach(function(pColumn){
					var vColumn = Helper.VerifyField(pColumn, vTableColumns[vTableName]);
					if(!vColumn) return pCallBackError("Invalid column!");
					vColumns[vColumns.length] = vColumn;
				});
				Query("SELECT " + vColumns.join(", ") + " FROM " + vTableName + vFilter, pCallBackSuccess, pCallBackError);
			}
		});
	});
};

vExports.Insert = function(pTable, pData, pCallBackSuccess, pCallBackError){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) return pCallBackError("Invalid table name!");

		GetColumList(vTableName, function(){

			var vKeys = Object.keys(pData);

			var vColumns = [];
			vKeys.forEach(function(pColumn){
				var vColumn = Helper.VerifyField(pColumn, vTableColumns[vTableName]);
				if(!vColumn) return pCallBackError("Invalid column!");
				vColumns[vColumns.length] = vColumn;
			});
			var vData = [];
			vColumns.forEach(function(pColumn){
				vData[vData.length] = vConnection.escape(pData[pColumn]);
			});

			var sql = "INSERT INTO " + vTableName + "(" + vColumns.join(", ") + ")" +
						"VALUES('" + vData.join("', '") + "')";

			Query(sql, pCallBackSuccess, pCallBackError);
		});
	});
};

vExports.Update = function(pTable, pData, pFilter, pCallBackSuccess, pCallBackError){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) return pCallBackError("Invalid table name!");

		GetColumList(vTableName, function(){
			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTableName, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}else {
				return pCallBackError("Please specify a where clause when updating");
			}

			var vQuery = "UPDATE " + vTableName + " SET ";
			var vKeys = Object.keys(pData);
			var vColumns = [];
			for(var i = 0; i < vKeys.length; i++){
				var vColumn = Helper.VerifyField(vKeys[i], vTableColumns[vTableName]);
				if(!vColumn) return pCallBackError("Invalid column!");
				vQuery += vColumn + " = " + vConnection.escape(pData[vColumn]);
				if(i < vKeys.length-1) vQuery += ", ";
			}

			vQuery += vFilter;

			Query(vQuery, pCallBackSuccess, pCallBackError);
		});
	});
};

vExports.Delete = function(pTable, pFilter, pCallBackSuccess, pCallBackError){
	GetTableList(function(){
		vTableName = Helper.VerifyField(pTable, vTableList);
		if(!vTableName) return pCallBackError("Invalid table name!");

		GetColumList(vTableName, function(){
			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTableName, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}else {
				return pCallBackError("Please specify a where clause when deleting");
			}

			var vQuery = "DELETE FROM " + vTableName + vFilter;

			Query(vQuery, pCallBackSuccess, pCallBackError);
		});
	});
};

vExports.Execute = function(pProcedure, pCallBackSuccess, pCallBackError){
	throw new Error("Not implemented!");
};

vExports.Close = function(){
	if(vConnection){
		vConnection.end();
		vConnection = null;
	}
};

///////////////////////////////////////////////////////////
// Private functions
function GetTableList(pCallBackSuccess){
	if(!vTableList){
		Query("SHOW TABLES", function(pResultSet){
			vTableList = [];

			pResultSet.Rows.forEach(function(pRow, pRowIndex){
				pResultSet.Columns.forEach(function(pColumn, pColumnIndex){
					vTableList[vTableList.length] = pRow[pColumn]; //Column name will be like "Tables_in_tablename"
				});
			});
			if(pCallBackSuccess)pCallBackSuccess();
		});
	}else{
		if(pCallBackSuccess)pCallBackSuccess();
	}
}

function GetColumList(pTable, pCallBackSuccess){
	if(vTableColumns[pTable]){
		pCallBackSuccess();
	}else {
		Query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
	 			vConnectionOptions.database + "' AND `TABLE_NAME`='" + pTable + "';", function(pResultSet){

			vDef = [];
			pResultSet.Rows.forEach(function(pRow, pRowIndex){
				vDef[vDef.length] = pRow.COLUMN_NAME;
			});
			vTableColumns[pTable] = vDef;
			pCallBackSuccess();
		});

	}
}

function Query(pQuery, pCallBackSuccess, pCallBackError){
	vConnection.query(pQuery, function(pError, pRows, pFields){
		if(pError){
			pCallBackError("Table listing error: " + pError);
		}else{
			pCallBackSuccess(CreateResultSet(pRows, pFields));
		}
	});
}

function CreateResultSet(pRows, pFields){
	var vRS = {
		Rows: pRows,
		Columns: []
	};
	if(pFields){
		pFields.forEach(function(pColumn, pColumnIndex){
			vRS.Columns[vRS.Columns.length] = pColumn.name;
		});
	}
	return vRS;
}

function FormatFilter(pTableName, pFilter, pRecurse){
	if(pFilter.Column){
		vColumn = Helper.VerifyField(pFilter.Column, vTableColumns[pTableName]);
		if(!vColumn) throw new Error("Invalid column!");
		vOperator = Helper.VerifyOperator(pFilter.Operator);
		if(!vOperator) throw new Error("Invalid Operator!");
		// Build string
		return vColumn + " " + vOperator + " " + vConnection.escape(pFilter.Value);
	}else if(pFilter.Combo){
		if(!pRecurse) pRecurse = 0;
		if(pRecurse > 100) throw new Error("Max amount of filter recursing reaced!");
		pRecurse ++;
		vCombo = Helper.VerifyCombo(pFilter.Combo);
		// Recurse each
		var vFilterString = "(";
		for(var i = 0; i < pFilter.Items.length; i++){
			vFilterString += FormatFilter(pTableName, pFilter.Items[i], pRecurse);
			if(i < pFilter.Items.length-1) vFilterString += " " + vCombo + " ";
		}
		return vFilterString + ")";
	}else{
		throw new Error("Invalid filter!");
	}
}
module.exports = vExports;
