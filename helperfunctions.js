module.exports = {
	VerifyField: function(pString, pArray){
		for(var i = 0; i < pArray.length; i++){
			if(pString === pArray[i]){
				return pArray[i];
			}
		}
		return null;
	},

	VerifyOperator: function(pOperator){
		switch (pOperator) {
			case "=":
				return "=";
			case "<":
				return "<";
			case ">":
				return ">";
			case "<>":
				return "<>";
			case "<=":
				return "<=";
			case ">=":
				return ">=";
			case "LIKE":
				return "LIKE";
			case "IS NULL":
				return "IS NULL";
			case "IS NOT NULL":
				return "IS NOT NULL";
			default:
				return null;
		}
	},

	VerifyCombo: function(pCombo){
		switch (pCombo) {
			case "AND":
				return "AND";
			case "OR":
				return "OR";
			default:
				return null;
		}
	}
};
