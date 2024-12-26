const Chat = () => {
  const { data: session } = useSession();
  
  // 根據 session 中的角色判斷使用哪個 ID
  const currentUserId = session?.user?.isAdmin 
    ? session.user.adminId  // 使用管理員 ID
    : session.user.userId;  // 使用一般用戶 ID

  // ... 其他聊天室邏輯 ...
} 