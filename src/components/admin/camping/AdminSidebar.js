'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { 
      href: '/admin/camping', 
      label: '營地管理首頁', 
      icon: '🏠'
    },
    { 
      href: '/admin/camping/list', 
      label: '營地列表', 
      icon: '🏕️'
    },
    { 
      href: '/admin/camping/orders', 
      label: '訂單管理', 
      icon: '📝'
    },
    { 
      href: '/admin/camping/users', 
      label: '會員管理', 
      icon: '👥'
    },
    { 
      href: '/admin/camping/comments', 
      label: '評論管理', 
      icon: '💭'
    },
    { 
      href: '/admin/camping/settings', 
      label: '系統設定', 
      icon: '⚙️'
    },
    {
      href: '/admin/messages',
      label: '客服訊息管理',
      icon: '💬'
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
              ${pathname === item.href 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
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