'use client';
import { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

// 可拖拽的活動項目組件
function SortableItem({ id, activity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-white rounded-lg shadow mb-2 cursor-move hover:bg-gray-50 border border-[var(--gray-6)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{activity.icon}</span>
          <div>
            <div className="font-medium text-[var(--gray-1)]">{activity.title}</div>
            <div className="text-sm text-[var(--gray-4)]">
              {activity.duration} 分鐘
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripPlanner() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [schedule, setSchedule] = useState({
    1: [],
    2: []
  });
  const [equipment, setEquipment] = useState(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = schedule[selectedDay].findIndex(item => item.id === active.id);
      const newIndex = schedule[selectedDay].findIndex(item => item.id === over.id);

      setSchedule({
        ...schedule,
        [selectedDay]: arrayMove(schedule[selectedDay], oldIndex, newIndex),
      });
    }
  };

  // 添加活動到行程
  const addActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: `${activity.id}-${Date.now()}`,
    };

    setSchedule({
      ...schedule,
      [selectedDay]: [...schedule[selectedDay], newActivity],
    });
    updateEquipment(activity);
  };

  // 更新裝備清單
  const updateEquipment = (activity) => {
    const newEquipment = new Set(equipment);
    
    switch (activity.type) {
      case 'exercise':
        newEquipment.add('瑜珈墊');
        newEquipment.add('運動服');
        break;
      case 'meal':
        newEquipment.add('炊具');
        newEquipment.add('餐具');
        break;
      // ... 其他裝備類型 ...
    }
    
    setEquipment(newEquipment);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 天數選擇 */}
      <div className="flex gap-4 mb-6">
        {Object.keys(schedule).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(Number(day))}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedDay === Number(day)
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--gray-7)] text-[var(--gray-1)] hover:bg-[var(--gray-6)]'
            }`}
          >
            Day {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* 活動模板 */}
        <div className="col-span-1">
          <h3 className="font-semibold mb-4 text-[var(--gray-1)]">活動選項</h3>
          {Object.entries(activityTemplates).map(([timeSlot, activities]) => (
            <div key={timeSlot} className="mb-4">
              <h4 className="text-sm text-[var(--gray-4)] mb-2 capitalize">{timeSlot}</h4>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => addActivity(activity)}
                    className="p-3 bg-[var(--gray-7)] rounded-lg cursor-pointer 
                             hover:bg-[var(--secondary-3)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{activity.icon}</span>
                      <div>
                        <div className="font-medium text-[var(--gray-1)]">{activity.title}</div>
                        <div className="text-sm text-[var(--gray-4)]">
                          {activity.duration} 分鐘
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 行程安排 */}
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[var(--gray-1)]">Day {selectedDay} 行程</h3>
            <span className="text-sm text-[var(--gray-4)]">
              總時間: {schedule[selectedDay].reduce((total, activity) => total + activity.duration, 0)} 分鐘
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={schedule[selectedDay].map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="min-h-[400px] bg-[var(--gray-7)] rounded-lg p-4 
                            border border-[var(--gray-6)]">
                {schedule[selectedDay].map((activity) => (
                  <SortableItem 
                    key={activity.id} 
                    id={activity.id} 
                    activity={activity}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* 裝備清單 */}
        <div className="col-span-1">
          <h3 className="font-semibold mb-4 text-[var(--gray-1)]">建議裝備</h3>
          <div className="bg-[var(--gray-7)] rounded-lg p-4 border border-[var(--gray-6)]">
            {Array.from(equipment).map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 py-2 text-[var(--gray-2)]"
              >
                <span className="text-[var(--status-success)]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 活動模板數據
const activityTemplates = {
  morning: [
    { id: 'morning-1', title: '早晨瑜珈', duration: 60, type: 'exercise', icon: '🧘‍♀️' },
    { id: 'morning-2', title: '野炊早餐', duration: 90, type: 'meal', icon: '🍳' },
    { id: 'morning-3', title: '生態導覽', duration: 120, type: 'education', icon: '🌿' }
  ],
  afternoon: [
    { id: 'afternoon-1', title: '野外求生課程', duration: 180, type: 'education', icon: '🏕️' },
    { id: 'afternoon-2', title: '溪流探索', duration: 120, type: 'adventure', icon: '🏞️' },
    { id: 'afternoon-3', title: '手作工藝', duration: 90, type: 'craft', icon: '🎨' }
  ],
  evening: [
    { id: 'evening-1', title: '營火晚會', duration: 120, type: 'social', icon: '🔥' },
    { id: 'evening-2', title: '星空觀察', duration: 90, type: 'education', icon: '🌟' },
    { id: 'evening-3', title: '野外烤肉', duration: 120, type: 'meal', icon: '🍖' }
  ]
}; 