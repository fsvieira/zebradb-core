const terms = (e, genVariable, variables, constrains={}) => {
    switch(e.type) {
        case 'constant': 
            return {c: e.data, id: e.data};

        case 'variable': {
            const v = e.data || genVariable();

            let vdata = variables[v];
            if (!vdata) {
                vdata = variables[v] = {v};
                vdata.id = v;
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
                    const cs = {op: '!=', args: [vdata.id, t.id].sort()};
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

            return {t: ts(e.data, genVariable, variables, constrains), body, id: genVariable()}
        }
    }
}

const ts = (tupleData, genVariable, variables={}, constrains={}) => tupleData
    .map(e => terms(e, genVariable, variables, constrains));

function prepare (tuple) {

    let v = 1;
    const genVariable = () => '_v' + v++;

    const constrains = {};
    const t = terms(tuple, genVariable, {}, constrains);

    t.constrains = constrains;

    console.log(JSON.stringify(t));
    return t;
}

module.exports = prepare;
