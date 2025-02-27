"use client";
import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Container,
  Row,
  Col,
  Pagination,
  Badge,
  InputGroup,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { showCartAlert } from "@/utils/sweetalert";

export default function UserDashboard() {
  // 會員列表的狀態
  const [users, setUsers] = useState([]);
  const [statusZeroCount, setStatusZeroCount] = useState(0);

  // 分頁相關 state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // 排序與篩選
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [searchTerm, setSearchTerm] = useState("");
  const [hideStatusZero, setHideStatusZero] = useState(false);

  // Modal 相關 state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, edit, add
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 目前操作的會員資料
  const [currentUser, setCurrentUser] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    phone: "",
    birthday: "",
    gender: "",
    address: "",
    status: 1,
  });

  // 初次載入及參數變更時，重新取得資料
  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder, hideStatusZero, perPage]);

  // 搜尋功能需額外處理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 重設頁數
    fetchUsers();
  };

  // 從 API 取得會員資料
  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        perPage,
        sort: sortField,
        order: sortOrder,
        hideStatusZero: hideStatusZero ? "1" : "0",
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const res = await fetch(`/api/member/admin/users?${queryParams}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setStatusZeroCount(data.statusZeroCount || 0);
      } else {
        showCartAlert.error("獲取會員資料失敗");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showCartAlert.error("系統錯誤，無法獲取會員資料");
    }
  };

  // 獲取單一會員資料
  const fetchUserDetail = async (userId) => {
    try {
      const res = await fetch(`/api/member/admin/users?id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.data);
      } else {
        throw new Error(data.message || "獲取會員資料失敗");
      }
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 處理排序
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  // 切換會員狀態（啟用/停用）
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 1 ? 0 : 1;
      const confirmText = newStatus === 1 ? "啟用" : "停用";

      const result = await showCartAlert.confirm(
        `確定要${confirmText}此會員？`,
        `會員: ${user.name} (${user.email})`
      );

      if (!result.isConfirmed) return;

      const res = await fetch(
        `/api/member/admin/users?id=${user.id}&status=${newStatus}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        showCartAlert.success(data.message);
        fetchUsers();
      } else {
        throw new Error(data.message || `${confirmText}會員失敗`);
      }
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 顯示會員詳情
  const handleViewUser = async (userId) => {
    try {
      await fetchUserDetail(userId);
      setShowDetailModal(true);
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 開始編輯會員
  const handleEditUser = async (userId) => {
    try {
      await fetchUserDetail(userId);
      setModalMode("edit");
      setShowModal(true);
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 新增會員
  const handleAddUser = () => {
    setCurrentUser({
      id: null,
      name: "",
      email: "",
      password: "",
      phone: "",
      birthday: "",
      gender: "male",
      address: "",
      status: 1,
    });
    setModalMode("add");
    setShowModal(true);
  };

  // 儲存會員資料（新增或更新）
  const handleSaveUser = async () => {
    try {
      const method = modalMode === "add" ? "POST" : "PUT";

      // 基本驗證
      if (!currentUser.name || !currentUser.email) {
        throw new Error("請填寫姓名和電子郵件");
      }

      // 只在新增會員且不是第三方登入時需要密碼
      if (modalMode === "add" && !currentUser.password) {
        throw new Error("請設定密碼");
      }

      // 電子郵件格式驗證
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser.email)) {
        throw new Error("請輸入有效的電子郵件地址");
      }

      // 電話號碼驗證 (如果有提供)
      if (currentUser.phone && !/^\d{10}$/.test(currentUser.phone)) {
        throw new Error("請輸入正確的手機號碼格式");
      }

      // 提交前處理空密碼：如果是編輯模式且密碼為空，從資料中移除密碼欄位
      let dataToSubmit = { ...currentUser };
      if (
        modalMode === "edit" &&
        (!dataToSubmit.password || dataToSubmit.password === "")
      ) {
        delete dataToSubmit.password;
      }

      const res = await fetch(`/api/member/admin/users`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await res.json();

      if (data.success) {
        showCartAlert.success(
          modalMode === "add" ? "會員新增成功" : "會員資料已更新"
        );
        setShowModal(false);
        fetchUsers();
      } else {
        throw new Error(data.message || "操作失敗");
      }
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // 性別中文顯示
  const translateGender = (gender) => {
    const map = {
      male: "男",
      female: "女",
      other: "其他",
    };
    return map[gender] || "其他";
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">會員管理</h1>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Button
            variant="success"
            onClick={handleAddUser}
            className="mb-2 mb-md-0"
          >
            <FaPlus className="me-1" /> 新增會員
          </Button>
        </Col>
        <Col md={8}>
          <div className="d-flex flex-wrap justify-content-end gap-2">
            <Form.Check
              type="checkbox"
              id="hideStatusZero"
              label={`隱藏停用 ${statusZeroCount} 名會員`}
              checked={hideStatusZero}
              onChange={() => {
                setHideStatusZero(!hideStatusZero);
                setCurrentPage(1);
              }}
              className="me-3 d-flex align-items-center"
            />

            <Form onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="搜尋會員名稱、Email、電話"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            <Form.Select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setCurrentPage(1);
              }}
              className="w-auto"
            >
              <option value="">--排序欄位--</option>
              <option value="id">編號</option>
              <option value="name">姓名</option>
              <option value="birthday">生日</option>
              <option value="created_at">建立時間</option>
            </Form.Select>

            <Form.Select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-auto"
            >
              <option value="ASC">升序</option>
              <option value="DESC">降序</option>
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* 會員列表表格 */}
      <Row>
        <Col>
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("id")}
                        style={{ cursor: "pointer" }}
                      >
                        編號{" "}
                        {sortField === "id" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("email")}
                        style={{ cursor: "pointer" }}
                      >
                        Email{" "}
                        {sortField === "email" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        style={{ cursor: "pointer" }}
                      >
                        姓名{" "}
                        {sortField === "name" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th>電話</th>
                      <th
                        onClick={() => handleSort("birthday")}
                        style={{ cursor: "pointer" }}
                      >
                        生日{" "}
                        {sortField === "birthday" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th>性別</th>
                      <th>狀態</th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        建立時間{" "}
                        {sortField === "created_at" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th className="text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">
                          無會員資料
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="user-row"
                          onClick={() => handleViewUser(user.id)}
                        >
                          <td>{user.id}</td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: "150px" }}
                          >
                            {user.email}
                          </td>
                          <td>{user.name}</td>
                          <td>{user.phone || "-"}</td>
                          <td>{formatDate(user.birthday)}</td>
                          <td>{translateGender(user.gender)}</td>
                          <td>
                            <Badge
                              bg={user.status === 1 ? "success" : "danger"}
                            >
                              {user.status === 1 ? "啟用" : "停用"}
                            </Badge>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td className="text-center">
                            <div
                              className="d-flex gap-2 justify-content-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <FaEdit /> 編輯
                              </Button>
                              <Button
                                variant={
                                  user.status === 1
                                    ? "outline-danger"
                                    : "outline-success"
                                }
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.status === 1 ? (
                                  <>
                                    <FaToggleOff /> 停用
                                  </>
                                ) : (
                                  <>
                                    <FaToggleOn /> 啟用
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <Pagination className="justify-content-center">
              <Pagination.Prev
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {/* 顯示頁碼 */}
              {Array.from({ length: totalPages }, (_, i) => {
                // 只顯示當前頁附近的頁碼
                if (
                  i === 0 || // 第一頁
                  i === totalPages - 1 || // 最後一頁
                  (i >= currentPage - 2 && i <= currentPage + 2) // 當前頁附近
                ) {
                  return (
                    <Pagination.Item
                      key={`page-${i + 1}`} // 使用更唯一的 key 值
                      active={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  );
                } else if (
                  (i === currentPage - 3 && i > 0) ||
                  (i === currentPage + 3 && i < totalPages - 1)
                ) {
                  // 顯示省略頁碼，使用唯一的 key
                  return <Pagination.Ellipsis key={`ellipsis-${i}`} />;
                }
                return null;
              })}

              <Pagination.Next
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          )}
        </Col>
      </Row>

      {/* 編輯/新增會員 Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "add" ? "新增會員" : "編輯會員"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    姓名 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.name}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={currentUser.email}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, email: e.target.value })
                    }
                    disabled={modalMode === "edit"}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* 根據條件顯示密碼欄位 - 只在新增用戶或編輯非第三方登入用戶時顯示 */}
            {(modalMode === "add" ||
              (modalMode === "edit" && currentUser.login_type === "email")) && (
              <Form.Group className="mb-3">
                <Form.Label>
                  密碼{" "}
                  {modalMode === "add" && (
                    <span className="text-danger">*</span>
                  )}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={currentUser.password || ""}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, password: e.target.value })
                  }
                  placeholder={
                    modalMode === "edit"
                      ? "留空表示不更改密碼"
                      : "8個字以上英數混合"
                  }
                  required={modalMode === "add"}
                />
              </Form.Group>
            )}

            {/* 顯示第三方登入資訊 */}
            {modalMode === "edit" && currentUser.login_type !== "email" && (
              <div className="alert alert-info">
                此用戶使用{" "}
                {currentUser.login_type === "line" ? "LINE" : "Google"}{" "}
                登入，無需密碼管理。
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    電話 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.phone || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, phone: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>性別</Form.Label>
                  <Form.Select
                    value={currentUser.gender || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, gender: e.target.value })
                    }
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>生日</Form.Label>
                  <Form.Control
                    type="date"
                    value={
                      currentUser.birthday
                        ? currentUser.birthday.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        birthday: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>地址</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.address || ""}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        address: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            {modalMode === "edit" && (
              <Form.Group className="mb-3">
                <Form.Label>狀態</Form.Label>
                <Form.Select
                  value={currentUser.status}
                  onChange={(e) =>
                    setCurrentUser({
                      ...currentUser,
                      status: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>啟用</option>
                  <option value={0}>停用</option>
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            {modalMode === "add" ? "新增" : "更新"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 會員詳情 Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>會員詳細資料</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>編號:</strong> {currentUser.id}
          </p>
          <p>
            <strong>姓名:</strong> {currentUser.name}
          </p>
          <p>
            <strong>Email:</strong> {currentUser.email}
          </p>
          <p>
            <strong>電話:</strong> {currentUser.phone || "-"}
          </p>
          <p>
            <strong>性別:</strong> {translateGender(currentUser.gender)}
          </p>
          <p>
            <strong>生日:</strong> {formatDate(currentUser.birthday)}
          </p>
          <p>
            <strong>地址:</strong> {currentUser.address || "-"}
          </p>
          <p>
            <strong>會員狀態:</strong>{" "}
            {currentUser.status === 1 ? "啟用" : "停用"}
          </p>
          <p>
            <strong>登入類型:</strong> {currentUser.login_type || "email"}
          </p>
          <p>
            <strong>最後登入時間:</strong> {formatDate(currentUser.last_login)}
          </p>
          <p>
            <strong>建立時間:</strong> {formatDate(currentUser.created_at)}
          </p>
          <p>
            <strong>更新時間:</strong> {formatDate(currentUser.updated_at)}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            關閉
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowDetailModal(false);
              handleEditUser(currentUser.id);
            }}
          >
            編輯
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
