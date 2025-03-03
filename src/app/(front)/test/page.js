// src/app/(front)/test/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const baseCanvasRef = useRef(null);
  const coverCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const coverCanvas = coverCanvasRef.current;
    const baseCtx = baseCanvas.getContext('2d');
    const coverCtx = coverCanvas.getContext('2d');

    // 設置獎品內容
    baseCtx.fillStyle = '#8B4513';
    baseCtx.font = 'bold 30px Arial';
    baseCtx.textAlign = 'center';
    baseCtx.fillText('恭喜獲得露營折價券！', 150, 100);
    baseCtx.fillText('NT$ 500', 150, 140);

    // 設置遮罩層
    coverCtx.fillStyle = '#888888';
    coverCtx.fillRect(0, 0, 300, 200);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const coverCanvas = coverCanvasRef.current;
    const coverCtx = coverCanvas.getContext('2d');
    const rect = coverCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 設置刮除效果
    coverCtx.globalCompositeOperation = 'destination-out';
    coverCtx.beginPath();
    coverCtx.arc(x, y, 15, 0, Math.PI * 2);
    coverCtx.fill();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-[var(--primary-brown)] mb-6">
          露營刮刮樂
        </h1>

        <div className="flex flex-col items-center">
          <div className="relative w-[300px] h-[200px] mb-4">
            <canvas
              ref={baseCanvasRef}
              width={300}
              height={200}
              className="absolute top-0 left-0 bg-white rounded-lg"
            />
            <canvas
              ref={coverCanvasRef}
              width={300}
              height={200}
              className="absolute top-0 left-0 rounded-lg cursor-pointer"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          
          <p className="text-gray-600 text-center">
            用滑鼠刮開灰色區域，看看您中了什麼獎！
          </p>
        </div>
      </motion.div>
    </div>
  );
}