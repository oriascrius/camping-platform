// components/RentalDetails.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import Pagination from "./Pagination";
import SortAndFilter from "./sort-filter";
import SearchBar from "./search-bar";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import { useRouter } from "next/navigation"; // 引入 useRouter
import { useSession } from "next-auth/react"; // 引入 useSession

const RentalDetails = () => {
  const { data: session } = useSession();
  const [leases, setLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true); // 加載狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const router = useRouter(); // 使用 useRouter
  const cardRefs = useRef([]); // 用於存儲卡片的引用

  useEffect(() => {
    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      router.push("/auth/login");
      return;
    }

    const fetchLeases = async () => {
      try {
        const response = await fetch(`/api/member/rental/${session.user.id}`);
        const data = await response.json();

        if (response.ok) {
          setLeases(data.leases);
          setFilteredLeases(data.leases);
        } else {
          Swal.fire("錯誤", data.error || "獲取數據失敗", "error");
        }
      } catch (error) {
        Swal.fire("錯誤", "無法連接到伺服器", "error");
      } finally {
        setLoading(false); // 加載完成
      }
    };

    fetchLeases();
  }, [session, router]);

  const LeaseCountdown = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    function calculateTimeLeft() {
      const difference = new Date(endDate) - new Date();
      return {
        天: Math.floor(difference / (1000 * 60 * 60 * 24)),
        時: Math.floor((difference / (1000 * 60 * 60)) % 24),
        分: Math.floor((difference / 1000 / 60) % 60),
        秒: Math.floor((difference / 1000) % 60),
      };
    }

    return (
      <div className="countdown d-flex">
        <span>剩餘時間：</span>
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="countdown-unit">
            <span>{value}</span>
            {unit}
          </div>
        ))}
      </div>
    );
  };

  // 根據視窗剩餘空間自動判斷展開方向
  const getSmartExpandDirection = (index, element) => {
    if (typeof window === "undefined") return "right";

    const cardRect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (cardRect.left < viewportWidth * 0.25) return "right";
    if (cardRect.right > viewportWidth * 0.75) return "left";
    return "bottom";
  };

  // 根據日期自動計算租借狀態
  const getLeaseStatus = (start, end) => {
    const now = new Date();
    const endDate = new Date(end);
    return endDate > now ? "active" : "expired";
  };

  // 處理延長租借
  const handleExtend = async (leaseId, currentEndDate) => {
    const currentEnd = new Date(currentEndDate);
    const minDate = new Date(currentEnd);
    minDate.setDate(currentEnd.getDate() + 1); // 從當前結束日期的第二天開始

    const maxDate = new Date(currentEnd);
    maxDate.setDate(currentEnd.getDate() + 8); // 最多延長7天

    const { value: newDate } = await Swal.fire({
      title: "延長租借時間",
      html: `
        <div class="date-picker-container">
          <input 
            type="date" 
            id="endDate"
            class="swal2-input date-picker"
            min="${minDate.toISOString().split("T")[0]}"
            max="${maxDate.toISOString().split("T")[0]}"
            value="${minDate.toISOString().split("T")[0]}"
          >
          <div class="date-info">
            <span>可延長範圍：${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "確認延長",
      cancelButtonText: "取消",
      focusConfirm: false,
      preConfirm: () => {
        const dateInput = document.getElementById("endDate");
        if (!dateInput.value) {
          Swal.showValidationMessage("請選擇日期");
        }
        return dateInput.value;
      },
    });

    if (newDate) {
      try {
        const response = await axios.post("/api/member/rental/extend", {
          leaseId,
          newDate,
        });

        if (response.data.success) {
          setLeases((prev) =>
            prev.map((lease) =>
              lease.id === leaseId
                ? { ...lease, appointment_end: newDate }
                : lease
            )
          );
          Swal.fire("成功", "租借時間已延長", "success");
        }
      } catch (error) {
        Swal.fire("錯誤", error.response?.data?.error || "操作失敗", "error");
      }
    }
  };

  const handleSearch = (searchValue) => {
    const filtered = leases.filter((lease) =>
      lease.product_name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredLeases(filtered);
    setCurrentPage(1);
  };

  const indexOfLastLease = currentPage * itemsPerPage;
  const indexOfFirstLease = indexOfLastLease - itemsPerPage;
  const currentLeases = filteredLeases.slice(
    indexOfFirstLease,
    indexOfLastLease
  );

  return (
    <div className=" rental-details">
      <SearchBar placeholder="搜尋租借紀錄..." onSearch={handleSearch} />
      {loading ? (
        Array(itemsPerPage)
          .fill()
          .map((_, index) => (
            <motion.div
              key={index}
              className="sm-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ))
      ) : filteredLeases.length === 0 ? (
        <div className="no-data">
          <p>沒有符合搜尋條件的租借紀錄</p>
        </div>
      ) : (
        <>
          {currentLeases.map((lease, index) => (
            <motion.div
              key={lease.id}
              layout
              className="rental-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              ref={(el) => (cardRefs.current[index] = el)} // 存儲卡片引用
            >
              <Card>
                <Card.Body>
                  <div
                    className="d-flex justify-content-between align-items-center"
                    onClick={() =>
                      setExpandedId(expandedId === lease.id ? null : lease.id)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <h5>{lease.product_name}</h5>
                      <small className="text me-2">
                        租期:{" "}
                        {new Date(
                          lease.appointment_starts
                        ).toLocaleDateString()}{" "}
                        ~ {new Date(lease.appointment_end).toLocaleDateString()}
                      </small>
                      <span
                        className={`badge ${
                          getLeaseStatus(
                            lease.appointment_starts,
                            lease.appointment_end
                          ) === "active"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {getLeaseStatus(
                          lease.appointment_starts,
                          lease.appointment_end
                        ) === "active"
                          ? "進行中"
                          : "已過期"}
                      </span>
                    </div>
                    <motion.span
                      animate={{ rotate: expandedId === lease.id ? 180 : 0 }}
                    >
                      ▼
                    </motion.span>
                  </div>

                  <AnimatePresence>
                    {expandedId === lease.id && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          x:
                            getSmartExpandDirection(
                              index,
                              cardRefs.current[index]
                            ) === "right"
                              ? 100
                              : 0,
                          y:
                            getSmartExpandDirection(
                              index,
                              cardRefs.current[index]
                            ) === "bottom"
                              ? 50
                              : 0,
                        }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="card-expand-content mt-3"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.y > 50) setExpandedId(null);
                        }}
                      >
                        <hr />
                        <div className="row">
                          <div className="col-md-4">
                            {lease.images[0] && (
                              <img
                                src={`/${lease.images[0]}`}
                                alt={lease.product_name}
                                className="img-fluid rounded"
                                style={{ width: "auto", height: "auto" }} // 保持寬高比
                              />
                            )}
                          </div>
                          <div className="col-md-8 ">
                            <p>{lease.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="p-1"
                              onClick={() =>
                                handleExtend(lease.id, lease.appointment_end)
                              }
                            >
                              延長租借時間
                            </Button>
                            <LeaseCountdown endDate={lease.appointment_end} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredLeases.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default RentalDetails;
