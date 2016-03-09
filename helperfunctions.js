module.exports = {
	VerifyField: function(pString, pArray){
		var vString = null;
		pArray.forEach(function(pElem){
			if(pString === pElem){
				vString = pElem;
			}
		});
		return vString;
	},

	VerifyOperator: function(pOperator){
		//"=; <; >; <>; <=; >=; LIKE; IS NULL; IS NOT NULL;"
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

	VerifyCombo(pCombo){
		switch (pCombo) {
			case "AND":
				return "AND";
			case "OR":
				return "OR";
			default:
				return null;
		}
	}
}
