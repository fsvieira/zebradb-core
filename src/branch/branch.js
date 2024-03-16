const { definitions } = require('../..');
const {
    unify,
    varGenerator,
    getVariable,
    toString,
    copyTerm,
    copyPartialTerm,
    createMaterializedSet,
    // prepareVariables,
    constants,
    createBranch,
    logger,
    getContextState
} = require('./operations');

const {
    checkVariableConstraints,
    constraintEnv,
    evalConstraint
} = require('./operations/built-in/constraints');


const BranchContext = require("./branchContext");

const {
    values: {
        C_FALSE,
        C_TRUE,
        C_UNKNOWN
    }
} = constants;

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

async function setIn (ctx, set, element) {

    const branches = [];

    // const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    
    // const rDB = branch.table.db;

    /*const ctx = {
        parent: branch,
        root: await branch.data.root,
        variables: await branch.data.variables,
        setsInDomains: await branch.data.setsInDomains,
        constraints: await branch.data.constraints,
        unsolvedConstraints: await branch.data.unsolvedConstraints,
        extendSets: await branch.data.extendSets,
        unsolvedVariables: await branch.data.unsolvedVariables,
        unchecked: await branch.data.unchecked,
        checked: await branch.data.checked,
        level: await branch.data.level + 1,
        // branch,
        log: await branch.data.log,
        children: []  
    };*/

    // await ctx.removeSetsInDomains(element);
    // const domainBranch = await ctx.saveBranch();

    /*const newBranch1 = await rDB.tables.branches.insert(ctx, null);

    ctx.rDB = rDB;
    ctx.newVar = newVar;
    ctx.options = options;
    */

    /*const unifyCtx = await BranchContext.create(
        domainBranch,
        ctx.options,
        ctx.definitionDB
    );*/

    for await (let eID of set.elements.values()) {
        const unifyCtx = await ctx.snapshot();
        await unify(unifyCtx, eID, element);
        await unifyCtx.removeSetsInDomains(element);
        const unifiedBranch = await unifyCtx.saveBranch();

        branches.push(unifiedBranch);
    }
        
    if (branches.length) {
        return branches;
    }

    const elements = [];
    const {
        definition
    } = set;

    const {variables, root} = definition;
    const s = variables[root];

    for (let i=0; i<s.elements.length; i++) {
        const id = s.elements[i];
        const eID = await copyPartialTerm(ctx, definition, id, null, false, true);
        elements.push(eID);
    }

    ctx.variableCounter = varCounter();
    ctx.state = 'split';
    delete ctx.newVar;
    delete ctx.options;
    delete ctx.rDB;

    const message = `state=${ctx.state}, root=${await toString(null, ctx.root, ctx, true)}`; 
    await logger(options, ctx, message);

    const newBranch = await rDB.tables.branches.insert(ctx, null);
    const children = (await branch.data.children).concat([newBranch]);
    branch.update({children});

    for (let i=0; i<elements.length; i++) {
        const eID = elements[i];

        // throw 'Set In : need to check unify';
        branches.push(await unify(newBranch, options, eID, element));
    }

    return branches;
}

async function __unifyDomain (
    branch,
    options,
    id,
    domainID
) {
    const d = await getVariable(branch, domainID);
    const e = await getVariable(branch, id);

    switch (e.type) {
        /*case constants.type.SET: {
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

        case constants.type.SET: {
            return [await unify(branch, options, id, null, s.element)];
        }*/

        case constants.type.MATERIALIZED_SET: {
            return await setIn(
                branch, 
                options, 
                d, e
            );
        }

        default:
            throw 'unify domain unknown type ' + s.type;
    }
}

const hasValue = v => [C_TRUE, C_FALSE].includes(v);

async function isSolved (ctx, id) {

    const cs = await ctx.getVariable(id);

    if (hasValue(cs.state)) {
        return true;
    }

    let root = cs.root;

    while (root) {
        const {csID, side} = root;
        const rootCs = await ctx.getVariable(csID);
        const csValue = rootCs[`${side}Value`] || rootCs.state;
        const oValue = rootCs[`${side === 'a' ? 'b':'a'}Value`] || rootCs.state;

        if (hasValue(csValue)) {
            return true;
        }
        else if (hasValue(oValue)) {
            // return isSolved(ctx, csID);
            root = rootCs.root;
        }
        else {
            root = null;
        }
    }

    return false;
}

