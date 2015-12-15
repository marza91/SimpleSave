module.exports = {
	VerifyField: function(pString, pArray){
		var vString = null;
		pArray.forEach(function(pElem){
			if(pString === pElem){
				vString = pElem;
			}
		});
		return vString;
	}
}
