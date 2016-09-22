'use strict';
let error = {};

error.statusCode = {
    invalidParams: 400,
    authorizationErr: 401,
    notFoundErr: 404,
    serverErr: 412,
    generalErr: 500
};

error.global = {
    general: {statusCode: error.statusCode.generalErr, code: "GLO-00001", message: 'global.general'},
    notFound: {statusCode: error.statusCode.notFoundErr, code: "GLO-00002", message: 'global.notFound'},
    notUpdated: {statusCode: error.statusCode.serverErr, code: "GLO-00003", message: 'global.notUpdated'},
    noTypeUser: {statusCode: error.statusCode.serverErr, code: "GLO-00004", message: 'global.noTypeUser'}
};

module.exports = error;