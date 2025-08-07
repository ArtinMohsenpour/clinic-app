"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    image:
      "https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    title: "خدمات پیشرفته پزشکی",
    subtitle: "سلامتی شما، اولویت ما",
    description:
      "با تیمی متعهد از متخصصان و تجهیزات مدرن، مراقبت‌های پزشکی در سطح جهانی را تجربه کنید.",
    buttonText: "بیشتر بدانید",
    buttonLink: "/about",
  },
  {
    id: 2,
    image:
      "https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    title: "خدمات جامع درمانی",
    subtitle: "همه نیازهای پزشکی در یک مکان",
    description:
      "از چکاپ‌های دوره‌ای تا درمان‌های تخصصی، همه خدمات پزشکی مورد نیاز شما را ارائه می‌دهیم.",
    buttonText: "مشاهده خدمات",
    buttonLink: "/services",
  },
  {
    id: 3,
    image:
      "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    title: "تیم متخصصان برجسته",
    subtitle: "باور به سلامت شما",
    description:
      "تیمی از پزشکان و پرسنل حرفه‌ای برای ارائه بهترین مراقبت‌ها در کنار شما هستند.",
    buttonText: "تماس با ما",
    buttonLink: "/contact",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative w-full h-[600px] overflow-hidden rounded-lg ">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-full h-full relative">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority
              sizes="100vw"
              quality={100}
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-start px-8 md:px-16">
            <div className="max-w-2xl text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {slide.title}
              </h2>
              <p className="text-xl mb-4">{slide.subtitle}</p>
              <p className="text-lg mb-6">{slide.description}</p>
              <a
                href={slide.buttonLink}
                className="bg-[#00A390] hover:bg-[#00796b] text-white px-6 py-3 rounded-full font-semibold transition"
              >
                {slide.buttonText}
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-[#00A390] p-3 rounded-full transition z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-[#00A390] p-3 rounded-full transition z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-[#00A390] scale-110" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
