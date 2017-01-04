// Levels, 
function getChilds(data, parent) {
    var childs = [];
    for (var branch in data.branchs) {
        var b = data.branchs[branch];

        if (
            (typeof b.data.parent === 'string' && b.data.parent === parent) ||
            (b.data.parent instanceof Array && b.data.parent.indexOf(parent) !== -1)
        ) {
            childs.push(branch);
        }
    }

    return childs;
}

function setLevels(data, branch, level) {
    level = level || 0;
    branch = branch || data.root;

    var b = data.branchs[branch];

    if (b.metadata.level === undefined) {
        b.metadata.level = level;
        var childs = getChilds(data, branch);

        for (var i = 0; i < childs.length; i++) {
            setLevels(data, childs[i], level + 1);
        }
    }
}

function injectLinesString (iStr, str) {
    if (str === '') {
        return iStr + '\\empty';
    }
    else {
        return str.trim().split('\n').map(function (s) {
            return iStr + s;
        }).join('\n');
    }
}

function printQuery (utils, zvs, data, branch) {
    // Get globals
    var globalsHash = zvs.add({
        type: "globals"
    });
    
    var q = zvs.getObject(globalsHash, branch).query;

    if (q) {
        q = utils.toString(q, true);
    }
    
    return q;
}

function setupMetadata (utils, zvs, data, branch, b) {
    switch (b.data.action) {
        case 'init':
            b.metadata.prettyText = 'init;';
            break;
        
        case 'definitions':
            var definitions = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[0], b.data.parent), true));
            var globals1 = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[1], b.data.parent).definitions, true));
            var globals2 = injectLinesString('\t', utils.toString(zvs.getObject(b.metadata.changes[b.data.args[1]], branch).definitions, true));
            
            b.metadata.prettyText = 'Definitions: \n'
                + definitions + '\n\n'
                + 'Global Definitions: \n' + globals1 + '\n => \n' + globals2 + ';\n'
            ;
            break;

        case 'query':
            var query = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[0], b.data.parent), true)) + ' : Query';
            var globals = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[1], b.data.parent).definitions, true)) + ' : Definitions';
            
            b.metadata.prettyText = b.data.action + '(\n' + query + ',\n'+ globals + '\n)\n => \n' + printQuery(utils, zvs, data, branch);
            
            break;
            
        case 'unify':
            var p = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[0], b.data.parent), true));
            var q = injectLinesString('\t', utils.toString(zvs.getObject(b.data.args[1], b.data.parent), true));
            
            b.metadata.prettyText = b.data.action + '(\n' + p + ',\n'+ q + '\n)\n => \n' + printQuery(utils, zvs, data, branch);
            
            break;
        
        case '_merge':
            console.log("_merge");
            var bQueries = '';
            for (var i=0; i<b.data.parent.length; i++) {
                bQueries += printQuery(utils, zvs, data, b.data.parent[i]) + '\n';
            }
            
            bQueries = injectLinesString('\t', bQueries);
            
            b.metadata.prettyText = b.data.action +'(\n' + bQueries +  '\n)\n => \n' + printQuery(utils, zvs, data, branch);
            break; 
            
        default:
            b.metadata.prettyText = b.data.action;
            /*var args = "";
            
            if (b.data.args) {
                for (var i=0; i<b.data.args.length; i++) {
                    var o = zvs.getObject(b.data.args[i], b.data.parent);
                    
                    if (args !== "") {
                        args += ", ";
                    }
                    
                    args += utils.toString(o, true);
                }
            }
            
            console.log(
                b.data.action
                + "("+ args +")"
            );
            
            b.metadata.prettyText = b.data.action + "(" + args + ")";*/
    }
}

// Prepare data,
function prepare(data) {
    data = JSON.parse(data);

    setLevels(data);

    data.levels = [];
    data.graph = [];

    var ZVS = require("../../../../lib3/zvs");
    var utils = require("../../../../lib3/utils");

    var zvs = new ZVS(data);
    var globalsHash = zvs.add({
        type: "globals"
    });

    for (var branch in data.branchs) {
        var b = data.branchs[branch];
        var q = zvs.getObject(globalsHash, branch).query;

        if (q) {
            q = utils.toString(q, true);
        }

        setupMetadata(utils, zvs, data, branch, b);

        data.graph.push({
            data: {id: branch}
        });

        if (b.data.parent) {
            if (b.data.parent instanceof Array) {
                for (var i=0; i<b.data.parent.length; i++) {
                    data.graph.push({
                        data: {
                            id: b.data.parent[i] + "_" + branch, 
                            source: b.data.parent[i],
                            target: branch
                        }
                    });
                }
            }
            else {
                data.graph.push({
                    data: {
                        id: b.data.parent + "_" + branch,
                        source: b.data.parent,
                        target: branch
                    }
                });
            }
        }
        
        // TODO: filter fail branchs, recursive. 
        if (b.metadata.result) {
            b.metadata.id = branch;
            data.levels[b.metadata.level] = data.levels[b.metadata.level] || [];
            data.levels[b.metadata.level].push({
                branch: branch,
                query: q
            });
            
            b.metadata.query = q;
        }
    }
    
    return data;
}

function App() {
    riot.observable(this);

    this.data;
    this.title = "Raindropz";

    this.on('update', function(data) {
        this.data = prepare(data.data);
    });
}

module.exports = App;