import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { BRAND_NAME, ACCENT_BACKGROUND_STYLE } from "~/config/brand";

const faqData = (brandName: string) => [
  {
    question: `How much does ${brandName} cost?`,
    answer: `$10/month after a 7-day free trial.`
  },
  {
    question: "What's included in the free trial?",
    answer: "Full access to everything: stock search with key metrics, side-by-side company comparisons, custom financial projections with scenario modeling, company financials, and interactive charts. No limitations, no credit card required."
  },
  {
    question: "How do the projections work and how can I use them?",
    answer: "Model future stock performance in three simple steps: (1) Input your growth assumptions for revenue and net income over 4 years, (2) Set expected P/E multiples (low and high estimates), (3) Instantly see projected stock prices and CAGR for 3-5 years. Run Bear, Base, and Bull scenarios to compare outcomes under different assumptions."
  },
];

export function FAQSection() {
  const faqs = faqData(BRAND_NAME);
  
  return (
    <section id="faq" className="py-24" style={ACCENT_BACKGROUND_STYLE}>
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-5xl font-bold text-center mb-12">
          Frequently asked questions
        </h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white border border-gray-200 rounded-lg px-6 shadow-sm"
            >
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline py-6 focus:outline-none focus-visible:outline-none">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 text-base pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

