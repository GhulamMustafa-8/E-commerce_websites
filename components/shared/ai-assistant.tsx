'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import { formatPKR, effectivePrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
}

const SUGGESTIONS = [
  'Show me headphones under 15000 PKR',
  'What are your best sellers?',
  'Help me find a gift',
  'Do you have running shoes?',
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your shopping assistant. Ask me to find products, compare options, or answer store FAQs." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const q = text.toLowerCase();
      let query = supabase.from('products').select('*, brand:brands(*), category:categories(*), product_images(*)').eq('is_published', true);

      const priceMatch = q.match(/under\s*(\d{3,})/);
      if (priceMatch) {
        query = query.lte('price', Number(priceMatch[1]));
      }
      if (q.includes('best seller') || q.includes('bestseller')) {
        query = query.eq('is_bestseller', true);
      }
      if (q.includes('new')) {
        query = query.eq('is_new', true);
      }
      if (q.includes('shoe') || q.includes('sneaker')) {
        query = query.ilike('name', '%sneaker%');
      }
      if (q.includes('headphone')) {
        query = query.ilike('name', '%headphone%');
      }
      if (q.includes('dress')) {
        query = query.ilike('name', '%dress%');
      }
      if (q.includes('serum') || q.includes('beauty')) {
        query = query.ilike('name', '%serum%');
      }
      if (q.includes('gift')) {
        query = query.eq('is_featured', true);
      }

      const { data } = await query.limit(4);
      const products = (data as Product[]) ?? [];

      let reply: string;
      if (products.length > 0) {
        reply = `I found ${products.length} product${products.length > 1 ? 's' : ''} for you:`;
      } else {
        reply = "I couldn't find exact matches, but you can browse our full catalog. Try asking about headphones, sneakers, dresses, or serums!";
      }

      setMessages((m) => [...m, { role: 'assistant', content: reply, products }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble searching. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full p-0 shadow-lg"
        size="icon"
        aria-label="Open AI assistant"
      >
        <Bot className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Shopping Assistant
            </SheetTitle>
            <SheetDescription className="sr-only">Chat with the AI shopping assistant</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1" ref={scrollRef as never}>
            <div className="flex flex-col gap-3 p-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{m.content}</p>
                    {m.products && m.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.products.map((p) => (
                          <Link key={p.id} href={`/products/${p.slug}`} onClick={() => setOpen(false)} className="flex gap-2 rounded-md bg-background p-2 hover:bg-accent">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                              {p.product_images?.[0]?.url && (
                                <img src={p.product_images[0].url} alt={p.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="line-clamp-1 text-xs font-medium">{p.name}</span>
                              <span className="text-xs font-semibold">{formatPKR(effectivePrice(p.price, p.sale_price))}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 border-t p-3"
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything…" aria-label="Message" />
            <Button type="submit" size="icon" disabled={loading} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
