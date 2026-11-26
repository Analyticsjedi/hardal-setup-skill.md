// pages/_app.tsx (Next.js Pages Router)
import type { AppProps } from "next/app";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        id="hrd-tracker"
        strategy="afterInteractive"
        src={`${process.env.NEXT_PUBLIC_HARDAL_COLLECT_URL}/tracker.js`}
        data-tenant-id={process.env.NEXT_PUBLIC_HARDAL_TENANT_ID}
        data-source-id={process.env.NEXT_PUBLIC_HARDAL_SOURCE_ID}
      />
      <Component {...pageProps} />
    </>
  );
}
