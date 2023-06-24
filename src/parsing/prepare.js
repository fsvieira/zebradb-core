const {branchOps} = require("../branch");

const {
    type: {
        CONSTANT, // : "c",
        TUPLE, // : "t",
        CONSTRAINT, // : "cs",
        SET, // : "s",
        LOCAL_VAR, // : 'lv',
        GLOBAL_VAR // : 'gv',
    },
    operation: {
        OR, // : "or",
        AND, // : "and",
        IN, // : "in",
        UNIFY, // : "=",
        NOT_UNIFY, // : "!="
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
                    ctx.constrains.add(constrainID);

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
function termSet (ctx, t) {
    const {type, elements, variable, expression, size} = t;

    const cid = ctx.newVar();

    const nt = {
        type,
        elements: [],
        variable: term(ctx, variable),
        expression: term(ctx, expression),
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

function termTuple(ctx, t) {
    const {data, type} = t;

    const cid = ctx.newVar();
    const nt = ctx.variables[cid] = {type, data: [], cid};

    for (let i=0; i<data.length; i++) {
        nt.data.push(term(ctx, t.data[i]));
    }

    return cid;
}

function termConstant (ctx, t) {
    const {type, data} = t;
    const cid = ctx.newVar(data);
    ctx.variables[cid] = {type, data: t.data, cid};

    return cid;
}

function term (ctx, t) {
    if (t) {
        switch (t.type) {
            case SET: return termSet(ctx, t);
            case GLOBAL_VAR: return termGlobalVariable(ctx, t);
            case TUPLE: return termTuple(ctx, t);
            case CONSTANT: return termConstant(ctx, t);
            default:
                throw `TYPE ${t.type} IS NOT DEFINED, ${JSON.stringify(t)}`;
        }
    }
}

function prepare (tuple) {

    console.log("PREPARE TUPLE", JSON.stringify(tuple, null, '  '));

    const {newVar} = branchOps.varGenerator(0); 
    const ctx = {
        variables: {},
        newVar
    }

    const root = term(ctx, tuple);

    const globalVariable = ctx.variables[root].variable;

    return {variables: ctx.variables, root, globalVariable};

    /*
    const {newVar} = branchOps.varGenerator(0); 

    const ctx = {
        variables: {},
        constrains: new Set(),
        newVar
    }

    const root = terms(ctx, tuple);

    // convert constrains set to normal array
    for (let varname in ctx.variables) {
        const v = ctx.variables[varname];

        if (v.v && v.e) {
            v.e = [...v.e];
        }
    }

    // console.log(ctx.variables);
    
    return {variables: ctx.variables, constrains: [...ctx.constrains], root};
    */
}

module.exports = prepare;
