"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { RiRobot2Line, RiCheckboxCircleLine } from 'react-icons/ri';
import { FaUser } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { BsLightbulb, BsCalendarCheck, BsShield, BsCloudRain, BsSun, BsMoon, BsCheckCircle } from 'react-icons/bs';
import { FaRoute, FaUtensils, FaCloudSun, FaTemperatureHigh, FaWind, FaList, FaRegCompass } from 'react-icons/fa';
import { MdOutlinePhotoCamera, MdNotifications, MdOutlineTimer, MdLocationOn } from 'react-icons/md';

export default function AIHelper({ activityData }) {
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('notifications');
  const [checklist, setChecklist] = useState([
    { id: 1, text: '檢查帳篷完整性', done: false, category: 'equipment' },
    { id: 2, text: '準備防雨裝備', done: false, category: 'equipment' },
    { id: 3, text: '確認照明設備', done: false, category: 'equipment' },
    { id: 4, text: '準備保暖衣物', done: false, category: 'equipment' },
    { id: 5, text: '檢查急救包', done: false, category: 'safety' },
  ]);
  const [schedule, setSchedule] = useState([
    { time: '06:00', event: '日出觀賞', reminder: true },
    { time: '07:00', event: '早餐時間', reminder: true },
    { time: '17:00', event: '準備晚餐', reminder: true },
    { time: '18:00', event: '日落觀賞', reminder: true },
  ]);

  // 預設問題分類
  const quickQuestions = {
    planning: [
      {
        icon: <BsCalendarCheck />,
        title: '行程規劃',
        questions: [
          '這個季節適合去這個營地嗎？',
          '建議待幾天最適合？',
          '有推薦的行程安排嗎？'
        ]
      },
      {
        icon: <FaRoute />,
        title: '路線建議',
        questions: [
          '從台北要怎麼去最方便？',
          '附近有哪些景點可以順路遊玩？',
          '停車方便嗎？'
        ]
      }
    ],
    equipment: [
      {
        icon: <BsLightbulb />,
        title: '裝備指南',
        questions: [
          '這個營地需要哪些必備裝備？',
          '有什麼特殊裝備需要準備嗎？',
          '食材要怎麼準備最適合？'
        ]
      },
      {
        icon: <FaUtensils />,
        title: '飲食建議',
        questions: [
          '有推薦的露營料理嗎？',
          '食材要準備多少份量？',
          '有什麼特別的野炊建議？'
        ]
      }
    ],
    safety: [
      {
        icon: <BsShield />,
        title: '安全提醒',
        questions: [
          '有什麼安全注意事項？',
          '緊急醫療設施在哪裡？',
          '野生動物要注意什麼？'
        ]
      },
      {
        icon: <FaCloudSun />,
        title: '天氣應對',
        questions: [
          '下雨天要如何應對？',
          '氣溫變化大要注意什麼？',
          '有防災避難建議嗎？'
        ]
      }
    ]
  };

  // 智能提醒系統
  useEffect(() => {
    const checkConditionsAndNotify = () => {
      const currentHour = currentTime.getHours();
      const weather = activityData?.weather;
      const temp = activityData?.temperature;
      
      const newNotifications = [];

      // 時間相關提醒
      if (currentHour === 6) {
        newNotifications.push({
          type: 'morning',
          icon: <BsSun className="text-yellow-500" />,
          title: '早晨提醒',
          content: '早安！天氣晴朗適合觀賞日出，建議準備保暖衣物。',
          priority: 'normal'
        });
      }

      if (currentHour === 17) {
        newNotifications.push({
          type: 'evening',
          icon: <BsMoon className="text-blue-500" />,
          title: '入夜提醒',
          content: '太陽即將下山，請確認照明設備及保暖裝備。',
          priority: 'high'
        });
      }

      // 天氣相關提醒
      if (weather?.includes('雨')) {
        newNotifications.push({
          type: 'weather',
          icon: <BsCloudRain className="text-blue-600" />,
          title: '天氣警示',
          content: '預計將有降雨，請確認防雨設備並注意排水。',
          priority: 'high'
        });
      }

      // 溫度相關提醒
      if (temp < 15) {
        newNotifications.push({
          type: 'temperature',
          icon: <FaTemperatureHigh className="text-blue-500" />,
          title: '低溫提醒',
          content: '氣溫偏低，建議加強保暖並注意體溫。',
          priority: 'high'
        });
      }

      // 更新提醒列表
      setNotifications(newNotifications);
    };

    // 每小時檢查一次條件
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkConditionsAndNotify();
    }, 3600000); // 每小時更新

    // 初始檢查
    checkConditionsAndNotify();

    return () => clearInterval(interval);
  }, [activityData, currentTime]);

  const handleSendQuestion = async (questionText = userInput) => {
    if (!questionText.trim()) return;

    const userMessage = {
      type: 'user',
      content: questionText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/camping/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: questionText,
          activityData: {
            name: activityData?.activity_name,
            location: activityData?.camp_address,
            description: activityData?.description,
            weather: activityData?.weather,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('AI 回應失敗');
      }

      const data = await response.json();
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI 處理錯誤:', error);
      const errorMessage = {
        type: 'error',
        content: '抱歉，處理您的問題時出現錯誤，請稍後再試。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSendQuestion(question);
  };

  // Enhanced animations
  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  // Add floating animation for the AI helper button
  const floatingAnimation = {
    y: [-2, 2],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  };

  // 新增功能：照片分析建議
  const handlePhotoAnalysis = async (photo) => {
    // 實作照片分析邏輯
    // 1. 分析照片中的露營環境
    // 2. 提供相應的建議
  };

  // 新增功能：即時天氣提醒
  const handleWeatherAlert = async () => {
    // 實作天氣監測邏輯
    // 1. 定期檢查天氣變化
    // 2. 發送重要天氣提醒
  };

  const tabs = [
    { id: 'notifications', icon: <MdNotifications />, label: '即時提醒' },
    { id: 'checklist', icon: <FaList />, label: '露營清單' },
    { id: 'schedule', icon: <MdOutlineTimer />, label: '行程表' },
    { id: 'compass', icon: <FaRegCompass />, label: '方位指南' },
  ];

  const handleChecklistToggle = (id) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const handleScheduleToggle = (time) => {
    setSchedule(schedule.map(item =>
      item.time === time ? { ...item, reminder: !item.reminder } : item
    ));
  };

  return (
    <>
      {/* 通知提示圖標 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAIHelper(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2
          bg-gradient-to-r from-green-500 to-green-600 
          text-white px-4 py-2 rounded-full shadow-lg"
      >
        <MdNotifications size={24} />
        {notifications.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showAIHelper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 
              bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl"
            >
              {/* 頭部 */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <RiRobot2Line className="text-green-600" size={24} />
                  <h2 className="font-semibold">露營助手</h2>
                </div>
                <button
                  onClick={() => setShowAIHelper(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <IoClose size={20} />
                </button>
              </div>

              {/* 分頁選單 */}
              <div className="flex border-b">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3
                      text-sm font-medium transition-colors duration-200
                      ${activeTab === tab.id 
                        ? 'text-green-600 border-b-2 border-green-600' 
                        : 'text-gray-500 hover:text-green-600'}`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* 內容區域 */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'notifications' && (
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        目前沒有需要注意的事項
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border ${
                            notification.priority === 'high' 
                              ? 'bg-red-50 border-red-100' 
                              : 'bg-green-50 border-green-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              {notification.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.content}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'checklist' && (
                  <div className="space-y-3">
                    {checklist.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl border flex items-center gap-3
                          ${item.done ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}
                        onClick={() => handleChecklistToggle(item.id)}
                      >
                        <div className={`p-2 rounded-lg
                          ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <BsCheckCircle size={20} />
                        </div>
                        <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="space-y-3">
                    {schedule.map(item => (
                      <motion.div
                        key={item.time}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl border border-gray-100 
                          flex items-center gap-3"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <MdOutlineTimer size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">{item.time}</div>
                          <div className="text-sm text-gray-500">{item.event}</div>
                        </div>
                        <button
                          onClick={() => handleScheduleToggle(item.time)}
                          className={`p-2 rounded-lg transition-colors
                            ${item.reminder ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          <MdNotifications size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'compass' && (
                  <div className="text-center py-4">
                    <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
                      <FaRegCompass size={48} className="text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">營地方位</h3>
                      <p className="text-sm text-gray-500">
                        營地座標：{activityData?.latitude || 'N/A'}, {activityData?.longitude || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        海拔高度：{activityData?.altitude || 'N/A'} 公尺
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部資訊 */}
              <div className="p-4 bg-gray-50 rounded-b-2xl border-t text-sm text-gray-500">
                上次更新：{currentTime.toLocaleTimeString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 