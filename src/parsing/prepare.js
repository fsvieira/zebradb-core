const {branchOps} = require("../branch");
const {SHA256} = require("sha2");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        SET_CS, // 'sc'
        SET_EXP, // 'se'
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR // : 'gv',
    },
    operation: {
        OR, //: "or",
        AND, //: "or",: "and",
        IN, //: "or",: "in",
        UNIFY, //: "or",: "=",
        NOT_UNIFY, //: "or",: "!=",
        UNION, //: "or",: "union",
        ADD, //: "or",: '+',
        SUB, //: "or",: '-',
        MUL, //: "or",: '*',
        DIV, //: "or",: '/',
        MOD, //: "or",: '%',
        FUNCTION, //: "or",: 'fn',
        BELOW, //: "or",: '<',
        BELOW_OR_EQUAL, //: "or",: '<=',
        ABOVE, //: "or",: '>',
        ABOVE_OR_EQUAL, //: "or",: '>='
    }
} = branchOps.constants;

/*
    1. Structure: 
        * (type, op?, data?)

    2. Solving Operations:
        * variable =, in ? solvable in compile time ?
        * Make a list of operations, to be solved at the end 
*/

/*
function terms (ctx, t) {
    switch (t.type) {
        case '=': {
            const {variable, set} = t;

            if (set.type === 'set') {
                variable.domain = set.data;
                return terms(ctx, variable);
            }
            else if (set.type === 'tuple') {
                variable.in = set;
                return terms(ctx, variable);
            }
            
            throw `Invalid Set type ${set.type}`;

        }
        case 'in': {
            const {variable, set} = t;

            if (set.type === 'cset') {
                variable.domain = set.data;
                return terms(ctx, variable);
            }
            else if (set.type === 'tuple') {
                variable.in = set;
                return terms(ctx, variable);
            }
            
            throw `Invalid Set type ${set.type}`;
        }
        case 'constant': {
            const cid = ctx.newVar(t.data);
            ctx.variables[cid] = {type: CONSTANT, c: t.data, cid};

            return cid;
        }
        case 'variable': {
            const v = t.data || ctx.newVar();
            const cid = v;

            let vdata = ctx.variables[cid];

            if (!vdata) {
                vdata = ctx.variables[cid] = {type: VARIABLE, v, cid};
            }

            if (t.domain) {
                const domains = t.domain.map(c => terms(ctx, c)).sort();
                vdata.d = vdata.d ?
                    vdata.d.filter(c => domains.includes(c)):
                    domains
                ;
        
                if (vdata.d.length === 0) {
                    throw new Error("Definition has domains that cancel each other.");
                }
            }

            if (t.in) {
                const vin = (vdata.in || []).concat(terms(ctx, t.in));
                vdata.in = [...new Set(vin)];
            }

            if (t.except) {
                for (let i=0; i<t.except.length; i++) {
                    const ecid = terms(ctx, t.except[i]);

                    const args = [cid, ecid].sort();
                    const constrainID = `_cs_${args[0]}!=${args[1]}`;
                    const cs = {op: '!=', args, cid: constrainID };

                    ctx.variables[constrainID] = cs;
                    ctx.constraints.add(constrainID);

                    vdata.e = (vdata.e || new Set());
                    vdata.e.add(constrainID);
                    const cdata = ctx.variables[ecid];

                    if (cdata.v) {
                        cdata.e = (cdata.e || new Set());
                        cdata.e.add(constrainID);
                    }
                }
            }

            return cid;
        }
        case 'tuple': {
            let body;
            if (t.body && t.body.length) {
                body = [];
                for (let i=0; i<t.body.length; i++) {
                    body.push(terms(ctx, t.body[i]));
                }
            }

            const cid = ctx.newVar();
            const ts = [];

            for (let i=0; i<t.data.length; i++) {
                ts.push(terms(ctx, t.data[i]));
            }

            ctx.variables[cid] = {type: TUPLE, t: ts, body, cid};

            return cid;
        }
    }

}*/

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

function termSetConstrains (ctx, t) {
    const {type, element, expression, variable, size} = t;

    const cid = ctx.newVar(t);

    const v = term(ctx, {
        ...element,
        expression
    });

    const nt = {
        type,
        element: v,
        variable: term(ctx, variable),
        size
    };

    ctx.variables[cid] = nt;

    return cid;
}

