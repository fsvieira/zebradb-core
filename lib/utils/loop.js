Object.defineProperties(Object.prototype, {
    pWhile: {
        value: function (fn) {
            const arg = this;
            
            function next () {
                return new Promise(function (resolve, reject) {
                    fn(arg, resolve, reject);
                }).then(function (c) {
                    if (c) {
                        return next();
                    }
                    
                    return c;
                }, function (err) {
                    console.log(err);
                    return err;
                });
            }
            
            next();
        },
        enumerable: false
    } 
});

Array.prototype.pForEach = function (fn) {
    var index = 0;
    const array = this;
    
    function next () {
        if (index < array.length) {
            fn(array[index++], index).then(function (c) {
                if (c) {
                    next();
                }
            });
        }
    }

    next();
};

