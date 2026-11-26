// app/layout.tsx (Next.js App Router). Add the Script once, in the root layout.
import Script from "next/script";

const HRD_URL = process.env.NEXT_PUBLIC_HARDAL_COLLECT_URL!;   // e.g. https://analytics.example.com
const HRD_TENANT_ID = process.env.NEXT_PUBLIC_HARDAL_TENANT_ID!;
const HRD_SOURCE_ID = process.env.NEXT_PUBLIC_HARDAL_SOURCE_ID!;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          id="hrd-tracker"
          strategy="afterInteractive"
          src={`${HRD_URL}/tracker.js`}
          data-tenant-id={HRD_TENANT_ID}
          data-source-id={HRD_SOURCE_ID}
        />
      </body>
    </html>
  );
}

// .env.local (public values, safe to commit if the project commits other NEXT_PUBLIC_ values)
// NEXT_PUBLIC_HARDAL_COLLECT_URL=https://analytics.example.com
// NEXT_PUBLIC_HARDAL_TENANT_ID=11111111-1111-4111-8111-111111111111
// NEXT_PUBLIC_HARDAL_SOURCE_ID=22222222-2222-4222-8222-222222222222