async function solveConstraints (ctx) {// (branch, options) {

/*    const ctx = {
        parent: branch,
        branch: branch, // TODO user parent branch, no need to send this,
        root: await branch.data.root,
        level: (await branch.data.level + 1),
        variables: await branch.data.variables,
        checked: await branch.data.checked,
        unchecked: await branch.data.unchecked,
        constraints: await branch.data.constraints,
        unsolvedConstraints: await branch.data.unsolvedConstraints,
        extendSets: await branch.data.extendSets,
        unsolvedVariables: await branch.data.unsolvedVariables,
        variableCounter: await branch.data.variableCounter,
        setsInDomains: await branch.data.setsInDomains,
        children: await branch.data.children,
        log: await branch.data.log,
        rDB: branch.table.db
    };

    const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

    ctx.newVar = newVar;
*/

    // let size = await ctx.unsolvedConstraints.size;
    // let resultSize = 0;

    let size, resultSize, fail;
    let changes = 0;
    do {
        let unsolvedConstraints = ctx.unsolvedConstraints;
        
        size = await ctx.unsolvedConstraints.size;
        for await (let csID of ctx.unsolvedConstraints.values()) {
            const cs = await ctx.getVariable(csID);

            const solved = await isSolved(ctx, cs.id);

            if (solved) {
                unsolvedConstraints = await unsolvedConstraints.remove(cs.id);
            }
            else {
                const env = await constraintEnv(ctx, cs);
                fail = !(await evalConstraint(ctx, cs, env, new Set()));

                if (fail) {
                    break;
                }
            }

        }

        resultSize = await unsolvedConstraints.size;

        changes += size - resultSize;

        ctx.unsolvedConstraints = unsolvedConstraints;

        if (fail) {
            break;
        }
    }
    while (size !== resultSize);

    if (changes > 0) {
        /*const newBranch = await createBranch(
            options,
            fail,
            branch,
            varCounter,
            ctx.level,
            ctx.checked,
            ctx.unchecked,
            ctx.variables,
            ctx.constraints,
            ctx.unsolvedConstraints,
            ctx.extendSets,
            ctx.unsolvedVariables,
            ctx.setsInDomains,
            ctx.log        
        );*/

        await ctx.saveBranch();

        return true;
    }

    return false;
}

async function executeConstraints (options, definitionDB, branch, v) {

    const ctx = {
        parent: branch,
        root: await branch.data.root,
        level: (await branch.data.level + 1),
        variables: await branch.data.variables,
        checked: await branch.data.checked,
        unchecked: await branch.data.unchecked,
        constraints: await branch.data.constraints,
        unsolvedConstraints: await branch.data.unsolvedConstraints,
        extendSets: await branch.data.extendSets,
        unsolvedVariables: await branch.data.unsolvedVariables,
        variableCounter: await branch.data.variableCounter,
        children: await branch.data.children,
        log: await branch.data.log,
        rDB: branch.table.db
    };

    const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

    ctx.newVar = newVar;

    const fail = !(await checkVariableConstraints(ctx, v));
    
    const newBranch = await createBranch(
        options,
        fail,
        branch,
        varCounter,
        ctx.level,
        ctx.checked,
        ctx.unchecked,
        ctx.variables,
        ctx.constraints,
        ctx.unsolvedConstraints,
        ctx.extendSets,
        ctx.unsolvedVariables,
        ctx.setsInDomains,
        ctx.log        
    );

    return changes;
    // throw 'Create New Branch';
}

async function extendSet (ctx, setID) {
    let set = await ctx.getVariable(setID);

    await ctx.removeExtendSet(setID);

    if (set.definition) {
        const {definition: {variables, root}, defID=root} = set;

        const setDef = variables[defID];
        const copyID = setDef.elements[0];

        const mapVars = {[defID]: set.id};

        const eID = await copyPartialTerm(
            ctx, set.definition, 
            copyID, true, true,
            mapVars
        );

        set = await ctx.getVariable(set.id);
        const elements = await set.elements.add(eID);

        await ctx.setVariableValue(set.id, {
            ...set,
            elements
        });
    }
    else {
        console.log("TODO: ONLY VALID SETS SHOULD BE HERE!!");
        return false;
    }
    
    await ctx.saveBranch();

    return true;
}

