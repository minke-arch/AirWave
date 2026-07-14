import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { BookingProvider } from "../context/BookingContext";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "에어웨이브 (AirWave) - 영화 예매 서비스",
  description: "Next.js & TailwindCSS v4로 개발된 현대적이고 반응성이 뛰어난 영화 예매 서비스 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-gray-900">
        <BookingProvider>
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
