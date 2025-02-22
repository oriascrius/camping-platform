"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { RiRobot2Line, RiCloseLine } from 'react-icons/ri';
import { FaUser, FaCompass, FaMapMarkedAlt, FaCampground } from 'react-icons/fa';
import { MdOutlineLocalActivity, MdRestaurant, MdWarning, MdLocationOn } from 'react-icons/md';
import { BsCalendar3, BsGear, BsQuestionCircle } from 'react-icons/bs';
import { WiDaySunny } from 'react-icons/wi';

export default function AIHelper({ activityData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 當消息更新時自動滾動
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 定義功能類別
  const categories = [
    {
      id: 'location',
      icon: <MdLocationOn className="text-blue-500" />,
      title: '交通指南',
      description: '抵達營地方式、停車資訊',
      questions: [
        '如何開車前往營地？',
        '附近有停車場嗎？',
        '有大眾運輸工具可以到達嗎？'
      ]
    },
    {
      id: 'activity',
      icon: <MdOutlineLocalActivity className="text-green-500" />,
      title: '活動建議',
      description: '推薦行程、周邊景點',
      questions: [
        '有什麼推薦的活動行程？',
        '附近有哪些景點可以遊玩？',
        '適合帶小孩參加嗎？'
      ]
    },
    {
      id: 'equipment',
      icon: <BsGear className="text-gray-600" />,
      title: '裝備指南',
      description: '必備裝備、注意事項',
      questions: [
        '需要準備哪些露營裝備？',
        '有什麼特殊裝備需求？',
        '營地有提供什麼設施？'
      ]
    },
    {
      id: 'food',
      icon: <MdRestaurant className="text-orange-500" />,
      title: '飲食資訊',
      description: '餐飲建議、食材準備',
      questions: [
        '附近有什麼美食推薦？',
        '營地可以烤肉嗎？',
        '需要自備什麼食材？'
      ]
    },
    {
      id: 'weather',
      icon: <WiDaySunny className="text-yellow-500" />,
      title: '天氣資訊',
      description: '天氣建議、注意事項',
      questions: [
        '這個季節天氣如何？',
        '需要特別注意什麼天氣狀況？',
        '建議的露營季節是？'
      ]
    },
    {
      id: 'safety',
      icon: <MdWarning className="text-red-500" />,
      title: '安全須知',
      description: '安全提醒、緊急措施',
      questions: [
        '有什麼安全注意事項？',
        '附近有醫療設施嗎？',
        '遇到緊急情況怎麼辦？'
      ]
    }
  ];

  const handleSendQuestion = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/camping/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          category: {
            id: activeCategory.id,
            title: activeCategory.title
          },
          activityData: {
            name: activityData?.activity_name,
            location: activityData?.camp_address,
            description: activityData?.description,
            weather: activityData?.weather,
          }
        }),
      });

      if (!response.ok) throw new Error('AI 回應失敗');

      const data = await response.json();
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI 處理錯誤:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: '抱歉，處理您的問題時出現錯誤，請稍後再試。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI 助手按鈕 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2
          bg-white text-[#6B8E7B] px-4 py-2 rounded-full shadow-lg
          border-2 border-[#6B8E7B] hover:bg-[#F5F7F5]"
      >
        <RiRobot2Line size={24} />
        <span className="font-medium">露營助手</span>
      </motion.button>

      {/* AI 助手對話框 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 w-[100vw] max-w-[500px]
                     bg-white rounded-2xl shadow-xl border border-gray-200"
          >
            {/* 頭部 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <RiRobot2Line className="text-green-600" size={24} />
                <span className="font-medium">露營助手</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* 主要內容區 */}
            <div className="p-4 h-[60vh] overflow-y-auto">
              {!activeCategory ? (
                // 功能類別選擇
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category)}
                      className="p-4 border rounded-xl hover:border-[#6B8E7B] 
                               hover:bg-[#F5F7F5] transition-all duration-300
                               flex flex-col items-center text-center gap-2"
                    >
                      <div className="text-2xl">{category.icon}</div>
                      <div className="font-medium">{category.title}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                // 對話區域
                <div className="space-y-4">
                  {/* 返回按鈕 */}
                  <button
                    onClick={() => {
                      setActiveCategory(null);
                      setMessages([]);
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                  >
                    <span>←</span>
                    <span>返回功能選單</span>
                  </button>

                  {/* 快速問題 */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">常見問題：</div>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory.questions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendQuestion(question)}
                          className="text-sm px-3 py-1 rounded-full bg-gray-100
                                   hover:bg-[#E8ECE8] text-gray-600 hover:text-[#6B8E7B]"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 對話記錄 */}
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-xl ${
                            message.type === 'user'
                              ? 'bg-[#6B8E7B] text-white'
                              : message.type === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-500 p-3 rounded-xl">
                          思考中...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 