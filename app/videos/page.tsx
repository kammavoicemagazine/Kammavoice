"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, ArrowLeft, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerLightTap, triggerSuccessHaptic } from "@/lib/haptic-utils";

interface Reel {
  id: string;
  videoUrl: string;
  title: string;
  titleTe: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  captionTe: string;
  captionEn: string;
}

const MOCK_REELS: Reel[] = [
  {
    id: "r1",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-39851-large.mp4",
    title: "Telugu Cinema Innovation 2026",
    titleTe: "తెలుగు సినిమా నూతన ఆవిష్కరణలు 2026",
    author: "Kamma Voice Entertainment",
    likes: 3840,
    comments: 245,
    shares: 1280,
    captionTe: "నూతన కథనాలు మరియు అధునాతన సాంకేతికతతో తెలుగు చిత్రసీమ 2026 లో సరికొత్త మైలురాళ్లను అందుకుంటోంది.",
    captionEn: "Telugu cinema is reaching new milestones in 2026 with fresh narratives and cutting-edge visual technologies."
  },
  {
    id: "r2",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-typing-on-a-luminous-keyboard-in-the-dark-40176-large.mp4",
    title: "Amaravati Tech Corridor Growth",
    titleTe: "అమరావతి ఐటీ కారిడార్ అభివృద్ధి",
    author: "Kamma Voice Business",
    likes: 4920,
    comments: 512,
    shares: 1940,
    captionTe: "అమరావతి ప్రాంతంలో నూతన ఐటీ స్టార్టప్ హబ్స్ వేగంగా విస్తరిస్తూ, వేలాది మంది యువతకు ఉపాధి అవకాశాలను సృష్టిస్తున్నాయి.",
    captionEn: "New IT startup hubs are expanding rapidly in the Amaravati region, generating thousands of jobs for youth."
  },
  {
    id: "r3",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-with-vertical-video-playing-40191-large.mp4",
    title: "Kamma Voice Cinematic App Launch",
    titleTe: "కమ్మ వాయిస్ ప్రీమియం యాప్ ప్రారంభం",
    author: "KV Tech",
    likes: 8520,
    comments: 928,
    shares: 4210,
    captionTe: "ఆఫ్‌లైన్ మ్యాగజైన్ డౌన్‌లోడ్‌లు, హ్యాప్టిక్ ఫీడ్‌బ్యాక్ మరియు అత్యంత వేగవంతమైన స్క్రోలింగ్‌తో కూడిన మా సరికొత్త యాప్‌ను ఇప్పుడే డౌన్‌లోడ్ చేసుకోండి.",
    captionEn: "Download our brand new mobile experience today featuring offline magazine reading, native haptics, and fluid navigation."
  }
];

export default function VideosPage() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);

  const handleBack = () => {
    triggerLightTap();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-40 bg-black text-white flex flex-col select-none">
      {/* Immersive Header overlay */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3 pt-safe-top">
        <button
          onClick={handleBack}
          className="p-2.5 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold font-[family-name:var(--font-playfair)] tracking-wider text-gold drop-shadow-md">
          REELS
        </span>
      </div>

      {/* Snap Scroll Video Container */}
      <div className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-16">
        {MOCK_REELS.map((reel) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            isMuted={isMuted}
            onToggleMute={() => {
              triggerLightTap();
              setIsMuted(!isMuted);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ReelItem({ reel, isMuted, onToggleMute }: { reel: Reel; isMuted: boolean; onToggleMute: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Auto Play/Pause on Scroll using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.log("[Reels] Autoplay blocked:", err));
          } else {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    triggerLightTap();
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayOverlay(true);
      setTimeout(() => setShowPlayOverlay(false), 800);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayOverlay(true);
          setTimeout(() => setShowPlayOverlay(false), 800);
        });
    }
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    triggerSuccessHaptic();
    setLiked(true);
    if (!liked) {
      setLikeCount((prev) => prev + 1);
    }

    const id = Date.now();
    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1000);
  };

  // Simple double tap detector
  let lastTap = 0;
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      handleDoubleTap(e);
    } else {
      handleVideoTap(e);
    }
    lastTap = now;
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightTap();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerLightTap();
    // Simulate share native sheet
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: reel.captionTe,
        url: window.location.href,
      }).catch(console.warn);
    } else {
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full snap-start snap-always relative bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Video element */}
      <div 
        onClick={handleTap}
        className="w-full h-full relative flex items-center justify-center cursor-pointer"
      >
        <video
          ref={videoRef}
          src={reel.videoUrl}
          className="w-full h-full object-cover md:max-w-md"
          loop
          muted={isMuted}
          playsInline
          webkit-playsinline="true"
        />

        {/* Shadow Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        {/* Large Play/Pause State Indicator Indicator */}
        <AnimatePresence>
          {showPlayOverlay && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-white pointer-events-none"
            >
              {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-tap animated hearts */}
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0], y: -80, rotate: Math.random() * 30 - 15 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute text-red-500 fill-red-500 pointer-events-none z-30"
            style={{ left: h.x - 24, top: h.y - 24 }}
          >
            <Heart className="w-12 h-12 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Right Side Interaction Panel */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-30">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLikeClick}
            className={`p-3 rounded-full border transition-all active:scale-90 cursor-pointer ${
              liked 
                ? "bg-red-500/25 border-red-500 text-red-500" 
                : "bg-black/40 border-white/10 text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
          </button>
          <span className="text-[10px] font-bold text-gray-300 drop-shadow-md">
            {likeCount}
          </span>
        </div>

        {/* Comments info placeholder */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); triggerLightTap(); }}
            className="p-3 rounded-full bg-black/40 border border-white/10 text-white transition-all active:scale-90 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-bold text-gray-300 drop-shadow-md">
            {reel.comments}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShareClick}
            className="p-3 rounded-full bg-black/40 border border-white/10 text-white transition-all active:scale-90 cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-bold text-gray-300 drop-shadow-md">
            {reel.shares}
          </span>
        </div>

        {/* Mute/Volume toggler */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="p-3 rounded-full bg-black/40 border border-white/10 text-white transition-all active:scale-90 cursor-pointer mt-2"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-gold" />}
        </button>
      </div>

      {/* Bottom Info & Captions Overlay */}
      <div className="absolute left-4 bottom-24 right-20 flex flex-col gap-3 text-left z-30 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gold drop-shadow-md">
            @{reel.author}
          </span>
          <h3 className="text-sm font-bold text-white leading-snug drop-shadow-md mt-1">
            {reel.titleTe}
          </h3>
          <p className="text-xs text-gray-400 font-semibold drop-shadow-md mt-0.5">
            {reel.title}
          </p>
        </div>

        {/* AI-Generated Telugu Captions container with frosted blur */}
        <div className="bg-black/40 backdrop-blur-md border border-white/[0.08] p-3 rounded-2xl flex flex-col gap-1.5 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[8px] font-bold text-gold uppercase tracking-wider">
              AI-Generated Telugu Captions
            </span>
          </div>
          <p className="text-xs leading-relaxed text-white/95 font-medium">
            {reel.captionTe}
          </p>
          <div className="border-t border-white/[0.06] pt-1.5 mt-0.5">
            <p className="text-[10px] text-gray-400 italic font-medium leading-normal">
              {reel.captionEn}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
