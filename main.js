///////////////////////////////////////////////////////////
// Include
var MySQL = require("mysql");
var Helper = require("./helperfunctions.js");

///////////////////////////////////////////////////////////
// Static vars
var ActiveConnections = [];

///////////////////////////////////////////////////////////
// Connection prototype
function SimSaveConnection(pOptions){
	var priv = {
	 	connection : null, // Mysql Connection object
		options : pOptions, // Connection options for reference
		tableList : {}, // List of available tables
		procedureList : {}, // List of available procedures
		connectionIndex : -1, // Index of connection in ActiveConnections
		connected : false // Used to check if connection is active
	}, self = this; // Reference for use in callbacks etc.

	///////////////////////////////////////////////////////////
	// Public functions
	self.Connect = function(pCallBackError, pCallBackSuccess) {
		priv.connection = MySQL.createConnection(priv.options);

		priv.connection.connect(function(pError){
			if(pError){
				pCallBackError("Connection error: " + pError);
			}else{
				var vTablesDone = false, vProcsDone = false;

				Query("SHOW Tables;", false, null, function(pResultSet){
					pResultSet.Rows.forEach(function(pRow, pRowIndex){
						priv.tableList[pRow[pResultSet.Columns[0]]] = {
							name: pRow[pResultSet.Columns[0]] //Column name will be like "Tables_in_tablename"
						};
					});
					if(vProcsDone) ConnectionSuccess(pCallBackSuccess);
					else vTablesDone = true;
				});

				Query("SHOW PROCEDURE STATUS;", false, null, function(pResultSet){
					pResultSet.Rows.forEach(function(pRow, pRowIndex){
						priv.procedureList[pRow.Name] = {
							name: pRow.Name
						};
					});
					if(vTablesDone) ConnectionSuccess(pCallBackSuccess);
					else vProcsDone = true;
				});
			}
		});
	};

	self.Select = function(pTable, pColumns, pFilter, pCallBackError, pCallBackSuccess){
		GetColumList(pTable, pCallBackError, function(vTable){

			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTable, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}

			if(pColumns === "*"){
				Query("SELECT * FROM " + vTable.name + vFilter, true, pCallBackError, pCallBackSuccess);

			}else {
				if(typeof pColumns === "string") {
					pColumns = [pColumns];
				}

				var vColumns = [];
				pColumns.forEach(function(pColumn){
					var vColumn = Helper.VerifyField(pColumn, vTable.columns);
					if(!vColumn) return pCallBackError("Invalid column!");
					vColumns[vColumns.length] = vColumn;
				});
				Query("SELECT " + vColumns.join(", ") + " FROM " + vTable.name + vFilter, true, pCallBackError, pCallBackSuccess);
			}
		});
	};

	self.Insert = function(pTable, pData, pCallBackError, pCallBackSuccess){
		GetColumList(pTable, pCallBackError, function(vTable){
			var vKeys = Object.keys(pData);

			var vColumns = [];
			vKeys.forEach(function(pColumn){
				var vColumn = Helper.VerifyField(pColumn, vTable.columns);
				if(!vColumn) return pCallBackError("Invalid column!");
				vColumns[vColumns.length] = vColumn;
			});
			var vData = [];
			vColumns.forEach(function(pColumn){
				vData[vData.length] = priv.connection.escape(pData[pColumn]);
			});

			var sql = "INSERT INTO " + vTable.name + "(" + vColumns.join(", ") + ")" +
						"VALUES('" + vData.join("', '") + "')";

			Query(sql, false, pCallBackError, pCallBackSuccess);
		});
	};

	self.Update = function(pTable, pData, pFilter, pCallBackError, pCallBackSuccess){
		GetColumList(pTable, pCallBackError, function(vTable){
			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTable, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}else {
				return pCallBackError("Please specify a where clause when updating");
			}

			var vSQL = "UPDATE " + vTable.name + " SET ";
			var vKeys = Object.keys(pData);
			var vColumns = [];
			for(var i = 0; i < vKeys.length; i++){
				var vColumn = Helper.VerifyField(vKeys[i], vTable.columns);
				if(!vColumn) return pCallBackError("Invalid column!");
				vSQL += vColumn + " = " + priv.connection.escape(pData[vColumn]);
				if(i < vKeys.length-1) vSQL += ", ";
			}

			vSQL += vFilter;

			Query(vSQL, false, pCallBackError, pCallBackSuccess);
		});
	};

	self.Delete = function(pTable, pFilter, pCallBackError, pCallBackSuccess){
		GetColumList(pTable, pCallBackError, function(vTable){
			var vFilter = "";
			if(pFilter){
				try {
					vFilter = " WHERE " + FormatFilter(vTable, pFilter);
				} catch (e) {
					return pCallBackError(e);
				}
			}else {
				return pCallBackError("Please specify a where clause when deleting");
			}

			var vSQL = "DELETE FROM " + vTable.name + vFilter;

			Query(vSQL, false, pCallBackError, pCallBackSuccess);
		});
	};

	self.Execute = function(pProcedureName, pParameters, pCallBackError, pCallBackSuccess){
		GetProcParams(pProcedureName, pCallBackError, function(vProcedure){
			var vKeys = Object.keys(pParameters);

			var vParameters = [];
			vKeys.forEach(function(pParamName){
				var vParam = Helper.VerifyField(pParamName, vProcedure.parameters);
				if(!vParam) return pCallBackError("Invalid parameter!");
				vParameters[vParameters.length] = vParam;
			});

			var vData = [];
			vParameters.forEach(function(pColumn){
				vData[vData.length] = priv.connection.escape(pParameters[pColumn]);
			});

			var sql = "CALL " + vProcedure.name + "(" + vData.join(", ") + ");";

			Query(sql, true, pCallBackError, pCallBackSuccess);
		});
	};

	self.Close = function(){
		// TODO: Do something about closing all connections/not filling up extreme amounts of ActiveConnections
		if(priv.connection){
			priv.connection.end();
			priv.connection = null;
			priv.connected = false;
		}
	};

	sef.IsConnected = function(){
		return priv.connected;
	};


	///////////////////////////////////////////////////////////
	// Private functions
	function ConnectionSuccess(pCallBack){
		priv.connectionIndex = ActiveConnections.length;
		ActiveConnections[priv.connectionIndex] = self;
		priv.connected = true;
		pCallBack("Connected");
	}

	function GetColumList(pTableName, pCallBackError, pCallBackSuccess){
		vTable = priv.tableList[pTableName];
		if(!vTable) return pCallBackError("Invalid table name!");

		if(vTable.columns){
			pCallBackSuccess(vTable);
		}else {
			Query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
		 			priv.options.database + "' AND `TABLE_NAME`='" + vTable.name + "';", false, null, function(pResultSet){

				vTable.columns = [];
				pResultSet.Rows.forEach(function(pRow, pRowIndex){
					vTable.columns[vTable.columns.length] = pRow.COLUMN_NAME;
				});
				pCallBackSuccess(vTable);
			});

		}
	}

	function GetProcParams(pProcName, pCallBackError, pCallBackSuccess){
		var vProc = priv.procedureList[pProcName];
		if(!vProc) return pCallBackError("Invalid proc name!");

		if(vProc.parameters){
			pCallBackSuccess(vProc);
		}else {
			Query("SELECT PARAMETER_NAME FROM INFORMATION_SCHEMA.PARAMETERS WHERE SPECIFIC_SCHEMA = '" +
		 			priv.options.database + "' AND `SPECIFIC_NAME`='" + vProc.name + "';", false, null, function(pResultSet){

				vProc.parameters = [];
				pResultSet.Rows.forEach(function(pRow, pRowIndex){
					vProc.parameters[vProc.parameters.length] = pRow.PARAMETER_NAME;
				});
				pCallBackSuccess(vProc);
			});

		}
	}

	function Query(pQuery, pIsProcedure, pCallBackError, pCallBackSuccess){
		priv.connection.query(pQuery, function(pError, pRows, pFields){
			if(pError){
				if(pCallBackError)pCallBackError("Query error: " + pError);
				else console.log(pError);
			}else{
				if(pIsProcedure){
					pCallBackSuccess(pRows, pFields);
				}else {
					pCallBackSuccess(CreateResultSet(pRows, pFields));
				}

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
				vRS.Columns[vRS.Columns.length] = pColumn?pColumn.name:"no-no-field";
			});
		}
		return vRS;
	}

	function FormatFilter(pTable, pFilter, pRecurse){
		if(pFilter.Column){
			vColumn = Helper.VerifyField(pFilter.Column, pTable.columns);
			if(!vColumn) throw new Error("Invalid column!");
			vOperator = Helper.VerifyOperator(pFilter.Operator);
			if(!vOperator) throw new Error("Invalid Operator!");
			// Build string
			return vColumn + " " + vOperator + " " + priv.connection.escape(pFilter.Value);
		}else if(pFilter.Combo){
			if(!pRecurse) pRecurse = 0;
			if(pRecurse > 100) throw new Error("Max amount of filter recursing reaced!");
			pRecurse ++;
			vCombo = Helper.VerifyCombo(pFilter.Combo);
			// Recurse each
			var vFilterString = "(";
			for(var i = 0; i < pFilter.Items.length; i++){
				vFilterString += FormatFilter(pTable, pFilter.Items[i], pRecurse);
				if(i < pFilter.Items.length-1) vFilterString += " " + vCombo + " ";
			}
			return vFilterString + ")";
		}else{
			throw new Error("Invalid filter!");
		}
	}

}

module.exports = {
	Connection : SimSaveConnection,
	CloseAll : function(){
		for(var i = 0; i < ActiveConnections.length; i++){
			ActiveConnections[i].Close();
		}
	}
};
