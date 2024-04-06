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
    await ctx.getSetSize(setID);

    let set = await ctx.getVariable(setID);

    /*const elTotal = await set.elements.size; 
    if (set.size === elTotal) {
        await ctx.removeExtendSet(setID);
        await ctx.saveBranch(true);
        return true;
    }
    else if (set.size === elTotal + 1) {
        await ctx.removeExtendSet(setID);
    }*/

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

        /*await ctx.startGroup({
            op: 'add-set-element',
            elementID: eID,
            setID,
            id: eID
        });*/

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

async function mergeElement (ctxA, ctxB, aID, bID) {
    const as = await ctxA.getVariable(aID);
    const bs = await ctxB.getVariable(bID);

    if (as.type === bs.type) {

        switch (as.type) {
            case constants.type.MATERIALIZED_SET: {
                await mergeSetSet(ctxA, ctxB, aID, bID);
                return;
            }

            case constants.type.TUPLE: {
                if (as.data.length === bs.data.length) {
                    for (let i=0; i<as.data.length; i++) {
                        const aID = as.data[i];
                        const bID = bs.data[i];

                        await mergeElement(ctxA, ctxB, aID, bID);
                    }
                }
            }

            case constants.type.CONSTANT: {
                /*
                if (as.id !== bs.id) {
                    throw `MERGE CONSTANT ${as.id} ** ${bs.id}`;
                }*/
                // We don't care about set elements!
                return; 
            }

            default:
                throw `MERGE ELEMENT!! ${as.type}!`;
        }
    }
    else {
        throw `MERGE ELEMENT!! ${as.type} ** ${bs.type}!`;
    }
}

async function mergeSetSet (ctxA, ctxB, aID, bID) {
    const a = await ctxA.getVariable(aID);
    const b = await ctxB.getVariable(bID);

    for await (let eID of a.elements.values()) {
        await mergeElement(ctxA, ctxB, eID, eID);
    }

    const am = a.matrix;
    const bm = b.matrix;

    console.log("MERGE MATRIX", am, bm);
    /*
    const elements = [];
    const data = []; // am.data.concat(bm.data);
    const indexes = {};

    for(let i=0; i<am.elements.length; i++) {
        const aID = am.elements[i];
        elements.push(await ctxA.toString(aID));
    }

    for(let e in am.indexes) {
        indexes[await ctxA.toString(e)] = am.indexes[e];
    }

    for(let i=0; i<bm.elements.length; i++) {
        const bID = bm.elements[i];
        elements.push(await ctxB.toString(bID));
    }

    for(let e in bm.indexes) {
        indexes[await ctxB.toString(e)] = bm.indexes[e];
    }

    for (let i=0; i<elements.length; i++) {
        const r = [];
        data.push(r);
        const aID = elements[i];
        for (let i=0; i<elements.length; i++) {
            const bID = elements[i];

            if (aID === bID) {
                r.push(1);
            }
            else {
                const ai = indexes[aID];
                const bi = indexes[bID];

                const conflict = ai.filter(idx => bi.includes(idx)).length > 0;

                r.push(conflict?1:0);
            }
        }
    }

    console.log("ELEMENTS ", elements, data, indexes);
    console.log("MERGE MATRIX", JSON.stringify([am, bm], null, '  '));
    */
}

async function __merge (options, rDB, branchA, branchB) {

    const ctxA = await BranchContext.create(branchA, options, rDB);
    const ctxB = await BranchContext.create(branchB, options, rDB);

    const resultsSetID = '__resultsSet';
    // const a = await ctxA.getVariable(resultsSetID);
    // const b = await ctxA.getVariable(resultsSetID);

    await mergeSetSet(ctxA, ctxB, resultsSetID, resultsSetID);

    console.log("MERGE ", await ctxA.toString(), " ** " , await ctxB.toString());

    throw 'MERGE IS NOT IMPLEMENTED';
}

async function copyElement(ctxA, ctxB, id) {
    // throw 'COPY ELEMENT NOT IMPLEMENTED!';
    return await ctxB.toString(id);
}

async function mergeMatrix (ctxA, ctxB, a, b) {
    const am = a.matrix;
    const bm = b.matrix;

    const elements = am.elements.slice();
    const indexes = {...am.indexes};
    const data = [];

    for (let i=0; i<bm.elements.length; i++) {
        const id = bm.elements[i];

        const aIdx = am.indexes[id];
        const bIdx = bm.indexes[id];

        const ai = aIdx.sort().join(":");
        const bi = bIdx.sort().join(":");

        if (ai != bi) {
            a.elements = await a.elements.remove(id);

            // remove element from unique map,
            for (let i=0; i<aIdx.length; i++) {
                a.uniqueMap = await a.uniqueMap.remove(aIdx[i]);
            }

            const bID = await copyElement(ctxA, ctxB, id);
            elements.push(bID);
            indexes[bID] = bIdx.slice();
        }
    }

    for (let i=0; i<elements.length; i++) {
        const r = [];
        data.push(r);
        const aID = elements[i];
        for (let i=0; i<elements.length; i++) {
            const bID = elements[i];

            if (aID === bID) {
                r.push(1);
            }
            else {
                const ai = indexes[aID];
                const bi = indexes[bID];

                const conflict = ai.filter(idx => bi.includes(idx)).length > 0;

                r.push(conflict?1:0);
            }
        }
    }

    await ctxA.setVariableValue(a.id, {
        ...a,
        matrix: {
            elements,
            indexes,
            data
        }
    });
} 

async function merge (options, rDB, branchA, branchB) {
    const ctxA = await BranchContext.create(branchA, options, rDB);
    const ctxB = await BranchContext.create(branchB, options, rDB);

    for await (let [eID] of ctxA._ctx.variables) {
        const a = await ctxA.getVariable(eID);

        if (a.type === constants.type.MATERIALIZED_SET) {
            const aSet = {...a};
            const b = await ctxB.getVariable(eID);
            await mergeMatrix(ctxA, ctxB, aSet, b);
        }
    }

    throw 'MERGE IS NOT IMPLEMENTED';
}


async function expand (
    definitionDB, 
    branch, 
    options, 
    selector, 
    definitions
) {

    const ctx = await BranchContext.create(branch, options, definitionDB);
    
    // 1. Solve Set Domains
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

    // 2. Assign domains values to variables, 
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

    // 3. Trigger unsolved constrained variables, 
    if (await ctx.unsolvedConstraints.size) {
        const r = await solveConstraints(ctx); //branch, options);

        if (r) {
            await branch.update({state: 'split'});
            return r;
        }
    }

    console.log("---->", await ctx.toString());
    // await branch.update({state: 'yes'});

    await branch.update({state: 'merge'});

    // throw 'EVAL IF EXTEND SET IS NEEDED!! ...';

    
    /*
    const r = await genSetIterator(ctx);
    console.log("---->", await ctx.toString(), JSON.stringify(r, null, '  '));
    throw 'MERGE ...';
    */

    // 4. Add only one element to incomplete sets, 
    /*console.log('S=', await ctx.toString());
    for await (let sID of ctx.extendSets.values()) {
        const r = await extendSet(ctx, sID)// branch, sID);
        if (r) {
            await branch.update({state: 'split'});
            return r; 
        }
    }

    await branch.update({state: 'yes'});
    */

    // else 
    // throw 'expand : next steps!!';
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

module.exports = {
    // create,
    createBranchMaterializedSet,
    expand,
    merge,
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

