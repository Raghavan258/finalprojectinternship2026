import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";

export const metadata: Metadata = {
  title: "ConnectMyEvent — Discover · Host · Connect",
  description: "The ultimate intelligent matching platform connecting ambitious participants, professional organizers, sponsors & judges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Chatbot />
      </body>
    </html>
  );
}
