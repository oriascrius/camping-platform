'use client';
import { useState, useEffect } from 'react';
import CampCard from './CampCard';

export default function CampList() {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/owner/camp-reviews');
        const { data } = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.length > 0 ? (
        applications.map((application) => (
          <CampCard 
            key={application.application_id} 
            application={application} 
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">目前沒有申請記錄</p>
        </div>
      )}
    </div>
  );
} 