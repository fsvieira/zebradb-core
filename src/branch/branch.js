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


async function expand (branch, selector, definitions) {
    const state = await branch.data.state;

    if (state === 'unsolved_variables') {
        const unsolvedVariables = await branch.data.unsolvedVariables;
        let min=Infinity, minVar; 
        for await (let vID of unsolvedVariables.values()) {
            const v = await branch.data.variables.get(vID);
            if (v.d.length < min) {
                min = v.d.length;
                minVar = v;
            }
        }
        
        const r = await Promise.all(minVar.d.map(cID => unify(branch, minVar.id, cID)));

        await branch.update({state: 'split'});

        return r;
    }
    else {
        const id = await selector(branch);

        const ds = definitions(await toJS(branch, id));

        const r = await Promise.all(ds.map(definition => unify(branch, id, definition)));

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
    unsolvedVariables=rDB.iSet(), 
    checked=rDB.iSet(),
    branchID
) {

    return await rDB.tables.branches.insert({
        branchID,
        parent,
        root,
        level,
        checked,
        unchecked,
        variables,
        unsolvedVariables,
        children: [],
        state: 'maybe',
        variableCounter
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

