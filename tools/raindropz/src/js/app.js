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


function prepare(data) {
    data = JSON.parse(data);

    setLevels(data);

    data.levels = [];

    var ZVS = require("../../../../lib3/zvs");
    var utils = require("../../../../lib3/utils");

    var zvs = new ZVS(data);
    var globalsHash = zvs.add({
        type: "globals"
    });

    console.log(globalsHash);
    for (var branch in data.branchs) {
        var b = data.branchs[branch];
        var q = zvs.getObject(globalsHash, branch).query;

        if (q) {
            q = utils.toString(q, true);
        }

        // TODO: filter fail branchs, recursive. 
        if (b.metadata.result) {
            b.metadata.id = branch;
            data.levels[b.metadata.level] = data.levels[b.metadata.level] || [];
            data.levels[b.metadata.level].push({
                branch: branch,
                query: q
            });
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