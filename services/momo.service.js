import crypto from 'crypto';
import axios from 'axios';
import { request } from 'http';


const MomoService = {
    name: "momo",
    settings: {
        accessKey: process.env.MOMO_ACCESSKEY,
        secretKey: process.env.MOMO_SECRETKEY,
        redirectUrl: process.env.MOMO_REDIRECT_URL,
        ipnUrl: process.env.MOMO_IPN_URL
    },
    actions: {
        async createPaymentRequest(ctx) {
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
        },

        async callback(ctx) {
            console.log("callback:");
            console.log(ctx.params);
                console.log("orderId =", ctx.params.orderId);
            if (ctx.params && ctx.params.resultCode === 0) {
                ctx.call("transaction.updateStatus", {
                    transactionId: ctx.params.orderId,
                    isSuccess: true,
                    return_message: ctx.params.message
                });
            } else {
                const result = await ctx.call("momo.queryPayment", { id: ctx.params.orderId });
                console.log("querying ...");
                if (result && result.resultCode === 0) {
                    ctx.call("transaction.updateStatus", {
                        transactionId: result.orderId,
                        isSuccess: true,
                        return_message: result.message
                    })
                }
                else {
                    ctx.call("transaction.updateStatus", {
                        transactionId: ctx.params.orderId,
                        isSuccess: false,
                        return_message: result.message
                    })
                }
            }
            return ctx.params
        },

        async queryPayment(ctx) {
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
    }
}

export default MomoService