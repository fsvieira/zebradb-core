let total = (v) => v.values.constants.length + v.values.tuples.length;

let sortTotalValues = (values) => {
    values.sort((a, b) => {
        if (a.variable === b.variable) {
            const atotal = total(a);
            const btotal = total(b);
                    
            return btotal - atotal;       
        }
                
        return (b.variable?1:0) - (a.variable?1:0);
    });
    
    return values;
};

"#if DEBUG";
    const {contractFunc} = require('../../testing/contracts');
    
    sortTotalValues = contractFunc(sortTotalValues, 'sortTotalValues', {
        post: (values) => {
            let i=0, min=Infinity;
            for (i=0; i<values.length; i++) {
                const value = values[i];
                if (!value.variable) {
                    break;
                }
                
                const t = total(values[i]);
                if (total(values[i]) <= min) {
                    min = t;
                }
                else {
                    return "Found variables incresing value at position " + i + ", of " + JSON.stringify(values);
                }
            }
            
            min = Infinity;
            for (; i<values.length; i++) {
                const value = values[i];
                
                if (value.variable) {
                    return "Found variable on values at position " + i + ", of " + JSON.stringify(values);
                }
                
                const t = total(values[i]);
    
                if (total(values[i]) <= min) {
                    min = t;
                }
                else {
                    return "Found values incresing value at position " + i + ", of " + JSON.stringify(values);
                }
            }
        }
    });
    
    total = contractFunc (total, 'total', {
        pre: (v) => {
            if ( !(v.values.constants instanceof Array) ) {
                return "Invalid value constants " + JSON.stringify(v) + ".";
            }

            if ( !(v.values.tuples instanceof Array) ) {
                return "Invalid value tuples " + JSON.stringify(v) + ".";
            }
        }
    });
    
"#endif";

module.exports = {sortTotalValues};
