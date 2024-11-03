

const zalopayResponseCode = {
    "SUCCESS": [1],
    "FAILED": [2],
    "PENDING": [3],
}

const momoResponseCode = {
    "SUCCESS": [0],
    "FAILED": [10, 11, 12, 13, 20, 21, 22, 40, 41, 42, 43, 45, 47],
    "CANCELED": [98, 99, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 1080, 1081, 1088, 2019, 4001, 4100],
    "PENDING": [1000, 7000, 7002, 9000],
}

export default function getTransactionState(paymentMethod, responseCode) {
    if (paymentMethod === "zalopay") {
        return Object.keys(zalopayResponseCode).find(key => zalopayResponseCode[key].includes(responseCode)) || "UNKNOWN";
    }
    else if (paymentMethod === "momo") {
        return Object.keys(momoResponseCode).find(key => momoResponseCode[key].includes(responseCode)) || "UNKNOWN";
    }
}
