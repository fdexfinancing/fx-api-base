"use strict";

const helper = require('../src/helper');

describe("Helper unit test", () => {
    it("should capitalize letters", () => {
        assert.equal(helper.capitalize("test"), "Test");
        assert.equal(helper.capitalize("test new test"), "Test New Test");
    });

    it("should remove accents", () => {
        assert.equal(helper.removeAccent("Olá"), "ola");
        assert.equal(helper.removeAccent("Caçamba são legais"), "cacambasaolegais");
    });

    it("should display errorMessage", () => {
        let params = {
            schedule: {
                user: {
                    phone: {
                        areaCode: 11,
                        number: '990798789767'
                    },
                    _id: 1,
                    name: 'Hello'
                }
            },
            text: 'Test'
        };

        assert.equal(helper.errorMessage(params), " - fone: (11) 990798789767Test1<br />Cliente: Hello - fone: (11) 990798789767");
    });
});
