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

async function mergeElements (ctx, setA, setB, aID, bID) {
    const a = await ctx.getVariable(aID);
    const b = await ctx.getVariable(bID);

    if (a.id !== b.id) {
        if (a.type === b.type) {
            if (a.type === constants.type.MATERIALIZED_SET) {
                await mergeSets(ctx, a, b);
            }
            else {
                const elements = await setA.elements.add(bID);
                await ctx.setVariableValue(setA.id, {
                    ...setA,
                    elements
                });
            }
        }
        else {
            throw `mergeElements, diff type ${a.type} !== ${b.type}`;
        }
    }
    // else nothing to do, 

//     throw 'MergeElements';
}

async function addElement (ctx, setA, el, setB) {
    if (!await setA.elements.has(el.id)) {
        const indexes = await setB.varIndexes.get(el.id);

        console.log(
            `addElement : ${await ctx.toString(el.id)} in ${await ctx.toString(setA.id)}`
        );

        if (indexes) {
            for await (let idx of indexes.values()) {
                if (await setA.uniqueMap.has(idx)) {
                    // conflict found, do nothing.
                    return;
                }
            }
        }

        setA.elements = await setA.elements.add(el.id);
        await ctx.setVariableValue(setA.id, setA);
    }
    /*else {
        console.log(
            `addElement : ${await ctx.toString(el.id)} IS IN ${await ctx.toString(setA.id)}`
        );
    }*/
}

async function mergeSetSet (ctx, setA, setB) {
    for await (let bID of setB.elements.values()) {
        const b = await ctx.getVariable(bID);
        for await (let aID of setA.elements.values()) {
            const a = await ctx.getVariable(aID);

            if (
                a.type === b.type 
                && a.type === constants.type.MATERIALIZED_SET
            ) {
                await mergeSets(ctx, b, a);
            }
            else {
                await addElement(ctx, setA, b, setB);
            }
        }
    }
}

async function mergeSets(ctx, setA, setB) {

    await mergeSetSet(ctx, setA, setB);
    await mergeSetSet(ctx, setB, setA);

    // await addElement(ctx, setA, sA, setB);
    // await addElement(ctx, setA, sB, setB);
    
    /*
    const bElements = new Set();
    const abElements = new Set();

    for await (let eID of setB.elements.values()) {
        if (await setA.elements.has(eID)) {
            abElements.add(eID);
        }
        else {
            bElements.add(e);
        }
    }

    for await (let [idx, bID] of setB.uniqueMap) {
        if (bElements.has(bID)) { 
            const aID = await setA.uniqueMap.get(idx);

            if (aID) {
                bElements.remove(bID);
            }
        }
    }

    for (let eID of bElements) {

    }*/
    /*
    for await (let bID of setB.elements.values()) {
        if (!await setA.elements.has(bID)) {
            console.log("TODO: check if bID is a conflict index element ??");

            const r = new Set();

            for await (let [idx, value] of setB.uniqueMap) {
                const bi = await ctx.getVariable(value);
                if (bi.id === bID) {
                    throw 'FOUND INDEX!';
                    const aID = await setA.uniqueMap.get(idx);

                    if (aID) {
                        r.add(aID);
                    }
                }
            }

            if (r.size > 0) {
                throw 'mergeSets: conflicting elements is not implemented!';
            }
            else {
                for await (let aID of setA.elements.values()) {            
                    await mergeElements(ctx, setA, setB, aID, bID);
                }
            }
        }
    }*/
    
    
}

async function getMergeVariable (dest, src, id) {
    const v = await src.getVariable(id);
    const vID = v.id;
    const bHash = await src._ctx.variablesHash.get(vID);
    const vn = await dest._ctx.hashVariables.get(bHash);

    if (vn) {
        return vn;
    }

    return bHash;
}

async function mergeCopy (dest, src) {
    for await (let [hash, vn] of src._ctx.hashVariables) {

        if (!await dest._ctx.hashVariables.has(hash)) {
            console.log("COPY ", await src.toString(vn));
            const v = await src.getVariable(vn);

            switch (v.type) {
                case constants.type.CONSTANT: {
                    await dest.setVariableValue(v.id, v, hash);
                    break;
                }

                case constants.type.TUPLE: {
                    const data = [];
                    for (let i=0; i<v.data.length; i++) {
                        const vn = v.data[i];
                        data.push(await getMergeVariable(dest, src, vn));
                    }

                    await dest.setVariableValue(hash, {
                        ...v,
                        data,
                        id: hash,
                    }, hash);

                    break;
                }
                
                case constants.type.MATERIALIZED_SET: {
                    let elements = dest.rDB.iSet();

                    for await (let vn of v.elements.values()) {
                        const ve = await src.getVariable(vn);
                        const e = await getMergeVariable(dest, src, ve.id);
                        elements = await elements.add(e);
                    }

                    console.log("TODO: we need to make new uniqueMap and save it!");
                    await dest.setVariableValue(hash, {
                        ...v,
                        elements,
                        id: hash,
                    }, hash);

                    break;
                }

                default:
                    throw `mergeCopy : Copy ${v.type} is not implemented!`;
            }
        }

    }
}

async function merge (options, rDB, branchA, branchB) {
    
    const ctxA = await BranchContext.create(branchA, options, null, rDB);
    const ctxB = await BranchContext.create(branchB, options, null, rDB);

    await ctxA.genHashes();
    await ctxB.genHashes();

    const aSize = await ctxA._ctx.hashVariables.size;
    const bSize = await ctxB._ctx.hashVariables.size;

    const a = aSize > bSize ? ctxA : ctxB;
    const b = aSize > bSize ? ctxB : ctxA;

    console.log(`Merge ${await a.toString()} ** ${await b.toString()}`);

    await mergeCopy(a, b);

    const resultsSetID = '__resultsSet';
    const bSetID = await getMergeVariable(a, b, resultsSetID);

    const setA = await a.getVariable(resultsSetID);
    const setB = await a.getVariable(bSetID);

    console.log(`Merge Sets : setA=${await a.toString(setA.id)}`);

    console.log("TODO: setB copy is not ok!!", setB);
    console.log(`Merge Sets : setB=${await a.toString(setB.id)}`);

    console.log(`Merge Sets : setA=${await a.toString(setA.id)}, setB=${await a.toString(setB.id)}`);
    
    await mergeSets(a, setA, setB);

    /*
    const resultsSetID = '__resultsSet';

    const setA = await a.getVariable(resultsSetID);
    const setB = await b.getVariable(resultsSetID);

    await mergeAux(a, b, setA, setB);
*/
    await branchA.update({state: 'merged'});
    await branchB.update({state: 'merged'});

    return a.saveBranch();
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

