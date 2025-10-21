import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  header?: {
    title: string;
    description?: string;
    actions?: ReactNode;
  };
}

export function PageLayout({ children, className, header }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {header && (
        <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/5">
          <div className="container flex h-16 items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{header.title}</h1>
              {header.description && (
                <p className="text-sm text-muted-foreground">{header.description}</p>
              )}
            </div>
            {header.actions && (
              <div className="flex items-center gap-2">{header.actions}</div>
            )}
          </div>
        </div>
      )}

      <main className={cn("container py-6", className)}>
        {children}
      </main>
    </div>
  );
}