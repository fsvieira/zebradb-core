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
        level: (await parentBranch.data.level + 1),
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
        const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

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

/*
async function mergeMaterializedSets(variables, valueA, valueB, mergeStack) {
    for await (let e of valueB.elements.values()) {
        valueA.elements = await valueA.elements.add(e);

        const eA = await variables.has(e) ? e : null;
        mergeStack.push([eA, e]);
    }

    return variables.set(valueA.id, valueA);
}

async function copyValue (variables, id, value, mergeStack) {
    variables = await variables.set(id, value);

    switch (value.type) {
        case constants.type.TUPLE: {
            for (let i=0; i<value.data.length; i++) {
                const e = value.data[i];
                const eA = await variables.has(e) ? e : null;
                mergeStack.push([eA, e]);
            }

            break;
        }

        case constants.type.CONSTANT:
            break;

        default: {
            throw 'COPY VALUE ' + value.type + ' IS NOT DEFINED!';
        }
    }

    return variables;
}*/

// TODO : Split 
async function getElement (ctx, id, branch) {

    if (await ctx.variables.has(id)) {
        const a = await getVariable(null, id, ctx);
        const b = await getVariable(branch, id);

        if (
            (a.id === b.id)
            || (await ctx.variables.has(b.id))
        ) {
            return b.id;
        }

        throw 'getElement copy b.id!!'

    }

    throw 'GET ELEMENT MAYBE A HAS ID??';        
}

async function mergeMaterializedSets(ctx, valueA, valueB, branchB) {

    let elements = valueA.elements;

    for await (let b of valueB.elements.values()) {
        const e = await getElement(ctx, b, branchB);

        elements = await elements.add(e);
    }

    ctx.variables = await ctx.variables.set(
        valueA.id, {
            ...valueA, 
            elements
        }
    );
}

async function mergeElement (ctx, branchA, branchB, id) {
    const variablesA = await branchA.data.variables;
    const variablesB = await branchB.data.variables;
     
    const vA = await variablesA.has(id) ? await getVariable(branchA, id) : null;
    const vB = await variablesB.has(id) ? await getVariable(branchB, id) : null;

    console.log("MERGE ", vA, vB);

    if (vA === null) {
        throw 'A is null';
    }
    else if (vB === null) {
        throw 'B is null';
    }
    else if (vA.type === vB.type) {
        switch (vA.type) {
            case constants.type.MATERIALIZED_SET: {
                await mergeMaterializedSets(ctx, vA, vB, branchB);
                break;
            }

            default:
                throw 'IMPLEMENT MERGE ELEMENT!!';
        }
    }

}

async function merge (rDB, branchA, branchB) {
    {
        const variablesA = await branchA.data.variables;
        const variablesB = await branchB.data.variables;

        const aSize = await variablesA.size;
        const bSize = await variablesB.size;

        // choose the one with more variables, so that 
        // we have less to copy.
        if (aSize < bSize) {
            const bA = branchA;
            branchA = branchB;
            branchB = bA;
        }
    }

    const aCounter = await branchA.data.variableCounter;
    const bCounter = await branchB.data.variableCounter;
    const variableCounter = aCounter > bCounter ? aCounter : bCounter;
 
    const ctx = {
        parent: [branchA, branchB],
        root: await branchA.data.root,
        level: (await branchA.data.variableCounter + 1),
        variables: await branchA.data.variables,
        checked: await branchA.data.checked,
        unchecked: await branchA.data.unchecked,
        constraints: await branchA.data.constraints,
        unsolvedVariables: await branchA.data.unsolvedVariables,
        variableCounter,
        state: 'yes',
        children: [],
        log: await branchA.data.log
    };

    const uncheckedB = await branchB.data.checked;
    const checkedB = await branchB.data.checked;

    console.log(
        await toString(branchA),
        ' X ',
        await toString(branchB)
    );

    await mergeElement(ctx, branchA, branchB, ctx.root);

    // 2. Merge checked and unchecked variables,
    for await (let b of checkedB.values()) {
        ctx.checked = await ctx.checked.add(b);
        ctx.unchecked = await ctx.unchecked.remove(b);
    }
        
    for await (let b of uncheckedB.values()) {
        if (!(await ctx.checked.has(b))) {
            ctx.unchecked = await ctx.unchecked.add(b);
        }
    }

   // 3. create new branch,   
    const mergedBranch = await rDB.tables.branches.insert(ctx, null);
       
   // 2. mark both branches as solved, for now split.
   await branchA.update({state: 'split'});
   await branchB.update({state: 'split'});
   
   return mergedBranch;    
}

