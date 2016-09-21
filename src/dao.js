"use strict";
const db = require("./db");

class Dao extends db {
    dbConnection(_dbconfig){
        super.dbConnection(_dbconfig);
    }

    getAll(model, params, callback) {
        params = params || {page: 1};
        const selectFields = [];
        const selectLeftFields = [];

        _.each(model.columns, (column) => {
            _.each((column.fields || {}).replace(/ /g, "").split(","), (field) => {
                const prop = column.model.annotation[field];
                if (field && (!prop || !prop.notBind)) {
                    if (column.left)
                        selectLeftFields.push(`${column.model.table}.${field}${prop && prop.columnName ? ` as ${prop.columnName}` : ""}`);
                    else
                        selectFields.push(`${column.model.table}.${field}${prop && prop.columnName ? ` as ${prop.columnName}` : ""}`);
                }
            });
        });

        let query = ` select total_items, ${model.table}.* ${(selectLeftFields.length > 0 ? `, ${selectLeftFields}` : "")}
                                    from (select count(*) OVER() as total_items, ${selectFields.toString()}`;
        if (params.specialField)
            query += `, ${params.specialField}`;

        query += ` from ${model.table}`;

        _.each(model.join, (join) => {
            query += ` ${join.join || 'inner'} join ${join.joinTable} on ${join.joinTable}.${join.referColumn} = ${join.table}.${join.localColumn}`;
            if(join.where)
                query += join.where.replace(new RegExp('{{table}}', 'g'), join.joinTable).replace(new RegExp('{{p_table}}', 'g'), model.table);
            if(join.verifyDel)
                params.whereClause += ` and ${join.joinTable}.deleted_at is null`;
        });

        if (params.whereClause && params.values)
            query += params.whereClause;

        if (params.orderBy)
            query += params.orderBy;

        if (params.pageSize)
            query += ` offset ${params.pageSize * ((params.page || 1) - 1)} limit ${params.pageSize}`;

        query += `) as ${model.table}`;

        _.each(model.leftJoin, (ljoin) => {
            const localColumn = model.annotation[ljoin.localColumn] ? model.annotation[ljoin.localColumn].columnName : ljoin.localColumn;
            query += ` ${ljoin.join || 'left'} join ${ljoin.joinTable} on ${ljoin.joinTable}.${ljoin.referColumn} = ${ljoin.table}.${localColumn}`;
            if(ljoin.where)
                query += ljoin.where.replace(new RegExp('{{table}}', 'g'), ljoin.joinTable).replace(new RegExp('{{p_table}}', 'g'), model.table);
            if(ljoin.verifyDel)
                params.whereLeft += !params.whereLeft ? ` where ${ljoin.joinTable}.deleted_at is null` : ` and ${ljoin.joinTable}.deleted_at is null`;
        });

        if(model.leftJoin && model.leftJoin.length > 0 ) {
            if (params.whereLeft)
                query += params.whereLeft;

            if (params.orderByLeft)
                query += params.orderByLeft;
        }

        super.exec(params.conn, query, params.values, callback);
    }

