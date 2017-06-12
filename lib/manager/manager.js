const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");


const {
    include,
    parse,
    prepareTuples,
    definitions
} = require("../actions/index");




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
            /*
                TODO: plan, if planner has no results, then move query,
                we can't do it all at once, we need first execute plan 
                and then have a next function to select the ones that 
                have ended and the ones that are going to check ? 
            */
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

