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

    console.log(`VERIFY ToJS : `, branch, id);

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
            console.log(s);
            const {a, op, b} = s;

            switch (op) {
                case constants.operation.UNION: {
                    const av = await getVariable(branch, a);
                    const bv = await getVariable(branch, b);

                    const branches = [
                        await unify(branch, options, id, null, av.element),
                        await unify(branch, options, id, null, bv.element),
                    ];

                    console.log(branches);
                    return branches;
                }
            } 

        }

        default:
            throw 'unify domain unknown type ' + s.type;
    }
}

/*
async function getDomain (
    branch,
    options,
    variableID, 
    definitions
) {
    const domain = await getVariable(branch, variableID);

    console.log("TODO: on copy terms we need to check if variable alredy exists");

    if (domain.type === constants.type.GLOBAL_VAR) {
        const definition = await definitions(domain);

        const level = await branch.data.level + 1;
        const rDB = branch.table.db;
        
        const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
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
        };
        
        const id = await copyTerm(ctx, definition, true);

        ctx.variables.set(variableID, {...domain, defer: id});

        console.log("SETUP DEFINITION");

        const newBranch = await rDB.tables.branches.insert({
            parent: branch,
            root: await branch.data.root,
            variableCounter: varCounter(),
            level,
            checked: ctx.checked,
            unchecked: ctx.unchecked,
            variables: ctx.variables,
            constraints: ctx.constraints,
            unsolvedVariables: ctx.unsolvedVariables,
            children: [],
            state: 'maybe',
            log: ctx.log
        }, null);
        
        await branch.update({state: 'split'});

        return {branch: newBranch, variableID};
    }

    return {branch, variableID};
}*/

async function expand (branch, options, selector, definitions) {
    const state = await branch.data.state;

    if (state === 'unsolved_variables') {
        const unsolvedVariables = await branch.data.unsolvedVariables;
        let min=Infinity, minVar, minDomain; 
        let v;
        for await (let vID of unsolvedVariables.values()) {
            v = await branch.data.variables.get(vID);

            const domain = await getVariable(branch, v.domain);

            console.log("TODO: WHY Variable HAS NO CONSTRAINS!!", v);
            console.log(domain);
            
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

        const v = await getVariable(branch, id);

        let r;

        if (v.domain) {
            /// const domain = await getVariable(branch, v.domain);

            /// const searchTerm = domain;
            /// const definition = await definitions(searchTerm);

            /// console.log("--====--");
            /// console.log(definition);

            // If is a set:
            //  1. we need to save the set, 
            //    a. check if set exists, if not: 
            //      1. create set,
            //      2. if elements don't exists add them,
            //      3. setup elements distinction constraints.
            //  2. unify elements with tuple, create branches
            // NOTES: we can send the defintion to unify, and let it do the rest, 
            //        unify must be capable to return multiple branches.  

            /*const {
                branch: domainBranch, 
                variableID: domainID
            } = await getDomain(
                branch,
                options,
                v.domain,
                definitions
            );*/

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
        /*
        console.log(ds);

        const r = await Promise.all(ds.map(definition => unify(branch, options, id, null, definition)));

        await branch.update({state: 'split'});
        return r;
        */
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
}

module.exports = {
    create,
    expand,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    // prepareVariables,
    getVariable,
    constants
}