async function debugUnsolvedVariables (ctx) {
    for await (let e of ctx.unsolvedVariables.values()) {
        console.log(" == DEBUG ===> Unsolved Variables", await ctx.getVariable(e));
    }
}

async function expand (
    definitionDB, 
    branch, 
    options, 
    selector, 
    definitions
) {

    const ctx = await BranchContext.create(branch, options, definitionDB);
    
    console.log("Sets In Domains ", await ctx.toString());
    for await (let eID of ctx.setsInDomains.values()) {
        const v = await ctx.getVariable(eID);
        const d = await ctx.getVariable(v.domain);

        const r = await setIn(
            ctx,
            d, eID
        );

        await branch.update({state: 'split'});
        return r;
    }

    for await (let e of ctx.unsolvedVariables.values()) {
        const v = await ctx.getVariable(e);
        const d = await ctx.getVariable(v.domain);

        const r = await setIn(
            ctx,
            d, e
        );

        await branch.update({state: 'split'});

        return r;
    }

    if (await ctx.unsolvedConstraints.size) {
        const r = await solveConstraints(ctx); //branch, options);

        if (r) {
            await branch.update({state: 'split'});
            return r;
        }
    }

    for await (let sID of ctx.extendSets.values()) {
        const r = await extendSet(ctx, sID)// branch, sID);
        if (r) {
            await branch.update({state: 'split'});
            return r; 
        }
    }

    console.log("EXPAND DUMP BRANCH ", await ctx.toString());

    // else 
    throw 'expand : next steps!!';
}

