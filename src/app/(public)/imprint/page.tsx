import { getImprintPage } from "@/lib/data/home";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getImprintPage();
  if (!page) return {};
  return {
    title: page.title,
  };
}

export default async function ImprintPage() {
  const page = await getImprintPage();

  if (!page) {
    notFound();
  }

  // Helper to render body content based on its type (string vs JSON block)
  const renderBody = () => {
    if (!page.body) return null;

    // If it's a simple string (e.g. from a simple textarea or HTML string)
    if (typeof page.body === "string") {
      // Check if it looks like HTML (starts with a tag)
      // This allows simple text with newlines to render as whitespace-pre-line,
      // while HTML content (from a rich editor) renders via innerHTML.
      const isHtml = /<[a-z][\s\S]*>/i.test(page.body);

      if (isHtml) {
        return <div dangerouslySetInnerHTML={{ __html: page.body }} />;
      }

      // Fallback for plain text: preserves newlines
      return <div className="whitespace-pre-line">{page.body}</div>;
    }

    // If it's a JSON object (e.g. from a rich text editor),
    // for now we stringify it until a specific renderer is implemented.
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 bg-gray-50 p-4 rounded-md overflow-x-auto">
        {JSON.stringify(page.body, null, 2)}
      </pre>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Centered Title with no divider */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-yekan text-navbar-secondary mb-4">
          {page.title}
        </h1>
      </div>

      <div className="bg-white p-8 md:p-12 shadow-sm rounded-2xl border border-gray-300 min-h-[400px]">
        {/* Using 'prose' (Tailwind Typography) for rich text styling. 
            'prose-lg' for larger text, 'max-w-none' to fill container.
            'prose-slate' for neutral colors.
        */}
        <div className="prose prose-lg prose-slate text-lg  max-w-none font-yekan text-gray-700 leading-relaxed text-justify">
          {renderBody()}
        </div>

        {/* Contact Items Section */}
        {page.contactItems && page.contactItems.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold font-yekan text-navbar-secondary mb-8 text-center">
              اطلاعات تماس
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {page.contactItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center w-full bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 p-6 rounded-xl border border-gray-100"
                >
                  <span className="text-gray-500 font-bold mb-3 font-yekan text-lg">
                    {item.label}
                  </span>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navbar-secondary hover:text-blue-600 font-medium dir-ltr text-lg transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="font-medium dir-ltr text-gray-800 select-all text-lg">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
