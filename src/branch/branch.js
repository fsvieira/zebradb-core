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

async function setIn (branch, options, set, element) {

    const branches = [];

    const {varCounter, newVar} = varGenerator(await branch.data.variableCounter);
    
    const rDB = branch.table.db;

    const ctx = {
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
    };

    ctx.setsInDomains = await ctx.setsInDomains.remove(element);

    const newBranch1 = await rDB.tables.branches.insert(ctx, null);

    ctx.rDB = rDB;
    ctx.newVar = newVar;
    ctx.options = options;

    for await (let eID of set.elements.values()) {
        branches.push(await unify(newBranch1, options, eID, element));
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

    console.log("SET IN NEW-BRANCH - START DUMP UNSOLVED CONSTRAINTS!!");
    for await (let csID of ctx.unsolvedConstraints.values()) {
        console.log("SET IN NEW-BRANCH RR => ", await toString(null, csID, ctx)); 
    }

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

    const cs = await getVariable(null, id, ctx);

    if (hasValue(cs.state)) {
        return true;
    }

    let root = cs.root;

    while (root) {
        const {csID, side} = root;
        const rootCs = await getVariable(null, csID, ctx);
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

async function solveConstraints (branch, options) {
    const ctx = {
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


    // let size = await ctx.unsolvedConstraints.size;
    // let resultSize = 0;

    let size, resultSize, fail;
    let changes = 0;
    do {
        let unsolvedConstraints = ctx.unsolvedConstraints;
        
        size = await ctx.unsolvedConstraints.size;
        for await (let csID of ctx.unsolvedConstraints.values()) {
            const cs = await getVariable(null, csID, ctx);

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

        await branch.update({state: 'split'});

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

async function extendSet (branch, setID) {
    const ctx = {
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

    const set = await getVariable(null, setID, ctx);

    ctx.extendSets = ctx.extendSets.remove(setID);

    if (set.definition) {
        const {definition: {variables, root}, defID=root} = set;

        const setDef = variables[defID];
        const copyID = setDef.elements[0];

        const eID = await copyPartialTerm(ctx, set.definition, copyID, null, true, true);

        set.elements = await set.elements.add(eID);

        ctx.variables = await ctx.variables.set(set.id, set);

    }
    else {
        console.log("TODO: ONLY VALID SETS SHOULD BE HERE!!");
        return false;
    }
    
    const options = {};
    const fail = false;

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

    await branch.update({state: 'split'});
        

    console.log(await toString(newBranch, ctx.root));
    return true;
}

async function expand (
    definitionDB, 
    branch, 
    options, 
    selector, 
    definitions
) {
    options.definitionDB = definitionDB;
    
    console.log("Sets In Domains ", await toString(branch, await branch.data.root));
    const setsInDomains = await branch.data.setsInDomains;
    for await (let e of setsInDomains.values()) {
        const v = await getVariable(branch, e);
        const d = await getVariable(branch, v.domain);

        // if (await d.elements.size === 0) {
            const r = await setIn(
                branch, 
                options, 
                d, e
            );

            await branch.update({state: 'split'});

            console.log("TODO: why not make all domains ??")
            return r;
        /*}
        else {
        }*/
    }

    console.log("Unsolved Vars ", await toString(branch, await branch.data.root));

    const unsolvedVariables = await branch.data.unsolvedVariables;
    for await (let e of unsolvedVariables.values()) {
        const v = await getVariable(branch, e);
        const d = await getVariable(branch, v.domain);

        const r = await setIn(
            branch, 
            options, 
            d, e
        );

        await branch.update({state: 'split'});

        return r;
        console.log("SOLVE UNSOLVED VARIABLES " , v);
//        throw 'SOLVE UNSOLVED VARIABLES';
    }

    console.log(
        "TODO: [expand] first solve unsolvedVariables!!" +
        " --> unsolvedVariables are only domains + constraints!"
    );


    // throw 'EVERYTHING SHOULD BE UNSOLVED VARS; HAS LONG THEY HAVE CONSTRAINTS!'; 
    const unsolvedConstraints = await branch.data.unsolvedConstraints;

    if (await unsolvedConstraints.size) {
        const r = await solveConstraints(branch, options);
        if (r) {
            return r;
        }
    }

    console.log("Extandable Set!!");
    const extendSets = await branch.data.extendSets;
    for await (let sID of extendSets.values()) {
        /*const set = await getVariable(branch, sID);
        console.log(set);
        
        console.log("EXTEND SET ", await toString(branch, sID));*/
        const r = await extendSet(branch, sID);
        if (!r) {
            return r; 
        }
    }

    console.log("END!!", await toString(branch, await branch.data.root));

    // else 
    throw 'expand : next steps!!';

    /*let r;
    if (await branch.data.setsInDomains.size) {
        const setsInDomains = await branch.data.setsInDomains;

        let id, domain;
        for await (let e of setsInDomains.values()) {
            id = e;
            const v = await getVariable(branch, id);

        }

        r = await unifyDomain(
            branch,
            options,
            id,
            v.domain,
        );

        await branch.update({state: 'split'});

    }
    else {
        throw 'expand : what to solve ??';
    }*/
    
    return r;

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
            await executeConstraints(options, definitionDB, branch, c);
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
    const ctx = {
        parent: parentBranch,
        root: await parentBranch.data.root,
        level: (await parentBranch.data.level + 1),
        setsInDomains: await parentBranch.data.setsInDomains,
        checked: await parentBranch.data.checked,
        unchecked: await parentBranch.data.unchecked,
        constraints: await parentBranch.data.constraints,
        unsolvedConstraints: await parentBranch.data.unsolvedConstraints,
        extendSets: await parentBranch.data.extendSets,
        unsolvedVariables: await parentBranch.data.unsolvedVariables,
        variableCounter: await parentBranch.data.variableCounter,
        children: [],
        log: await parentBranch.data.log
    }*/

    // const parentVariables = await parentBranch.data.variables;

    {
        // Set empty set branch, has success 
        const emptyResults = {
            type: constants.type.MATERIALIZED_SET,
            id,
            elements: rDB.iSet()
        };

        await ctxEmpty.setVariableValue(id, emptyResults);

        // const variables = await parentVariables.set(id, emptyResults);
     
        const log = await logger(options, {log: ctx.log}, "Create Empty Set Results");

        await rDB.tables.branches.insert({
            ...ctx,
            state: 'yes',
            variables,
            log,
            branchID: `${parentBranch.id}-empty`
        }, null);

        console.log("EMPTY BRANCH - START DUMP UNSOLVED CONSTRAINTS!!");
        for await (let csID of ctx.unsolvedConstraints.values()) {
            console.log("EMPTY BRANCH RR => ", await toString(null, csID, ctx)); 
        }    
    }

    {
        const {root} = definitionElement;
        // const v = variables[root];

        // Set elements branch to be evaluated.
        const {varCounter, newVar} = varGenerator(ctx.variableCounter + 1); 

        ctx.variables = parentVariables;
        ctx.newVar = newVar;
        ctx.rDB = rDB;

        const setID = await copyPartialTerm(
            ctx, 
            definitionElement, 
            root, 
            definitionsDB,
            extendSets,
            true
        );

        ctx.variables = await ctx.variables.set(
            id, {
                type: constants.type.LOCAL_VAR, 
                cid: id, 
                id, 
                defer: setID
            }
        );

        delete ctx.newVar;
        delete ctx.rDB;

        const state = await getContextState(ctx);

        const message = `state=${state}, root=${await toString(null, ctx.root, ctx, true)}`; 
        const log = await logger(options, {log: ctx.log}, message);

        const branch = await rDB.tables.branches.insert({
            ...ctx,
            variableCounter: varCounter(),
            state,
            log,
            branchID: `${parentBranch.id}-element`
        }, null);

        console.log("ELEMENT BRANCH - START DUMP UNSOLVED CONSTRAINTS!!");
        for await (let csID of ctx.unsolvedConstraints.values()) {
            console.log("ELEMENT BRANCH RR => ", await toString(null, csID, ctx)); 
        }

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

async function merge (options, rDB, branchA, branchB) {
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

