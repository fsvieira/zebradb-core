function table2tuple (table, id, tuples) {
    tuples = tuples || {};
    id = (id === undefined)?table.start:id;
    var p = table.data[id];
    var q;

    if (p.type === 'defer') {
        return table2tuple(table, p.data, tuples);
    }
    else if (p.type === 'not') {
        p = {
            type: p.type,
            data: table2tuple(table, p.data, tuples)
        };
    }
    else if (p.type === 'unify') {
        q = {
            type: p.type,
            data: []
        };
        
        for (var i=0; i<p.data.length; i++) {
            q.data.push(table2tuple(table, p.data[i], tuples));
        }
        
        p = q;
    }
    else if (p.type === 'tuple') {
        q = tuples[id];
        if (q === undefined) {
            q = {
                type: p.type,
                data: []
            };

            tuples[id] = q;
            for (var i=0; i<p.data.length; i++) {
                q.data.push(table2tuple(table, p.data[i], tuples));
            }
        }
        
        p = q;
    }
    else if (p.type === 'variable') {
        p = {type: p.type, data: 'x$'+id};
    }
    
    return p;
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

