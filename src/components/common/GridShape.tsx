"use client";

import Image from "next/image";
import React from "react";

export default function GridShape() {
  return (
    <>
      {/* Mining Layer Background with Zoom Effect - Full Size, No Tint */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="mining-layer-zoom absolute inset-0 w-full h-full">
          <Image
            fill
            src="/images/mining-layer.jpeg"
            alt="mining layers"
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
      </div>

      {/* Stratum Branding with Mining Elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center space-y-6 mining-fade-in">
          <div className="relative">
            <h1 className="text-6xl xl:text-8xl font-bold text-white/10 dark:text-white/5 tracking-wider">
              STRATUM
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            </div>
          </div>
          <p className="text-white/20 dark:text-white/10 text-sm tracking-[0.3em] uppercase">
            Mining Operations Platform
          </p>
        </div>
      </div>

      {/* Animated Layer Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        <div className="layer-line layer-line-1"></div>
        <div className="layer-line layer-line-2"></div>
        <div className="layer-line layer-line-3"></div>
      </div>

      <style jsx>{`
        @keyframes miningZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.2);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideLayer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .mining-layer-zoom {
          animation: miningZoom 15s ease-in-out infinite alternate;
          transform-origin: center center;
        }

        .mining-fade-in {
          animation: fadeIn 10s ease-out;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.15;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}