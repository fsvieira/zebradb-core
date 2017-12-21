const prepare = require("../definitions/prepare");

function copyDefinitions (req, res) {
    const copyTupleDefinitions = [];
    const {zvs} = req.context;
    const {branchId, tuples} = req.args;
    
    for (var i=0; i<tuples.length; i++) {
        const tuple = tuples[i].tuple;
        var tupleDefs;
                
        tupleDefs = tuples[i].definitions;

        var t = [];
        for (var j=0; j<tupleDefs.length; j++) {
            var c = prepare.copyWithVars(
                zvs.getObject(branchId, tupleDefs[j]),
                function () {
                    return zvs.branches.getUniqueId(branchId);
                }
            );

            var negation = c.negation;
                    
            delete c.negation;
            var def = zvs.data.add(c);
                    
            t.push({
                negation: negation,
                definition: def
            });
        }
                
        copyTupleDefinitions.push({
            tuple,
            definitions: t
        });
    }

    res.send({value: {
        branchId,
        tuples: copyTupleDefinitions
    }});
}


module.exports = copyDefinitions;
