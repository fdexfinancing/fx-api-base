"use strict";

const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const jwtSecret = require("./config.json").jwtSecret;

class auth {

    verifyPassword(password, hash, callback) {

        const shasum = crypto.createHash('sha256');
        const digest = shasum.update(password).digest('hex');

        bcrypt.compare(digest, hash, (err, isMatch) => {
            if (err) return callback(err);
            callback(null, isMatch);
        });
    }

    generateRandomToken(callback) {
        crypto.randomBytes(20, (err, buf) => {
            if(err)
                return callback(err);

            const token = buf.toString('hex');
            callback(null, token);
        });
    }

    generatePasswordHash(password, callback) {

        bcrypt.genSalt(5, (err, salt) => {
            if (err) return callback(err);

            const shasum = crypto.createHash('sha256');
            const digest = shasum.update(password).digest('hex');

            bcrypt.hash(digest, salt, null, (err, hash) => {
                if (err) return callback(err);
                callback(null, hash);
            });
        });
    }

    generateToken(object, audience) {

        return jwt.sign({
            id: object.id,
            name: object.name,
            email: object.email
        }, jwtSecret, {
            expiresIn: 60*60*24*30, // 30 dias
            audience
        });
    }

    getRefreshToken(oldToken, callback) {

        try {

            // verify a token
            jwt.verify(oldToken, jwtSecret, (err, profile) => {

                if (err && err.name == 'TokenExpiredError') {
                    profile = jwt.decode(oldToken);
                }

                if (!profile) {
                    return callback('invalid token');
                }

                const refreshed_token = jwt.sign({
                    id: profile.id,
                    email: profile.email,
                    name: profile.name
                }, jwtSecret, {
                    expiresIn: 60 * 60 * 24 * 30,
                    audience: profile.aud
                });

                callback(null, refreshed_token);
            });
        }
        catch(err) {
            callback(err);
        }
    }
}

module.exports = db;

