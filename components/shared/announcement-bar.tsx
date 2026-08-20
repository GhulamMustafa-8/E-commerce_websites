'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Truck, ShieldCheck } from 'lucide-react';

const messages = [
  { icon: Truck, text: 'Free shipping on orders over PKR 5,000' },
  { icon: ShieldCheck, text: 'Secure payments & 7-day easy returns' },
  { icon: Sparkles, text: 'New arrivals every week — shop the latest' },
];

export function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, []);
  const Msg = messages[idx];
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container-ec flex h-9 items-center justify-center gap-2 text-xs font-medium sm:text-sm">
        <Msg.icon className="h-4 w-4 shrink-0" />
        <span className="animate-fade-in">{Msg.text}</span>
      </div>
    </div>
  );
}
