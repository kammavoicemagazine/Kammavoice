"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, FileText, ArrowRight } from "lucide-react";
import type { Magazine } from "@/lib/types";

export default function MagazineHero({ magazine }: { magazine: Magazine }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#080808]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Cover Image — shown first on mobile */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
            className="flex items-center justify-center order-1 lg:order-2"
          >
            <Link href={`/magazine/${magazine.id}`} className="block relative group">
              {/* Magazine cover container */}
              <div className="relative w-[220px] sm:w-[260px] md:w-[280px] lg:w-[300px] aspect-[3/4] rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/[0.08] bg-[#111] transition-all duration-500 group-hover:shadow-[0_25px_70px_rgba(201,168,76,0.15)] group-hover:scale-[1.02]">
                <img
                  src={magazine.coverImageUrl}
                  alt={magazine.title}
                  className="object-contain w-full h-full"
                />
                {/* Glossy shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </div>
              
              {/* 3D Page edges */}
              <div className="absolute top-2 right-[-4px] bottom-2 w-[3px] bg-gradient-to-b from-gray-200 to-gray-300 rounded-r -z-10 transition-transform group-hover:translate-x-0.5" />
              <div className="absolute top-4 right-[-7px] bottom-4 w-[2px] bg-gradient-to-b from-gray-300 to-gray-400 rounded-r -z-20 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/[0.08] border border-gold/20 text-gold text-[11px] font-bold mb-5 tracking-[0.1em] uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Latest Issue</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] mb-3 text-white font-[family-name:var(--font-playfair)]">
              {magazine.title}
            </h1>
            
            {magazine.titleTelugu && (
              <p className="text-lg sm:text-xl text-gold/70 mb-5 font-medium font-[family-name:var(--font-playfair)]">
                {magazine.titleTelugu}
              </p>
            )}

            {/* Issue meta */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-sm text-gray-400 mb-7">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold/70" />
                {magazine.issueDate}
              </span>
              {magazine.volume && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="font-semibold text-gray-300">{magazine.volume}</span>
                </>
              )}
              {magazine.pageCount > 0 && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-gold/70" />
                    {magazine.pageCount} Pages
                  </span>
                </>
              )}
            </div>

            {/* CTA */}
            <Link
              href={`/magazine/${magazine.id}`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gold text-[#0A0A0A] font-bold text-base hover:bg-gold-light transition-all duration-300 hover:scale-[1.04] active:scale-95 group shadow-[0_4px_24px_rgba(201,168,76,0.25)] hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] cursor-pointer"
            >
              Read Magazine
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Bottom border accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </section>
  );
}
