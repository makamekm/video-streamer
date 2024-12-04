"use client";

import { MenuItem, PageLayout, PageLayoutAside } from "@gravity-ui/navigation";
import { House, Play, FloppyDisk, Archive } from '@gravity-ui/icons';
import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MenuLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);

  const menuItemsShowcase = useMemo<MenuItem[]>(() => [
    {
      id: 'control',
      title: 'Управление',
      icon: Play,
      link: '/',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/');
      },
      current: pathname === '/',
    },
    {
      id: 's3',
      title: 'Диск',
      icon: FloppyDisk,
      link: '/s3',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/s3');
      },
      current: pathname === '/s3',
    },
    {
      id: 'torrent',
      title: 'Торрент',
      icon: Archive,
      link: '/torrent',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/torrent');
      },
      current: pathname === '/torrent',
    },
  ], [pathname, router]);

  return (
    <PageLayout compact={compact}>
      <PageLayoutAside
        headerDecoration
        menuItems={menuItemsShowcase}
        logo={{
          text: 'Стриминг',
          icon: House,
          href: '/',
          'aria-label': 'Стриминг',
          onClick: () => router.push('/'),
        }}
        onChangeCompact={setCompact}
        qa={'pl-aside'}
      />

      <PageLayout.Content>
        {children}
      </PageLayout.Content>
    </PageLayout>
  );
}
