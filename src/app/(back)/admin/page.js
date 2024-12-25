export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理後台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 統計卡片 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">總訂單數</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        {/* 可以添加更多統計卡片 */}
      </div>
    </div>
  );
} 