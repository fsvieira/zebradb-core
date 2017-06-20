const test = require("../lib/testing/test");

describe('Multiply Tests', function() {
    it('should multiply results.',
        test(
            `(yellow 'a)
            ('b blue)
            ?('c 'd)`
            ,
            `?('c 'd):
                @(yellow 'a) 
                @(yellow blue) 
                @('b blue)`
        )
    );
        
    it('should multiply results (with variables with same name).',
        test(
            `(yellow 'a)
            ('a blue)
            ?('a 'b)`
            ,
            `?('a 'b): 
                @(yellow 'a) 
                @('a blue)`
             
            `@('a blue)
            @(yellow 'a)
            @(yellow blue)`
        )
    );
});