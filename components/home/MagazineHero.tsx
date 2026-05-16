"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import type { Magazine } from "@/lib/types";

export default function MagazineHero({ magazine }: { magazine: Magazine }) {
  return (
    <section className="relative w-full min-h-[80vh] min-h-[80dvh] lg:h-[85vh] flex items-center bg-[#0A0A0A] overflow-hidden">
      {/* Background Blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src={magazine.coverImageUrl}
          alt=""
          fill
          className="object-cover opacity-20 blur-3xl scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent lg:via-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-semibold mb-6">
              <BookOpen className="w-4 h-4" />
              <span>Latest Issue</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 font-[family-name:var(--font-playfair)]">
              {magazine.title}
            </h1>
            
            {magazine.titleTelugu && (
              <p className="text-xl sm:text-2xl text-gold/80 mb-6 font-medium">
                {magazine.titleTelugu}
              </p>
            )}

            <div className="flex items-center justify-center lg:justify-start gap-4 text-muted mb-8">
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-gold" />
                {magazine.issueDate}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border-subtle" />
              <span className="text-sm font-medium">{magazine.volume}</span>
              {magazine.pageCount > 0 && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-border-subtle" />
                  <span className="text-sm">{magazine.pageCount} Pages</span>
                </>
              )}
            </div>

            <Link
              href={`/magazine/${magazine.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gold text-[#0A0A0A] font-bold text-base sm:text-lg hover:bg-gold-light transition-all hover:scale-105 active:scale-95 group min-h-[48px]"
            >
              Read Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Cover Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="flex-1 w-full max-w-md lg:max-w-none perspective-1000 order-1 lg:order-2"
          >
            <Link href={`/magazine/${magazine.id}`} className="block relative group">
              <div className="relative aspect-[3/4] w-full rounded-sm overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-1">
                <Image
                  src={magazine.coverImageUrl}
                  alt={magazine.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%]" />
              </div>
              
              {/* Fake 3D pages effect behind cover */}
              <div className="absolute top-1 right-[-4px] bottom-1 w-2 bg-gray-300 rounded-r shadow-[inset_-1px_0_2px_rgba(0,0,0,0.2)] -z-10" />
              <div className="absolute top-2 right-[-8px] bottom-2 w-2 bg-gray-200 rounded-r shadow-[inset_-1px_0_2px_rgba(0,0,0,0.1)] -z-20" />
            </Link>
          </motion.div>

        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
}
