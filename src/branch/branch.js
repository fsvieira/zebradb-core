const {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    // prepareVariables,
    constants
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

async function unifyDomain (
    branch,
    options,
    id,
    domainID
) {
    const s = await getVariable(branch, domainID);

    switch (s.type) {
        case constants.type.SET: {
            return await Promise.all(s.elements.map(
                definitionID => unify(branch, options, id, definitionID)
            ));        
        }

        case constants.type.SET_EXP: {
            const {a, op, b} = s;

            switch (op) {
                case constants.operation.UNION: {
                    const av = await getVariable(branch, a);
                    const bv = await getVariable(branch, b);

                    const branches = [
                        await unify(branch, options, id, null, av.element),
                        await unify(branch, options, id, null, bv.element),
                    ];

                    return branches;
                }
            } 

        }

        case constants.type.SET_CS: {
            return [await unify(branch, options, id, null, s.element)];
        }

        default:
            throw 'unify domain unknown type ' + s.type;
    }
}

async function expand (branch, options, selector, definitions) {
    const state = await branch.data.state;

    if (state === 'unsolved_variables') {
        const unsolvedVariables = await branch.data.unsolvedVariables;
        let min=Infinity, minVar, minDomain; 
        let v;
        for await (let vID of unsolvedVariables.values()) {
            v = await branch.data.variables.get(vID);

            const domain = await getVariable(branch, v.domain);
            
            if (domain.size < min) {
                min = domain.size;
                minDomain = domain;
                minVar = v;
            }

        }
        
        const minVarD = minDomain.elements;
        const r = await Promise.all(minVarD.map(cID => unify(branch, options, minVar.id, cID)));

        await branch.update({state: 'split'});

        return r;
    }
    else {
        const id = await selector(branch);

        if (id === undefined) {
            throw 'SELECTING A UNDEFINED ID';
        }


        const v = await getVariable(branch, id);

        let r;

        if (v.domain) {
            r = await unifyDomain(
                branch,
                options,
                id,
                v.domain,
            );

            await branch.update({state: 'split'});

        }
        else {
            const searchTerm = await toJS(branch, id);
            const ds = await definitions(searchTerm);

            r = await Promise.all(ds.map(definition => unify(branch, options, id, null, definition)));

            await branch.update({state: 'split'});
        }

        return r;
    }
}

async function createMaterializedSet (
    rDB, 
    id, 
    parentBranch, 
    definitionElement, 
    definitionsDB
) {
    // get branch shared data,
    
    const ctx = {
        parent: parentBranch,
        root: await parentBranch.data.root,
        level: (await parentBranch.data.variableCounter + 1),
        checked: await parentBranch.data.checked,
        unchecked: await parentBranch.data.unchecked,
        constraints: await parentBranch.data.constraints,
        unsolvedVariables: await parentBranch.data.unsolvedVariables,
        variableCounter: await parentBranch.data.variableCounter,
        children: [],
        log: await parentBranch.data.log
    }

    const parentVariables = await parentBranch.data.variables;

    {
        // Set empty set branch, has success 
        const emptyResults = {
            type: constants.type.MATERIALIZED_SET,
            id,
            elements: rDB.iSet()
        };

        const variables = await parentVariables.set(id, emptyResults);

        await rDB.tables.branches.insert({
            ...ctx,
            state: 'yes',
            variables,
            branchID: `${parentBranch.id}-empty`
        }, null);
    }

    {
        // Set empty elements branch to be evaluated.
        const {varCounter, newVar} = varGenerator(0); 

        ctx.variables = parentVariables;
        ctx.newVar = newVar;

        const element = await copyTerm(
            ctx, 
            definitionElement, 
            definitionsDB, 
            true
        );

        const valueResults = {
            type: constants.type.MATERIALIZED_SET,
            id,
            elements: await rDB.iSet().add(element)
        };

        ctx.variables = await ctx.variables.set(id, valueResults);

        delete ctx.newVar;

        await rDB.tables.branches.insert({
            ...ctx,
            varCounter: varCounter(),
            state: 'maybe',
            branchID: `${parentBranch.id}-element`
        }, null);
    }

}

async function mergeMaterializedSets(variables, valueA, valueB) {
    for await (let e of valueB.elements.values()) {
        valueA.elements = await valueA.elements.add(e);
    }

    return variables.set(valueA.id, valueA);
}

async function merge (rDB, branchA , branchB) {
    /*
    const ctx = {
        variables: await branch.data.variables,
        constraints: await branch.data.constraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        newVar,
        level,
        rDB: branch.table.db,
        branch,
        log: await branch.data.log,
        options  
    };*/

    let variablesA = await branchA.data.variables;
    const variablesB = await branchB.data.variables;

    for await (let [key, valueB] of variablesB) {
        if (await variablesA.has(key)) {
            const valueA = await variablesA.get(key);

            console.log(valueA, valueB);

            if (valueA.type === valueB.type) {
                switch (valueA.type) {
                    case constants.MATERIALIZED_SET:
                        variables = await mergeMaterializedSets(variablesA, valueA, valueB);
                        break;

                    default:
                        throw `MERGE TYPE : ${valueA.type}!`;
                }
            }
            else {
                throw `MERGE WITH DIFF TYPES : ${valueA.type}=${valueB.type}!`;
            }
        }
        else {
            variablesA = await variablesA.set(key, valueB);
        }
    }

    // 1. create new branch,
    await rDB.tables.branches.insert({
        parent: [branchA, branchB],
        root: await branch.data.root,
        level: (await branch.data.level) + 1,
        constraints: await branch.data.constraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        children: [],
        state: 'yes',
        variableCounter: await branch.data.varCounter,
        log: await branch.data.log,
        variables: variablesA
    }, null);
    
    // 2. mark both branches as solved, for now split.
    await branchA.update({state: 'split'});
    await branchB.update({state: 'split'});

    console.log("END");
    throw 'Branch.js Merge is not defined!!';
}

/*
async function create (
    rDB,
    root,
    variableCounter,
    level=0,
    parent=null, 
    unchecked=rDB.iSet(), 
    variables=rDB.iMap(),
    constraints=rDB.iSet(),
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
        constraints,
        unsolvedVariables,
        children: [],
        state: 'maybe',
        variableCounter,
        log
    }, null);
}*/

module.exports = {
    // create,
    merge,
    createMaterializedSet,
    expand,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    // prepareVariables,
    getVariable,
    constants
}

