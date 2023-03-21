const {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    prepareVariables
} = require('./operations');


async function toJS (branch, id) {
    id = id || await branch.data.root;

    const v = await getVariable(branch, id);

    if (v.t) {
        return {
            ...v, 
            t: await Promise.all(v.t.map(v => toJS(branch, v))),
            checked: await branch.data.checked.has(v.id)
        };
    }
    
    return v;
}


async function expand (branch, options, selector, definitions) {
    const state = await branch.data.state;

    if (state === 'unsolved_variables') {
        const unsolvedVariables = await branch.data.unsolvedVariables;
        let min=Infinity, minVar; 
        for await (let vID of unsolvedVariables.values()) {
            const v = await branch.data.variables.get(vID);
            if (v.d.size < min) {
                min = v.d.size;
                minVar = v;
            }
        }
        
        const minVarD = await minVar.d.toArray();
        const r = await Promise.all(minVarD.map(cID => unify(branch, options, minVar.id, cID)));

        await branch.update({state: 'split'});

        return r;
    }
    else {
        const id = await selector(branch);

        const ds = await definitions(await toJS(branch, id));

        const r = await Promise.all(ds.map(definition => unify(branch, options, id, definition)));

        await branch.update({state: 'split'});
        return r;
    }
}

async function create (
    rDB,
    root,
    variableCounter,
    level=0,
    parent=null, 
    unchecked=rDB.iSet(), 
    variables=rDB.iMap(),
    constrains=rDB.iSet(),
    unsolvedVariables=rDB.iSet(), 
    checked=rDB.iSet(),
    branchID,
    log=rDB.iArray()
) {

    return await rDB.tables.branches.insert({
        branchID,
        parent,
        root,
        level,
        checked,
        unchecked,
        variables,
        constrains,
        unsolvedVariables,
        children: [],
        state: 'maybe',
        variableCounter,
        log
    }, null);
}

module.exports = {
    create,
    expand,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    prepareVariables,
    getVariable
}

