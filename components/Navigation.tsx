import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  HomeIcon,
  MessageCircle,
  ImageIcon,
  Film,
  Settings,
  User,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/image', label: 'Images', icon: ImageIcon },
    { href: '/video', label: 'Videos', icon: Film },
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold inline-block">🐰</span>
            <span className="font-semibold">Rabbit AI Studio</span>
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Button
                key={href}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  isActive && "bg-accent text-accent-foreground"
                )}
                asChild
              >
                <Link href={href}>
                  <Icon size={16} />
                  {label}
                </Link>
              </Button>
            );
          })}
          <div className="ml-4 border-l border-border pl-4">
            <Button variant="outline" size="icon">
              <User size={16} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}