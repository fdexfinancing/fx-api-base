'use strict';
/*
{
    notBind: not include in columns of this model,
    model: model reference,
    referColumn: column of reference table to join,
    localColumn: local column to join,
    join: type of join (left / right / inner),
    where: additional clause on join
    verifyDel: include clause to get only not deleted on last where
}
*/
class Model {
    constructor(opt, path) {
        if (opt && opt.show) {
            this.join = [];
            this.leftJoin = [];
            this.columns = [];
            this.leftColumns = [];

            this.path = path || '../model';
        }
    }

    include(name, opt) {
        opt = opt || {};
        const nameArr = name.split('.');
        let model;
        let modelAux;

        name = nameArr[nameArr.length - 1];

        if (nameArr.length > 1) {
            modelAux = new (require(`${this.path}/${this.annotation[nameArr[0]].model}`))();

            for(let i=1; i < (nameArr.length-1); i++){
                modelAux = new (require(`${this.path}/${modelAux.annotation[nameArr[nameArr.length - (nameArr.length - i)]].model}`))()
            }
        }
        else
            modelAux = this;

        const m = require(`${this.path}/${modelAux.annotation[nameArr[nameArr.length - 1]].model}`);

        model = new m();

        const key = opt.left ? 'leftJoin' : 'join';

        this[key].push({
            table: modelAux.table,
            localColumn: modelAux.annotation[name].localColumn,
            joinTable: model.table,
            referColumn: modelAux.annotation[name].referColumn,
            join: modelAux.annotation[name].join,
            verifyDel: modelAux.annotation[name].verifyDel,
            where: modelAux.annotation[name].where
        });


        this.columns.push(this.setColumns(model, opt.fields, name, opt.left));

        return this;
    }

    setColumns(model, fields, objName, left){
        fields = fields && Object.keys(fields).length > 0 ? fields : Object.getOwnPropertyNames(model).toString();

        return {model: model || this, fields, objName, left};
    }

    get annotation(){
        return {
            join: {notBind: true},
            leftJoin: {notBind: true},
            columns: {notBind: true},
            leftColumns: {notBind: true}
        }
    }
}

module.exports = Model;
