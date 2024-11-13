"use client";

import { MenuItem, PageLayout, PageLayoutAside } from "@gravity-ui/navigation";
import { useMemo, useState } from "react";
import logoIcon from "../icons/logo.svg";
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
      id: 's3',
      title: 'Диски S3',
      icon: logoIcon,
      link: '/s3',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/s3');
      },
      current: pathname === '/s3',
    },
    {
      id: 'control',
      title: 'Управление',
      icon: logoIcon,
      link: '/control',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/control');
      },
      current: pathname === '/control',
    },
    {
      id: 'torrent',
      title: 'Торрент',
      icon: logoIcon,
      link: '/torrent',
      onItemClick(item, collapsed, event) {
        event.preventDefault();
        event.stopPropagation();
        router.push('/torrent');
      },
      current: pathname === '/torrent',
    },
  ], [pathname]);
  
  return (
    <PageLayout compact={compact}>
      <PageLayoutAside
            headerDecoration
            menuItems={menuItemsShowcase}
            logo={{
                text: 'Diplodoc Админка',
                icon: logoIcon,
                href: '#',
                'aria-label': 'Diplodoc Админка',
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
