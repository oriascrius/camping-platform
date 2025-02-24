import crypto from "crypto";
import axios from "axios";

// ✅ 讀取環境變數
const LINEPAY_CHANNEL_ID = process.env.LINEPAY_CHANNEL_ID;
const LINEPAY_CHANNEL_SECRET = process.env.LINEPAY_CHANNEL_SECRET;
const LINEPAY_API_URL = process.env.LINEPAY_API_URL;
const PRODUCT_LINEPAY_RETURN_HOST = process.env.PRODUCT_LINEPAY_RETURN_HOST;
const PRODUCT_LINEPAY_RETURN_CONFIRM_URL =
  process.env.PRODUCT_LINEPAY_RETURN_CONFIRM_URL;
const PRODUCT_LINEPAY_RETURN_CANCEL_URL =
  process.env.PRODUCT_LINEPAY_RETURN_CANCEL_URL;

/**
 * ✅ 產生 LINE Pay API 簽名 (HMAC SHA256)
 * @param {string} url - API 端點
 * @param {object} body - 請求內容
 * @returns {object} 包含所需標頭
 */
function createLinePayHeaders(url, body) {
  const nonce = Date.now().toString();
  const signature = crypto
    .createHmac("SHA256", LINEPAY_CHANNEL_SECRET)
    .update(LINEPAY_CHANNEL_SECRET + url + JSON.stringify(body) + nonce)
    .digest("base64");

  return {
    "Content-Type": "application/json",
    "X-LINE-ChannelId": LINEPAY_CHANNEL_ID,
    "X-LINE-Authorization-Nonce": nonce,
    "X-LINE-Authorization": signature,
  };
}

/**
 * ✅ 建立 LINE Pay 付款請求
 * @param {object} orderData - 訂單資訊
 * @returns {object} 包含付款連結的回應
 */
export async function createLinePayRequest(orderData) {
  const url = "/v3/payments/request";
  const requestUrl = `${LINEPAY_API_URL}${url}`;

  // ✅ 組裝請求內容
  const body = {
    amount: parseInt(orderData.amount),
    currency: "TWD",
    orderId: orderData.orderId,
    packages: orderData.packages,
    redirectUrls: {
      confirmUrl: `${PRODUCT_LINEPAY_RETURN_HOST}${PRODUCT_LINEPAY_RETURN_CONFIRM_URL}?orderId=${orderData.orderId}`,
      cancelUrl: `${PRODUCT_LINEPAY_RETURN_HOST}${PRODUCT_LINEPAY_RETURN_CANCEL_URL}`,
    },
  };

  try {
    console.log("📦 LINE Pay 請求內容:", JSON.stringify(body, null, 2));

    // ✅ 取得標頭
    const headers = createLinePayHeaders(url, body);

    // ✅ 發送 LINE Pay 付款請求
    const response = await axios.post(requestUrl, body, { headers });

    console.log("✅ LINE Pay API 回應:", response.data);

    if (response.data.returnCode !== "0000") {
      throw new Error(`❌ LINE Pay API 錯誤: ${response.data.returnMessage}`);
    }

    return {
      success: true,
      paymentUrl: response.data.info.paymentUrl.web,
      transactionId: response.data.info.transactionId,
    };
  } catch (error) {
    console.error("❌ LINE Pay 付款請求失敗:", error);
    throw error;
  }
}

/**
 * ✅ 確認 LINE Pay 付款
 * @param {string} transactionId - LINE Pay 交易編號
 * @param {number} amount - 付款金額
 * @returns {object} LINE Pay API 回應結果
 */
export async function confirmLinePayPayment(transactionId, amount) {
  const url = `/v3/payments/${transactionId}/confirm`;
  const requestUrl = `${LINEPAY_API_URL}${url}`;

  const body = {
    amount: parseInt(amount),
    currency: "TWD",
  };

  try {
    console.log("📦 LINE Pay 付款確認內容:", JSON.stringify(body, null, 2));

    const headers = createLinePayHeaders(url, body);

    const response = await axios.post(requestUrl, body, { headers });

    console.log("✅ LINE Pay 確認回應:", response.data);

    if (response.data.returnCode !== "0000") {
      throw new Error(`❌ LINE Pay 確認失敗: ${response.data.returnMessage}`);
    }

    return response.data;
  } catch (error) {
    console.error("❌ LINE Pay 確認請求失敗:", error);
    throw error;
  }
}
