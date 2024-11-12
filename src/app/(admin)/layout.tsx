import type { Metadata } from "next";
import localFont from "next/font/local";
import {getRootClassName} from '@gravity-ui/uikit/server';
import "../globals.css";
import "../theme.scss";

const theme = 'light';
const rootClassName = getRootClassName({theme});

import {configure, ThemeProvider, ToasterComponent, ToasterProvider} from '@gravity-ui/uikit';
import Loading from "../components/loading";
import MenuLayout from "../menu-layout";

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
  title: "Diplodoc Админка",
  description: "Diplodoc Админка для дежурных",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider theme={theme}>
      <html lang="en" className={rootClassName}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToasterProvider>
            <MenuLayout>
              {children}
            </MenuLayout>
            <ToasterComponent />
          </ToasterProvider>
          <Loading theme="light" />
        </body>
      </html>
    </ThemeProvider>
  );
}
