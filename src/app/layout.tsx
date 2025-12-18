import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
