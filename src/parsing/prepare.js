const {branchOps} = require("../branch");
const {SHA256} = require("sha2");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_EXP, // 'se'
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR, // : 'gv',
        INDEX, // idx,
        SET_SIZE
    },
    operation: {
        OR, // "or",
        AND, // "and",
        IN, // "in",
        UNIFY, // "=",
        NOT_UNIFY, // "!=",
        UNION, // "union",
        ADD, // '+',
        SUB, // '-',
        MUL, // '*',
        DIV, // '/',
        MOD, // '%',
        FUNCTION, // 'fn',
        BELOW, // '<',
        BELOW_OR_EQUAL, // '<=',
        ABOVE, // '>',
        ABOVE_OR_EQUAL, // '>='
        UNIQUE, // 'un'
    }
} = branchOps.constants;

function termSetExpression (ctx, s) {
    const {type, a, op, b, variable} = s;

    const cid = ctx.newVar(s);

    const v = {
        type,
        a: term(ctx, a),
        op,
        b: term(ctx, b),
        variable: variable?term(ctx, variable):undefined
    };

    ctx.variables[cid] = v;

    return cid;
}


function termConstraints (ctx, exp) {
    const {type, a, op, b} = exp;

    const av = term(ctx, a);
    const bv = term(ctx, b);

    let vars = [av, bv];
    if ([AND, OR, ADD, MUL, UNIFY, NOT_UNIFY, UNION].includes(op)) {
        vars = vars.sort();
    }

    const cid = `__${type}:${SHA256(vars.join(op)).toString('base64')}`;

    if (!ctx.constraints.includes(cid)) {
        ctx.constraints.push(cid);

        ctx.variables[cid] = {
            type,
            a: av,
            op,
            b: bv,
            cid
        };
    }

    return cid;
}

function getElementVariables (v, vars=[], dups={}) {
    switch (v.type) {
        case TUPLE: {
            for (i=0; i<v.data.length; i++) {
                getElementVariables(v.data[i], vars, dups);
            }

            break;
        }

        case LOCAL_VAR: {
            if (!dups[v.varname]) {
                dups[v.varname] = true;
                vars.push({type: v.type, varname: v.varname})
            }
            break;
        }

        case SET: {
            return v;
        }

        default:
            throw `getElementVariables type ${v.type} not implemented!`;
    }

    return vars;
}

function termSet (ctx, t) {
    // const {type, elements, variable, size} = t;
    const {
        type,
        elements,
        expression,
        domain,
        indexes,
        variable,
        size,
        elementAlias
    } = t;

    const cid = ctx.newVar(elementAlias || t);

    let varIndexes, varIndexesEl = [];

    if (indexes || expression) {
        const newIndexes = indexes || [];

        const variables = getElementVariables(elements[0]);

        if (variables.length) {
            newIndexes.push({
                type: INDEX,
                op: UNIQUE,
                variables,
                uniqueElementIndex: true
            });
        }

        if (newIndexes.length) {
            varIndexes = newIndexes.map(v => {
                const idx = {
                    ...v,
                    setID: cid
                };

                varIndexesEl.push(idx);
                // create constraint:
                return term(ctx, idx);
            });
        }
    }

    const termVariable = variable ? term(ctx, variable) : cid; 

    const nt = {
        type,
        // element: termElement,
        elements: [],
        variable: termVariable,
        indexes: varIndexes,
        size,
        expression: expression ? term(ctx, expression) : undefined,
        domain: domain ? term(ctx, domain) : undefined,
        cid
    };

    ctx.variables[cid] = nt;

    if (elements) {
        for (let i=0; i<elements.length; i++) {
            const e = elements[i];
            const id = term(ctx, e);
            nt.elements.push(id);
        }

        if (varIndexes) {
            const eID = nt.elements[0];
            for (let i=0; i<varIndexesEl.length; i++) {
                varIndexesEl[i].eID = eID;
            }
        }
    }

    return cid;
}

function termGlobalVariable (ctx, t) {
    const cid = `$${t.varname}`;
    const v = ctx.variables[cid];

    if (!v) {
        ctx.variables[cid] = {...t, cid};
    }

    return cid;
}

function termSetSize (ctx, s) {
    const cid = ctx.newVar(s);
    const variable = term(ctx, s.variable); 

    const v = ctx.variables[cid] || {
        ...s,
        variable, 
        cid
    };
    
    ctx.variables[cid] = v;

    // term(ctx, lv.expression);

    return cid;
}

function termLocalVariable (ctx, lv) {
    // this can be done using a scope stack ? 

    const cid = ctx.newVar(lv);
    const v = ctx.variables[cid] || {...lv, cid};

    ctx.variables[cid] = v;
    
    // create constraints, 
    // constraints will be set on variable on constraints link phase, 
    // if variable is directly used on any constraint. 
    term(ctx, lv.expression);


    if (lv.indexes) {
        console.log("LOCAL VAR INDEXES ", lv.indexes);
        throw 'LOCAL VAR INDEXES';
    }

    if (lv.domain) {
        v.domain = term(ctx, lv.domain);
    }

    if (lv.indexes) {
        v.indexes = term(ctx, lv.indexes)
    }

    /*
    if (!v) {
        ctx.variables[cid] = {
            ...lv, 
            domain: term(ctx, lv.domain),
            indexes: term(ctx, lv.indexes),
            expression: undefined,
            cid
        };
    }*/

    return cid;
}

