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

    const uniqueElements = {...am.uniqueElements};
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
    let elements = set.elements;
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

/*
async function plan (ctx, elementID) {
    const e = await ctx.getVariable(elementID);
    const d = e.domain ? await ctx.getVariable(e.domain) : undefined;

    switch (e.type) {
        case constants.type.TUPLE: {
            const vars = [];
            for (let i=0; i<e.data.length; i++) {
                const vID = e.data[i];
                const v = await ctx.getVariable(vID);
                if (v.type === constants.type.LOCAL_VAR || v.type === constants.type.LOCAL_VAR) {

                }
            }
        }
    }

    console.log(e, d);
}*/

async function _initSet (parentBranch, options, definitionsDB, {setID: id, set: definitionElement}) {
    const ctxSet = await BranchContext.create(
        parentBranch,
        options,
        definitionsDB
    );

    
    // ctx.branchID = `${setID || parentBranch.id}-set`;

    const {root, variables} = definitionElement;
    const setID = await copyPartialTerm(
        ctxSet, 
        definitionElement, 
        root,
        true, // extendSets,
        true
    );

    await ctxSet.setVariableValue(
        id, {
            type: constants.type.LOCAL_VAR, 
            cid: id, 
            id, 
            defer: setID
        }
    );

    const s = await ctxSet.getVariable(id);

    // create ctx elements,
    const elements = variables[root].elements;
    for (let i=0; i<elements.length; i++) {
        const ctxElement = ctxSet.snapshot();
        const elID = elements[i];

        const elementID = await copyPartialTerm(
            ctxElement, 
            definitionElement, 
            elID,
            true, // extendSets,
            true
        );

        // const actions = await plan(ctxElement, elementID);

        /*
        const s = await ctxElement.getVariable(elementID);
        const t = await ctxElement.getVariable(s.domain);
        console.log(s, t);
        await ctxElement.setActions([{action: ''}]);
        */

        await ctxElement.setActions([{action: 'unify-domain', elementID, inSetID: setID}]);
        ctxElement.state = 'maybe';
        await ctxElement.saveBranch();
    }

    ctxSet.state = 'merge';
    await ctxSet.saveBranch();

    console.log("TODO: we need to add a group or some way to merge branches to its fathers. stack ?");
    
    return branch;
}

