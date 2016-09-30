"use strict";

const fxBase = require('../index.js');

describe("Module test", () => {
    it("should bootstrap module", () => {
        assert.equal(fxBase.hasOwnProperty('ApiRequest'), true);
        assert.equal(fxBase.hasOwnProperty('Helper'), true);
        assert.equal(fxBase.hasOwnProperty('Dao'), true);
        assert.equal(fxBase.hasOwnProperty('Model'), true);
        assert.equal(fxBase.hasOwnProperty('Auth'), true);
        assert.equal(typeof fxBase.ApiRequest, "function");
        assert.equal(typeof fxBase.Model, "function");
        assert.equal(typeof fxBase.Dao, "function");
        assert.equal(typeof fxBase.Auth, "function");
        assert.equal(typeof fxBase.Helper, "object");
    });
});