async function _2_merge (rDB, branchA , branchB) {
    let variables = await branchA.data.variables;
    let checkedA = await branchA.data.checked;
    let uncheckedA = await branchA.data.checked;

    const uncheckedB = await branchB.data.checked;
    const checkedB = await branchB.data.checked;

    let variablesA = await branchA.data.variables;
    let variablesB = await branchB.data.variables;

    for await (let [idB] of variablesB) {
        const vB = await getVariable(branchB, idB);
        
        if (await variablesA.has(idB)) {
            const vA = await getVariable(branchA, idB);

            if (
                vA.type === vB.type && 
                vA.type === constants.type.MATERIALIZED_SET
            ) {
                let elements = vA.elements;
                for await (let e of vB.elements.values()) {
                    const v = await getVariable(branchB, e);

                    console.log("TODO: we need a rename variables table??");
                    elements = await elements.add(v.id);
                }
            
                variables = await variables.set(
                    vA.id, {
                    ...vA,
                    elements
                });
            }
            else if (vA.id === vB.id) {
                console.log("CONFLICT 1", vA, vB);
                // throw 'CONFLICT 1 ??'
            }
            else {
                variables = await variables.set(vB.id, vB);
            }
    
        }
        else if (await variablesA.has(vB.id)) {
            const vA = await getVariable(branchA, vB.id);

            if (vA.id !== vB.id) {
                console.log("CONFLICT 2", vA, vB);
                throw 'CONFLICT 2 ??'
            }
            else if (vA.type !== constants.type.CONSTANT) {
                console.log("CONFLICT 3", vA, vB);
                // throw "CONFLICT 3 ?? SHOULD BE CHECKED ??";
            }
        }
        else {
            variables = await variables.set(vB.id, vB);
        }
    }

    // 2. Merge checked and unchecked variables,
    for await (let b of checkedB.values()) {
        checkedA = await checkedA.add(b);
        uncheckedA = await uncheckedA.remove(b);
    }
    
    for await (let b of uncheckedB.values()) {
        if (!(await checkedA.has(b))) {
            uncheckedA = await uncheckedA.add(b);
        }
    }
    
    // 3. create new branch,
    const aCounter = await branchA.data.variableCounter;
    const bCounter = await branchB.data.variableCounter;
    const variableCounter = aCounter > bCounter ? aCounter : bCounter;
    
    const mergedBranch = await rDB.tables.branches.insert({
        parent: [branchA, branchB],
        root: await branchA.data.root,
        level: (await branchA.data.level) + 1,
        constraints: await branchA.data.constraints,
        unsolvedVariables: await branchA.data.unsolvedVariables,
        unchecked: uncheckedA,
        checked: checkedA,
        children: [],
        state: 'yes',
        variableCounter,
        log: await branchA.data.log,
        variables
    }, null);
        
    // 2. mark both branches as solved, for now split.
    await branchA.update({state: 'split'});
    await branchB.update({state: 'split'});
    
    return mergedBranch;    
}

async function __merge (rDB, branchA , branchB) {
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

    let variables = await branchA.data.variables;
    let checkedA = await branchA.data.checked;
    let uncheckedA = await branchA.data.checked;

    const uncheckedB = await branchB.data.checked;
    const checkedB = await branchB.data.checked;

    let variablesB = await branchB.data.variables;

    const conflictVariables = [];
    for await (let [key, valueB] of variablesB) {
        console.log("VALUE B ==>", valueB);

        switch (valueB.type) {
            case constants.type.CONSTANT:
            case constants.type.GLOBAL_VAR:
                break;

            default:
                if (await variables.has(key)) {
                    conflictVariables.push(key);
                }
        }
    }

    console.log("== CONFLICT VARIABLES == ", JSON.stringify(conflictVariables));

    // 1. merge variables,

    const rootA = await branchA.data.root;
    const rootB = await branchB.data.root;

    const mergeStack = [[rootA, rootB]];

    while (mergeStack.length) {
        const [elA, elB] = mergeStack.pop();

        const valueA = elA ? await getVariable(branchA, elA) : null;
        const valueB = await getVariable(branchB, elB);

        if (valueA === null) {
            variables = await copyValue(variables, elB, valueB, mergeStack);
        }
        else if (valueA.type === valueB.type) {
            switch (valueA.type) {
                case constants.type.MATERIALIZED_SET:
                    variables = await mergeMaterializedSets(
                        variables, 
                        valueA, 
                        valueB,
                        mergeStack
                    );
                    break;

                default:
                    throw `MERGE TYPE : ${valueA.type}!`;
            }
        }
        else {
            throw `MERGE WITH DIFF TYPES : ${valueA.type}=${valueB.type}!`;
        }
    }

    /*
    throw "MERGE FROM THE ROOT!!";
    for await (let [key, valueB] of variablesB) {
        if (await variablesA.has(key)) {
            const valueA = await variablesA.get(key);

            console.log(valueA, valueB);

            if (valueA.type === valueB.type) {
                switch (valueA.type) {
                    case constants.type.MATERIALIZED_SET:
                        variables = await mergeMaterializedSets(variablesA, valueA, valueB);
                        break;

                    default:
                        console.log("MMMMMMMMMMMMMMMM", valueA);
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
    }*/

    // 2. Merge checked and unchecked variables,
    for await (let b of checkedB.values()) {
        checkedA = await checkedA.add(b);
        uncheckedA = await uncheckedA.remove(b);
    }

    for await (let b of uncheckedB.values()) {
        if (!(await checkedA.has(b))) {
            uncheckedA = await uncheckedA.add(b);
        }
    }

    // 3. create new branch,
    const aCounter = await branchA.data.variableCounter;
    const bCounter = await branchB.data.variableCounter;
    const variableCounter = aCounter > bCounter ? aCounter : bCounter;

    const mergedBranch = await rDB.tables.branches.insert({
        parent: [branchA, branchB],
        root: await branchA.data.root,
        level: (await branchA.data.level) + 1,
        constraints: await branchA.data.constraints,
        unsolvedVariables: await branchA.data.unsolvedVariables,
        unchecked: uncheckedA,
        checked: checkedA,
        children: [],
        state: 'yes',
        variableCounter,
        log: await branchA.data.log,
        variables
    }, null);
    
    // 2. mark both branches as solved, for now split.
    await branchA.update({state: 'split'});
    await branchB.update({state: 'split'});

    return mergedBranch;
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

