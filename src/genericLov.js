'use strict';

class LovModel {
    constructor(obj) {
        obj = obj || {};

        this.value = obj[(annotation["value"] || {}).columnName] || obj.value;
        this.display = obj[(annotation["display"] || {}).columnName] || obj.display;
    }

    get annotation() {
        return annotation;
    }
};


const annotation = {
};


module.exports = LovModel;

