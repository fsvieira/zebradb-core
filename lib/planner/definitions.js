function getTuplesDefinitions (branchId, tuples, match) {
    const matchTuples = {};
    
    for (let i=0; i<tuples.length; i++) {
        const tupleID = tuples[i];
        var definitions = match.match(branchId, tupleID);
        
        if (definitions && definitions.length) {
            matchTuples[tupleID] = definitions;
        }
        else {
            return;
        }
    }
    
    return matchTuples;
}

module.exports = {
    getTuplesDefinitions
};
