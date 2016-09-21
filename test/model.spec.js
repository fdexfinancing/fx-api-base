'use strict';

const Model = require('../src/model');
const assert = require('assert');
const myModel = new Model();

describe("Model unit tests", () => {
    it("should initialize model", () => {
        assert.equal(typeof myModel.setColumns, 'function');
        assert.equal(typeof myModel.annotation, 'object');
        assert.equal(typeof myModel.include, 'function');
    });
});
