const test = require("../lib/testing/test");

describe('Brave puzzle Tests.', function() {
    it('should solve brave puzzle',
        test(
            `(letter B)
            (letter R)
            (letter A)
            (letter V)
            (letter E)
            
            (equal 'x 'x)
            
            (distinct 
                (letter 'b) (letter 'r) (letter 'a) (letter 'v) (letter 'e)
                ^(equal 'b 'r) ^(equal 'b 'a) ^(equal 'b 'v) ^(equal 'b 'v) ^(equal 'b 'e)
                ^(equal 'r 'a) ^(equal 'r 'v) ^(equal 'r 'v) ^(equal 'r 'e)
                ^(equal 'a 'v) ^(equal 'a 'e)
            )
            
            (conditions '1 '2 '3 '4 '5 '6 '7 '8 '9 '10 '11 '12)
            
            (brave
                'x1y1 'x2y1 'x3y1 'x4y1 'x5y1
                'x1y2 'x2y2 'x3y2 'x4y2 'x5y2
                'x1y3 'x2y3 'x3y3 'x4y3 'x5y3
                'x1y4 'x2y4 'x3y4 'x4y4 'x5y4
                'x1y5 'x2y5 'x3y5 'x4y5 'x5y5
                (
                    conditions
                    (distinct 'x1y1 'x2y1 'x3y1 'x4y1 'x5y1)
                    (distinct 'x1y2 'x2y2 'x3y2 'x4y2 'x5y2)
                    (distinct 'x1y3 'x2y3 'x3y3 'x4y3 'x5y3)
                    (distinct 'x1y4 'x2y4 'x3y4 'x4y4 'x5y4)
                    (distinct 'x1y5 'x2y5 'x3y5 'x4y5 'x5y5)
                    
                    (distinct 'x1y1 'x1y2 'x1y3 'x1y4 'x1y5)
                    (distinct 'x2y1 'x2y2 'x2y3 'x2y4 'x2y5)
                    (distinct 'x3y1 'x3y2 'x3y3 'x3y4 'x3y5)
                    (distinct 'x4y1 'x4y2 'x4y3 'x4y4 'x4y5)
                    (distinct 'x5y1 'x5y2 'x5y3 'x5y4 'x5y5)
            
                    (distinct 'x1y1 'x2y2 'x3y3 'x4y4 'x5y5)
                    (distinct 'x1y5 'x2y4 'x3y3 'x4y2 'x5y1)
                )
            )
            
            
            ?(brave
                (letter B) (letter R) (letter A) (letter V) (letter E)
                '          (letter E) (letter B) (letter R) '
                '          '          (letter V) '          (letter B)
                '          (letter B) (letter R) '          '
                '          '          (letter E) (letter B) '
                '
            )
            `
            ,
            `?(brave (letter B) (letter R) (letter A) (letter V) (letter E) ' (letter E) (letter B) (letter R) ' ' ' (letter V) ' (letter B) ' (letter B) (letter R) ' ' ' ' (letter E) (letter B) ' '): @(brave @(letter B) @(letter R) @(letter A) @(letter V) @(letter E) @(letter V) @(letter E) @(letter B) @(letter R) @(letter A) @(letter R) @(letter A) @(letter V) @(letter E) @(letter B) @(letter E) @(letter B) @(letter R) @(letter A) @(letter V) @(letter A) @(letter V) @(letter E) @(letter B) @(letter R) @(conditions @(distinct @(letter B) @(letter R) @(letter A) @(letter V) @(letter E)) @(distinct @(letter V) @(letter E) @(letter B) @(letter R) @(letter A)) @(distinct @(letter R) @(letter A) @(letter V) @(letter E) @(letter B)) @(distinct @(letter E) @(letter B) @(letter R) @(letter A) @(letter V)) @(distinct @(letter A) @(letter V) @(letter E) @(letter B) @(letter R)) @(distinct @(letter B) @(letter V) @(letter R) @(letter E) @(letter A)) @(distinct @(letter R) @(letter E) @(letter A) @(letter B) @(letter V)) @(distinct @(letter A) @(letter B) @(letter V) @(letter R) @(letter E)) @(distinct @(letter V) @(letter R) @(letter E) @(letter A) @(letter B)) @(distinct @(letter E) @(letter A) @(letter B) @(letter V) @(letter R)) @(distinct @(letter B) @(letter E) @(letter V) @(letter A) @(letter R)) @(distinct @(letter A) @(letter B) @(letter V) @(letter R) @(letter E))))[^!(equal A B) !(equal A B) !(equal A B) !(equal A B) !(equal A E) !(equal A E) !(equal A E) !(equal A R) !(equal A R) !(equal A R) !(equal A R) !(equal A V) !(equal A V) !(equal A V) !(equal A V) !(equal A V) !(equal A V) !(equal B A) !(equal B A) !(equal B A) !(equal B A) !(equal B E) !(equal B E) !(equal B R) !(equal B R) !(equal B R) !(equal B V) !(equal B V) !(equal B V) !(equal E A) !(equal E A) !(equal E A) !(equal E A) !(equal E A) !(equal E B) !(equal E B) !(equal E B) !(equal E R) !(equal E R) !(equal E R) !(equal E V) !(equal E V) !(equal E V) !(equal E V) !(equal R A) !(equal R A) !(equal R A) !(equal R A) !(equal R A) !(equal R B) !(equal R B) !(equal R E) !(equal R E) !(equal R E) !(equal R E) !(equal R V) !(equal R V) !(equal R V) !(equal R V) !(equal V A) !(equal V A) !(equal V A) !(equal V B) !(equal V B) !(equal V B) !(equal V E) !(equal V E) !(equal V E) !(equal V E) !(equal V E) !(equal V R) !(equal V R) !(equal V R) !(equal V R) !(equal V R)]`
            ,
            {timeout: 60000 * 5}
        )
    );
});

