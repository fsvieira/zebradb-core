const {parse: zparse} = require("../zparser");
const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const prepare = require("../prepare");

function parse (text) {
    return new Promise(function (resolve, reject) {
       resolve({values: zparse(text)});
    });
}

function include (readFile) {
    const files = [];
    
    return function (filename) {
        if (files.indexOf(filename) === -1) {
            files.push(filename);
            return readFile(filename).then(function (text) {
                return {value: text};
            });
        }
        else {
            return Promise.resolve({});
        }
    };
}

function branch (zvs, {parentBranchId, action, args}) {
    const parent = zvs.branches.getRawBranch(parentBranchId);
	
	if (parent.metadata) {
	    Object.freeze(parent.metadata.changes);
	}
	
	return zvs.branches.branchHash({
	    parent: parentBranchId,
		args: args.slice(0),
		action: action,
		level: parent.data.level + 1
	});
}

function definitions (zvs) {
    const definitions = [];
    var definitionsBranchId;
    
    return function (tuple) {
        return new Promise (function (resolve) {
            if (tuple.type === 'query') {
                if (!definitionsBranchId) {
                    // TODO: keep this in a list,
                    const unckedIds = definitions.map(x => x.zid);
                    const branchId = branch(
                        zvs, 
                        {
                            parentBranchId: zvs.branches.root, 
                            action: 'definitions', 
                            args: [zvs.data.dataHash(unckedIds)]
                        }
                    );
                    
                    definitionsBranchId = branch(
                        zvs, 
                        {
                            parentBranchId: branchId, 
                            action: 'check definitions', 
                            args: []
                        }
                    );
                    
                    for (var i=0; i<definitions.length; i++) {
                        const d = definitions[i];
                        zvs.branches.transform(definitionsBranchId, d.zid, d.zCheckedId);
                    }
                }
                
                const queryBranchId = branch(
                    zvs, 
                    {
                        parentBranchId: definitionsBranchId, 
                        action: 'query',
                        args: [tuple.zid]
                    }
                );

                resolve({value: queryBranchId});
            }
            else {
                definitions.push(tuple);
                definitionsBranchId = undefined;
                resolve({});
            }
        });
    };
} 

function prepareTuples (zvs) {
    return function (value) {
        return new Promise(function (resolve, reject) {
            var id = 0;
            var prefix;
            function genId () {
                return prefix + id++;
            }

            if (value.type === 'query') {
                prefix = 'q$';
                const query = prepare.copyWithVars(value.data, genId);
                resolve({value:{type: 'query', zid: zvs.data.add(query), data: query}});
            }
            else {
                prefix = 'd$';

                const def = prepare.copyWithVars(value, genId);
                def.zid = zvs.data.add(def);
                
                def.check = true;
                def.zCheckedId = zvs.data.add(def);
                
                resolve({value: def});
            }
        });
    };
}

function session (readFile) {
    
    const zvs = new ZVS();
    
    const pipeline = {
        transitions: {
            files: {
                to: {
                    texts: include(readFile)
                },
                next: function () {return 'texts';}
            },
            texts: {
                to: {
                    parsed: parse
                },
                next: function () {return 'parsed';}
            },
            parsed: {
                to: {
                    tuples: prepareTuples(zvs),
                    files: function (value) {
                        return new Promise(function (resolve, reject) {
                            resolve({value: value.data});
                        });
                    }
                },
                next: function (value) {
                    return value.type === 'include'?'files':'tuples';
                }
            },
            tuples: {
                to: {
                    queries: definitions(zvs)
                },
                next: function () {return 'queries';}
            },
            /*queries: {
                to: {
                    check: check(zvs)
                },
                next: function () {return 'check';}
            }*/
        },
        ordered: ['files', 'tuples'],
        start: 'texts'
    };



    const kanban = new Kanban(pipeline);
    return kanban;
}

function readFile (files) {
    
    return function (filename) {
        return new Promise(function (resolve, reject) {
            const file = files[filename];
            
            if (file) {
                setTimeout(function () {
                    resolve(file.data);
                }, file.delay || 0);
            }
            else {
                reject("File not found.");
            }
        });
    };
}

session(
    readFile({
        "yellow": {
            data: '(yellow) ?(yellow)',
            delay: 1000
        }
    })
).add('[yellow]');