async function createBranchMaterializedSet (
    options,
    rDB, 
    id, 
    parentBranch, 
    definitionElement, 
    definitionsDB,
    extendSets=false
) {
    // get branch shared data,
    
    const ctxEmpty = await BranchContext.create(
        parentBranch,
        options,
        definitionsDB,
        rDB
    );

    const ctxElement = ctxEmpty.snapshot();

    {
        // Set empty set branch, has success 
        const emptyResults = {
            type: constants.type.MATERIALIZED_SET,
            id,
            elements: rDB.iSet()
        };

        await ctxEmpty.setVariableValue(id, emptyResults);
        await ctxEmpty.logger("Create Empty Set Results");

        ctxEmpty.state = 'yes';
        ctxEmpty.branchID = `${parentBranch.id}-empty`;

        await ctxEmpty.saveBranch();
    }

    {
        const {root} = definitionElement;
        const setID = await copyPartialTerm(
            ctxElement, 
            definitionElement, 
            root,
            extendSets,
            true
        );

        await ctxElement.setVariableValue(
            id, {
                type: constants.type.LOCAL_VAR, 
                cid: id, 
                id, 
                defer: setID
            }
        );

        const eStr = await ctxElement.toString(); 
        
        const message = `state=${await ctxElement.currentState()}, root=${eStr}`; 
        
        await ctxElement.logger(message);

        const branch = await ctxElement.saveBranch();

        return branch;
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

async function __mergeMaterializedSets(ctx, valueA, valueB, branchB) {

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

async function __mergeElement (ctx, branchA, branchB, id) {
    const variablesA = await branchA.data.variables;
    const variablesB = await branchB.data.variables;
     
    const vA = await variablesA.has(id) ? await getVariable(branchA, id) : null;
    const vB = await variablesB.has(id) ? await getVariable(branchB, id) : null;

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

async function mergeConstants (ctxA, ctxB, constA, constB) {
    if (constA.data === constB.data) {
        return {new: false, values: [constA.id, constA.id]};
    }
    else if (await ctxA.hasVariable(constB.id)) {
            return {newValue: false, values: [constA.id, constA.id]};
    }
    else {
        await ctxA.setVariableValue(constB.id, constB);

        return {newValue: true, values: [constA.id, constB.id]};
    }
}

async function mergeTuples (ctxA, ctxB, tupleA, tupleB) {
    if (tupleA.data.length === tupleB.data.length) {
        const t = [];

        let r = false;
        for (let i=0; i<tupleA.data.length; i++) {
            const a = await ctxA.getVariable(tupleA.data[i]);
            const b = await ctxB.getVariable(tupleB.data[i]);

            const {newValue, values} = await mergeAux(
                ctxA, ctxB, a, b
            );

            r = r || newValue;
            t.push(values); 
        }

        
    }
    else {
        throw 'mergeTuples : tuples have diferente size!!';
    }
}

async function mergeMaterializedSets(ctxA, ctxB, setA, setB) {

    for await (let bID of setB.elements.values()) {
        const b = await ctxB.getVariable(bID);
        for await (let aID of setA.elements.values()) {
            const a = await ctxB.getVariable(bID);
            await mergeAux(ctxA, ctxB, a, b);
        }
    }
}

async function mergeAux (ctxA, ctxB, a, b) {
    if (a.type === b.type) {
        console.log(`mergeAux : ${await ctxA.toString(a.id)} ** ${await ctxB.toString(b.id)}`);
        switch (a.type) {
            case constants.type.MATERIALIZED_SET:
                return mergeMaterializedSets(ctxA, ctxB, a, b);

            case constants.type.TUPLE:
                return mergeTuples(ctxA, ctxB, a, b);

            case constants.type.CONSTANT:
                return mergeConstants(ctxA, ctxB, a, b);

            default: 
                throw `mergeAux : type ${a.type} is not defined!`
        }
    }
    else {
        throw 'mergeAux : diferente types is not defined!'
    }
}

async function __merge (options, rDB, branchA, branchB) {
    const resultsSetID = '__resultsSet';

    console.log("TODO: check the branch that has more variables to be A");

    const ctxA = await BranchContext.create(branchA, options, null, rDB);
    const ctxB = await BranchContext.create(branchB, options, null, rDB);

    const setA = await ctxA.getVariable(resultsSetID);
    const setB = await ctxB.getVariable(resultsSetID);

    await mergeAux(ctxA, ctxB, setA, setB);
}

async function merge (options, rDB, branchA, branchB) {
    
    const ctxA = await BranchContext.create(branchA, options, null, rDB);
    const ctxB = await BranchContext.create(branchB, options, null, rDB);

    await ctxA.genHashes();
    await ctxB.genHashes();

    /*
    const setA = await ctxA.getVariable(resultsSetID);
    const setB = await ctxB.getVariable(resultsSetID);

    await mergeAux(ctxA, ctxB, setA, setB);
    */
}

async function __3_merge (options, rDB, branchA, branchB) {
    const ctxA = await BranchContext.create(branchA, options, null, rDB);
    const ctxB = await BranchContext.create(branchB, options, null, rDB);

    
    console.log(
        await ctxA.toString() + ' ** ' + 
        await ctxB.toString() 
    );

    for await (let [bvID] of ctxB._ctx.variables) {
        const bv = await ctxB.getVariable(bvID);
        console.log("MERGE " , bvID, bv.id, bv);

        if ([
            constants.type.INDEX,
            constants.type.CONSTRAINT
        ].includes(bv.type)) {
            continue;
        }

        // TODO: why "has" is not working ??  
        // const r = await ctxA._ctx.variables.has(bv.id);
        const r = await ctxA.hasVariable(bv.id);
        if (r) {
            const equal = await compare(ctxA, ctxB, bv);

            // if equal then don't copy else copy 
            if (equal) {
                continue;
            }
            else {
                // clone b ?? 
            }
            /*
            const av = await ctxA.getVariable(bv.id);

            if (av.id === bv.id) {
                const cmp = await compare(ctxA, ctxB, bv);
                console.log("CHECK IF THEY HAVE SAME ID!", await ctxB.toString(bv.id), cmp);
            }
            else if (bv.id === bvID) {
                console.log("AV - COPY B ID => ", await ctxB.toString(bv.id))
            }
            else {
                console.log("DONT COPY, IDS ARE DIFF")
            }*/
        }
        else {
            console.log("COPY B ID => ", await ctxB.toString(bv.id));
        }
    }

    throw 'MERGE STOP!!'
}

async function __2_merge (options, rDB, branchA, branchB) {
    const ctxA = await BranchContext.create(branchA, options, null, rDB);
    const ctxB = await BranchContext.create(branchB, options, null, rDB);

    console.log("MERGE BRANCHES ", branchA.id, branchB.id);
    const resultsSetID = '__resultsSet';
    const a = await ctxA.getVariable(resultsSetID);
    const b = await ctxB.getVariable(resultsSetID);
        
    for await (let eaID of a.elements.values()) {
        const eA = await ctxA.getVariable(eaID);
        console.log(await ctxA.toString(eaID) ,eA, await eA.uniqueMap.size);

        for await (let ebID of b.elements.values()) {
            const eB = await ctxB.getVariable(ebID);
            console.log(await ctxB.toString(ebID), eB, await eB.uniqueMap.size);

            // TODO: sometimes we get same values from diff branches ?? 
            console.log("MERGE ", await ctxA.toString(eaID), ' ** ' , await ctxB.toString(ebID) );

            const bElements = new Set(await eB.elements.toArray());

            for (const e of bElements) {
                const eV = await ctxB.getVariable(e); 
                console.log(`MAP ${e} -> ${eV.id}`);
            }

            const bElementsConflict = new Set();
            for await (let [key, aValue] of eA.uniqueMap) {
                console.log("hash ==>", key, aValue);
                if (await eB.uniqueMap.has(key)) {
                    const bValue = await eB.uniqueMap.get(key);

                    const aV = await ctxB.getVariable(aValue); 
                    const bV = await ctxB.getVariable(bValue);
                    
                    if (aV.id === bV.id) {
                        console.log(`MAP a=${aV.id}, b=${bV.id}.`);
                    }
                    else {
                        console.log(
                            "Conflict", aV.id, bV.id,
                            await ctxA.toString(aValue), 
                            await ctxB.toString(bValue)
                        );

                        bElementsConflict.add(bV.id);
                    }

                    bElements.delete(bValue);
                    bElements.delete(bV.id);
                }
                /*else {
                    console.log("No Conflict ", 
                        await ctxA.toString(aValue),
                        await ctxB.toString(bValue)
                    );
                }*/
            }

            for (let e of bElements) {
                console.log(" el  --> ", await ctxB.toString(e));
            }

            for (let e of bElementsConflict) {
                console.log(" elC --> ", await ctxB.toString(e));
            }

            console.log("b el ", [...bElements], [...bElementsConflict]);

            let elements = a.elements;
            for (let e of bElements) {
                throw 'WE NEED TO COPY ELEMENT TO NEW BRANCH !! HOW :D MERGE BRANCH ??'
                elements = await elements.add(e)
            }

            /*await ctxA.setVariableValue(eA.id, {
                ...eA,
                elements
            });*/

            for await (let e of elements) {
                console.log("RRR => ", await ctxA.getVariable(e));
            }
 
            throw 'MERGE BOTH ELEMENTS';
        }

        await ctxA.saveBranch();
    }

    await branchA.update({update: 'merge'});
    await branchB.update({update: 'merge'});

    // throw 'DO MERGE !!';
}

async function __merge (options, rDB, branchA, branchB) {
    throw 'MERGE ??';

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
        unsolvedConstraints: await branchA.data.unsolvedConstraints,
        extendSets: await branchA.data.extendSets,
        unsolvedVariables: await branchA.data.unsolvedVariables,
        variableCounter,
        state: 'yes',
        children: [],
        log: await branchA.data.log
    };

    const uncheckedB = await branchB.data.checked;
    const checkedB = await branchB.data.checked;

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
   const message = `state=${ctx.state}, root=${await toString(null, ctx.root, ctx, true)}`; 
   await logger(options, ctx, message);

    const mergedBranch = await rDB.tables.branches.insert(ctx, null);
       
   // 2. mark both branches as solved, for now split.
   await branchA.update({state: 'split'});
   await branchB.update({state: 'split'});
   
   return mergedBranch;    
}

module.exports = {
    // create,
    merge,
    createBranchMaterializedSet,
    expand,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    copyPartialTerm,
    // prepareVariables,
    getVariable,
    constants,
    logger,
    BranchContext
}

