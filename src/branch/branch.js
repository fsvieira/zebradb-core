const {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    createMaterializedSetCs,
    // prepareVariables,
    constants,
    createBranch,
} = require('./operations');

const {checkVariableConstraints} = require('./operations/built-in/constraints');

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

async function executeConstraints (definitionDB, branch, v) {

    const ctx = {
        parent: branch,
        root: await branch.data.root,
        level: (await branch.data.level + 1),
        variables: await branch.data.variables,
        checked: await branch.data.checked,
        unchecked: await branch.data.unchecked,
        constraints: await branch.data.constraints,
        unsolvedVariables: await branch.data.unsolvedVariables,
        variableCounter: await branch.data.variableCounter,
        children: await branch.data.children,
        log: await branch.data.log,
        rDB: branch.table.db
    };

    const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

    ctx.newVar = newVar;

    const fail = await checkVariableConstraints(definitionDB, ctx, v);

    await createBranch(
        fail,
        branch,
        varCounter,
        ctx.level,
        ctx.checked,
        ctx.unchecked,
        ctx.variables,
        ctx.constraints,
        ctx.unsolvedVariables,
        ctx.log        
    );

    // throw 'Create New Branch';
}

async function expand (
    definitionDB, 
    branch, 
    options, 
    selector, 
    definitions
) {
    const state = await branch.data.state;

    if (state === 'unsolved_variables') {
        const unsolvedVariables = await branch.data.unsolvedVariables;
//        let min=Infinity, minVar, minDomain; 
//        let v;

        let d; 
        let domain;
        let dSize;
        let c;
        let cSize;

        for await (let vID of unsolvedVariables.values()) {
            v = await branch.data.variables.get(vID);

            if (v.domain) {
                const dDomain = await getVariable(branch, v.domain);
            
                const size = await domain.size;

                if (!d || dSize > size) {
                    domain = dDomain;
                    dSize = size;
                    d = v;
                }

                c === null;

            }
            else if (c !== null) {
                const size = await v.constraints.size;

                if (!c || cSize > size) {
                    cSize = size;
                    c = v;
                }
            }

            /*const domain = await getVariable(branch, v.domain);
            
            if (domain.size < min) {
                min = domain.size;
                minDomain = domain;
                minVar = v;
            }*/

        }
        
        // const minVarD = minDomain.elements;
        // const r = await Promise.all(minVarD.map(cID => unify(branch, options, minVar.id, cID)));

        let r;
        if (d) {
            const elements = domain.elements;
            r = await Promise.all(elements.map(cID => unify(branch, options, d.id, cID))); 
        }
        else {
            await executeConstraints(definitionDB, branch, c);
            // console.log('UNSOLVED VARS ', c);
            // throw 'UNSOLVED VARS IS NOT IMPLMENETED!!'
        }
        
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

/*
async function createMaterializedSetCs (
    ctx,
    definitionsDB,
    definitionElement, 
    v,
    variableID=ctx.newVar()
) {

    const {element: elementID} = v;

    const element = await copyPartialTerm(
        ctx, 
        definitionElement, 
        elementID,
        definitionsDB, 
        true
    );
    
    const valueResults = {
        type: constants.type.MATERIALIZED_SET,
        id: variableID,
        elements: await ctx.rDB.iSet().add(element)
    };

    ctx.variables = await ctx.variables.set(variableID, valueResults);

    return variableID;
}*/

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
        const {root, variables} = definitionElement;
        const v = variables[root];

        // Set elements branch to be evaluated.
        const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

        ctx.variables = parentVariables;
        ctx.newVar = newVar;
        ctx.rDB = rDB;

        switch (v.type) {
            case constants.type.SET_CS: {
                await createMaterializedSetCs(
                    ctx,
                    definitionsDB, 
                    definitionElement, 
                    v,
                    id
                );
                break;
            }

            default:
                throw `createMaterializedSet : ${v.type} not defined!`;
        }

        /*throw 'createMaterializedSet - SET QUERY!!';

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
        */

        delete ctx.newVar;
        delete ctx.rDB;

        const uSize = await ctx.unchecked.size;
        const cSize = await ctx.unsolvedVariables.size;

        const state = uSize === 0?(cSize?'unsolved_variables':'maybe'):'yes';

        const branch = await rDB.tables.branches.insert({
            ...ctx,
            variableCounter: varCounter(),
            state,
            branchID: `${parentBranch.id}-element`
        }, null);

        const s = await toString(branch);

        console.log('QUERY ', s);
    }

}

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

module.exports = {
    // create,
    merge,
    createMaterializedSet,
    expand,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    copyPartialTerm,
    // prepareVariables,
    getVariable,
    constants
}

