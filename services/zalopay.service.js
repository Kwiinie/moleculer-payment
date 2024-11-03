"use strict";
import axios from "axios";
import CryptoJS from "crypto-js";
import moment from "moment";
import qs from "qs";
import getTransactionState from "../utils/transaction-state.util.js";

const ZalopayService = {
    name: "zalopay",
    settings: {
        app_id: process.env.ZALOPAY_APP_ID,
        key1: process.env.ZALOPAY_KEY1,
        key2: process.env.ZALOPAY_KEY2,
        endpoint: process.env.ZALOPAY_ENDPOINT,
        query: process.env.ZALOPAY_ENDPOINT_QUERY,
        callbackUrl: process.env.ZALOPAY_CALLBACK_URL
    },
    actions: {
        createPaymentRequest: {
            params: {
                amount: { type: "number", positive: true, integer: true, required: true },
                orderInfo: { type: "string", required: true }
            },
            async handler(ctx) {
                const { amount, orderInfo } = ctx.params;
                console.log("aaaaaa", typeof (amount), typeof (orderInfo));
                try {
                    const { app_id, key1, key2, endpoint, callbackUrl } = this.settings;
                    const embed_data = {};
                    const items = [];
                    const transID = Math.floor(Math.random() * 1000000);
                    const order = {
                        app_id: parseInt(app_id),
                        app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
                        app_user: "user123",
                        app_time: Date.now(), // miliseconds
                        item: JSON.stringify(items),
                        embed_data: JSON.stringify(embed_data),
                        amount: amount,
                        description: orderInfo,
                        bank_code: "zalopayapp",
                        callback_url: callbackUrl
                    }
                    console.log("order", order);
                    const data = order.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
                    order.mac = CryptoJS.HmacSHA256(data, key1).toString();

                    const response = await axios.post(endpoint, null, { params: order });
                    return {
                        order: order,
                        response: response.data
                    };
                } catch (error) {
                    this.logger.error("Error while creating payment request to ZaloPay:", error);
                    throw error;
                }
            }
        },
        callback: {
            rest: "POST /callback",
            params: {
                data: { type: "string", required: true },
                mac: { type: "string", required: true }
            },
            async handler(ctx) {
                let result = {};

                try {
                    const dataStr = ctx.params.data;
                    const reqMac = ctx.params.mac;

                    const mac = CryptoJS.HmacSHA256(dataStr, this.settings.key2).toString();
                    console.log("mac =", mac);


                    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
                    if (reqMac !== mac) {
                        // callback không hợp lệ
                        result.return_code = -1;
                        result.return_message = "mac not equal";
                    }
                    else {
                        // thanh toán thành công
                        // merchant cập nhật trạng thái cho đơn hàng
                        const dataJson = JSON.parse(dataStr, this.settings.key2);
                        console.log("update order's status = success where app_trans_id =", dataJson["app_trans_id"]);

                        result.return_code = 1;
                        result.return_message = "success";
                        const transactionState = getTransactionState("zalopay", result.return_code);
                        console.log(result);
                        console.log("trang thai:", transactionState);

                        ctx.call("transaction.updateTransaction", { transactionId: dataJson["app_trans_id"], transactionStatus: transactionState, returnMessage: result.return_message, responseCode: result.return_code, paymentDate: new Date() });

                    }
                } catch (ex) {
                    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
                    result.return_message = ex.message;

                    const query = await ctx.call("zalopay.queryPayment", { id: dataJson["app_trans_id"] });
                    const transactionState = getTransactionState("zalopay", query.return_code);
                    console.log("query zalopay:", query);
                    console.log("trang thai:", transactionState);
                    ctx.call("transaction.updateTransaction", { transactionId: dataJson["app_trans_id"], transactionStatus: transactionState, returnMessage: query.return_message, responseCode: query.return_code, paymentDate: new Date() });
                }

                // thông báo kết quả cho ZaloPay server
                return result;
            }
        },

        queryPayment: {
            rest: "POST /payment/:id",
            params: {
                id: { type: "string", objectId: true, required: true },
            },
            async handler(ctx) {
                try {
                    const { app_id, key1, query } = this.settings;
                    const app_trans_id = ctx.params.id;
                    const postData = {
                        app_id: parseInt(app_id),
                        app_trans_id,
                    };
                    const data = `${postData.app_id}|${postData.app_trans_id}|${key1}`;
                    postData.mac = CryptoJS.HmacSHA256(data, key1).toString();

                    const response = await axios.post(query, qs.stringify(postData), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    return response.data;
                } catch (error) {
                    this.logger.error("Error while getting payment status from ZaloPay:", error);
                    throw error;
                }
            }
        },
    }
}

export default ZalopayService;