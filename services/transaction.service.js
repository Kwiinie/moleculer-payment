"use strict";
import { ObjectId } from "mongodb";
import dbMixin from "../mixins/db.mixin.js";


const TransactionService = {
    name: "transaction",
    mixins: dbMixin("transactions"),
    collection: "transactions",

    settings: {
        fields: ["transactionId", "amount", "paymentMethod", "orderInfo", "paymentDate", "isSuccess", "createdAt", "updatedAt"],
        entityValidator: {
            transactionId: { type: "string", optional: true },
            amount: { type: "number", positive: true, integer: true, required: true },
            paymentMethod: { type: "enum", values: ["momo", "zalopay"], required: true },
            transactionStatus: { type: "enum", values: ["PENDING", "SUCCESS", "FAILED", "CANCELED", "UNKNOWN"], required: true },
            orderInfo: { type: "string", optional: true },
            paymentDate: { type: "date", optional: true },
            returnMessage: { type: "string", optional: true },
            responseCode: { type: "number", optional: true },
        },
    },

    actions: {
        create: {
            rest: "POST ",
            params: {
                amount: { type: "number", positive: true, integer: true, required: true },
                paymentMethod: { type: "enum", values: ["momo", "zalopay"], required: true },
            },
            async handler(ctx) {
                const { amount, paymentMethod } = ctx.params;
                const data = {
                    amount: parseInt(amount),
                    paymentMethod,
                    transactionId: null,
                    orderInfo: `Payment for order ${new ObjectId()}`,
                    transactionStatus: "PENDING",
                    createdAt: ctx.params.createdAt,
                    updatedAt: ctx.params.updatedAt,
                };

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
        },

        updateTransaction: {
            params: {
                transactionId: { type: "string", required: true },
                transactionStatus: { type: "enum", values: ["PENDING", "SUCCESS", "FAILED", "CANCELED", "REFUND", "UNKNOWN"], required: true },
                returnMessage: { type: "string", required: true },
                responseCode: { type: "number", required: true },
                paymentDate: { type: "date", optional: true },
            },
            async handler(ctx) {
                const { transactionId, transactionStatus, returnMessage, responseCode, paymentDate } = ctx.params;
                return this.adapter.updateMany({ transactionId: transactionId }, { $set: { transactionStatus, returnMessage, responseCode, updatedAt: new Date(), paymentDate } });
            },
        },
    },
};


export default TransactionService;
