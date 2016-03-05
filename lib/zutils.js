function table2tuple (
    table, 
    id, 
    tuples,
    cache
) {
    
    cache = cache || {};
    tuples = tuples || {};
 
    id = (id === undefined)?table.start:id;
    
    if (cache[id]) {
        return cache[id];
    }

    var p = table.data[id];
    var q, r=p;

    // cache[id] = {type: "constant", data:"_RECURSIVE_"};
    
    /*else if (p.type === 'defer') {
        p = table2tuple(table, p.data, tuples, cache);
    }*/
    if (p.type === 'not') {
        r = {
            type: p.type,
            data: table2tuple(table, p.data, tuples, cache)
        };
    }
    /*
    else if (p.type === 'unify') {
        q = {
            type: p.type,
            data: []
        };
        
        for (var i=0; i<p.data.length; i++) {
            q.data.push(table2tuple(table, p.data[i], tuples, cache));
        }
        
        p = q;
    }*/
    else if (p.type === 'tuple') {
        q = tuples[id];
        if (q === undefined) {
            q = {
                type: p.type,
                data: []
            };

            tuples[id] = q;
            for (var i=0; i<p.data.length; i++) {
                q.data.push(table2tuple(table, p.data[i], tuples, cache));
            }
        }
        
        r = q;
    }
    else if (p.type === 'variable') {
        r = {type: p.type, data: 'x$'+id};
    }
    
    if (p.unify) {
        r = {
            type: "unify",
            data: [r]
        };
        
        cache[id] = r;
        
        for (var i=0; i<p.unify.length; i++) {
            var v = table2tuple(table, p.unify[i], tuples, cache);
            
            if (v !== r) {
                if (v.type === "unify") {
                    for (var j=0; j<v.data.length; j++) {
                        if (r.data.indexOf(v.data[j]) === -1) {
                            r.data.push(v.data[j]);
                        }
                    }
                }
                else {
                    if (r.data.indexOf(v) === -1) {
                        r.data.push(v);
                    }
                }
            }
        }
    }
    else {
        cache[id] = r;
    }
    
    return r;
}


function tuple2table (p, table, write) {
    table = table || {
        data: [{type: 'ignore'}],
        start: 1
    };

    var id = 0;
    if (p.type === 'unify') {
        console.log("TODO: unify");
    }
    else if (p.type === 'not') {
        var n = {
            type: 'not'
        };
        
        table.data.push(n);
        id = table.data.length-1;
        tuple2table(p.data, table, n);
    }
    else if (p.type === 'tuple') {
        var t = [];
        table.data.push({
            type: 'tuple',
            data: t
        });
        
        id = table.data.length-1;

        for (var i=0; i<p.data.length; i++) {
            tuple2table(p.data[i], table, t);
        }
    }
    else if ((p.type == 'variable') && (!p.data || p.data === '')) {
        table.data.push(p);
        id = table.data.length-1;
    }
    else if (
        (p.type === 'constant')
        || (p.type === 'variable')
    ) {
        id = table.data.findIndex(function (x) {
            return (x.type === p.type) && (x.data === p.data);
        });
        
        if (id === -1) {
            table.data.push(p);
            id = table.data.length-1;
        }
    }
    
    if (write) {
        if (write.type === 'not') {
            write.data = id;   
        }
        else {
            write.push(id);
        }
    }

    return table;
}


module.exports = {
    tuple2table: tuple2table,
    table2tuple: table2tuple
};

