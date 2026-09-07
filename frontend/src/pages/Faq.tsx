import { ChevronDown } from 'lucide-react'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { FAQ_ITEMS } from '../data/faqContent'

export default function Faq() {
  return (
    <CustomerLayout title="Common internet issues" showBack>
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-base leading-6 text-text-secondary">
          Answers to the questions we hear most. If yours isn't here, scanning your router will
          usually find the exact issue.
        </p>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border bg-card shadow-sm open:pb-1"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-medium text-text marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {item.question}
                <ChevronDown
                  size={20}
                  className="shrink-0 text-text-secondary transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="px-4 pb-3 text-base leading-6 text-text-secondary">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </CustomerLayout>
  )
}
