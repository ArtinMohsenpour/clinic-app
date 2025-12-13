import { getPatientIntakePageData } from "@/lib/data/patient-intake";
import RichTextRenderer from "@/components/common/RichTextRenderer";

export const metadata = {
  title: "راهنمای پذیرش | کلینیک تخصصی",
  description: "راهنمای پذیرش برای بیماران عمومی و مراحل پذیرش بیماران خاص (دیالیز).",
};

export default async function PatientIntakePage() {
  const pageData = await getPatientIntakePageData();

  return (
      <div className="bg-background-2" dir="rtl">
        {/* HERO */}
        <div className="relative isolate overflow-hidden px-6 py-12 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-20" />
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] shadow-xl shadow-cms-primary/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mt-2 text-4xl font-bold tracking-tight bg-gradient-to-l pb-3 from-cms-primary to-indigo-600 bg-clip-text text-transparent sm:text-6xl">
              {pageData?.title || "راهنمای پذیرش"}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              لطفاً بسته به نوع نیاز درمانی خود، راهنمای مربوطه را مطالعه فرمایید.
            </p>
          </div>

          {/* GUIDANCE SECTION: General vs Dialysis */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

              {/* 1. General Patients (Simple) */}
              <div className="rounded-2xl bg-white/60 backdrop-blur p-6 ring-1 ring-gray-200 shadow-sm flex flex-col h-fit">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  بیماران عمومی و درمانگاه
                </h2>
                <p className="text-gray-600 flex-grow leading-7">
                  برای مراجعات معمول پزشکی، چکاپ‌ها و ویزیت‌های عمومی، فرآیند پذیرش ساده است. کافیست با همراه داشتن کارت شناسایی مراجعه فرمایید.
                </p>
                <div className="mt-6 rounded-xl bg-green-50/50 p-4 border border-green-100">
                  <h3 className="font-semibold text-green-800 text-sm mb-2">مدارک و مراحل:</h3>
                  <ul className="list-disc pr-4 space-y-1 text-sm text-gray-700">
                    <li>کارت ملی یا شناسنامه</li>
                    <li>دفترچه بیمه (در صورت وجود)</li>
                    <li>مراجعه به باجه پذیرش یا دریافت نوبت آنلاین</li>
                  </ul>
                </div>
              </div>

              {/* 2. Dialysis Patients (Special Disease Protocol) */}
              <div className="rounded-2xl bg-white backdrop-blur p-6 ring-1 ring-red-200 shadow-md flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  بیماران دیالیزی (بیماران خاص)
                </h2>
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-100">
                  <strong>توجه بسیار مهم:</strong> جهت دریافت خدمات رایگان دیالیز، شما باید ابتدا در سیستم بیمه به عنوان «بیمار خاص» نشان‌دار شده باشید. بدون این تاییدیه، بیمه هزینه‌ها را پوشش نمی‌دهد.
                </div>

                <div className="space-y-4 mt-auto">
                  <div className="relative pl-4 border-r-2 border-gray-200 pr-4 pb-2">
                    <div className="absolute -right-1.5 top-1 h-3 w-3 rounded-full bg-red-500"></div>
                    <h4 className="text-sm font-bold text-gray-900">۱. دریافت معرفی‌نامه پزشک</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      دریافت نامه از متخصص نفرولوژی که نیاز به دیالیز را تایید کند (همراه با آزمایشات کراتینین و اوره).
                    </p>
                  </div>

                  <div className="relative pl-4 border-r-2 border-gray-200 pr-4 pb-2">
                    <div className="absolute -right-1.5 top-1 h-3 w-3 rounded-full bg-red-500"></div>
                    <h4 className="text-sm font-bold text-gray-900">۲. مراجعه به اداره بیمه (نشان‌دار شدن)</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      مراجعه به اداره بیمه (سلامت یا تامین اجتماعی) یا سامانه شهروندی جهت ثبت بیماری در «صندوق بیماری‌های خاص».
                      <br/>
                      <span className="text-red-600 font-medium">مدارک لازم:</span> تاییدیه پزشک، کارت ملی، شناسنامه و سوابق پاتولوژی.
                    </p>
                  </div>

                  <div className="relative pl-4 border-r-2 border-gray-200 pr-4 pb-2">
                    <div className="absolute -right-1.5 top-1 h-3 w-3 rounded-full bg-red-500"></div>
                    <h4 className="text-sm font-bold text-gray-900">۳. دریافت تاییدیه (حواله الکترونیک)</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      پس از ثبت در سامانه بیمه، وضعیت شما به «بیمار خاص» تغییر کرده و سهمیه دیالیز فعال می‌شود.
                    </p>
                  </div>

                  <div className="relative pl-4 border-gray-200 pr-4">
                    <div className="absolute -right-1.5 top-1 h-3 w-3 rounded-full bg-green-500"></div>
                    <h4 className="text-sm font-bold text-gray-900">۴. مراجعه به کلینیک جهت پذیرش</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      همراه با مدارک تایید شده بیمه و آزمایشات ویروسی (HBsAg, HIV, HCV) جهت تشکیل پرونده به کلینیک مراجعه کنید.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* BODY - Rich Text (CMS Content) */}
          <div className="mx-auto mt-12 max-w-5xl">
            {pageData?.body ? (
                <div className="rounded-2xl bg-white/60 backdrop-blur p-4 sm:p-6 shadow-sm ring-1 ring-gray-900/5">
                  <RichTextRenderer content={pageData.body} />
                </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}