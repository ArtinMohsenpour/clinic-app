export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-red-500 text-2xl sm:text-4xl font-bold font-nastaliq">
          شرکت ما در خدمت شماست
        </div>
        <div className="grid min-h-screen p-8 sm:p-20 gap-16 font-sans">
          {/* Global fallback uses “bnazanin”, but you can override: */}
          <h1 className="text-4xl font-bold font-digikala">
            این عنوان با فونت Digikala
          </h1>
          <p className="text-xl font-nastaliq">این پاراگراف با فونت Nastaliq</p>
          <footer className="font-bnazanin">این فوتر با فونت B Nazanin</footer>
        </div>
      </main>
    </div>
  );
}
