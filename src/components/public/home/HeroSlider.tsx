"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Define the type for the slide data
type HeroSlideData = {
  id: string;
  title: string;
  description?: string | null;
  callToActionText?: string | null;
  callToActionUrl?: string | null;
  image?: {
    publicUrl: string | null;
    alt?: string | null;
  } | null;
};

interface HeroSliderProps {
  slides: HeroSlideData[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  // Auto-play functionality
  // useEffect(() => {
  //   if (slides.length <= 1) return;
  //   const timer = setInterval(() => {
  //     setCurrent((prev) => (prev + 1) % slides.length);
  //   }, 6000); // Change slide every 6 seconds
  //   return () => clearInterval(timer);
  // }, [slides.length]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div
      className="relative w-full h-[600px] sm:h-[700px] lg:h-[600px] overflow-hidden bg-gray-900 group font-yekan"
      dir="rtl"
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image */}
          {slide.image?.publicUrl ? (
            <Image
              src={slide.image.publicUrl}
              alt={slide.image.alt || slide.title}
              fill
              className="object-cover opacity-50 lg:opacity-60 transition-transform duration-[10000ms] ease-linear transform scale-100 hover:scale-105"
              priority={index === 0}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-900 to-slate-900 opacity-80" />
          )}

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center select-none ">
            <div className="container mx-auto px-6 sm:px-12 lg:px-60  ">
              <div className="max-w-fit flex flex-col items-start text-right px-5 py-5 bg-[#0000002e] shadow-lg shadow-gray-900 space-y-6 sm:space-y-8 backdrop-blur-[4px] rounded-3xl border-[1px] border-white/20">
                {/* Title */}
                <h2 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-[#ffffff] leading-tight drop-shadow-xl animate-in fade-in slide-in-from-right-8 duration-700">
                  {slide.title}
                </h2>

                {/* Description */}
                {slide.description && (
                  <p className="text-lg sm:text-xl lg:text-xl text-gray-100 leading-relaxed  drop-shadow-lg max-w-2xl animate-in fade-in slide-in-from-right-8 duration-700 delay-150 whitespace-pre-line">
                    {slide.description}
                  </p>
                )}

                {/* Button */}
                {slide.callToActionText && slide.callToActionUrl && (
                  <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <Link
                      href={slide.callToActionUrl}
                      className="backdrop-blur-[12px] inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 hover:bg-cms-secondary text-white border-2 border-[#ffffff51]  rounded-xl text-lg sm:text-xl font-bold transition-all transform hover:-translate-y-1 hover:shadow-xl shadow-md shadow-gray-900 active:scale-95"
                    >
                      {slide.callToActionText}
                      <ChevronLeft className="w-5 h-5 mr-2" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Controls (Only if multiple slides) */}
      {slides.length > 1 && (
        <>
          {/* Desktop/Tablet Arrows */}
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95"
            aria-label="Next Slide"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95"
            aria-label="Previous Slide"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Indicators (All Screens) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "bg-navbar-secondary w-12"
                    : "bg-white/40 hover:bg-white/70 w-6"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}