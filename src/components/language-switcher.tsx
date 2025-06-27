'use client';

import { usePathname, useRouter } from '@/navigation';
import { useLocale } from 'next-intl';
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
  const locale = useLocale();

  const handleLocaleChange = (nextLocale: 'en' | 'es') => {
    router.replace(pathname, {locale: nextLocale});
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
