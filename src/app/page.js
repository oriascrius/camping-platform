export default function Home() {
    return (
      <div className="space-y-12">
        {/* 英雄區塊 */}
        <section className="text-center py-16 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            探索台灣最美的露營勝地
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            找到完美的露營地點，創造難忘的戶外體驗
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700">
            立即探索
          </button>
        </section>
  
        {/* 特色區塊 */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">營地搜尋</h3>
            <p className="text-gray-600">
              提供完整的營地資訊，輕鬆找到理想的露營地點
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">即時預訂</h3>
            <p className="text-gray-600">
              線上預訂系統，簡單快速完成營地預約
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">經驗分享</h3>
            <p className="text-gray-600">
              豐富的社群評價與露營攻略分享
            </p>
          </div>
        </section>
  
        {/* 熱門營地區塊 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">熱門營地推薦</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 這裡可以後續加入營地卡片組件 */}
          </div>
        </section>
      </div>
    )
  }