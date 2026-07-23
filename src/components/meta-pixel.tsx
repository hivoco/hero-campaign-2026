"use client";

import Script from "next/script";
import { FB_PIXEL_ID } from "@/lib/fbpixel";

/**
 * Meta Pixel base install — loads fbevents.js once, then init + PageView. Custom
 * per-button events (Start_Journey / SEND_OTP / Generate_Video) fire via
 * trackPixel() from lib/fbpixel.ts. Loaded through next/script
 * (afterInteractive) so it never blocks first paint.
 *
 * No <noscript> fallback pixel: Next 16 only allows <noscript> in the document
 * <head>, and this campaign is a JS-required SPA — a JS-disabled browser can't
 * run the app at all, so that fallback would never fire.
 */
export function MetaPixel() {
  if (!FB_PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  );
}
