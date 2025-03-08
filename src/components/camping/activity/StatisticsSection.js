'use client';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export default function StatisticsSection() {
  const [counts, setCounts] = useState({
    activities: 0,
    campers: 0,
    camps: 0,
    rating: 0
  });

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  // 數字動畫效果
  useEffect(() => {
    if (inView) {
      const duration = 2500; // 延長動畫時間
      const steps = 60;
      const interval = duration / steps;

      const targets = {
        activities: 500,
        campers: 2000,
        camps: 30,
        rating: 4.8
      };

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        
        setCounts({
          activities: Math.floor((targets.activities * currentStep) / steps),
          campers: Math.floor((targets.campers * currentStep) / steps),
          camps: Math.floor((targets.camps * currentStep) / steps),
          rating: Number((targets.rating * currentStep / steps).toFixed(1))
        });

        if (currentStep === steps) {
          clearInterval(timer);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [inView]);

  // 莫蘭迪色系統計卡片
  const statCards = [
    {
      value: counts.activities,
      label: '成功舉辦活動',
      suffix: '+',
      bgGradient: 'from-[#FFE4D6] to-[#FFDAC8]',
      textColor: 'text-[#B25F3E]',
      borderColor: 'border-[#FFB598]',
      shadowColor: 'shadow-[#FFE4D6]'
    },
    {
      value: counts.campers,
      label: '快樂露營者',
      suffix: '+',
      bgGradient: 'from-[#D4E7D5] to-[#BFD8C0]',
      textColor: 'text-[#446850]',
      borderColor: 'border-[#A8C7AA]',
      shadowColor: 'shadow-[#D4E7D5]'
    },
    {
      value: counts.camps,
      label: '合作營地',
      suffix: '+',
      bgGradient: 'from-[#F2D5E5] to-[#E8C1D7]',
      textColor: 'text-[#A55A82]',
      borderColor: 'border-[#DCA8C3]',
      shadowColor: 'shadow-[#F2D5E5]'
    },
    {
      value: counts.rating,
      label: '平均評分',
      suffix: '',
      bgGradient: 'from-[#D5E6E8] to-[#BFD8DB]',
      textColor: 'text-[#4B828B]',
      borderColor: 'border-[#A8C7CA]',
      shadowColor: 'shadow-[#D5E6E8]'
    }
  ];

  return (
    <div className="relative w-screen left-[50%] right-[50%] mx-[-50vw] 
                    bg-gradient-to-b from-[#F8F9F8] to-[#EEF0EE] overflow-hidden
                    py-12 sm:py-16 md:py-20 lg:py-24 
                    mt-12 sm:mt-16 md:mt-20 lg:mt-24
                    mb-12 sm:mb-16 md:mb-20 lg:mb-24">
      {/* 裝飾圓圈 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 左上大圓 */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full 
                      bg-gradient-to-br from-[#FFE4D6]/40 to-[#FFDAC8]/40 
                      animate-float-slow blur-lg" />
        {/* 右下大圓 */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full 
                      bg-gradient-to-tl from-[#D4E7D5]/50 to-[#BFD8C0]/50 
                      animate-float-slower blur-lg" />
        {/* 中間小圓 */}
        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full 
                      bg-gradient-to-r from-[#F2D5E5]/30 to-[#E8C1D7]/30 
                      animate-float blur-md" />
      </div>

      {/* 主要內容 */}
      <div ref={ref} className="relative max-w-[1440px] mx-auto 
                              px-4 sm:px-6 lg:px-8
                              py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 
                      gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {statCards.map((stat, index) => (
            <div key={index} className="group">
              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${stat.bgGradient}
                rounded-2xl p-6 md:p-8
                border-2 ${stat.borderColor}/40
                shadow-lg hover:shadow-xl
                transform transition-all duration-500
                hover:scale-105 hover:-translate-y-1
                backdrop-blur-sm
                group-hover:border-opacity-60
              `}>
                {/* 背景光暈效果 */}
                <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full 
                              bg-white/20 blur-xl group-hover:scale-150 
                              transition-transform duration-700`} />
                
                <div className="relative space-y-3">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-4xl md:text-5xl font-bold ${stat.textColor}
                                   transition-all duration-300 group-hover:transform 
                                   group-hover:scale-110 drop-shadow-sm`}>
                      {stat.value}
                    </span>
                    <span className={`text-2xl font-bold ${stat.textColor} ml-1 opacity-90`}>
                      {stat.suffix}
                    </span>
                  </div>
                  <span className={`block text-sm md:text-base text-center ${stat.textColor}
                                 font-medium transition-all duration-300
                                 group-hover:opacity-90`}>
                    {stat.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 