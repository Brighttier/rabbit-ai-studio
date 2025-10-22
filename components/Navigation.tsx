'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import {
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
  const { user, userRole, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        <div className="flex items-center">
          {!loading && (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}