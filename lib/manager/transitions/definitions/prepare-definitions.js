const prepare = require("./prepare");

function prepareDefinitions (req, res) {
    
    function genId () {
        return "id$" + req.store.id++;
    }
        
    const definitions = req.store.definitions;
    const tuple = req.args;
    
    if (tuple.type === 'query') {
        res.send({
            value: {
                definitions,
                query: tuple
            }
        });
    }
    else {
        const def = prepare.copyWithVars(tuple, genId);
        def.check = true;
                
        definitions.push(def);
        req.store.definitionsBranchId = undefined;
        res.send({});
    }
}

module.exports = prepareDefinitions;