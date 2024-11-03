"use strict";

import ApiGateway from "moleculer-web";

const ApiService = {
    name: "api",
    mixins: [ApiGateway],
    settings: {
        port: process.env.PORT,
        ip: "0.0.0.0",
        routes: [
            {
                path: "/api",

                whitelist: [
                    "**"
                ],

                // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
                mergeParams: true,

                // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
                authentication: false,

                // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
                authorization: false,

                // The auto-alias feature allows you to declare your route alias directly in your services.
                // The gateway will dynamically build the full routes from service schema.
                autoAliases: true,

                aliases: {

                },

                /**
                 * Before call hook. You can check the request.
                 * @param {Context} ctx
                 * @param {Object} route
                 * @param {IncomingRequest} req
                 * @param {ServerResponse} res
                 * @param {Object} data
                 *
                onBeforeCall(ctx, route, req, res) {
                    // Set request headers to context meta
                    ctx.meta.userAgent = req.headers["user-agent"];
                }, */

                /**
                 * After call hook. You can modify the data.
                 * @param {Context} ctx
                 * @param {Object} route
                 * @param {IncomingRequest} req
                 * @param {ServerResponse} res
                 * @param {Object} data
                onAfterCall(ctx, route, req, res, data) {
                    // Async function which return with Promise
                    return doSomething(ctx, res, data);
                }, */

                // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
                callOptions: {},

                bodyParsers: {
                    json: {
                        strict: true,
                        limit: "1MB"
                    },
                    urlencoded: {
                        extended: true,
                        limit: "1MB"
                    }
                },

                // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
                mappingPolicy: "all", // Available values: "all", "restrict"

                // Enable/disable logging
                logging: true
            }
        ],

        // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
        log4XXResponses: false,
        // Logging the request parameters. Set to any log level to enable it. E.g. "info"
        logRequestParams: true,
        // Logging the response data. Set to any log level to enable it. E.g. "info"
        logResponseData: true,

    },
};

export default ApiService;
