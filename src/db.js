"use strict";

const pg = require('pg');
pg.defaults.poolSize = 20;

class db {
    constructor(_dbconfig){
        this.url = !dbconfig.user || !dbconfig.password ? `pg://${dbconfig.host}/${dbconfig.database}${dbconfig.options}` : `pg://${dbconfig.user}:${dbconfig.password}@${dbconfig.host}/${dbconfig.database}${dbconfig.options}`;
    }

    transactional(callback) {
        pg.connect(this.url, (err, conn, done) => {
            conn.done = done;
            if (err) {
                return rollback(conn, err, callback);
            }
            conn.query('BEGIN', err => {
                if (err) {
                    return rollback(conn, err, callback);
                }
                callback(null, conn);
            });
        });
    }

    commit(conn, callback) {
        conn.query('COMMIT', (err, result) => {
            if (conn.done)
                conn.done();
            callback(err, result);
        });
    }

    execTransactional(instructions, callback) {
        pg.connect(this.url, (err, conn, done) => {
            conn.done = done;
            if (err)
                return rollback(conn, err, callback);

            conn.query('BEGIN', err => {
                if (err) {
                    return rollback(conn, err, callback);
                }
                process.nextTick(() => {
                    let erro = null;
                    let control = 0;
                    _.each(instructions, i => {
                        conn.query(i.text, i.values, (err, r) => {
                            control++;
                            if (err) {
                                erro = erro || err;
                                i.error = err;
                            } else {
                                i.result = r;
                            }

                            if (control == instructions.length) {
                                if (erro) {
                                    return rollback(conn, erro, callback);
                                }

                                conn.query('COMMIT', (err, result) => {
                                    done();
                                    callback(err, instructions);
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    exec(conn, text, values, callback) {

        if (conn)
            conn.query(text, values, (err, result) => {
                return callback(err, result);
            });
        else
            pg.connect(this.url, (err, conn, done) => {
                if (err) {
                    done();
                    return callback(err);
                } else {
                    conn.query(text, values, (err, result) => {
                        done();
                        if (err)
                            return callback(err);
                        return callback(err, result);
                    });
                }
            });
    }

    rollback(conn, err, callback) {
        if (conn)
            return rollback(conn, err, callback);
        else
            pg.connect(this.url, (err, conn, done) => {
                conn.done = done;
                return rollback(conn, err, callback);
            });
    }
}

const rollback = (conn, err, callback) => {
    conn.query('ROLLBACK', e => {
        if(e)
            console.log("Erro ao fazer rollback");
        if(conn.done)
            conn.done();
        return callback(e);
    });
};

module.exports = db;