function termConstrains(ctx, exp) {
    const {type, a, op, b} = exp;

    const av = term(ctx, a);
    const bv = term(ctx, b);

    let vars = [av, bv];
    if ([AND, OR, ADD, MUL, UNIFY, NOT_UNIFY, UNION].includes(op)) {
        vars = vars.sort();
    }

    const cid = `__${type}:${SHA256(vars.join(op)).toString('base64')}`;

    console.log(cid, `TODO: [termConstrains] make a better variable generator`);

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

function termSet (ctx, t) {
    const {type, elements, variable, size} = t;

    const cid = ctx.newVar(t);

    const nt = {
        type,
        elements: [],
        variable: term(ctx, variable),
        size
    };

    ctx.variables[cid] = nt;

    for (let i=0; i<elements.length; i++) {
        const e = elements[i];
        const id = term(ctx, e);
        nt.elements.push(id);
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

function termLocalVariable (ctx, lv) {
    console.log("TODO: When local variables come from sets we may need a new scope!!");
    // this can be done using a scope stack ? 

    const cid = ctx.newVar(lv);
    const v = ctx.variables[cid];

    if (!v) {
        ctx.variables[cid] = {
            ...lv, 
            domain: term(ctx, lv.domain),
            cid
        };
    }

    return cid;
}

function termTuple(ctx, t) {
    const {
        data, 
        type, 
        domain,
        expression
    } = t;

    const cid = ctx.newVar(t);
    const nt = ctx.variables[cid] = {type, data: [], cid};

    for (let i=0; i<data.length; i++) {
        nt.data.push(term(ctx, data[i]));
    }

    if (expression) {
        term(ctx, expression);
        // nt.expression = term(ctx, expression);
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

function term (ctx, t) {
    if (t) {
        switch (t.type) {
            case SET: return termSet(ctx, t);
            case SET_CS: return termSetConstrains(ctx, t);
            case GLOBAL_VAR: return termGlobalVariable(ctx, t);
            case LOCAL_VAR: return termLocalVariable(ctx, t);
            case TUPLE: return termTuple(ctx, t);
            case CONSTANT: return termConstant(ctx, t);
            case CONSTRAINT: return termConstrains(ctx, t);
            case SET_EXP: return termSetExpression(ctx, t);
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

    const {a, op, b, constraints} = cs;

    if (constraints && constraints.length) {
        console.log("NOT ROOT!");
        return;
    }
    else {
        linkDownLogicalRoots(ctx, a, {csID: cs.cid, side: 'a'});
        linkDownLogicalRoots(ctx, b, {csID: cs.cid, side: 'b'});
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
            case SET_CS:
            case TUPLE:
            case SET_EXP:
            case SET: return newVar();
            case CONSTANT: return newVar(v.data);
            case LOCAL_VAR:
                return v.varname || newVar();
            default:
                throw 'prepare : type is not defined ' + v.type;
        }
    }

    const root = term(ctx, tuple);

    const globalVariable = ctx.variables[root].variable;

    if (ctx.constraints.length) {
        for (let i=0; i<ctx.constraints.length; i++) {
            const cid = ctx.constraints[i];
            const {a, b} = ctx.variables[cid];

            const av = ctx.variables[a];
            const bv = ctx.variables[b];

            if ([GLOBAL_VAR, LOCAL_VAR, CONSTRAINT].includes(av.type)) {
                av.constraints = (av.constraints || []).concat(cid);
            }

            if ([GLOBAL_VAR, LOCAL_VAR, CONSTRAINT].includes(bv.type)) {
                bv.constraints = (bv.constraints || []).concat(cid);
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

    /*
    const {newVar} = branchOps.varGenerator(0); 

    const ctx = {
        variables: {},
        constraints: new Set(),
        newVar
    }

    const root = terms(ctx, tuple);

    // convert constraints set to normal array
    for (let varname in ctx.variables) {
        const v = ctx.variables[varname];

        if (v.v && v.e) {
            v.e = [...v.e];
        }
    }

    // console.log(ctx.variables);
    
    return {variables: ctx.variables, constraints: [...ctx.constraints], root};
    */
}

module.exports = prepare;
