/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import RichTextRenderer from "../../../components/common/RichTextRenderer";

// 1. Update Interface to match Database/CMS output
interface Faq {
  id: string | number;
  question: string;
  // answer comes as JsonValue (object/array), not a simple string
  answer: any;
  // updatedAt comes as a Date object from the DB, but might be serialized to string later
  updatedAt?: string | Date;
  categories?: Array<{ category: { name: string } }>;
}

export default function FaqList({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | number | null>(null);

  // 2. Fix argument type: We pass the ID directly, not the SetStateAction
  const toggleFaq = (id: string | number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;

        return (
          <div
            key={faq.id}
            className={`group overflow-hidden rounded-xl border bg-white transition-all duration-400 shadow-sm
              ${isOpen ? "border-blue-300 shadow-md" : "border-slate-200"}`}
          >
            {/* Header / Trigger */}
            <button
              onClick={() => toggleFaq(faq.id)}
              className="flex w-full items-center justify-between p-4 sm:p-5 cursor-pointer outline-none select-none text-right"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300
                  ${
                    isOpen
                      ? "bg-blue-600 text-white rotate-180"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <ChevronDown size={18} />
                </div>

                <span
                  className={`text-base font-bold transition-colors leading-relaxed
                  ${isOpen ? "text-blue-700" : "text-slate-800"}`}
                >
                  {faq.question}
                </span>
              </div>

              {faq.categories?.[0]?.category?.name && (
                <span className="hidden md:inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded border border-slate-200 mr-4">
                  {faq.categories[0].category.name}
                </span>
              )}
            </button>

            {/* Animation Wrapper */}
            <div
              className={`grid transition-[grid-template-rows] duration-400 ease-in-out
              ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-6 pt-2 border-t border-slate-50 mr-12 ml-4">
                  <div className="prose prose-blue max-w-none text-slate-600 leading-8 text-justify font-medium pt-3 text-sm md:text-base">
                    {/* Render the JSON content */}
                    {faq.answer && <RichTextRenderer content={faq.answer} />}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                    <span className="opacity-70">
                      آخرین بروزرسانی:{" "}
                      {faq.updatedAt
                        ? new Date(faq.updatedAt).toLocaleDateString("fa-IR")
                        : "---"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
