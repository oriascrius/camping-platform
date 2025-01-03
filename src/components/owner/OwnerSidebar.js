'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function OwnerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { 
      href: '/owner/dashboard', 
      label: '營地總覽', 
      icon: '📊'
    },
    { 
      href: '/owner/camps', 
      label: '營地管理', 
      icon: '🏕️'
    },
    { 
      href: '/owner/bookings', 
      label: '訂單管理', 
      icon: '📝'
    },
    { 
      href: '/owner/reviews', 
      label: '評價管理', 
      icon: '⭐'
    },
    { 
      href: '/owner/settings', 
      label: '帳號設定', 
      icon: '⚙️'
    },
    { 
      href: '/owner/messages', 
      label: '訊息中心', 
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
                ? 'bg-green-50 text-green-600' 
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