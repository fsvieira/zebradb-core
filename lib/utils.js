
function toString (p, debug) {

    function ts (v) {
        return toString(v, debug);
    }

    if (!p) {
        return "";
    }

    switch (p.type) {
        case "tuple":
            return (debug?(p.loop && !p.check?"*":""):"") + (debug?(p.check?"@":""):"") + (debug?(p.exists === false?"!":""):"") + "(" + p.data.map(ts).join(" ") + ")"
                + (p.negation && p.negation.length?"[^" + toString(p.negation, debug) + "]":"");

        case "constant":
            return p.data;

        case "variable":
            return "'" + (p.data || ""); // + (debug?":" + p.id:"");

        default:
            if (p.map) {
                return p.map(ts).sort().join("\n");
            }
    }
}

function printQuery (branch, text) {
    console.log((text?text + " => ":"") + toString(branch.zvs.getObject(branch.id, branch.zvs.data.global("query")), true));
}

module.exports = {
    toString: toString,
    printQuery: printQuery
};

