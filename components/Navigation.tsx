'use client';

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
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Navigation() {
  const pathname = usePathname();
  const { user, userRole, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Navigation links - only shown when authenticated
  const navLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/image', label: 'Images', icon: ImageIcon },
    { href: '/video', label: 'Videos', icon: Film },
  ];

  // Admin link - only for admin users
  const adminLink = { href: '/admin', label: 'Admin', icon: Settings };

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
          {/* Show navigation links only when authenticated */}
          {!loading && user && (
            <>
              {navLinks.map(({ href, label, icon: Icon }) => {
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

              {/* Admin link - only for admin users */}
              {userRole === 'admin' && (
                <Button
                  variant={pathname === adminLink.href ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    pathname === adminLink.href && "bg-accent text-accent-foreground"
                  )}
                  asChild
                >
                  <Link href={adminLink.href}>
                    <adminLink.icon size={16} />
                    {adminLink.label}
                  </Link>
                </Button>
              )}
            </>
          )}

          {!loading && (
            <div className={cn("flex items-center", user && "ml-4 border-l border-border pl-4")}>
              {user ? (
                // Signed in - show user dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User size={16} />
                      <span className="hidden sm:inline">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm text-muted-foreground">
                      {user.email}
                    </DropdownMenuItem>
                    {userRole && (
                      <DropdownMenuItem className="text-sm text-muted-foreground">
                        Role: {userRole}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Not signed in - show single sign in button
                <Button variant="default" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}