"use client";

import React, { useEffect, useRef } from "react";

interface SubtleGoldAuraProps {
  active?: boolean;
}

export const SubtleGoldAura: React.FC<SubtleGoldAuraProps> = ({ active = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const updateSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth || document.documentElement.clientWidth || 1200;
      canvas.height = window.innerHeight || document.documentElement.clientHeight || 800;
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    const w = canvas.width;
    const h = canvas.height;

    // Generate 75 continuous falling sacred flower petals (Pushpa Vrushti)
    const petalCount = 75;
    const petals = Array.from({ length: petalCount }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h, // Distributed across entire screen immediately
      size: Math.random() * 9 + 6, // 6px - 15px petal size
      speedY: Math.random() * 2.4 + 1.2, // Faster, steady downward fall (1.2 - 3.6 px/frame)
      speedX: (Math.random() - 0.5) * 0.6,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.08, // Fluttering rotation
      swayFactor: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.04 + 0.02, // Gentle horizontal sway
      color:
        Math.random() > 0.4
          ? "rgba(255, 215, 0, " // Bright 24k Gold Marigold
          : Math.random() > 0.5
          ? "rgba(255, 130, 160, " // Sacred Lotus Pink/Rose
          : "rgba(255, 180, 50, ", // Amber Gold Petal
      alpha: Math.random() * 0.55 + 0.4, // High contrast, bright opacity
    }));

    const render = () => {
      const currentW = canvas.width;
      const currentH = canvas.height;

      ctx.clearRect(0, 0, currentW, currentH);

      // Deep Pure Black Canvas Background (No Aura/Glow)
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, currentW, currentH);

      // Render Continuous Falling Sacred Flower Petals (Pushpa Vrushti)
      petals.forEach((p) => {
        p.y += p.speedY;
        p.swayFactor += p.swaySpeed;
        p.x += Math.sin(p.swayFactor) * 1.4 + p.speedX;
        p.angle += p.spinSpeed;

        if (p.y > currentH + 25) {
          p.y = -25;
          p.x = Math.random() * currentW;
        }
        if (p.x < -25) p.x = currentW + 25;
        if (p.x > currentW + 25) p.x = -25;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Draw Sculpted Petal Shape
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.45, p.size * 0.85, p.size * 0.45, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.45, -p.size * 0.85, -p.size * 0.45, 0, -p.size);
        ctx.closePath();

        // Fill with radiant petal color
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.fill();

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
