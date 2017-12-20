class Tranformation {
    
    constructor (func, functions) {
        this.func = func;
        this.functions = functions;
    }
    
    executeStmt(code, variables) {
        if (code.type === 'variable') {
            const v = variables[code.data];
            return v.data;
        }
        else if (code.type === 'string') {
            return code.data;
        }
        else if (code.type === 'call') {
            const v = variables[code.data.variable.data];
            const f = this.functions[code.data.funcname];
            return f.execute(v);
        }
        else if (code instanceof Array) {
            /* its a concat string ? 
                TODO: make a concatString type
            */
            let s = "";
            for (let i=0; i<code.length; i++) {
                s += this.executeStmt(code[i], variables);
            }
            
            return s;
        }
    }
    
    equals (p, q) {
        
        if (p.type === q.type) {
            if (p.type === 'constant') {
                return p.data === q.data;
            }
            else if (p.type === 'variable') {
                // check if variables are the same, 
                return p.id === q.id;
            }
            else if (p.type === 'tuple' && p.data.length === q.data.length) {
                for (let i=0; i<p.data.length; i++) {
                    if (!this.equals(p.data[i], q.data[i])) {
                        return false;
                    }
                }
                
                return true;
            }
        }

        return false;
    }
    
    match (pattern, q) {
        
        const variables = {};

        const matches = [{
            p: pattern,
            q
        }];
        
        while (matches.length) {
            const {p, q} = matches.pop();
            
            if (p.type === 'variable') {
                
                if (p.data !== undefined && p.data !== "") {
                    const v = variables[p.data];

                    if (v === undefined) {
                        variables[p.data] = q;
                    }
                    else if (!this.equals(v, q)) {
                        // if they are not equal than match fails.
                        return;
                    }
                }
            }
            else if (
                (p.type !== q.type) || 
                (p.type === 'constant' && p.data !== q.data) ||
                (p.type === 'tuple' && p.data.length !== p.data.length)
            ) {
                return;
            }
            else if (p.type === 'tuple') {
                for (let i=0; i<p.data.length; i++) {
                    matches.push({
                        p: p.data[i],
                        q: q.data[i]
                    });
                }
            }
        }
        
        return variables;
    }
    
    execute (query) {
        
        const statments = this.func.data.data;

        for (let i=0; i<statments.length; i++) {
            const stmt = statments[i];
            
            if (stmt.data.match) {
                const variables = this.match(stmt.data.match, query);
                
                if (variables) {
                    return this.executeStmt(stmt.data.code, variables);
                }
            }
            else {
                /*
                    TODO:
                        - normalize data structure for statment and defaultStatement.
                */
                return this.executeStmt(stmt.data[0], {});
            }
        }
        
        return query;
    }
    
    validate () {
        /*
        TODO:
        functions check:
            1. all body variables must be on head,
            2. all functions body must exist, maybe validate should be called 
                before a query to make sure that all functions are defined.
        */
        
        return true;
    }
}

module.exports = Tranformation;