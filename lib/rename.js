function _getVariables (p, vs, vn, excludeNot) {
    if (p.type === 'variable') {
        if (p.data && (p.data.length > 0)) {
            if (vn.indexOf(p.data) === -1) {
                vn.push(p.data);
                vs.push(p);
            }
        }
        else {
            vs.push(p);
        }
    }
    else if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            _getVariables(p.data[i], vs, vn, excludeNot);
        }
    }
    else if (!excludeNot && (p.type === 'not')) {
        _getVariables(p.data, vs, vn, excludeNot);
    }
}

function getVariables (p, excludeNot) {
    var vs = [];
    var vn = [];
    
    _getVariables(p, vs, vn, excludeNot);
 
    return {
        variables: vs,
        names: vn
    };
}

/*
function getVariablesNames (p, excludeNot) {
    return getVariables(p, excludeNot).names;
}*/

function getVariablesNames (p) {
    var vars = [];
    for (var name in p.variables) {
        vars.push(name);
    }
    
    return vars;
}

function giveNames (p) {
    var vs = getVariables(p);
    
    vs.variables.forEach(function (v) {
        if (!v.data || !v.data.length) {
            v.data = findName(vs.names);
        }
    });
    
    return p;
}

function findName (all) {
    var name;
    var j = 0;
            
    do {
        name = "x$" + j;
        j++;
    } while (all.indexOf(name) !== -1);

    all.push(name);

    return name;
}

function findNames (all, names) {
    var r = {};
    
    for (var i=0; i<names.length; i++) {
        var name = findName(all);
        r[names[i]] = name;
    }
    
    return r;
}

function renameAux (p, names) {
    var name;
    if ((p.type === 'variable') && (name = names[p.data])) {
        p.data = name;
    }
    else if ((p.type === 'tuple') || (p.type === 'unify')) {
        for (var i=0; i<p.data.length; i++) {
            renameAux(p.data[i], names);
        }
    }
    else if (p.type === 'not') {
        renameAux(p.data, names);
    }
    
    return p;
}

function rename (q, namesP, namesQ) {
    var all = namesP.concat(namesQ); 
    var names = [];
    namesP.forEach(function (n) {
        if ((namesQ.indexOf(n) !== -1) && (names.indexOf(n) === -1)) {
            names.push(n);
        }
    });

    var newNames = findNames (all, names);
    return renameAux(q, newNames);
}

module.exports = {
    giveNames: giveNames,
    getVariablesNames: getVariablesNames,
    rename: rename
};

