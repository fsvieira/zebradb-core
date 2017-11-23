const test = require("../lib/testing/test");

describe("Func tests.", function () {
    it("Custom function for print query.",
        test(
            `(yellow)
            ?(yellow) {%
                return {result: result.data[0].data};
            %}
            ?(yellow) {% 
                return {result: "do it"};
            %}`
            ,
            `?(yellow):
                yellow
             ?(yellow):
                do it
            `
        )
    );

    it("brother test.",
        test(
            `(male rolando)
            (female noémia)

            (female joana)
            (female isabel)
            (male filipe)

            (parent (female noémia) (female joana))
            (parent (female noémia) (female isabel)) 
            (parent (female noémia) (male filipe)) 

            (parent (male rolando) (female joana))
            (parent (male rolando) (female isabel)) 
            (parent (male rolando) (male filipe)) 

            (father (male 'x) ('y 'z) (parent (male 'x) ('y 'z)))
            (mother (female 'x) ('y 'z) (parent (female 'x) ('y 'z)))

            ?(mother ' ' ') {%
                return {result: result.data[2].data[1].data + " is " +
                    result.data[1].data[1].data + " " +
                    (result.data[2].data[0].data === 'male'?"son":"daughter") +
                    "."};
            %}
            `
            ,
            `?(mother ' ' '):
                filipe is noémia son.
                isabel is noémia daughter.
                joana is noémia daughter.`
        )
    );

});
