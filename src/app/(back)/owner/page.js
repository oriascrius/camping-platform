'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardCheck,
  HiOutlineShoppingCart,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineGlobe
} from 'react-icons/hi';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart,
  Area
} from 'recharts';
import Swal from 'sweetalert2';

// 莫蘭迪色系
const colors = {
  sage: { bg: '#E3E7E3', text: '#4A5D4F' },
  rose: { bg: '#F2E6E6', text: '#9E7676' },
  sky: { bg: '#E6EEF2', text: '#6B8E9E' },
  sand: { bg: '#F2EEE6', text: '#9E8E6B' },
  lavender: { bg: '#E9E6F2', text: '#7B6B9E' },
  mint: { bg: '#E6F2EC', text: '#6B9E8E' },
  peach: { bg: '#F8E6DC', text: '#B67F6B' },
  olive: { bg: '#E6EDE4', text: '#6B8C5E' }
};

// 數字增長動畫組件
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 動畫持續時間（毫秒）
    const steps = 60; // 動畫步驟數
    const stepDuration = duration / steps;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setDisplayValue(Math.min(Math.floor(increment * currentStep), value));
      if (currentStep >= steps) clearInterval(timer);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return displayValue.toLocaleString();
};

// 統計卡片組件
const StatCard = ({ icon: Icon, title, value, unit, colorKey = 'sage', delay = 0 }) => {
  const color = colors[colorKey];
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: color.bg }}>
          <Icon className="w-5 h-5" style={{ color: color.text }} />
        </div>
        <span className="text-sm" style={{ color: color.text }}>{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold" style={{ color: color.text }}>
          <AnimatedNumber value={value} />
        </h3>
        <span className="text-xs opacity-70" style={{ color: color.text }}>{unit}</span>
      </div>
    </motion.div>
  );
};

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalActivities: 0,
    activeActivities: 0,
    pendingBookings: 0,
    monthlyRevenue: 0,
    revenueData: [],
    popularActivities: [],
    avgOrderValue: 0,
    completionRate: 0,
    customerSatisfaction: 0,
    topLocations: [],
    bookingTrends: [],
    categoryStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/owner/dashboard/stats');
      if (!response.ok) {
        throw new Error('獲取數據失敗');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('獲取儀表板數據失敗:', error);
      Swal.fire({
        title: '錯誤',
        text: '獲取數據失敗，請稍後再試',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]"
        />
      </div>
    );
  }

  return (
    <div className="p-6 mt-16 max-w-7xl mx-auto">
      <motion.h1 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold mb-6"
        style={{ color: colors.sage.text }}
      >
        數據中心
      </motion.h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          icon={HiOutlineShoppingCart}
          title="總訂單"
          value={stats.totalBookings}
          unit="筆"
          colorKey="sage"
          delay={0.1}
        />
        <StatCard
          icon={HiOutlineCurrencyDollar}
          title="總營收"
          value={stats.totalRevenue}
          unit="元"
          colorKey="rose"
          delay={0.2}
        />
        <StatCard
          icon={HiOutlineChartBar}
          title="本月營收"
          value={stats.monthlyRevenue}
          unit="元"
          colorKey="sky"
          delay={0.3}
        />
        <StatCard
          icon={HiOutlineClipboardCheck}
          title="待處理"
          value={stats.pendingBookings}
          unit="筆"
          colorKey="sand"
          delay={0.4}
        />
        <StatCard
          icon={HiOutlineCalendar}
          title="總活動"
          value={stats.totalActivities}
          unit="個"
          colorKey="lavender"
          delay={0.5}
        />
        <StatCard
          icon={HiOutlineUsers}
          title="進行中"
          value={stats.activeActivities}
          unit="個"
          colorKey="mint"
          delay={0.6}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg p-4 shadow-sm"
          style={{ borderLeft: `4px solid ${colors.peach.text}` }}
        >
          <h3 className="text-sm mb-2" style={{ color: colors.peach.text }}>平均訂單金額</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold" style={{ color: colors.peach.text }}>
              <AnimatedNumber value={stats.avgOrderValue} />
            </span>
            <span className="ml-2 text-sm opacity-70" style={{ color: colors.peach.text }}>元/筆</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg p-4 shadow-sm"
          style={{ borderLeft: `4px solid ${colors.olive.text}` }}
        >
          <h3 className="text-sm mb-2" style={{ color: colors.olive.text }}>訂單完成率</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold" style={{ color: colors.olive.text }}>
              <AnimatedNumber value={stats.completionRate} />
            </span>
            <span className="ml-2 text-sm opacity-70" style={{ color: colors.olive.text }}>%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-lg p-4 shadow-sm"
          style={{ borderLeft: `4px solid ${colors.sky.text}` }}
        >
          <h3 className="text-sm mb-2" style={{ color: colors.sky.text }}>顧客滿意度</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold" style={{ color: colors.sky.text }}>
              <AnimatedNumber value={stats.customerSatisfaction} />
            </span>
            <span className="ml-2 text-sm opacity-70" style={{ color: colors.sky.text }}>分</span>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.sage.text }}>
            <HiOutlineTrendingUp className="inline-block mr-2" />
            營收趨勢
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E3" />
                <XAxis dataKey="month" stroke={colors.sage.text} />
                <YAxis stroke={colors.sage.text} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: colors.sage.bg,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={colors.sage.text}
                  strokeWidth={2}
                  dot={{ fill: colors.sage.text }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.sage.text }}>
            <HiOutlineGlobe className="inline-block mr-2" />
            熱門活動排行
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popularActivities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E3" />
                <XAxis dataKey="name" stroke={colors.sage.text} />
                <YAxis stroke={colors.sage.text} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: colors.sage.bg,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill={colors.sage.bg}
                  stroke={colors.sage.text}
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.sage.text }}>
            <HiOutlineGlobe className="inline-block mr-2" />
            活動地區分布
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topLocations}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill={colors.sage.bg}
                  stroke={colors.sage.text}
                >
                  {stats.topLocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(colors)[index].bg} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.sage.text }}>
            <HiOutlineTrendingUp className="inline-block mr-2" />
            每日訂單趨勢
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E3" />
                <XAxis dataKey="date" stroke={colors.sage.text} />
                <YAxis stroke={colors.sage.text} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.sage.bg,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke={colors.sage.text}
                  fill={colors.sage.bg}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 