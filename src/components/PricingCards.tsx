'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLAN_TIERS } from '@/lib/plans'
import { CheckIcon, MinusIcon } from './icons'

export default function PricingCards() {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      <div className="mb-14 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-white/10 p-1 text-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              !annual ? 'bg-white text-accent' : 'text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-colors ${
              annual ? 'bg-white text-accent' : 'text-white/70'
            }`}
          >
            Annual
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-[#93C5FD]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLAN_TIERS.map((plan) => {
          const price = annual ? Math.round(plan.annualPrice / 12) : plan.price
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-7 ${
                plan.popular
                  ? 'border-2 border-[#2F6FED] bg-[linear-gradient(180deg,#1D4ED8,#1e3a8a)] text-white'
                  : 'border border-white/10 text-white'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                  Most popular
                </span>
              )}
              <p
                className={`text-xs font-medium tracking-wide ${
                  plan.popular ? 'text-white/70' : 'text-white/50'
                }`}
              >
                {plan.name.toUpperCase()}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                <span className={plan.popular ? 'text-sm text-white/70' : 'text-sm text-white/50'}>
                  /mo
                </span>
              </p>
              {annual && (
                <p className={`text-xs ${plan.popular ? 'text-white/70' : 'text-white/50'}`}>
                  ${plan.annualPrice} billed annually
                </p>
              )}
              <p className={`mt-1 text-sm ${plan.popular ? 'text-white/70' : 'text-white/50'}`}>
                {plan.description}
              </p>

              <Link
                href={`/login?mode=signup&plan=${plan.id}`}
                className={`mt-5 rounded-full px-4 py-2.5 text-center text-sm font-semibold ${
                  plan.popular
                    ? 'bg-white text-[#1D4ED8]'
                    : 'border border-white/20 text-white hover:bg-white/5'
                }`}
              >
                Start free trial
              </Link>

              <div
                className={`mt-6 flex flex-col gap-2.5 border-t pt-5 text-sm ${
                  plan.popular ? 'border-white/15' : 'border-white/10'
                }`}
              >
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckIcon className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-white' : 'text-white/70'}`} />
                    <span className={plan.popular ? 'text-white/90' : 'text-white/70'}>{f}</span>
                  </div>
                ))}
                {plan.omitted.map((f) => (
                  <div
                    key={f}
                    className={`flex items-center gap-2 ${plan.popular ? 'text-white/40' : 'text-white/30'}`}
                  >
                    <MinusIcon className="h-4 w-4 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-white/50">
        All plans include a 14-day free trial. No card required to start.
      </p>
    </div>
  )
}
