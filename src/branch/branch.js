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

async function processActionInDomain (branchCtx, action) {
    const {elementID} = action;
    const element = await branchCtx.getVariable(elementID);
    const set = await branchCtx.getVariable(element.domain);

    const definitionElement = set.definition;

    if (!definitionElement) {
        console.log(await branchCtx.toString(element.id));
        // throw 'NO DEFS';
        return;
    }

    const {variables} = definitionElement;

    const defElements = variables[set.defID].elements;

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
    }
    else if (branches.length === 1) {
        branchCtx.actions = {cmd: 'value', branch: branches[0]};
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
        
        console.log(await branchCtx.toString(element.id));
        branchCtx.actions = {
            cmd: 'in', 
            branches, 
            sizeElementsEval: true,
            setID: domainID
        };
    }

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

                await branchCtx.debug();

                const id = await copy(branchCtx, elementCtx, elementCtx.result);

                console.log(
                    '[1] ===> copy ' , await elementCtx.toString(elementCtx.result),
                    ' ==> result => ', await branchCtx.toString(id)
                );

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
        const size = await set.elements.size;
        if (set.size === size) {
            // 2. insert all elements in the set,
            throw 'processActionIn insert elements in the set'
        }
        else {
            const definitionElement = set.definition;
            const {variables} = definitionElement;

            const defElements = variables[set.defID].elements;

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

                /*elementCtx.actions = {cmd: 'eval', elementID};
                elementCtx.result = elementID;
                elementCtx.state = 'process';
                await elementCtx.commit();
                */
                await selectAction(elementCtx, elementID);

                branches.push(elementCtx.branch);
            }

            branchCtx.actions = {...action, branches};
            branchCtx.state = 'processing';
            await branchCtx.commit();
        }
    }
}

/*
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

            // const a = await branchCtx.toString(id);
            // const b = await branchCtx.toString(elementCtx.result);
            
            // console.log("--->", a, b);
            // throw 'TODO: Should Unify ??'
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

}*/

/*
    Select Action
*/

async function selectElementAction (branchCtx, elementID, level=0, checked=new Set()) {
    const element = await branchCtx.getVariable(elementID);

    if (checked.has(element.id)) {
        return [];
    }

    checked.add(element.id);

    level += 1;

    if (element.domain && !element.unifiedDomains?.includes(element.domain)) {
        return [{
            cmd: 'in-domain', 
            elementID: 
            element.id, 
            level, 
            result: element.id
        }];
    }

    let actions = [];
    switch (element.type) {
        case constants.type.MATERIALIZED_SET: {
            return [{
                cmd: 'in', 
                setID: element.id, 
                level,
                result: element.id
            }];
        }

        case constants.type.CONSTRAINT: {
            const {a, b} = element;
            actions = actions.concat(await selectElementAction(branchCtx, a, level, checked))
            actions = actions.concat(await selectElementAction(branchCtx, b, level, checked));

            break;
        }

        case constants.type.SET_SIZE: {
            const {variable} = element;
            actions = actions.concat(await selectElementAction(branchCtx, variable, level, checked));
            break;
        }

        case constants.type.TUPLE: {
            for (let i=0; i<element.data.length; i++) {
                actions = actions.concat(
                    await selectElementAction(branchCtx, element.data[i], level, checked)
                );
            }

            break;
        }

        case constants.type.LOCAL_VAR:
        case constants.type.INDEX: 
        case constants.type.CONSTANT:
            break;
        
        default:
            throw `selectAction : type ${element.type} is not implemented`;
    }

    if (actions.length === 0 && element.constraints) {
        for await (let csID of element.constraints.values()) {
            actions = actions.concat(await selectElementAction(
                branchCtx, 
                csID, 
                level,
                checked
            ));
        }
    }

    return actions;
}

async function selectAction (branchCtx, elementID) {
    const actions = await selectElementAction(branchCtx, elementID);

    if (actions.length > 0) {
        const selectedAction = actions.sort((a, b) => a.length - b.level)[0];

        const {result, level, ...action} = selectedAction;

        branchCtx.result = result;
        branchCtx.actions = action;
        branchCtx.state = 'process';
        await branchCtx.commit();
    }
    else {
        branchCtx.state = 'yes';
        await branchCtx.commit();
        // throw 'SHOULD MARK BRANCH HAS YES?';
    }
}
/*
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

            console.log(elementID, elementCtx.result);

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
        return await analyseElement(branchCtx, elementID, v);
    }
}*/

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

        // branchCtx.actions = {cmd: 'eval', elementID: b};

        await selectAction(branchCtx, b);
    }
    else {
        branchCtx.state = 'no';
    }

    await branchCtx.commit();
}

async function processActionValue (branchCtx, action) {
    const {branch} = action;
    const state = await branch.data.state;

    if (state === 'yes') {
        const elementCtx = await BranchContext.create(
            branch, 
            branchCtx.branchDB, 
            branchCtx.options, 
            branchCtx.definitionsDB, 
            branchCtx.rDB
        );

        const elementID = await copy(
            branchCtx, 
            elementCtx, 
            elementCtx.result
        );
    
        await elementCtx.debug();

        console.log(
            '[2] ===> copy ' , await elementCtx.toString(elementCtx.result),
            ' ==> result => ', await branchCtx.toString(elementID),
            ' ==> Element branchCtx Result', await elementCtx.toString(branchCtx.result),
            ' ==> branchCtx Result', await branchCtx.toString(branchCtx.result)
        );

        branchCtx.state = 'yes'; 
        await branchCtx.commit();
        
        // throw 'processActionValue : Copy result';
    }
    else if (state === 'no') {
        branchCtx.state = 'no';
        await branchCtx.commit();
    }
    // else do nothing, just wait.

}

async function processAction (branchCtx) {
    const action = branchCtx.actions;

    switch (action.cmd) {
        case 'in': {
            return processActionIn(branchCtx, action);
        }

        /*case 'eval': {
            return processActionEval(branchCtx, action);
        }*/

        case 'value': {
            return processActionValue(branchCtx, action);
        }

        case 'in-domain': {
            return processActionInDomain(branchCtx, action);
            // return processElementDomain(branchCtx, v);
        }

        case 'unify': {
            return processActionUnify(branchCtx, action);
        }

        /*
        case 'tuple-elements': {
            return processActionTupleElements(branchCtx, action);
        }*/

        default: 
            console.log(action);
            throw 'processAction : Undefined cmd ' + action.cmd;
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

async function run (qe, branch) {
    const branchCtx = await BranchContext.create(
        branch, 
        qe.branchDB, 
        qe.options, 
        qe.db, 
        qe.rDB
    );

    await processAction(branchCtx);
}

module.exports = {
    createBranchMaterializedSet,
    merge,
    toJS,
    toString,
    varGenerator,
    copyTerm,
    copyPartialTerm,
    getVariable,
    constants,
    logger,
    BranchContext,
    genSets,
    run,
    selectAction
}

