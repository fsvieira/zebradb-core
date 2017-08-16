#!/usr/bin/env node

const Session = require("../lib/z");
const utils = require("../lib/utils");
const fs = require("fs");

function readFile (filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, function (err, data) {
           if (err) {
               reject(err);
           }
           else {
               resolve(data.toString());
           }
        });
    });
}


function run (filename) {
    const session = new Session({
        readFile
    });
    
    function toString (branchId) {
        const query = session.zvs.getObject(branchId, session.zvs.data.global("query"));
        return utils.toString(query, true);
    }
    
    const queryIds = [];
    
    session.events.on('query-start', function (queryBranchId) {
        if (queryIds.indexOf(queryBranchId) === -1) {
            queryIds.push(queryBranchId);
            console.log("Query Started => " + toString(queryBranchId));
        }
    });
    
    session.events.on('success', function (branchId) {
        const queryBranchId = session.zvs.getObject(branchId, session.zvs.data.global("queryBranchId")).data;
        if (queryIds.indexOf(queryBranchId) !== -1) {
            console.log("Query Success: " + toString(queryBranchId) + " => " + toString(branchId));
        }
    });
    
    session.events.on('track', function ({id: queryBranchId, actives}) {
        const index = queryIds.indexOf(queryBranchId);
        if (actives === 0 && index !== -1) {
            // query ended remove it from list,
            queryIds.splice(index, 1);
            console.log("Query Ended => " + toString(queryBranchId));
        }
    });
    
    session.add({value: "[" + filename + "]"});
}

if (process.argv.length === 3) {
    run(process.argv[2]);
}
else {
    console.log(process.argv[1] + " <filename>");
}

