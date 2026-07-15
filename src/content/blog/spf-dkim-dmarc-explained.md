---
title: "SPF, DKIM, and DMARC Explained for People Who Aren't IT Professionals"
description: "What SPF, DKIM, and DMARC actually mean in plain English, why your business email might be landing in spam, and what to do about it."
date: "2026-07-15"
---

If you've ever had a customer say "your email went to my spam folder," or gotten a warning from your email provider about "email authentication," you've bumped into this topic. Here's what these three terms actually mean, in plain English, and why they matter for a small business.

## The problem they solve

Anyone can technically send an email that says it's from "you@yourbusiness.com" — email wasn't originally built to verify who's really sending a message. Scammers exploit this to impersonate real businesses (this is called "spoofing"). Gmail, Outlook, and other providers now check for proof that an email claiming to be from your business actually came from your systems. If that proof is missing, your legitimate emails increasingly get flagged as spam too — you get caught in the crossfire of a problem you didn't create.

SPF, DKIM, and DMARC are the three pieces of that proof. You don't need to understand how they work internally — you need to know that all three should be set up, and what happens if they aren't.

## SPF — "these servers are allowed to send email as me"

SPF (Sender Policy Framework) is a list of which mail servers are allowed to send email on behalf of your domain. Think of it like a guest list at the door — if an email claims to be from your business but comes from a server not on your list, it looks suspicious to the receiving inbox.

**If it's missing or misconfigured:** legitimate emails from your business (including ones sent through tools like Mailchimp, Google Workspace, or your invoicing software) are more likely to be marked as spam.

## DKIM — "this email hasn't been tampered with"

DKIM (DomainKeys Identified Mail) attaches a digital signature to outgoing emails, proving the content wasn't altered in transit and really did originate from your domain. It's less like a guest list and more like a wax seal on a letter.

**If it's missing or misconfigured:** similar effect to a missing SPF record — inboxes have less reason to trust that your email is genuinely yours, which hurts deliverability.

## DMARC — "here's what to do if a message fails those checks"

DMARC ties SPF and DKIM together and tells receiving mail servers what to do if a message fails those checks — reject it, quarantine it (send to spam), or let it through anyway with just a report sent back to you. It also gives you visibility: DMARC reports show you who is sending email that claims to be from your domain, which is often the first sign someone is impersonating your business.

**If it's missing:** you have no policy in place at all, meaning inboxes fall back to their own guesswork about how to treat your mail, and you get zero visibility into whether someone is spoofing your business email.

## Why this matters even if you've "never had a problem"

The most common way this bites a small business isn't a dramatic security incident — it's a slow decline in email deliverability that's hard to notice because it happens gradually. An invoice that doesn't get opened, a follow-up email a client never saw, a booking confirmation that landed in spam. By the time you notice a pattern, you may have been losing business quietly for months.

## What to actually do about it

You don't need to become an email infrastructure expert. What you need is:

1. Confirmation that SPF, DKIM, and DMARC are all correctly configured for your domain today.
2. An alert if any of them break in the future (these can silently stop working after a hosting or provider change).
3. A plain-English explanation of what's wrong if something does break, not a raw technical report.
