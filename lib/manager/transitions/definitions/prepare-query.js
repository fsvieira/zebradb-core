const prepare = require("./prepare");
const Match = require("../../../match/match");

function prepareQuery (req, res) {
    
    function genId () {
        return "id$" + req.store.id++;
    }
    
    const {query, definitions} = req.args;
    const {zvs, events} = req.context;
    
    const definitionsId = zvs.data.add(definitions);
    
    const definitionsBranchId = zvs.branches.getId({
	    parent: zvs.branches.root,
		args: [definitionsId],
		action: 'definitions'
    }).branchId;
    
    zvs.branches.transform(
        definitionsBranchId, 
        zvs.data.global("definitions"), 
        zvs.data.add({
            type: 'definitions',
            data: {
                definitions,
                branchId: definitionsBranchId
            }
        })
    );

    const match = new Match(zvs);
    
    const definitionsIds = zvs.getData(definitionsBranchId, definitionsId);
    
    match.addTuples(definitionsIds);
    zvs.addDefinitionsMatch(definitionsBranchId, match);
    
    
    const preparedQuery = prepare.copyWithVars(query.data, genId);
    const queryId = zvs.data.add(preparedQuery);
        
    const {branchId: queryBranchId} = zvs.branches.getId({
	    parent: definitionsBranchId,
		args: [queryId],
		action: 'query',
		func: query.func
    });
    
    zvs.branches.transform(
        queryBranchId, 
        zvs.data.global("queryBranchId"),
        zvs.data.add({
            type: 'query',
            data: queryBranchId
        })
    );

    zvs.branches.transform(queryBranchId, zvs.data.global("query"), queryId);
        
    events.trigger('query-start', queryBranchId);

    // res.send({value: {queryBranchId, definitionsBranchId}, trackId: queryBranchId});
    res.send({value: queryBranchId});
}

module.exports = prepareQuery;
