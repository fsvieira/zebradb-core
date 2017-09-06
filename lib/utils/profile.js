var counters = {};
var start = new Date().getTime();

function reset () {
    counters = {};
    start = new Date().getTime();
}

function profile (f, id) {
    if (f instanceof Function) {
        return function (...args) {
            counters[id] = counters[id] || {occurrences: 0, totalTime: 0};
    
            var t = new Date().getTime();
            var r = f.apply(this, args);
            var d = new Date().getTime() - t;
    
            var c = counters[id];
            
            c.totalTime += d;
            c.occurrences++;
    
            return r;
        };
    }
    else {
        return f;
    }
}

function profileClass (theClass) {
    const ids = Object.getOwnPropertyNames(theClass.prototype);
    ids.map(id => {
        const f = theClass.prototype[id];
        theClass.prototype[id] = profile(f, theClass.name + "." + id);
    });
}


function printCounters () {
    var end = new Date().getTime();
    var fulltime = end - start;
    var s = "";

    for (var id in counters) {
        try {
            const c = counters[id];
            const avg = c.totalTime / c.occurrences;
            const perc = (c.totalTime * 100 / fulltime);
            
            if (perc > 5) {
                s += "\t" + id + ": total= " + (c.totalTime/1000).toFixed(3) + "s, occ="+ c.occurrences + " avg= " + (avg/1000).toFixed(3) + "s, perc= " + perc.toFixed(2) + "%\n";
            }
        }
        catch (e) {
            s += e;
        }
    }

    s += "\tfull time: " + (fulltime/1000) + "s";
    
    console.log(s);
    return s;
}


module.exports = {
    reset,
    profile,
    profileClass,
    printCounters
};

