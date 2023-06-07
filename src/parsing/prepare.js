const {branchOps} = require("../branch");

const {
    type: {
        CONSTANT,
        TUPLE,
        VARIABLE,
        CONSTRAINT,
        SET
    }
} = branchOps.constants;

/*
    1. Structure: 
        * (type, op?, data?)

    2. Solving Operations:
        * variable =, in ? solvable in compile time ?
        * Make a list of operations, to be solved at the end 
*/


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

}


function prepare (tuple) {

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
}

module.exports = prepare;