    insertObj(obj, params, callback) {
        params = params || {};
        obj.created_at = new Date();
        const fields = [];
        const values = [];
        const aux_values = [];
        let count = 0;
        delete obj.id;
        const obj_prop = Object.getOwnPropertyNames(obj);
        for (let i in obj_prop) {
            const field = obj_prop[i];
            const prop = obj.annotation[field];
            if (!prop || !prop.notBind) {
                count++;
                fields.push(field);
                values.push(obj[field]);
                aux_values.push(`$${count}`);
            }
        }

        const query = `insert into ${obj.table}(${fields}) values (${aux_values}) RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, result.rows[0]);
        });
    }

    insertManyObj(objList, params, callback) {
        params = params || {};
        let count = 0;
        const values = [];
        const chunck = [];
        let fields = [];
        let table = "";
        _.each(objList, obj => {
            table = obj.table;
            obj.created_at = new Date();
            const aux_values = [];
            fields = [];
            delete obj.id;
            const obj_prop = Object.getOwnPropertyNames(obj);
            for (let i in obj_prop) {
                const field = obj_prop[i];
                const prop = obj.annotation[field];
                if (!prop || !prop.notBind) {
                    count++;
                    fields.push(field);
                    values.push(obj[field]);
                    aux_values.push(`$${count}`);
                }
            }

            chunck.push(`(${aux_values})`);
        });

        const query = `insert into ${table}(${fields}) values ${chunck} RETURNING *`;
        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            callback(null, result.rows);
        });
    }

    updateObj(id, obj, params, callback) {
        params = params || {};
        obj.updated_at = new Date();
        delete obj.id;
        delete obj.created_at;

        const fields = [];
        const values = [];
        const aux_values = [];
        let count = 0;
        const obj_prop = Object.getOwnPropertyNames(obj);

        for (let i in obj_prop) {
            const field = obj_prop[i];
            const prop = obj.annotation[field];
            if ((!prop || !prop.notBind) && (obj[field] || obj[field] == false)) {
                count++;
                fields.push(field);
                const val = obj[field] == 'null' ? null : obj[field];
                values.push(val);
                aux_values.push(`$${count}`);
            }
        }

        let query = `update ${obj.table} set `;

        for (let i = 0; i < count; i++) {
            query += `${fields[i]}=${aux_values[i]},`;
        }

        query = query.substring(0, query.length - 1);

        query += ` where ${obj.table}.id=$${++count}`;
        values.push(id);

        let clause_str = "";

        for (const j in params.clause) {
            values.push(params.clause[j]);
            clause_str += ` and ${obj.table}.${j}=$${++count}`;
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, result.rows[0]);
        });
    }

    updateListObj(listClause, obj, params, callback) {
        params = params || {};
        obj.updated_at = new Date();
        delete obj.id;
        delete obj.created_at;

        const fields = [];
        const values = [];
        const aux_values = [];
        let count = 0;
        const obj_prop = Object.getOwnPropertyNames(obj);

        for (let i in obj_prop) {
            const field = obj_prop[i];
            const prop = obj.annotation[field];
            if ((!prop || !prop.notBind) && (obj[field] || obj[field] == false)) {
                count++;
                fields.push(field);
                const val = obj[field] == 'null' ? null : obj[field];
                values.push(val);
                aux_values.push(`$${count}`);
            }
        }

        let query = `update ${obj.table} set `;

        for (let i = 0; i < count; i++) {
            query += `${fields[i]}=${aux_values[i]},`;
        }

        query = query.substring(0, query.length - 1);

        const key = _.keys(listClause)[0];
        if(!key)
            return callback(error.global.general);

        query += ` where ${obj.table}.${key} IN (SELECT unnest ($${++count}::integer[]))`;

        const value = listClause[key];

        values.push(typeof(value) == "object" ? value : value.toString().split(","));

        let clause_str = "";

        for (const j in params.clause) {
            values.push(params.clause[j]);
            clause_str += ` and ${obj.table}.${j}=$${++count}`;
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            callback(null, result.rows);
        });
    }

    deleteObj(id, table, params, callback) {
        params = params || {};
        let count = 0;
        let query = `update ${table} set deleted_at = now()  where ${table}.id=$${++count}`;
        const values = [id];
        let clause_str = "";

        for (let i in params.clause) {
            values.push(params.clause[i]);
            clause_str += ` and ${table}.${i}=$${++count}`;
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, !!result.rows[0]);
        });
    }

    deleteAllObj(table, params, callback) {
        params = params || {};
        let count = 0;
        let query = `update ${table} set deleted_at = now() where`;
        const values = [];
        let clause_str = "";

        for (const i in params.clause) {
            values.push(params.clause[i]);

            if (count == 0) {
                clause_str += ` ${table}.${i}=$${++count}`;
            } else {
                clause_str += ` and ${table}.${i}=$${++count}`;
            }
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, result.rows);
        });
    }


    realDeleteObj(id, table, params, callback) {
        params = params || {};
        let count = 0;
        let query = `delete from ${table} where ${table}.id=$${++count}`;
        const values = [id];
        let clause_str = "";

        for (const i in params.clause) {
            values.push(params.clause[i]);
            clause_str += ` and ${table}.${i}=$${++count}`;
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, !!result.rows[0]);
        });
    }

    realDeleteAll(table, params, callback) {
        params = params || {};
        let count = 0;
        let query = `delete from ${table} where 1=1`;
        const values = [];
        let clause_str = "";

        for (const i in params.clause) {
            values.push(params.clause[i]);
            clause_str += ` and ${table}.${i}=$${++count}`;
        }

        query += `${clause_str} RETURNING *`;

        super.exec(params.conn, query, values, (err, result) => {
            if(err)
                return callback(err);

            callback(null, !!result.rows[0]);
        });
    }

    changePassword(params, callback) {
        params = params || {};

        let query = null;
        if (params.typeUser == enumHelper.typeUser.company.value)
            query = `update ${params.table} set responsible_password = $1, password_token = null, token_expires = null`;
        else
            query = `update ${params.table} set password = $1, password_token = null, token_expires = null`;

        if (params.reset) {
            query += ` where ${params.table}.password_token=$2 and ${params.table}.token_expires >= now() RETURNING *`;
        }
        else {
            query += ` where ${params.table}.id=$2 RETURNING *`;
        }

        const values = [params.password, params.clauseValue];

        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            callback(null, result.rows[0]);
        });
    }

    resetPasswordToken(params, callback) {
        params = params || {};

        let query = `update ${params.table} set password_token = $1, token_expires = $2`;


        if (params.typeUser == enumHelper.typeUser.company.value)
            query += ` where ${params.table}.cnpj =$3  RETURNING *`;
        else
            query += ` where ${params.table}.email=$3  RETURNING *`;


        const values = [params.password_token, params.token_expires, params.userId];

        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            callback(null, result.rows[0]);
        });
    }

    uploadLoginData(params, callback) {
        params = params || {};

        let query = `update ${params.table} set last_login = $1`;

        if (params.typeUser == enumHelper.typeUser.consultant.value)
            query += ', stand_by=false';

        query += ` where ${params.table}.id = $2  RETURNING *`;

        const values = [new Date(), params.userId];

        super.exec(params.conn, query, values, (err, result) => {
            if (err || !result || result.rows.length <= 0)
                return callback(err || error.global.notFound);

            callback(null, result.rows[0]);
        });
    }

    getLastId(params, callback){
        params = params || {};
        let clause_str = "";
        let count = 0;
        let values = [];

        let query = `select ${(params.count ? `count(*)` : `max(id)`)} as value from  ${params.table}`;

        for (const i in params.clause) {
            values.push(params.clause[i]);
            clause_str += clause_str ? ` and ${params.table}.${i}=$${++count}` : ` where ${params.table}.${i}=$${++count}`;
        }

        if(clause_str)
            query += clause_str;

        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            let r = 0;
            if(result && result.rows && result.rows.length > 0)
                r = Number(result.rows[0].value);

            callback(null,  ++r);
        });

    }

    getGenericLovList(params, callback) {
        if (!params.query)
            return callback(error.global.general);

        const genericModel = require(`./genericLov`);

        const values = [];
        let query = params.query;
        let count = 0;

        for (const filter in params.filters) {
            if (query.indexOf(`{{${filter}}}`) >= 0) {
                query = query.replace(`{{${filter}}}`, `$${++count}`);
                values.push(params.filters[filter]);
            }
        }

        if (query.indexOf(`{{`) >= 0)
            return callback("filtro não informado");

        super.exec(params.conn, query, values, (err, result) => {
            if (err)
                return callback(err);

            const collection = [];
            _.each(result.rows, r => {
                const item = new genericModel(r);
                collection.push(item);
            });

            callback(null, {rows: collection});
        });
    }
}

module.exports = Dao;

