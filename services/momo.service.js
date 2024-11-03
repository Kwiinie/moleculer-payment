import crypto from 'crypto';
import axios from 'axios';
import getTransactionState from '../utils/transaction-state.util.js';


const MomoService = {
    name: "momo",
    settings: {
        accessKey: process.env.MOMO_ACCESSKEY,
        secretKey: process.env.MOMO_SECRETKEY,
        redirectUrl: process.env.MOMO_REDIRECT_URL,
        ipnUrl: process.env.MOMO_IPN_URL
    },
    actions: {
        createPaymentRequest: {
            params: {
                amount: { type: "number", positive: true, integer: true, required: true },
                orderInfo: { type: "string", required: true }
            },
            async handler(ctx) {
                const { amount, orderInfo } = ctx.params;
                try {
                    const { accessKey, secretKey, redirectUrl, ipnUrl } = this.settings;
                    var partnerCode = 'MOMO';
                    var orderId = partnerCode + new Date().getTime();
                    var extraData = '';
                    var requestId = orderId;
                    var requestType = "payWithMethod";
                    var lang = "vi";
                    var autoCapture = true;
                    var orderGroupId = '';

                    //before sign HMAC SHA256 with format
                    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
                    var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
                    //puts raw signature
                    console.log("--------------------RAW SIGNATURE----------------")
                    console.log(rawSignature)
                    //signature
                    var signature = crypto.createHmac('sha256', secretKey)
                        .update(rawSignature)
                        .digest('hex');
                    console.log("--------------------SIGNATURE----------------")
                    console.log(signature)

                    const requestBody = JSON.stringify({
                        partnerCode: partnerCode,
                        partnerName: "Test",
                        storeId: "MomoTestStore",
                        requestId: requestId,
                        amount: amount,
                        orderId: orderId,
                        orderInfo: orderInfo,
                        redirectUrl: redirectUrl,
                        ipnUrl: ipnUrl,
                        lang: lang,
                        requestType: requestType,
                        autoCapture: autoCapture,
                        extraData: extraData,
                        orderGroupId: orderGroupId,
                        signature: signature
                    });

                    const options = {
                        method: 'POST',
                        url: 'https://test-payment.momo.vn/v2/gateway/api/create',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        data: requestBody
                    };
                    let result;
                    try {
                        result = await axios(options);
                        console.log(result.data);
                        return result.data;
                    } catch (error) {
                        console.error("Error while making request to Momo API:", error);
                    }
                } catch (error) {
                    this.logger.error("Error while creating payment request to momo:", error);
                    throw error;
                }
            }
        },
        callback: {
            rest: "POST /callback",
            params: {
            },
            async handler(ctx) {
                console.log("callback:");
                console.log(ctx.params);
                console.log("orderId =", ctx.params.orderId);
                const result = await ctx.call("momo.queryPayment", { id: ctx.params.orderId });
                const transactionState = getTransactionState("momo", result.resultCode);
                console.log("trang thai ne:", transactionState);
                console.log("result ne:", result);
                ctx.call("transaction.updateTransaction", { transactionId: ctx.params.orderId, transactionStatus: transactionState, returnMessage: ctx.params.message, responseCode: ctx.params.resultCode, paymentDate: new Date() });
            }
        },
        queryPayment: {
            rest: "POST /payment/:id",
            params: {
                id: { type: "string", objectId: true, required: true },
            },
            async handler(ctx) {
                const orderId = ctx.params.id;
                console.log("aaaaaaa", ctx.params.id);
                console.log("sadfasd", orderId, typeof (orderId));
                const { accessKey, secretKey } = this.settings;
                var partnerCode = 'MOMO';
                var lang = 'vi';
                var requestId = orderId;

                var rawSignature = "accessKey=" + accessKey + "&orderId=" + orderId + "&partnerCode=" + partnerCode + "&requestId=" + requestId;
                console.log(rawSignature);
                var signature = crypto.createHmac('sha256', secretKey)
                    .update(rawSignature)
                    .digest('hex');

                const requestBody = JSON.stringify({
                    partnerCode: partnerCode,
                    requestId: requestId,
                    orderId: orderId,
                    signature: signature,
                    lang: lang
                })

                console.log(requestBody);

                const options = {
                    method: 'POST',
                    url: 'https://test-payment.momo.vn/v2/gateway/api/query',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: requestBody
                };


                let result = await axios(options);

                return result.data;
            }
        },
    }
}

export default MomoService