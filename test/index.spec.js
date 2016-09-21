"use strict";

const fxBase = require('../index.js');

describe("Module test", () => {
    it("should bootstrap module", () => {
        assert.equal(fxBase.hasOwnProperty('helper'), true);
        assert.equal(fxBase.hasOwnProperty('Dao'), true);
        assert.equal(fxBase.hasOwnProperty('Model'), true);
        assert.equal(typeof fxBase.Model, "function");
        assert.equal(typeof fxBase.Dao, "function");
        assert.equal(typeof fxBase.helper, "object");
    });
});
