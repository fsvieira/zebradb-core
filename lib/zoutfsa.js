function outDOT (fsa) {
    
    var body = "";
    
    var transitions = outString(fsa);
    
    for (var from in transitions) {
        var end = true;
        for (var v in transitions[from]) {
            end = false;
            
            transitions[from][v].forEach (function (t) {
                body += '\t"' + from + '" -> "' + t.to + '" [label = "' + v + "=" + t.value+'" ];\n';
            });
            
        }

        if (end) {
            body += '\t"' + from + '" -> "[END]";\n';
        }
    }

    return 'digraph fsm {\n' +
        '\trankdir=LR;\n' +
        '\tsize="8,5"\n'+
        '\tnode [shape = circle];\n' +
        body + "\n}\n";

}


function outString (fsa) {
    var output = {};
    
    for (var state in fsa.delta) {
        var variables = {};
        output[fsa.states[+state].toString()] = variables;
        for (var v in fsa.delta[+state].transitions) {
            var name = fsa.delta[+state].variables[v].name;
            var vname = (name?name:"") + "$" + v;
            variables[vname] = [];
            fsa.delta[+state].transitions[v].forEach (function (t) {
                variables[vname].push({value: t.value, to: fsa.states[t.to].toString()}); 
            });
            
        }
    }
    
    return output;
}


module.exports = {
    string: outString,
    dot: outDOT
};

