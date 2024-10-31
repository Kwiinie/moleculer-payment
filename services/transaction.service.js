"use strict";
import DbService from "moleculer-db";
import MongoAdapter from "moleculer-db-adapter-mongo";
import { ObjectId } from "mongodb";
import ZalopayService from "./zalopay.service.js";

const TransactionService = {
    name: "transaction",
    mixins: [DbService],
    adapter: new MongoAdapter(process.env.MONGODB_URL),
    collection: "transactions",

    settings: {
        fields: ["_id", "transactionId", "amount", "paymentMethod", "orderInfo", "paymentDate", "isSuccess"],
        entityValidator: {
            _id: { type: "string", objectId: true, optional: true },
            transactionId: { type: "string", optional: true },
            amount: { type: "number", positive: true, integer: true, required: true },
            paymentMethod: { type: "enum", values: ["momo", "zalopay"], required: true },
            orderInfo: { type: "string", required: true },
            paymentDate: { type: "date", optional: true },
            isSuccess: { type: "boolean", required: true },
            return_message: { type: "string", optional: true },
        },
    },

    actions: {
        async createTransaction(ctx) {
            const { amount, paymentMethod } = ctx.params;
            console.log("dsfasdfa", typeof (amount), typeof (paymentMethod));
            const data = {
                amount: parseInt(amount),
                paymentMethod,
                transactionId: null,
                orderInfo: `Payment for order ${new ObjectId()}`,
                paymentDate: new Date(),
                isSuccess: false,
            };

            console.log("data", data);

            if (paymentMethod === "zalopay") {
                try {
                    const res = await ctx.call("zalopay.createPaymentRequest", { amount: data.amount, orderInfo: data.orderInfo });
                    data.transactionId = res.order.app_trans_id;
                    this.adapter.insert(data);
                    return res;
                } catch (error) {
                    this.logger.error("Failed to create ZaloPay transaction:", error);
                    throw error;
                }
            }
            else if (paymentMethod === "momo") {
                try {
                    const res = await ctx.call("momo.createPaymentRequest", { amount: data.amount, orderInfo: data.orderInfo });
                    data.transactionId = res.orderId;
                    this.adapter.insert(data);
                    return res;
                } catch (error) {
                    this.logger.error("Failed to create MoMo transaction:", error);
                    throw error;
                }
            }
            else {
                throw new Error("Invalid payment method");
            }
        },

        async updateStatus(ctx) {
            const { transactionId, isSuccess, return_message } = ctx.params;
            return this.adapter.updateMany({ transactionId: transactionId }, { $set: { isSuccess, return_message } });
        },

    },
};

export default TransactionService;
