import { Bebas_Neue, Archivo_Black, Space_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QRTRANSFER",
  description: "offline file transfer. no internet. just light.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${archivoBlack.variable} ${spaceMono.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-archivo-black)" }}
      >
        {children}
      </body>
    </html>
  );
}
