
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  // Since i18n is removed, locale is hardcoded or can be removed.
  const locale = 'es';

  const handleLocaleChange = (nextLocale: 'en' | 'es') => {
    // This functionality is disabled as i18n is removed.
    // In a real i18n app, you would use the router to change locale.
    // router.replace(pathname, {locale: nextLocale});
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLocaleChange('es')}
          disabled={locale === 'es'}
        >
          Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange('en')}
          disabled={locale === 'en'}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
