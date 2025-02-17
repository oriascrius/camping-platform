"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityList } from "@/components/camping/activity/ActivityList";
import { ActivitySearch } from "@/components/camping/activity/ActivitySearch";
import { ActivitySidebar } from "@/components/camping/activity/ActivitySidebar";
import { SWRConfig } from 'swr';

export default function ActivitiesPage({ searchParams: initialSearchParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filterTags, setFilterTags] = useState([]);

  // 初始載入活動列表
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/camping/activities");
        const data = await response.json();
        setActivities(data.activities);
        setFilteredActivities(data.activities);
      } catch (error) {
        console.error("獲取活動列表失敗:", error);
      }
    };

    fetchActivities();
  }, []);

  // 處理地區篩選
  const handleLocationFilter = (location) => {
    const params = new URLSearchParams(searchParams.toString());

    if (location === "all") {
      params.delete("location");
    } else {
      params.set("location", location);
    }

    // 更新 URL
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/camping/activities${newUrl}`);

    // 更新篩選結果
    if (location === "all") {
      setFilteredActivities(activities);
    } else {
      const filtered = activities.filter((activity) => {
        const locationPrefix = location.substring(0, 2);
        return (
          activity.camp_address?.includes(locationPrefix) ||
          activity.camp_address?.includes(location)
        );
      });
      setFilteredActivities(filtered);
    }
  };

  // 處理篩選標籤 - 修改為單選模式
  const handleTagChange = (tag) => {
    // 如果是地區標籤，先移除舊的地區標籤
    setFilterTags((prev) => {
      const withoutLocation = prev.filter((t) => t.type !== "location");
      return [...withoutLocation, tag];
    });
  };

  // 處理移除標籤
  const handleRemoveTag = (tag) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tag === "all") {
      // 清除所有篩選
      router.push("/camping/activities");
      setFilteredActivities(activities);
      return;
    }

    // 根據標籤類型移除對應的參數
    switch (tag.key) {
      case "keyword":
        params.delete("keyword");
        break;
      case "date":
        params.delete("startDate");
        params.delete("endDate");
        break;
      case "startDate":
        params.delete("startDate");
        break;
      case "endDate":
        params.delete("endDate");
        break;
      case "price":
      case "minPrice":
      case "maxPrice":
        params.delete("minPrice");
        params.delete("maxPrice");
        break;
      case "priceRange":
        params.delete("priceRange");
        break;
      case "capacity":
        params.delete("capacity");
        break;
      case "duration":
        params.delete("duration");
        break;
      case "location":
        params.delete("location");
        break;
    }

    // 更新 URL
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/camping/activities${newUrl}`);
  };

  return (
    <SWRConfig 
      value={{
        refreshInterval: 30000, // 每30秒自動更新一次
        revalidateOnFocus: true, // 頁面獲得焦點時重新驗證
      }}
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">露營活動</h1>
          <ActivitySearch
            initialFilters={searchParams}
            onRemoveTag={handleRemoveTag}
          />
        </div>

        <div className="flex gap-6">
          <div className="hidden lg:block">
            <ActivitySidebar
              onFilterChange={handleLocationFilter}
              onTagChange={handleTagChange}
            />
          </div>
          <div className="flex-1">
            <ActivityList activities={filteredActivities} />
          </div>
        </div>
      </div>
    </SWRConfig>
  );
}
