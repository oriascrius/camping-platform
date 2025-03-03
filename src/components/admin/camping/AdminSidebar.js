"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin/camping/review",
      label: "審核管理",
      icon: "📋",
    },
    {
      href: "/admin/camping/list",
      label: "營區管理",
      icon: "🏕️",
    },
    {
      href: "/admin/camping/categories",
      label: "商品類別管理",
      icon: "📁",
    },
    {
      href: "/admin/camping/products",
      label: "商品管理",
      icon: "📦",
    },
    {
      href: "/admin/camping/orders",
      label: "商品訂單管理",
      icon: "📝",
    },
    {
      href: "/admin/camping/users",
      label: "使用者管理",
      icon: "👥",
    },
    {
      href: "/admin/coupons",
      label: "優惠券管理",
      icon: "🎫",
    },
    {
      href: "/admin/camping/articles",
      label: "官方文章管理",
      icon: "📰",
    },
    {
      href: "/admin/messages",
      label: "客服訊息管理",
      icon: "💬",
    },
    {
      href: "/admin/notifications",
      label: "通知管理",
      icon: "🔔",
    },
    {
      href: "/admin/logout",
      label: "登出系統",
      icon: "🚪",
    },
  ];

  return (
    <aside className="w-64 bg-white shadow h-[calc(100vh-4rem)]">
      <nav className="mt-5 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              group flex items-center px-4 py-3 text-sm font-medium rounded-md
              ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
