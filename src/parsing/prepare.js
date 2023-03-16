/*
const terms = (e, genVariable, variables, constrains={}) => {
    switch(e.type) {
        case 'constant': 
            return {c: e.data, cid: e.data};

        case 'variable': {
            const v = e.data || genVariable();

            let vdata = variables[v];
            if (!vdata) {
                vdata = variables[v] = {v};
                vdata.cid = v;
            }
        
            if (e.domain) {
                vdata.d = vdata.d?
                    vdata.filter(c => e.domain.includes(c.c)):
                    e.domain.map(c => terms(c, genVariable, variables, constrains))
                ;
        
                if (vdata.d.length === 0) {
                    throw new Error("Definition has domains that cancel each other.");
                }
            }
        
            if (e.except) {
                e.except.forEach(e => {
                    const t = terms(e, genVariable, variables, constrains);
                    const cs = {op: '!=', args: [vdata.cid, t.cid].sort()};
                    constrains[`_cs_${cs.args[0]}!=${cs.args[1]}`] = cs;
                })
            }
        
            return vdata;
        }

        case 'tuple': {
            let body;
            if (e.body && e.body.length) {
                body = ts(e.body, genVariable, variables, constrains);
            }

            return {t: ts(e.data, genVariable, variables, constrains), body, cid: genVariable()}
        }
    }
}

const ts = (tupleData, genVariable, variables={}, constrains={}) => tupleData
    .map(e => terms(e, genVariable, variables, constrains));
*/

const {branchOps} = require("../branch");

function terms (ctx, t) {
    switch (t.type) {
        case 'constant': {
            const cid = ctx.newVar(t.data);
            ctx.variables[cid] = {c: t.data, cid};

            return cid;
        }
        case 'variable': {
            const v = t.data || ctx.newVar();
            const cid = v;

            let vdata = ctx.variables[cid];

            if (!vdata) {
                vdata = ctx.variables[cid] = {v, cid};
            }

            if (t.domain) {
                vdata.d = vdata.d?
                    vdata.filter(c => t.domain.includes(c.c)):
                    t.domain.map(c => terms(ctx, c))
                ;
        
                if (vdata.d.length === 0) {
                    throw new Error("Definition has domains that cancel each other.");
                }
            }


            if (t.except) {
                for (let i=0; i<t.except.length; i++) {
                    const ecid = terms(ctx, t.except[i]);

                    const cs = {op: '!=', args: [cid, ecid].sort()};
                    const constrainID = `_cs_${cs.args[0]}!=${cs.args[1]}`;
                    ctx.constrains[constrainID] = cs;

                    vdata.e = (vdata.e || new Set());
                    vdata.e.add(constrainID);
                    const cdata = ctx.variables[ecid];

                    // if constrain is a variable then add constrain ref.
                    if (cdata.v) {
                        cdata.e = (cdata.e || new Set());
                        cdata.e.add(constrainID);
                    }
                }

                // console.log("TODO: if variable has domains, we should make a consistency check at this phase??? domains and constrains are evaluated on run phase?");
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

            ctx.variables[cid] = {t: ts, body, cid};

            return cid;
        }
    }

}


function prepare (tuple) {

    const {newVar} = branchOps.varGenerator(0); 

    const ctx = {
        variables: {},
        constrains: {},
        newVar
    }

    const root = terms(ctx, tuple);
    return {variables: ctx.variables, constrains: ctx.constrains, root};
}

module.exports = prepare;
