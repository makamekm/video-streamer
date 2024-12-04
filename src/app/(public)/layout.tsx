import { Suspense } from 'react'
import type { Metadata } from "next";
import localFont from "next/font/local";
import {getRootClassName} from '@gravity-ui/uikit/server';
import "../globals.css";
import "../theme.scss";

const theme = 'dark';
const rootClassName = getRootClassName({theme});

import {configure, ThemeProvider, ToasterComponent, ToasterProvider} from '@gravity-ui/uikit';
import Loading from "../components/loading";

configure({
  lang: 'ru',
});

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Стриминг видео",
  description: "Админка для стриминга видео",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense>
      <ThemeProvider theme={theme}>
        <html lang="en" className={rootClassName}>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
          >
            <ToasterProvider>
              {children}
              <ToasterComponent />
            </ToasterProvider>
            <Loading theme="dark" />
          </body>
        </html>
      </ThemeProvider>
    </Suspense>
  );
}
