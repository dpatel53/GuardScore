'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLAN_TIERS } from '@/lib/plans'
import { CheckIcon, MinusIcon } from './icons'

export default function PricingCards() {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-pill p-1 text-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              !annual ? 'bg-accent text-accent-foreground' : 'text-muted'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-colors ${
              annual ? 'bg-accent text-accent-foreground' : 'text-muted'
            }`}
          >
            Annual
            <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success-text">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLAN_TIERS.map((plan) => {
          const price = annual ? Math.round(plan.price * 0.8) : plan.price
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-accent text-accent-foreground'
                  : 'border border-border bg-surface'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning-text">
                  Most popular
                </span>
              )}
              <p
                className={`text-xs font-medium tracking-wide ${
                  plan.popular ? 'text-white/60' : 'text-muted'
                }`}
              >
                {plan.name.toUpperCase()}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                <span className={plan.popular ? 'text-sm text-white/60' : 'text-sm text-muted'}>
                  /mo
                </span>
              </p>
              <p className={`mt-1 text-sm ${plan.popular ? 'text-white/70' : 'text-muted'}`}>
                {plan.description}
              </p>

              <Link
                href={`/login?mode=signup&plan=${plan.id}`}
                className={`mt-5 rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
                  plan.popular
                    ? 'bg-white text-accent'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                Start free trial
              </Link>

              <div
                className={`mt-6 flex flex-col gap-2.5 border-t pt-5 text-sm ${
                  plan.popular ? 'border-white/15' : 'border-border'
                }`}
              >
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckIcon className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-white' : 'text-foreground'}`} />
                    <span>{f}</span>
                  </div>
                ))}
                {plan.omitted.map((f) => (
                  <div
                    key={f}
                    className={`flex items-center gap-2 ${plan.popular ? 'text-white/40' : 'text-muted'}`}
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

      <p className="mt-8 text-center text-sm text-muted">
        All plans include a 14-day free trial. No card required to start.
      </p>
    </div>
  )
}
