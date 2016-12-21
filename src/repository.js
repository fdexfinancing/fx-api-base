'use strict';

class Repository {
    constructor(db) {
        this.db = db;
    }

    connect(callback) {
        this.db.transactional((err, conn) => {
            return callback(err, conn);
        });
    }

    commit(conn, callback) {
        this.db.commit(conn, (err, result) => {
            return callback(err, result);
        });
    }

    rollback(conn, err, callback) {
        this.db.rollback(conn, err, e => {});
    }
}

module.exports = Repository;
