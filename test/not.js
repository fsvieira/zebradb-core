const test = require("../lib/testing/test");

describe('Not Tests.', function() {
    it('Simple not',
        test(
            `(equal 'x 'x) (blue)
            ?('x ^(equal 'x yellow))`
            ,
            `?('x)[^(equal 'x yellow)]: 
                @(blue)[^!(equal blue yellow)]`
        )
    );

    it('Simple not, no constants', 
        test(
            `(equal 'x 'x) ('x)
            ?('x ^(equal 'x yellow))`
            ,
            `?('x)[^(equal 'x yellow)]:
                <empty>`
        )
    );

    it('Declare a not equal',
        test(
            `(color 'a) (equal 'x 'x) (not-equal 'x 'y ^(equal 'x 'y))
            ?(equal yellow yellow)
            ?(equal yellow blue)
            ?(not-equal yellow yellow)
            ?(not-equal yellow blue)
            ?(not-equal (color yellow) (color yellow))
            ?(not-equal (color blue) (color yellow))`
            ,
            `?(equal yellow yellow):
                @(equal yellow yellow)
            ?(equal yellow blue):
                <empty>
            ?(not-equal yellow yellow):
                <empty>
            ?(not-equal yellow blue):
                @(not-equal yellow blue)[^!(equal yellow blue)]
            ?(not-equal (color yellow) (color yellow)):
                <empty>
            ?(not-equal (color blue) (color yellow)):
                @(not-equal @(color blue) @(color yellow))[^!(equal @(color blue) @(color yellow))]`
        )
    );

    it('Should make distinct tuples',
        test(
            `(color yellow)
            (color blue)
            (color red)
            (equal 'x 'x)
            (distinct 'x 'y ^(equal 'x 'y))
            ?(distinct (color yellow) (color yellow))
            ?(distinct (color yellow) (color blue))
            ?(distinct (color 'a) (color 'b))`
            ,
            `?(distinct (color yellow) (color yellow)):
                <empty>
            ?(distinct (color yellow) (color blue)):
                @(distinct @(color yellow) @(color blue))[^!(equal @(color yellow) @(color blue))]
            ?(distinct (color 'a) (color 'b)):
                @(distinct @(color blue) @(color yellow))[^!(equal @(color blue) @(color yellow))]
                @(distinct @(color red) @(color yellow))[^!(equal @(color red) @(color yellow))]
                @(distinct @(color yellow) @(color blue))[^!(equal @(color yellow) @(color blue))]
                @(distinct @(color red) @(color blue))[^!(equal @(color red) @(color blue))]
                @(distinct @(color yellow) @(color red))[^!(equal @(color yellow) @(color red))]
                @(distinct @(color blue) @(color red))[^!(equal @(color blue) @(color red))]`
        )
    );

    it('Should declare simple not.',
        test(
            `(number 0)
            (number 1)
            (not 'x 'y ^(equal 'x 'y))
            (equal 'x 'x)
            ?(not (number 'p) (number 'q))`
            ,
            `?(not (number 'p) (number 'q)):
                @(not @(number 1) @(number 0))[^!(equal @(number 1) @(number 0))]
                @(not @(number 0) @(number 1))[^!(equal @(number 0) @(number 1))]`
        )
    );

    it('Should declare a two number Set',
        test(
            `(number 0)
            (number 1)
            (set)
            (set (number 'a) (set) ')
            (set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))
            (equal 'x 'x)
            ?(set (number 'a) (set (number 'b) (set) ') ')
            ?(set (number 'a) (set (number 'b) (set (number 'c) (set) ') ') ')`,
            ``
        )
    );
/*
    it('Should declare a two number Set, query all', function() {
        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))" +
            "(equal 'x 'x)"
        );

        should(run.print("?(set (number 'a) 'tail ')")).eql(
            "@(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 1))]\n" +
            "@(set @(number 0) @(set) ')\n" +
            "@(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 0))]\n" +
            "@(set @(number 1) @(set) ')"
        );
    });

    it('Should declare a number Set, 3 elements', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))" +
            "(equal 'x 'x)"
        );

        should(run.print(
            "?(set (number 0) (set (number 1) (set (number 2) (set) ') ') ')"
        )).eql(
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))]"
        );

        should(run.print(
            "?(set (number 'a) 'tail ')"
        )).eql(
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 2))]\n" +
            "@(set @(number 0) @(set) ')\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 2) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 2))]\n" +
            "@(set @(number 1) @(set) ')\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))[^!(equal (number 2) (number 0))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))[^!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set) ')"
        );
    });

    it('Should declare a number Set, 4 elements', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            "(number 3)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))" +
            "(equal 'x 'x)"
        );

        should(run.print(
            "?(set (number 0) (set (number 1) (set (number 2) (set (number 3) (set) ') ') ') ')"
        )).eql(
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]"
        );

        should(run.print(
            "?(set (number 'a) (set (number 'b) (set (number 'c) (set (number 'd) (set) ') ') ') ')"
        )).eql(
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 0) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 0) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 0) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 1) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 2))]\n" + 
            "@(set @(number 1) @(set @(number 2) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 1) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 1) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 2) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 2) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 2) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 2) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 3) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 3) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 3) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 3) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 2) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 3) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 3) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]"
        );
    });

    it('Should declare a number Set, 4 elements, all', function() {
        this.timeout(1000 * 60 * 5);

        var run = new Z();
        
        run.add(
            "(number 0)" +
            "(number 1)" +
            "(number 2)" +
            "(number 3)" +
            "(set)" +
            "(set (number 'a) (set) ')" +
            "(set (number 'a) (set (number 'b) 'tail ') (set (number 'a) 'tail ') ^(equal (number 'a) (number 'b)))" +
            "(equal 'x 'x)"
        );

        should(run.print(
            "?(set (number 'a) 'tail ')"
        )).eql(
            // TODO: check why is there repeated nots, they may be diferent from each other before to eval to values.
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 0) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 0) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 0) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))[^!(equal (number 0) (number 3))]\n" +
            "@(set @(number 0) @(set) ')\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 1) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 0) (number 3))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 1) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 2) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 1) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')))[^!(equal (number 1) (number 2))\n!(equal (number 1) (number 3))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))[^!(equal (number 1) (number 3))]\n" +
            "@(set @(number 1) @(set) ')\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 2) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 2) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 3))\n!(equal (number 0) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 0) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))[^!(equal (number 2) (number 0))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 2) @(set @(number 0) @(set @(number 3) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 3))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 2) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 3))\n!(equal (number 1) (number 3))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set @(number 3) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 1) (number 3))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))[^!(equal (number 2) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 2) (number 0))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))) @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')))[^!(equal (number 2) (number 1))\n!(equal (number 2) (number 3))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 2) @(set @(number 3) @(set) ') @(set @(number 2) @(set) '))[^!(equal (number 2) (number 3))]\n" +
            "@(set @(number 2) @(set) ')\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 3) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 0) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) '))) @(set @(number 3) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 0) (number 2))\n!(equal (number 0) (number 2))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 0) (number 2))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))[^!(equal (number 3) (number 0))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 3) @(set @(number 0) @(set @(number 2) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 2))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 1) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) '))) @(set @(number 3) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 1) (number 2))\n!(equal (number 1) (number 2))\n!(equal (number 2) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set @(number 2) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 1) (number 2))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))[^!(equal (number 3) (number 1))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 3) @(set @(number 0) @(set @(number 1) @(set) ') @(set @(number 0) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 0) (number 1))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 2) (number 0))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 2) @(set @(number 0) @(set) ') @(set @(number 2) @(set) '))) @(set @(number 3) @(set @(number 1) @(set @(number 0) @(set) ') @(set @(number 1) @(set) ')) @(set @(number 3) @(set @(number 0) @(set) ') @(set @(number 3) @(set) '))))[^!(equal (number 1) (number 0))\n!(equal (number 2) (number 0))\n!(equal (number 2) (number 1))\n!(equal (number 2) (number 1))\n!(equal (number 3) (number 0))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set @(number 1) @(set) ') @(set @(number 2) @(set) ')) @(set @(number 3) @(set @(number 1) @(set) ') @(set @(number 3) @(set) ')))[^!(equal (number 2) (number 1))\n!(equal (number 3) (number 1))\n!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set @(number 2) @(set) ') @(set @(number 3) @(set) '))[^!(equal (number 3) (number 2))]\n" +
            "@(set @(number 3) @(set) ')"
        );
    });
*/
});
