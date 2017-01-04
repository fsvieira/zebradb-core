var should = require("should");
var utils = require("../lib3/utils");
var Z = require("../lib3/z");

describe("Definitions Tests.", function () {
    it("Add simple definitions.", function () {
        
        var run = new Z();
        var r;
        
        should(
            run.add("(yellow)")
        ).eql(undefined);
        
        r = run.add("?(yellow)");
        should(r).eql(
            {
                definitions: 'aefe3fe100de4c4d035c38ce0b1458d9626ae7a7',
                queries: {
                    '5f19be9ef080909b990cb397944b71045c405bd9': [
                        [ '8d813ed64022ad5861e77a0b7684d41707d262cf' ]
                    ]
                }
            }
        );
        
        should(
            utils.toString(run.zvs.getObject(run.globalsHash, r.definitions).definitions)
        ).eql("(yellow)");
        
        // TODO: even if this query is alredy ben evaluated it should return a result.
        r = run.add("?(yellow)");
        should(r).eql(
            {
                definitions: 'aefe3fe100de4c4d035c38ce0b1458d9626ae7a7',
                queries: { '5f19be9ef080909b990cb397944b71045c405bd9': [] }
            }
        );
        
        
        r = run.add("?(blue)");
        should(r).eql(
            {
                definitions: 'aefe3fe100de4c4d035c38ce0b1458d9626ae7a7',
                queries: { f495e4cc21d874829b145453e2ec0a6ff1ed9a11: [] }
            }
        );
        
        should(run.add("(blue)")).eql(undefined);
        
        r = run.add("?(blue)");
        should(r).eql(
            {
                definitions: '4ea9239958ff8a14ab35177dd2e3bd9165a2672e',
                queries: {
                    f495e4cc21d874829b145453e2ec0a6ff1ed9a11: [ 
                        [ '72a0c286066226eac8e07f02127d62efc495db2e' ]
                    ]
                }
            }
        );
        
        console.log(JSON.stringify(run.zvs.objects, null, '\t'));
        
        /*
        should(
            utils.toString(run.zvs.getObject(run.globalsHash, r.definitions).definitions)
        ).eql("(yellow)");
        
        r = run.add("?(yellow)");
        */
        
        /*should(r).eql({
            definitions: 'aefe3fe100de4c4d035c38ce0b1458d9626ae7a7',
            queries: {
                '5f19be9ef080909b990cb397944b71045c405bd9': [
                    [
                        '8d813ed64022ad5861e77a0b7684d41707d262cf',
                        '8d813ed64022ad5861e77a0b7684d41707d262cf'
                    ]
                ]
          }
        });*/
        
        /*
        should(
            utils.toString(run.zvs.getObject(run.globalsHash, r.definitions).definitions)
        ).eql("(yellow)");
        
        r = run.add("?(blue)");
        should(
            utils.toString(run.zvs.getObject(run.globalsHash, r.definitions).definitions)
        ).eql("(yellow)");
        */
        
        /*r = run.add("(yellow)");
        should(r).eql({
            definitions: 'e79e3013ab612d7372183425095f07f42a997c25'
        });
        
        should(
            utils.toString(run.zvs.getObject(run.globalsHash, r.definitions).definitions)
        ).eql("(yellow)");
        */
    });
});