import { useState, useRef, useEffect } from "react";
import { popupCenter } from "./popup-window"; // 你可能已經有這個工具

export function useShip711StoreOpener(serverCallbackUrl = "") {
  const newWindow = useRef(null);
  const [store711, setStore711] = useState({
    storeid: "",
    storename: "",
    storeaddress: "",
  });

  useEffect(() => {
    // 監聽 `message` 事件來接收 `7-11` API 回傳的資料
    const handleMessage = (event) => {
      //   console.log("📩 7-11 門市回傳資料:", event);

      // 確保來自 7-11 API 的資料安全
      if (event.origin !== "http://localhost:3000") return;

      try {
        const storeData = event.data;
        if (storeData && storeData.storeid) {
          //   console.log("✅ 更新選擇的門市:", storeData);
          setStore711(storeData); // 更新 React 狀態，確保 UI 正確渲染
        }
      } catch (error) {
        console.error("❌ 解析 7-11 門市回傳資料錯誤:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 開啟 7-11 選擇視窗
  const openWindow = () => {
    if (!serverCallbackUrl) {
      console.error("錯誤: 需要設定 Callback API URL");
      return;
    }

    newWindow.current = popupCenter(
      `https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=${serverCallbackUrl}`,
      "7-11 門市選擇",
      950,
      680
    );
  };

  return {
    store711,
    openWindow,
  };
}
