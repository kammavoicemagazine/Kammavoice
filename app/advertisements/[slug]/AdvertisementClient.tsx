"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhoneCall, Globe, Share2, MessageCircle } from "lucide-react";
import { Advertisement } from "@/lib/types";
import { incrementAdClick, incrementAdImpression } from "@/lib/firestore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { shareContent } from "@/lib/capacitor-init";

interface Props {
  ad: Advertisement;
}

export default function AdvertisementClient({ ad }: Props) {
  const [impressionLogged, setImpressionLogged] = useState(false);

  useEffect(() => {
    if (!impressionLogged && ad.id) {
      incrementAdImpression(ad.id);
      setImpressionLogged(true);
    }
  }, [ad.id, impressionLogged]);

  const handleLinkClick = () => {
    if (ad.id) {
      incrementAdClick(ad.id);
    }
  };

  const handleShare = async () => {
    const title = `${ad.sponsorName || ad.title} | Kamma Voice Sponsor`;
    const text = ad.description || "Check out this sponsor on Kamma Voice Magazine.";
    const url = window.location.href;

    try {
      await shareContent(title, text, url);
      toast.success("Opened share options!");
    } catch (error) {
      // Fallback
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out this sponsor on Kamma Voice Magazine: ${ad.sponsorName || ad.title}\n\n${window.location.href}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
            {/* Banner Image */}
            <div className="relative aspect-[21/9] w-full bg-black/10">
              <Image
                src={ad.imageUrl}
                alt={ad.sponsorName || ad.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  {ad.featured && (
                    <span className="inline-block bg-gold/20 text-gold text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                      Featured Sponsor
                    </span>
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-playfair)] text-gold-gradient">
                    {ad.sponsorName || ad.title}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="p-3 bg-surface hover:bg-surface-hover border border-border-subtle rounded-xl text-muted transition-colors flex items-center justify-center shadow-sm"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {ad.description && (
                <div className="prose prose-invert max-w-none mb-10">
                  <p className="text-lg text-muted/90 leading-relaxed whitespace-pre-wrap">
                    {ad.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-border-subtle">
                {(ad.website || ad.linkUrl) && (
                  <Link
                    href={ad.website || ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-gold text-[#0A0A0A] font-semibold rounded-xl hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Website
                  </Link>
                )}

                {ad.contactNumber && (
                  <Link
                    href={`tel:${ad.contactNumber}`}
                    onClick={handleLinkClick}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-surface border border-border-subtle text-foreground font-semibold rounded-xl hover:bg-surface-hover transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-5 h-5" />
                    Call Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
