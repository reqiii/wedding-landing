'use client'

import { useState, useEffect, useRef } from 'react'
import { Glass } from '@/components/ui/Glass'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What time should I arrive?',
    answer: 'Please arrive by 3:45 PM to ensure you\'re seated before the ceremony begins at 4:00 PM.',
  },
  {
    question: 'Is there parking available?',
    answer: 'Yes, complimentary valet parking is available at the venue. Self-parking is also available nearby.',
  },
  {
    question: 'Can I bring a plus one?',
    answer: 'Please check your invitation or RSVP form for your specific guest count. If you have questions, contact us.',
  },
  {
    question: 'What if I have dietary restrictions?',
    answer: 'Please indicate any dietary restrictions or allergies in your RSVP form. We\'ll accommodate all dietary needs.',
  },
  {
    question: 'Will the ceremony be outdoors?',
    answer: 'The ceremony will be held in our beautiful garden venue. In case of inclement weather, we have an indoor backup location.',
  },
  {
    question: 'Is there a hotel block reserved?',
    answer: 'Yes, we have reserved rooms at the Napa Valley Inn. Details will be sent with your RSVP confirmation.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-20 px-4 max-w-4xl mx-auto"
    >
      <div
        className={`transition-all duration-[600ms] ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Glass variant="panel">
          <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-white/20 last:border-0 pb-4 last:pb-0">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full text-left flex justify-between items-center gap-4 focus-ring rounded-medium p-2 -m-2"
                  aria-expanded={openIndex === index}
                >
                  <h3 className="font-semibold text-dark-gray pr-4">{faq.question}</h3>
                  <span className="text-light-orange text-xl flex-shrink-0">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openIndex === index && (
                  <p className="text-medium-gray mt-3 pl-2">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </section>
  )
}
