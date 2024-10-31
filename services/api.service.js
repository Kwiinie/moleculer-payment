"use strict";

import ApiGateway from "moleculer-web";

const ApiService = {
    name: "api",
    mixins: [ApiGateway],
    settings: {
        port: process.env.PORT,
        routes: [
            {
                path: "/api",
                whitelist: ["**"],
                aliases: {
                    "POST transactions": "transaction.createTransaction",
                    "GET transactions": "transaction.list",
                    "GET transactions/:id": "transaction.get",

                    "POST zalopay/callback": "zalopay.callback",
                    "POST zalopay/payment/:id": "zalopay.queryPayment",

                    "POST momo/callback": "momo.callback",
                    "POST momo/payment/:id": "momo.queryPayment",
                },
            },
        ],
    },
};

export default ApiService;