function termTuple(ctx, t) {
    const {
        data, 
        type, 
        domain,
        indexes,
        expression
    } = t;

    const cid = ctx.newVar(t);
    const nt = ctx.variables[cid] = {type, data: [], cid};

    for (let i=0; i<data.length; i++) {
        nt.data.push(term(ctx, data[i]));
    }

    if (indexes) {
        nt.indexes = [];

        for (let i=0; i<indexes.length; i++) {
            nt.indexes.push(term(ctx, indexes[i]));
        }    
    }

    if (expression) {
        term(ctx, expression);
    }

    if (domain) {
        nt.domain = term(ctx, domain);
    }

    return cid;
}

function termConstant (ctx, c) {
    // const {type, data} = c;
    // const cid = ctx.newVar(data);
    const cid = ctx.newVar(c);
    ctx.variables[cid] = {...c, cid};

    return cid;
}

function termIndex(ctx, idx) {

    const {
        type, 
        variables, 
        op, 
        setID,
        uniqueElementIndex
    } = idx;
    const avs = variables.map(variable => term(ctx, variable));

    let vars = [...avs, setID].sort();

    const cid = `__${type}:${SHA256(vars.join(op)).toString('base64')}`;

    if (!ctx.constraints.includes(cid)) {
        ctx.constraints.push(cid);

        ctx.variables[cid] = {
            type,
            variables: avs,
            op,
            setID,
            cid,
            uniqueElementIndex
        };
    }

    return cid;
}

function term (ctx, t) {
    if (t) {
        switch (t.type) {
            case SET: return termSet(ctx, t);
            // case SET_CS: return termSetConstraints(ctx, t);
            case GLOBAL_VAR: return termGlobalVariable(ctx, t);
            case LOCAL_VAR: return termLocalVariable(ctx, t);
            case TUPLE: return termTuple(ctx, t);
            case CONSTANT: return termConstant(ctx, t);
            case CONSTRAINT: return termConstraints(ctx, t);
            case SET_EXP: return termSetExpression(ctx, t);
            case INDEX: return termIndex(ctx, t);
            case SET_SIZE: return termSetSize(ctx, t);
            default:
                throw `TYPE ${t.type} IS NOT DEFINED, ${JSON.stringify(t)}`;
        }
    }
}

function linkDownLogicalRoots (ctx, vID, root) {
    const v = ctx.variables[vID];

    const {type, a, op, b, cid} = v;

    if (type === CONSTRAINT) {
        v.root = root;
        if (op === OR) {
            // new root
            linkDownLogicalRoots(ctx, a, {csID: cid, side: 'a'});
            linkDownLogicalRoots(ctx, b, {csID: cid, side: 'b'});
        }
        else {
            linkDownLogicalRoots(ctx, a, root);
            linkDownLogicalRoots(ctx, b, root);
        }
    }
} 

function linkLogicalRoots(ctx, id) {
    const cs = ctx.variables[id];

    const {type, a, op, b, constraints} = cs;

    if (type === CONSTRAINT) {
        if (constraints && constraints.length) {
            return;
        }
        else {
            linkDownLogicalRoots(ctx, a, {csID: cs.cid, side: 'a'});
            linkDownLogicalRoots(ctx, b, {csID: cs.cid, side: 'b'});
        }
    }
}

function prepare (tuple) {

    const {newVar} = branchOps.varGenerator(0); 
    const ctx = {
        variables: {},
        constraints: []
    }

    ctx.newVar = v => {
        switch(v.type) {
            case CONSTANT: return newVar(v.data);
            case LOCAL_VAR: return v.varname || newVar();
            case TUPLE:
            case SET_EXP:
            case INDEX:
            case SET: return newVar();
            case SET_SIZE: {
                return `${v.variable.varname}#size`;
            }

            default:
                throw 'prepare : type is not defined ' + v.type;
        }
    }

    const root = term(ctx, tuple);

    const globalVariable = ctx.variables[root].variable;

    if (ctx.constraints.length) {
        for (let i=0; i<ctx.constraints.length; i++) {
            const cid = ctx.constraints[i];
            const {type} = ctx.variables[cid];

            if (type === CONSTRAINT) {
                const {a, b} = ctx.variables[cid];

                const av = ctx.variables[a];
                const bv = ctx.variables[b];

                if (av.type === SET_SIZE) {
                    const set = ctx.variables[av.variable];
                    set.constraints = (set.constraints || []).concat(cid);
                }

                if (bv.type === SET_SIZE) {
                    const set = ctx.variables[bv.variable];
                    set.constraints = (set.constraints || []).concat(cid);
                }

                if ([
                    GLOBAL_VAR, LOCAL_VAR, CONSTRAINT, SET_SIZE, SET
                ].includes(av.type)) {
                    av.constraints = (av.constraints || []).concat(cid);
                }

                if ([
                    GLOBAL_VAR, LOCAL_VAR, CONSTRAINT, SET_SIZE, SET
                ].includes(bv.type)) {
                    bv.constraints = (bv.constraints || []).concat(cid);
                }
            }
            else if (type === INDEX) {
                const idx = ctx.variables[cid];
                const {variables} = idx;
                const set = ctx.variables[idx.setID];

                idx.eID = set.elements[0];

                for (let i=0; i<variables.length; i++) {
                    const variable = variables[i];
                    const av = ctx.variables[variable];

                    if ([GLOBAL_VAR, LOCAL_VAR, CONSTRAINT, SET_SIZE].includes(av.type)) {
                        av.constraints = (av.constraints || []).concat(cid);
                    }
                }
            }
        }

        for (let i=0; i<ctx.constraints.length; i++) {
            const cid = ctx.constraints[i];
            linkLogicalRoots(ctx, cid);
        }
    }


    return {
        variables: ctx.variables, 
        root, 
        globalVariable,
        constraints: ctx.constraints
    };
}

module.exports = prepare;
