"use strict";

const helper = require("./helper");

class ApiRequest
{
    constructor(protocol) {
        this.protocol = protocol ? require(protocol) : require('http');
    }

    Call(body, call_params, callback) {


        var options = {
            host: call_params.host,
            port: call_params.port,
            path: call_params.path,
            method: call_params.method,
            headers: call_params.headers
        };
        try {
            var request = this.protocol.request(options, function (response) {
                var body = "";
                response.on('data', function (data) {
                    body += data;
                });
                response.on('end', function () {
                    if (helper.IsJsonString(body)) {
                        body = JSON.parse(body);

                        if (body.error) {
                            return callback(body.error, null);
                        }

                        return callback(null, body);
                    }

                    return callback(body)
                });
            });
            request.write(JSON.stringify(body));
            request.on('error', function (err) {
                callback(err);
            });
            request.end();
        }
        catch (err) {
            callback(err);
        }
    }
}

module.exports = ApiRequest;