async function expand (
    definitionsDB, 
    branch, 
    options, 
    selector, 
    definitions
) {

    const ctx = await BranchContext.create(branch, options, definitionsDB);
    
    const actions = await ctx.actions.toArray();

    for (let i=0; i<actions.length; i++) {
        const action = actions[0];
        switch (action.action) {
            case 'init-set': await initSet(branch, options, definitionsDB, action); break;

        }
    }

    // createBranchMaterializedSet
    // 1. we need to create two branches, empty set and expand-set. 
    throw 'SOME ACTION!!';

    /*
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
    */
    
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

/*
    1. we create an empty set branch in case element branches fail, the empty branch will be the result,
    2. then we create a child branch with elements, 

    Considerations:
        * We should normalize the Material sets so they all share same properties like definition, 
        * We should be able to control set creation and element creation, right now some sets are populated with elements, we should separate 
            them so we can control how sets and elements are constructed. 
        * We need to consider how a element fail will impact the set, should it be empty or not-exists ? 
*/
async function initSet (ctxSet, options, definitionsDB, {setID: id, set: definitionElement}) {
    const rDB = ctxSet.rDB;
    const emptyResults = {
        type: constants.type.MATERIALIZED_SET,
        id,
        elements: rDB.iSet(),
        size: 0,
        matrix: {
            elements: [],
            data: [],
            indexes: {},
            uniqueElements: {}
        }
    };

    await ctxSet.setVariableValue(
        id, emptyResults
    );

    const ctxElement = ctxSet.snapshot();

    ctxSet.state = 'yes';
    await ctxSet.saveBranch();

    const {root, variables} = definitionElement;
    const setID = await copyPartialTerm(
        ctxElement, 
        definitionElement, 
        root,
        true, // extendSets,
        true
    );

    const s = await ctxElement.getVariable(setID);

    await ctxElement.setVariableValue(id, {...s, id, elements: rDB.iSet()});
    await ctxElement.setVariableValue(setID, {
        type: constants.type.LOCAL_VAR, 
        cid: setID, 
        id: setID, 
        defer: id
    });

    const size = await s.elements.size;

    let elements;
    if (size === 0) {
        // create element,
        const [elID] = variables[root].elements;
        const elementID = await copyPartialTerm(
            ctxElement, 
            definitionElement, 
            elID,
            true, // extendSets,
            true
        );
        
        elements = [elementID];
    }
    else {
        elements = await s.elements.toArray();
    }

    return {ctxElement, elements};
}

async function split (ctx, elementID) {
    const element = await ctx.getVariable(elementID);

    let childs = [];

    switch (element.type) {
        case constants.type.TUPLE: {
            for (let i=0; i<element.data.length; i++) {
                const vID = element.data[i];
                const v = await ctx.getVariable(vID);

                // TODO: we need to group each processing variable, so that we can process this. 
                if (v.domain) {
                    const vd = await ctx.getVariable(v.domain);

                    for await (let eID of vd.elements.values()) {
                        const vCtx = await ctx.snapshot();

                        await vCtx.setVariableValue('_process', v.id);
                        const ok = await unify(vCtx, eID, v.id);

                        if (ok) {
                            childs.push(vCtx);
                            vCtx.state = 'split';
                        }
                        else {
                            vCtx.state = 'no';
                        }

                        await vCtx.saveBranch();
                    }
                }
            }

            break;
        }

        default:
            throw "split : unkown type " + element.type;
    }

    return childs;
}

/// --- 
// recursive copy variables,
async function copy (destCtxA, srcCtxB, id, done=new Set()) {
    const dataB = await srcCtxB.getVariable(id);

    id = dataB.id;

    if (!done.has(id)) {
        done.add(id);

        let domain;

        if (dataB.domain) {
            domain = await copy(destCtxA, srcCtxB, dataB.domain, done);
        }

        switch (dataB.type) {
            case constants.type.MATERIALIZED_SET: {
                let elements = destCtxA.rDB.iSet();

                for await (let eID of dataB.elements.values()) {
                    const id = await copy(destCtxA, srcCtxB, eID, done);
                    elements = await elements.add(id);
                }

                await destCtxA.setVariableValue(id, {
                    ...dataB, 
                    elements,
                    domain
                });

                break;
            }

            case constants.type.TUPLE: {
                const data = [];
                for (i=0; i<dataB.data.length; i++) {
                    data.push(await copy(destCtxA, srcCtxB, dataB.data[i], done));
                }

                await destCtxA.setVariableValue(id, {
                    ...dataB, 
                    data,
                    domain
                });

                break;
            }

            case constants.type.LOCAL_VAR: 
            case constants.type.GLOBAL_VAR: 
                await destCtxA.setVariableValue(id, {...dataB, domain});
                break;

            case constants.type.CONSTANT:
                await destCtxA.setVariableValue(id, dataB);
                break;

            default:
                throw 'copy unkown type ' + dataB.type
        }

    }

    return id;
}

/*
async function __copy (destCtxA, srcCtxB, id, done=new Set()) {
    if (srcCtxB.state !== 'yes') {
        throw "Can't copy from a non 'yes' final branch!";
    }

    if (!done.has(id)) {
        done.add(id);

        const dataB = await srcCtxB.getVariable(id);
        let data = dataB;

        
        // TODO: check commit history to check if should overwrite A.
        // if (await destCtxA.hasVariable(id)) {
        //    const dataA = await destCtxA.getVariable(id);
        //    throw 'CONFLICT ID NOT IMPLEMENTED';
        // }
        
        await destCtxA.setVariableValue(dataB.id, data);

        if (data.domain) {
            await copy(destCtxA, srcCtxB, data.domain, done);
        }

        switch (data.type) {
            case constants.type.MATERIALIZED_SET: {
                for await (let eID of data.elements.values()) {
                    await copy(destCtxA, srcCtxB, eID, done);
                }

                break;
            }
            case constants.type.TUPLE: {
                for (i=0; i<data.data.length; i++) {
                    await copy(destCtxA, srcCtxB, data.data[i], done);
                }
            }

            case constants.type.LOCAL_VAR: 
            case constants.type.GLOBAL_VAR: 
            case constants.type.CONSTANT: 
                break;

            default:
                throw 'copy unkown type ' + dataB.type
        }

        return dataB.id;
    }
}

async function execute (destCtxA, srcCtxB, cmds) {
    for (let i=0; i<cmds.length; i++) {
        const c = cmds[i];

        switch (c.cmd) {
            case 'copy': {
                for (let i=0; i<c.ids.length; i++) {
                    const id = c.ids[i];
                    await copy(destCtxA, srcCtxB, id);
                }

                break;
            }

            case 'in': {
                const set = await destCtxA.getVariable(c.set);
                const elements = await set.elements.add(c.elementID);

                await destCtxA.setVariableValue(set.id, {
                    ...set,
                    elements
                });

                break;
            }

            default:
                throw 'Unkown Command';
        }
    }
}*/

async function __createSetElement (branchCtx, setID, createBranch=true) {
    const set = await branchCtx.getVariable(setID);
    const definitionElement = set.definition;
    const {root, variables} = definitionElement;

    let elements = set.elements;

    const [elID] = variables[root].elements;

    const elementCtx = createBranch ? await branchCtx.createBranch() : branchCtx;

    const elementID = await copyPartialTerm(
        elementCtx, 
        definitionElement, 
        elID,
        true, // extendSets,
        true
    );

    if (createBranch) {
        branchCtx.state = 'processing';
        branchCtx.actions = [{
            cmd: 'copy', 
            branch: elementCtx.branch, 
            elementID,
            in: setID
        }];
        
        await branchCtx.commit();
    
        elementCtx.state = 'process';
        elementCtx.actions = [{cmd: 'eval', elementID}];
        await elementCtx.commit();
    }
    else {
        elements = await elements.add(elementID);
        await branchCtx.setVariableValue(set.id, {
            ...set,
            elements
        });

        await branchCtx.commit();
    }
}

async function createDomainSetElements (branchCtx, setID) {
    console.log("TODO: domains should also be evaluated or proof that exists.");

    const set = await branchCtx.getVariable(setID);

    const size = await set.elements.size;
    if (set.size === size) {
        // nothing to do.
        return;
    }

    const definitionElement = set.definition;
    const {root, variables} = definitionElement;

    const defElements = variables[root].elements;
    let elements = set.elements;
    for (let i=0; i<defElements.length; i++) {
        const elID = defElements[i];

        const elementID = await copyPartialTerm(
            branchCtx, 
            definitionElement, 
            elID,
            true, // extendSets,
            true
        );

        elements = await elements.add(elementID);
    }

    await branchCtx.setVariableValue(set.id, {
        ...set,
        elements
    });

    await branchCtx.commit();
}

async function processActionIn (branchCtx, action) {
    const {branches, setID} = action;
    const set = await branchCtx.getVariable(setID);
    let elements = set.elements;

    if (branches) {
        const nextBranches = [];
        let updateSet = false;

        for (let i=0; i<branches.length; i++) {
            const branch = branches[i];
            const elementCtx = await BranchContext.create(
                branch, 
                branchCtx.branchDB, 
                branchCtx.options, 
                branchCtx.db, 
                branchCtx.rDB
            );

            const state = elementCtx.state;

            if (state === 'yes') {
                const id = await copy(branchCtx, elementCtx, elementCtx.result);
                elements = await elements.add(id);
                updateSet = true;
            }
            else if (state !== 'no') {
                nextBranches.push(branch);
            }
        }

        if (updateSet) {
            let size = set.size;
            if (action.sizeElementsEval) {
                size = await elements.size;
            }

            await branchCtx.setVariableValue(set.id, {
                ...set,
                elements,
                size
            });

            console.log("SET", await branchCtx.toString(set.id));
        }

        if (nextBranches.length) {
            branchCtx.actions = {
                ...branchCtx.actions,
                branches: nextBranches
            }
        }
        else {
            // check elements in set,
            const size = await elements.size;
            if (size === 0) {
                await branchCtx.setVariableValue(set.id, {
                    ...set,
                    size: 0
                });
            }

            branchCtx.state = 'yes';
        }

        await branchCtx.commit();
       
    }
    else {
        // create branches for in operator,
        // 1. iterate over elements of set, create them if needed,
        const set = await branchCtx.getVariable(setID);

        const size = await set.elements.size;
        if (set.size === size) {
            // 2. insert all elements in the set,
            throw 'processActionIn insert elements in the set'
        }
        else {
            const definitionElement = set.definition;
            const {root, variables} = definitionElement;

            const defElements = variables[root].elements;

            const branches = [];
            for (let i=0; i<defElements.length; i++) {
                const elID = defElements[i];
                const elementCtx = await branchCtx.createBranch();

                const elementID = await copyPartialTerm(
                    elementCtx, 
                    definitionElement, 
                    elID,
                    true, // extendSets,
                    true
                );

                elementCtx.actions = {cmd: 'eval', elementID};
                elementCtx.result = elementID;
                elementCtx.state = 'process';
                await elementCtx.commit();

                branches.push(elementCtx.branch);
            }

            branchCtx.actions = {...action, branches};
            branchCtx.state = 'processing';
            await branchCtx.commit();
        }
    }
}

async function processElementDomain (branchCtx, element) {

    const set = await branchCtx.getVariable(element.domain);

    const definitionElement = set.definition;

    if (!definitionElement) {
        console.log(await branchCtx.toString(element.id));
        // throw 'NO DEFS';
        return;
    }

    const {root, variables} = definitionElement;

    const defElements = variables[root].elements;

    const branches = [];
    for (let i=0; i<defElements.length; i++) {
        const elID = defElements[i];
        const elementCtx = await branchCtx.createBranch();

        const elementID = await copyPartialTerm(
            elementCtx, 
            definitionElement, 
            elID,
            true, // extendSets,
            true
        );

        elementCtx.actions = {
            cmd: 'unify', 
            a: element.id, 
            b: elementID,
            domain: element.domain
        };

        elementCtx.result = elementID;
        elementCtx.state = 'process';
        await elementCtx.commit();

        branches.push(elementCtx.branch);
    }

    if (branches.length === 0) {
        branchCtx.state = 'no';
        await branchCtx.commit();
    }
    else if (branches.length === 1) {
        branchCtx.actions = {cmd: 'eval', branch: branches[0]};
        await branchCtx.commit();
    }
    else {
        const domainID = branchCtx.newVar();

        const domainSet = {
            type: constants.type.MATERIALIZED_SET,
            id: domainID,
            elements: branchCtx.rDB.iSet(),
            size: -1
        };
    
        
        await branchCtx.setVariableValue(domainID, domainSet);
        await branchCtx.setVariableValue(element.id, {...element, domain: domainID});
        
        branchCtx.actions = {
            cmd: 'in', 
            branches, 
            sizeElementsEval: true,
            setID: domainID
        };

        await branchCtx.commit();
    }
} 

async function processActionTupleElements (branchCtx, action) {
    const branches = [];

    for (let i=0; i<action.branches.length; i++) {
        const branch = action.branches[i];

        const elementCtx = await BranchContext.create(
            branch, 
            branchCtx.branchDB, 
            branchCtx.options, 
            branchCtx.db, 
            branchCtx.rDB
        );

        const state = elementCtx.state;

        if (state === 'yes') {
            // copy element, 
            const id = await copy(branchCtx, elementCtx, elementCtx.result);

            /*
            const a = await branchCtx.toString(id);
            const b = await branchCtx.toString(elementCtx.result);
            
            console.log("--->", a, b);
            throw 'TODO: Should Unify ??'*/
        }
        else if (state === 'no') {
            branchCtx.state = 'no';
            await branchCtx.commit();
            return;
        }
        else {
            branches.push(branch);
        }
    }

    if (branches.length) {
        branchCtx.actions = {...branchCtx.actions, branches};
    }
    else {
        branchCtx.state = 'yes';
    }

    await branchCtx.commit();

}

async function processActionEval (branchCtx, action) {
    const {elementID, branch} = action;

    if (!elementID && branch) {
        const elementCtx = await BranchContext.create(
            branch, 
            branchCtx.branchDB, 
            branchCtx.options, 
            branchCtx.definitionsDB, 
            branchCtx.rDB
        );

        const state = elementCtx.state;
        if (state === 'yes') {
            const elementID = await copy(
                branchCtx, 
                elementCtx, 
                elementCtx.result
            );

            // branchCtx.actions = {cmd: 'eval', elementID};
            branchCtx.state = 'yes';
            await branchCtx.commit();
        }
        else if (state === 'no') {
            branchCtx.state = 'no';
            await branchCtx.commit();
        }

        return; 
    }

    const v = await branchCtx.getVariable(elementID);

    if (v.domain && !v.unifiedDomains?.includes(v.domain)) {
        // TODO: both v.domain and unfiedDomains may contain outdated ids and may 
        // mismatch, we need to make a better control check.
        return await processElementDomain(branchCtx, v);
    }
    else {
        switch (v.type) {
            case constants.type.TUPLE: {
                const branches = [];
                for (let i=0; i<v.data.length; i++) {
                    const eID = v.data[i];
                    const e = await branchCtx.getVariable(eID);

                    switch (e.type) {
                        case constants.type.LOCAL_VAR: {
                            if (e.domain) {
                                const elementCtx = await branchCtx.createBranch();
                                elementCtx.state = 'process';
                                elementCtx.result = e.id;
                                await processElementDomain(elementCtx, e);
                                await elementCtx.commit();
                                branches.push(elementCtx.branch);
                            }
                        }

                        case constants.type.CONSTANT:
                            break;

                        default:
                            throw 'processActionEval: tuple element unknown type ' + e.type;
                    }
                }

                if (branches.length) {
                    branchCtx.actions = {
                        cmd: 'tuple-elements', 
                        branches,
                        elementID
                    };

                    await branchCtx.commit();
                }
                else {
                    branchCtx.state = 'yes';
                    await branchCtx.commit();
                }

                break;
            }

            case constants.type.CONSTANT: 
                branchCtx.state = 'yes';
                await branchCtx.commit();
                break;

            default: 
                console.log(v);
                throw 'processActionEval : Unknown element type ' + v.type;
        }

        
    }
}

async function processActionUnify (branchCtx, action) {
    const {a, b, domain} = action;

    const ok = await unify(branchCtx, a, b);

    if (ok) {
        const element = await branchCtx.getVariable(a);
        if (domain) {
            await branchCtx.setVariableValue(element.id, {
                ...element,
                unifiedDomains: (element.unifiedDomains || []).concat(domain)
            });
        }

        branchCtx.actions = {cmd: 'eval', elementID: b};
    }
    else {
        branchCtx.state = 'no';
    }

    await branchCtx.commit();
}

async function processAction (branchCtx) {
    const action = branchCtx.actions;

    console.log(action, await branchCtx.toString(branchCtx.result));
    switch (action.cmd) {
        case 'in': {
            return processActionIn(branchCtx, action);
        }

        case 'eval': {
            return processActionEval(branchCtx, action);
        }

        case 'unify': {
            return processActionUnify(branchCtx, action);
        }

        case 'tuple-elements': {
            return processActionTupleElements(branchCtx, action);
        }

        default: 
            console.log(action);
            throw 'processAction : Undefined cmd ' + action.cmd;
    }
}

async function updateGraph (branchCtx, elementID) {
    let actions = branchCtx.graph.actions;
    if (!(await actions.has(elementID))) {
        const e = await branchCtx.getVariable(elementID);

        if (e.domain) {
            actions = await actions.set(elementID, {
                cmd: 'unify-domain',
                elementID,
                deps: [e.domain]
            });

            branchCtx.graph = {
                ...branchCtx.graph,
                actions
            };

            await updateGraph(branchCtx, e.domain);

            return elementID;
        }
        else {
            switch (e.type) {
                case constants.type.MATERIALIZED_SET: {
                    actions = await actions.set(elementID, {
                        cmd: 'in',
                        setID: elementID
                    });

                    branchCtx.graph = {
                        ...branchCtx.graph,
                        actions
                    };
        
                    return elementID;
                }

                case constants.type.TUPLE: {

                    const deps = [];
                    for (let i=0; i<e.data.length; i++) {
                        const id = await updateGraph(branchCtx, e.data[i]);
                        if (id) {
                            deps.push(id);
                        }
                    }

                    if (deps.length) {
                        actions = await branchCtx.graph.actions.set(elementID, {
                            cmd: 'tuple-check',
                            elementID,
                            deps
                        });
            
                        branchCtx.graph = {
                            ...branchCtx.graph,
                            actions
                        };
            
                        return elementID;
                    }
                }

                case constants.type.CONSTANT: 
                    return;

                default:
                    throw 'updateGraph ' + e.type + ' is not defined';
            }
        }

        /*branchCtx.graph = {
            ...branchCtx.graph,
            actions
        };*/

        /*
        actions = await actions.set(elementID, {
            cmd: 'eval',
            elementID,
            deps: e.domain ? [e.domain]: undefined
        });

        branchCtx.graph = {
            ...branchCtx.graph,
            actions
        };

        if (e.domain) {
            await updateGraph(branchCtx, e.domain);
        }
        */
        /*
        let deps = [];
        if (e.domain) {
            deps.push(e.domain);
        }

        switch (e.type) {
            case constants.type.TUPLE: {
                for (let i=0; i<e.data.length; i++) {
                    const vID = e.data[i];
                    deps.push(vID);
                    await updateGraph(branchCtx, vID);
                }

                actions = await actions.set(elementID, {
                    cmd: 'eval',
                    elementID,
                    deps
                });
            }
        }*/
    }
}

async function createSetElements (branchCtx, setID) {
    const set = await branchCtx.getVariable(setID);
    const definitionElement = set.definition;
    const {root, variables} = definitionElement;

    // const [elID] = variables[root].elements;

    const elements = variables[root].elements;
    const branches = [];
    for (let i=0; i<elements.length; i++) {
        const elementCtx = await branchCtx.createBranch();
        const elID = elements[i];

        const elementID = await copyPartialTerm(
            elementCtx, 
            definitionElement, 
            elID,
            true, // extendSets,
            true
        );

        elementCtx.state = 'process';
        await updateGraph(elementCtx, elementID);

        const actionsStr = await elementCtx.graph.actions.toArray();
        console.log(actionsStr);

        elementCtx.graph.result = elementID;
        await elementCtx.commit();

        branches.push(elementCtx.branch);

        /*branchCtx.state = 'processing';
        branchCtx.actions = [{
            cmd: 'copy', 
            branch: elementCtx.branch, 
            elementID,
            in: setID
        }];*/
    }
        
    // await branchCtx.commit();
    
    /*elementCtx.state = 'process';
    elementCtx.actions = [{cmd: 'eval', elementID}];
    await elementCtx.commit();*/

    return branches;
}

/*
async function eval (branchCtx, elementID) {
    const e = await branchCtx.getVariable(elementID);

    if (e.domain) {
        // solve domain,

        if (e.type === constants.type.LOCAL_VAR
            && !(e.constraints ? await e.constraints.size : false)
        ) {
            // nothing to do!
            branchCtx.state = 'yes';
            await branchCtx.commit();
            return;
        }

        let valueCtx; 
        const domain = {elementID, valueBranches: [], values: []};

        await createDomainSetElements(branchCtx, e.domain);

        const d = await branchCtx.getVariable(e.domain);

        for await (let dID of d.elements.values()) {
            valueCtx = await branchCtx.createBranch();

            // const ok = await unify(unifyCtx, eID, elementID);

            // unifyCtx.state = ok ? 'maybe' : 'no';
            valueCtx.state = 'process';
            valueCtx.actions = [{cmd: 'unify', dID, eID: elementID}];

            await valueCtx.commit();
            domain.valueBranches.push(valueCtx.branch);
        }

        branchCtx.state = 'processing';
        branchCtx.actions = [{cmd: 'solve-domain', ...domain}];
        await branchCtx.commit();
    }
    else {
        switch (e.type) {
            case constants.type.TUPLE: {
                const actions = [];
                
                for (let i=0; i<e.data.length; i++) {
                    const vID = e.data[i];
                    const v = await branchCtx.getVariable(vID);

                    if (v.domain) {
                        const elementBranch = await branchCtx.createBranch();
                        elementBranch.actions = [{cmd: 'eval', elementID: vID}];
                        elementBranch.state = 'process';
                        await elementBranch.commit();
                        actions.push({cmd: 'copy', branch: elementBranch.branch, elementID: vID});
                    }
                }

                if (actions.length) {
                    branchCtx.actions = actions;
                    branchCtx.state = 'processing';
                }
                else {
                    branchCtx.state = 'yes';
                }
                
                await branchCtx.commit();

                break;
            }

            case constants.type.CONSTANT: {
                branchCtx.state = 'yes';
                await branchCtx.commit();
                break;
            }

            case constants.type.MATERIALIZED_SET: {
                console.log(e);
                const size = await e.elements.size;
                if (size > 0) {
                    const actions = [];
                    for await (let eID of e.elements.values()) {
                        actions.push({cmd: 'eval', elementID: eID});
                    }

                    branchCtx.actions = actions;
                }
                else {
                    branchCtx.actions = [{cmd: 'create-element', elementID}];
                }

                branchCtx.state = 'process';
                await branchCtx.commit();

                break;
            }


            default:
                throw 'EVAL IS NOT DEFINED FOR TYPE : ' + e.type;
        }
    }
}*/

/*
async function process (cmd, branchCtx) {

    console.log("COMMAND", cmd);

    switch (cmd.cmd) {
        case 'create-element': {
            await createSetElement(branchCtx, cmd.elementID);
            break;
        }

        case 'eval': {
            await eval(branchCtx, cmd.elementID);
            break;
        }

        case "unify": {
            const {dID, eID} = cmd;
            const ok = await unify(branchCtx, dID, eID);

            if (!ok) {
                branchCtx.state = 'no';
                branchCtx.actions = [];
                await branchCtx.commit();
            }
            else {
                // commit unify changes,
                await branchCtx.commit();
                await eval(branchCtx, eID);
            }

            break;
        }

        case 'solve-domain': {
            let valueBranches = [];
            let values = cmd.values.slice();

            for (let i=0; i<cmd.valueBranches.length; i++) {
                const branch = cmd.valueBranches[i];
                const state = await branch.data.state;

                if (['yes', 'no'].includes(state)) {
                    if (state === 'yes') {
                        // actions.push({cmd: 'copy', branch, elementID: cmd.elementID});
                        const srcCtx = await BranchContext.create(
                            branch, 
                            branchCtx.branchDB, 
                            branchCtx.options, 
                            branchCtx.definitionsDB, 
                            branchCtx.rDB
                        );

                        const id = await copy(branchCtx, srcCtx, cmd.elementID);
                        values.push(id);
                    }
                }
                else {
                    valueBranches.push(branch);
                }
            }

            if (valueBranches.length === 0 || valueBranches.length < cmd.valueBranches.length) {
                if (valueBranches.length === 0) {
                    // nothing else to do,
                    branchCtx.actions = [];
                    if (values.length) {
                        branchCtx.state = 'yes';

                        const elementID = cmd.elementID;

                        if (values.length === 1) {
                            const id = values[0];
                            if (elementID !== id) {
                                await branchCtx.setVariableValue(elementID, {
                                    id: elementID,
                                    type: constants.type.LOCAL_VAR,
                                    defer: id
                                });
                            }
                        }
                        else {
                            const domainID = branchCtx.newVar();
                            let elements = branchCtx.rDB.iSet();

                            for (let i=0; i<values.length; i++) {
                                const id = values[i];
                                elements = await elements.add(id);
                            }

                            const domainSet = {
                                type: constants.type.MATERIALIZED_SET,
                                id: domainID,
                                elements,
                                size: await elements.size
                            };
                        
                            const e = await branchCtx.getVariable(elementID);
                            await branchCtx.setVariableValue(domainID, domainSet);
                            await branchCtx.setVariableValue(e.id, {...e, domain: domainID});
                        }
                    }
                    else {
                        branchCtx.state = 'no';
                    }

                    await branchCtx.commit();
                }
                else {                
                    // if its not completed keep going,
                    branchCtx.actions = [{
                        ...cmd,
                        valueBranches,
                        values
                    }];

                    await branchCtx.commit();
                }
            }

            break;
        }

        case 'copy' : {
            const state = await cmd.branch.data.state;
            if (state === 'yes') {
                const srcCtx = await BranchContext.create(
                    cmd.branch, 
                    branchCtx.branchDB, 
                    branchCtx.options, 
                    branchCtx.definitionsDB, 
                    branchCtx.rDB
                );

                console.log("copy ---->", cmd.elementID, await srcCtx.toString(cmd.elementID));

                const id = await copy(branchCtx, srcCtx, cmd.elementID);

                console.log("copy result ---->", id,  await branchCtx.toString(id));

                if (cmd.elementID !== id) {
                    await branchCtx.setVariableValue(cmd.elementID, {
                        id: cmd.elementID,
                        type: constants.type.LOCAL_VAR,
                        defer: id
                    });
                }

                if (cmd.in) {
                    const set = await branchCtx.getVariable(cmd.in);
                    const elements = await set.elements.add(cmd.elementID);

                    await branchCtx.setVariableValue(set.id, {...set, elements});
                }

                branchCtx.actions = [];
                branchCtx.state = 'yes';
                await branchCtx.commit();
            }
            else if (state === 'no') {
                branchCtx.state = 'no';
                branchCtx.actions = [];

                if (cmd.in) {
                    const set = await branchCtx.getVariable(cmd.in);

                    await branchCtx.setVariableValue(set.id, {
                        ...set, 
                        elements: branchCtx.rDB.iSet()
                    });
                }

                await branchCtx.commit();
            }

            break;
        }

        default:
            console.log(cmd);
            throw 'Unkown Command ' + cmd.cmd;
    }
}*/

async function process (action, branchCtx) {
    switch (action.cmd) {
        case 'in': {
            if (action.branches) {
                const branches = [];
                for (let i=0; i<action.branches.length; i++) {
                    const branch = action.branches[i];

                    const state = await branch.data.state;
                    if (['yes', 'no'].includes(state)) {
                        if (state === 'yes') {
                            const elementID = await branch.data.graph.result;

                            const srcCtx = await BranchContext.create(
                                branch, 
                                branchCtx.branchDB, 
                                branchCtx.options, 
                                branchCtx.definitionsDB, 
                                branchCtx.rDB
                            );
    
                            const id = await copy(branchCtx, srcCtx, elementID);
                            values.push(id);
                        }
                    }
                    else {
                        branches.push(branch);
                    }
                }
            }
            else {
                // start branch elements
                const branches = await createSetElements(branchCtx, action.setID);
                const actions = await branchCtx.graph.actions.set(
                    action.setID,
                    {...action, branches}
                );

                branchCtx.graph = {
                    ...branchCtx.graph,
                    actions
                };

                await branchCtx.commit();
            }

            break;
        }

        /*case 'eval': {
            await eval(branchCtx, action.elementID);
            break;
        }*/

        default:
            console.log(action);
            throw 'Unkown Command ' + action.cmd;
    }
}

/*
async function executeActions (branchCtx) {
    const graph = branchCtx.graph;

    let action = await graph.actions.get(id);

    if (!action) {
        console.log("---->", graph, await graph.actions.toArray());
        const v = await branchCtx.getVariable(id);

        console.log(v);
        throw 'Why Variable is not defined here! ';
    }


    if (action.done) {
        return true;
    }

    let done = true;
    if (action.deps) {
        for (let i=0; i<action.deps.length; i++) {
            const id = action.deps[i];
            done = done && await executeActions(branchCtx, id);
        }
    }
    
    if (done) {
        await process(action, branchCtx);
    }

    return false;
    
}*/

async function run (qe, branch) {
    const branchCtx = await BranchContext.create(
        branch, 
        qe.branchDB, 
        qe.options, 
        qe.db, 
        qe.rDB
    );

    // await executeActions(branchCtx);
    await processAction(branchCtx);
    
    // branchCtx.state = 'processing';
    // await branchCtx.commit();

    /*const [cmd] = branchCtx.actions;

    if (cmd) {
        await process(cmd, branchCtx);
    }*/
}

async function _new_run (qe) {
    console.log("Start RUN QE");
    const branches = qe.rDB.tables.branches;
    // const definitions = async tuple => qe.db.search(tuple);

    // 1. get root branch, 
    let rootBranch;
    for await (let branch of branches.findByIndex({branchID: 'ROOT'})) {
        rootBranch = branch;
        break;
    }

    const rootCtx = await BranchContext.create(
        rootBranch, 
        qe.branchDB, 
        qe.options, 
        qe.db, 
        qe.rDB
    );

    // 2. create root element,
    const rootSet = await rootCtx.getVariable(rootCtx.root);
    const definitionElement = rootSet.definition;
    const {root, variables} = definitionElement;

    const [elID] = variables[root].elements;

    const elementCtx = await rootCtx.createBranch();

    const elementID = await copyPartialTerm(
        elementCtx, 
        definitionElement, 
        elID,
        true, // extendSets,
        true
    );

    await elementCtx.commit();

    // 3. unify elementID with domain,
    const element = await elementCtx.getVariable(elementID);
    const d = await elementCtx.getVariable(element.domain);

    let unifyCtx; 
    for await (let eID of d.elements.values()) {
        unifyCtx = await elementCtx.createBranch();

        const ok = await unify(unifyCtx, eID, elementID);

        unifyCtx.state = ok ? 'maybe' : 'no';
        
        await unifyCtx.commit();

        break;
    }

    // 4. get element 'x, 
    const tuple = await unifyCtx.getVariable(elementID);
    const xID = tuple.data[1];
    const x = await unifyCtx.getVariable(xID);
    const xDomain = await unifyCtx.getVariable(x.domain);

    const xDomainCtx = await unifyCtx.createBranch();

    let xElements = qe.rDB.iSet();
    const id = x.id + '@domain';

    for await (let eID of xDomain.elements.values()) {
        let xValueCtx = await xDomainCtx.createBranch();
        const ok = await unify(xValueCtx, xID, eID);

        if (ok) {
            const c = await xValueCtx.getVariable(xID);
            xElements = await xElements.add(c.id);
            xValueCtx.state = 'yes'; // its completed
        }
        else {
            xValueCtx.state = 'no'; // its completed but fails.
        }

        await xValueCtx.commit();
    }

    const xDomainSet = {
        type: constants.type.MATERIALIZED_SET,
        id,
        elements: xElements,
        size: await xElements.size
    };

    await xDomainCtx.setVariableValue(id, xDomainSet);
    await xDomainCtx.setVariableValue(x.id, {...x, domain: id});

    xDomainCtx.state = 'yes'; // its completed!
    await xDomainCtx.commit();

    // 5. merge up
    {
        const str = await rootCtx.toString();
        console.log("ROOT Element ", str);
    }

    {
        const str = await elementCtx.toString(elementID);
        console.log("TUPLE Element ", str);
    }

    {
        const str = await unifyCtx.toString(xID);
        console.log("TUPLE DOMAINS Elements", str);
    }

    {
        const str = await xDomainCtx.toString(xID);
        console.log("X DOMAIN", str);
    }

    // 5a. Update changes on unifyCtx,
    // xDomain is completed so it can merge with unifyCtx,
    // TODO: state should be at branch, because commits are shared and on merge state will be shared too. 
    // await unifyCtx.merge(xDomainCtx);

    const cmd = [{cmd: 'copy', ids: [x.id]}];

    await execute(unifyCtx, xDomainCtx, cmd);
    await unifyCtx.commit();

    // 5b. Now unifyCtx is also a yes, we need to join up,

    await execute(elementCtx, unifyCtx, cmd);
    await elementCtx.commit();

    // 5c. Now element is also a yes, join up,
    cmd.push(
        {cmd: 'copy', ids: [elementID]},
        {cmd: 'in', elementID, set: rootCtx.root}
    );

    await execute(rootCtx, elementCtx, cmd);
    await rootCtx.commit();

    {
        console.log("----------- Start toString -------------------");
        const str = await rootCtx.toString();
        console.log("===> Results TUPLE DOMAINS Elements", str);
    }

    throw '--- WE NEED TO CREATE A BRANCH CONTEXT -- ADAPT!!';


    // await rootBranch.update({state: "split"});

    // const ctx = await BranchContext.create(rootBranch, qe.options, qe.db);

    // 2. create root set,
    // const [action] = await ctx.actions.toArray();
    // const {ctxElement, elements} = await initSet(ctx, qe.options, qe.db, action);

    // 3. create root set element,
    /*const rootSet = await ctx.getVariable(ctx.root);
    const definitionElement = rootSet.definition;
    const {root, variables} = definitionElement;

    const [elID] = variables[root].elements;
    const ctxElement = ctx.snapshot();

    ctx.state = 'split'
    await ctx.saveBranch();

    const elementID = await copyPartialTerm(
        ctxElement, 
        definitionElement, 
        elID,
        true, // extendSets,
        true
    );*/

    // 4. unify elementID with domain,
    /*const elementID = elements[0];
    const element = await ctxElement.getVariable(elementID);
    const d = await ctxElement.getVariable(element.domain);

    let unifyCtx; 
    for await (let eID of d.elements.values()) {
        unifyCtx = await ctxElement.snapshot();

        const ok = await unify(unifyCtx, eID, elementID);

        if (!ok) {
            ctxElement.state = 'no';
            await ctxElement.saveBranch();

            unifyCtx.state = 'no';
            await unifyCtx.saveBranch();

            // TODO: When reusing the context, we can't update state, why ? Can we do it if we create new context ? 
            // ctx.state = 'yes';
            // await ctx.saveBranch();
            // await ctx.branch.update({state: 'yes'});
            
            return;
        }
        else {
            // TODO: Why this does not work ? 
            // ctx.state = 'split';
            // await ctx.saveBranch();
            const r = await ctx.savedBranch.update({state: 'split'});
            // console.log(r);
        }

        break;

        // elements.push(unifiedBranch);
    }

    ctxElement.state = 'split';
    await ctxElement.saveBranch();

    // 5. split,
    const childs = await split(unifyCtx, elementID);

    if (!childs.length) {
        const ctxElements = unifyCtx.snapshot();
        unifyCtx.state = 'split';
        await unifyCtx.saveBranch();

        const set = await ctxElements.getVariable(action.setID);
        const elements = await set.elements.add(elementID);
        await ctxElements.setVariableValue(set.id, {...set, elements});

        ctxElements.state = 'yes';
        await ctxElements.saveBranch();

        return;
    }*/

    // 6. create new x domain,

    // TODO: we need to group branch by variable, also we need to know what variable we want to check on branch and or what actions to do. 
    
    /*
        Merge Case 1:
            a. The element is a variable, there is only variable changes
            b. There is only one branch then we are done,
            c. There is more than one branch , create domain put all elements in there, associate variable to new domain.

            * Creating merge branches, rethink branch structures, we need multiple fathers or something else. 
     */

    // const unifiedElement = await unifyCtx.getVariable(elementID);
    // const x = await unifyCtx.getVariable(unifiedElement.data[1]);

    // const id = x.id + '@domain';

    // TODO: we need a way to get what are the variables that we want to merge, ex. 'x and branches that evaluate 'x . 

    /*const xDomainCtx = unifyCtx.snapshot();
    
    unifyCtx.state = 'split';
    await unifyCtx.saveBranch();

    let xElements = qe.rDB.iSet();
    let eID;

    for (let i=0; i<childs.length; i++) {
        const xCtx = childs[i];
        eID = await xCtx.getVariable('_process');
        const c = await xCtx.getVariable(eID);
        
        xElements = await xElements.add(c.id);
    }

    const x = await xDomainCtx.getVariable(eID);
    const id = x.id + '@domain';

    const xDomain = {
        type: constants.type.MATERIALIZED_SET,
        id,
        elements: xElements,
        size: childs.length,
        matrix: {
            elements: [],
            data: [],
            indexes: {},
            uniqueElements: {}
        }
    };

    await xDomainCtx.setVariableValue(id, xDomain);
    await xDomainCtx.setVariableValue(x.id, {...x, domain: id});

    // 7. add element to set,
    const set = await xDomainCtx.getVariable(action.setID);

    await xDomainCtx.setVariableValue(set.id, {...set, elements: await set.elements.add(elementID)});

    // console.log(await xDomainCtx.toString(), await xDomainCtx.toString(id));

    xDomainCtx.state = 'yes';
    return await xDomainCtx.saveBranch();*/
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
    genSets,
    run
}

