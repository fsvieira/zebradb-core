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

    // if there is no elements on set/domain we need to create them,
    const elements = [];
    const {
        definition
    } = set;

    const {variables, root} = definition;
    const s = variables[root];

    for (let i=0; i<s.elements.length; i++) {
        const id = s.elements[i];
        const eID = await copyPartialTerm(ctx, definition, id, false, true);
        elements.push(eID);
    }

    for (let i=0; i<elements.length; i++) {
        const eID = elements[i];
        const unifyCtx = await ctx.snapshot();

        await unify(unifyCtx, eID, element);
        await unifyCtx.removeSetsInDomains(element);
        const unifiedBranch = await unifyCtx.saveBranch();

        branches.push(unifiedBranch);
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
        // console.log("CHEK ROOT ", await ctx.toString(root.csID), '\n');
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

            // console.log("csID =============> ", await ctx.toString(csID));

            const solved = await isSolved(ctx, cs.id);

            if (solved) {
                console.log("csID SOLVED ", await ctx.toString(csID));
                unsolvedConstraints = await unsolvedConstraints.remove(cs.id);
            }
            else {
                const env = await constraintEnv(ctx, cs);
                // console.log("csID ", await ctx.toString(csID), env);

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
}


async function copyElement(dest, src, id) {
    // throw 'COPY ELEMENT NOT IMPLEMENTED!';
    const v = await src.getVariable(id);

    switch (v.type) {
        case constants.type.TUPLE: {
            const id = dest.newVar();
            const data = [];

            for (let i=0; i<v.data.length; i++) {
                const copyID = v.data[i];
                data[i] = await copyElement(dest, src, copyID);                
            }

            await dest.setVariableValue(id, {
                ...v,
                data,
                id
            });

            return id;
        }

        case constants.type.CONSTANT: {
            if (!await dest.hasVariable(v.id)) {
                await dest.setVariableValue(v.id, v);
            }

            return v.id;
        }

        default: 
            throw `copyElement ${v.type} is not implemented!`;        
    }


}

async function mergeMatrix (ctxA, ctxB, a, b) {
    const am = a.matrix;
    const bm = b.matrix;

    const uniqueElements = am.uniqueElements;
    const elements = am.elements.slice();
    const indexes = {...am.indexes};
    // const data = [];


    for (let idx in bm.uniqueElements) {
        if (!uniqueElements[idx]) {
            const bID = bm.uniqueElements[idx];
            const id = uniqueElements[idx] = await copyElement(
                ctxA, 
                ctxB, 
                bID
            );

            elements.push(id);

            const bIdx = bm.indexes[bID];
            console.log("index", bIdx, bID, bm);

            if (!bIdx) {
                console.log(await ctxB.toString(bID));
                console.log(await ctxB.getVariable(bID));
                throw '----';
            }

            indexes[id] = bIdx.slice();
        }
    }

    if (elements.length) {
        await ctxA.setVariableValue(a.id, {
            ...a,
            elements: ctxA.rDB.iSet(),
            matrix: {
                elements,
                indexes,
                uniqueElements
            }
        });
    }
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

    await branchA.update({state: 'merged'});
    await branchB.update({state: 'merged'});

    ctxA.state = 'merge';
    await ctxA.saveBranch();
    // throw 'MERGE IS NOT IMPLEMENTED';
}

async function genSet (ctx, set) {

    const matrix = set.matrix;

    let eIndex = 0;
    let elements = ctx.rDB.iSet(); // set.elements;
    let conflictMask = matrix.elements.map(() => false);

    const conflict = (aID, bID) => {
        const ai = matrix.indexes[aID];
        const bi = matrix.indexes[bID];

        return ai.find(idx => bi.includes(idx)) !== undefined;
    }

    do {
        const eID = matrix.elements[eIndex];
        elements = await elements.add(eID);

        eIndex = null;
        for (let i=0; i<conflictMask.length; i++) {
            const nID = matrix.elements[i];
            const r = conflictMask[i] = conflictMask[i] || conflict(eID, nID);

            if (eIndex === null && r === false) {
                eIndex = i;
            }
        }
    }
    while (eIndex !== null);

    await ctx.setVariableValue(set.id, {
        ...set,
        elements,
        size: await elements.size
    });

    
    /*
    const matrix = set.matrix;

    let eIndex = 0;
    let elements = set.elements;
    let conflictMask = matrix.data[eIndex].slice();

    do {
        let row = matrix.data[eIndex];
        elements = await elements.add(matrix.elements[eIndex]);

        eIndex = null;
        for (let i=0; i<conflictMask.length; i++) {
            const r = conflictMask[i] = conflictMask[i] | row[i];
            
            if (eIndex === null && r === 0) {
                eIndex = i;
            }
        }
    }
    while (eIndex !== null);

    await ctx.setVariableValue(set.id, {
        ...set,
        elements,
        size: await elements.size
    });

    console.log("GEN SETT (1)", await ctx.toString(set.id));
    */
}

async function genSets (options, rDB, branch) {
    const ctx = await BranchContext.create(branch, options, rDB);
 
    const done = {};
    for await (let [eID] of ctx._ctx.variables) {
        const v = await ctx.getVariable(eID);

        if (!done[v.id]) {
            done[v.id] = true;

            if (v.type === constants.type.MATERIALIZED_SET) {
                if (v.matrix.elements.length > 0) {

                    await genSet(ctx, v);
                }
            }
        }
    }

    await branch.update({state: 'split'});

    ctx.state = 'yes';
    await ctx.saveBranch();
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

    console.log('PRINT => ', await ctx.toString());

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

    /*
    TODO: Handle Empty Set "merge" in case of fail.
    {
        // Set empty set branch, has success 
        const emptyResults = {
            type: constants.type.MATERIALIZED_SET,
            id,
            elements: rDB.iSet(),
            matrix: {
                elements: [],
                data: [],
                indexes: {},
                uniqueElements: {}
            }
        };

        await ctxEmpty.setVariableValue(id, emptyResults);
        await ctxEmpty.logger("Create Empty Set Results");

        ctxEmpty.state = 'merge';
        ctxEmpty.branchID = `${parentBranch.id}-empty`;

        await ctxEmpty.saveBranch();
    }
    */

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
    BranchContext,
    genSets
}

