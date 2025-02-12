import { NextResponse } from "next/server";

// db連線
import db from "@/lib/db";
// 導入當前session抓取使用者
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    // 使用 NextAuth 獲取當前登入的使用者
    const session = await getServerSession(authOptions);
    // console.log("⚡ API 取得 session:", session);

    // 若未登入，返回 401 未授權
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 獲取當前登入使用者的 ID
    const userId = session.user.id;

    const body = await request.json();

    // 1. 從 body 取出需要的欄位
    const {
      cartItems,
      deliveryMethod,
      paymentMethod,
      customerInfo,
      totalAmount,
    } = body;

    // 2. 連接資料庫, 寫入 product_orders / product_order_details

    // 2-1. 先把「訂單主檔」插入 product_orders
    const [orderResult] = await db.execute(
      `
        INSERT INTO product_orders (
          member_id,
          recipient_name,
          recipient_phone,
          recipient_email,
          shipping_address,
          delivery_method,
          payment_method,
          note,
          total_amount,
          created_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        // 依序對應上方 INSERT INTO 的欄位
        userId, // 或 0 / NULL，依你的欄位是否允許
        customerInfo.name,
        customerInfo.phone,
        customerInfo.email,
        customerInfo.address,
        deliveryMethod,
        paymentMethod,
        customerInfo.note,
        totalAmount, // 不再拆分運費或小計，直接存整筆訂單金額
      ]
    );

    // 取得新產生的 order_id
    const newOrderId = orderResult.insertId;

    //2-3 把「訂單明細」插入 product_order_details
    for (const cartItem of cartItems) {
      const [orderDetailResult] = await db.execute(
        `
          INSERT INTO product_order_details (
            order_id,
            product_id,
            quantity,
            price,
            created_at
          ) 
          VALUES (?, ?, ?, ?, NOW())
        `,
        [
          newOrderId, // 或 0 / NULL，依你的欄位是否允許
          cartItem.product_id,
          cartItem.quantity,
          cartItem.product_price,
        ]
      );
      //2-4 扣除相應的商品庫存
      await db.execute(`UPDATE products SET stock = stock - ? WHERE id = ?`, [
        cartItem.quantity,
        cartItem.product_id,
      ]);
    }

    // 2-5 清空當前使用者的購物車
    await db.execute(`DELETE FROM product_cart_items WHERE user_id = ?`, [
      userId,
    ]);

    // 3. 回傳成功訊息以及最新orderId
    return NextResponse.json({
      success: true,
      message: "Order created",
      orderId: newOrderId,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}

// 呼叫接收此API的函式
// const handleSubmitOrder = async (e) => {
//     e.preventDefault(); // 阻止表單預設行為 (避免頁面刷新或跳轉)

//     // 組合要送出的資料
//     const payload = {
//       cartItems: cart, // 購物車明細
//       deliveryMethod, // 配送方式
//       paymentMethod, // 付款方式
//       customerInfo, // 顧客表單資訊
//       subtotal, // 商品小計
//     };

//     try {
//       // 呼叫後端 API: POST /api/orders
//       const res = await fetch("/api/orders", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         // 如果響應狀態不是 2xx，視為失敗
//         throw new Error("下單失敗，請稍後再試");
//       }

//       // 若成功，導向「訂單確認」頁面
//       router.push("/product-cart/order-confirmation");
//     } catch (error) {
//       // 顯示錯誤訊息或做其他錯誤處理
//       alert(error.message);
//     }
//   };
