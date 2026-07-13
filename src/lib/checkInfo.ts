import type { CheckType } from './checks'

export interface CheckInfo {
  label: string
  whyItMatters: string
  whatToDo: string
}

export const CHECK_INFO: Record<CheckType, CheckInfo> = {
  uptime: {
    label: 'Website uptime',
    whyItMatters:
      'If your website goes down, anyone trying to find your hours, book with you, or check pricing hits a dead page and usually just leaves for a competitor. Most owners only find out their site was down when a customer mentions it, days later.',
    whatToDo:
      'Contact your web host\'s support and ask if there was an outage on their end. Many hosts have a status page you can check yourself. If your site goes down often, that\'s a sign it may be time to consider a more reliable host.',
  },
  page_speed: {
    label: 'Homepage speed',
    whyItMatters:
      'A slow-loading homepage frustrates visitors and hurts your search engine ranking. Most people leave a site that takes more than a few seconds to load and go to a faster competitor instead.',
    whatToDo:
      'Send this to whoever built or maintains your website and ask them to "look into page speed." Common fixes are compressing images, upgrading hosting, or removing unnecessary plugins. If you\'re on a website builder like Squarespace, Wix, or Shopify, this is usually already handled for you.',
  },
  ssl: {
    label: 'SSL certificate',
    whyItMatters:
      'Your SSL certificate is what makes the padlock show up in a browser. When it expires, every visitor sees a "your connection is not private" warning instead of your site, and most people leave immediately.',
    whatToDo:
      'You probably don\'t need to do anything yourself. Contact your website host (whoever you pay to keep your site online) and ask them to "renew the SSL certificate." Most hosts handle this automatically once you ask, or can turn on auto-renewal for you.',
  },
  tls_strength: {
    label: 'Connection security (TLS)',
    whyItMatters:
      "This checks the actual technology your server uses to encrypt visitor connections, separate from whether your SSL certificate has expired. Old, deprecated versions (TLS 1.0/1.1) have known weaknesses, and most modern security standards and cyber insurance policies now require them switched off.",
    whatToDo:
      'Contact your web host and ask them to "disable TLS 1.0 and 1.1 and only allow TLS 1.2 and above." This is a server setting, not something fixed on your website itself, and most hosts can turn it off in minutes.',
  },
  domain_expiry: {
    label: 'Domain expiry',
    whyItMatters:
      'If your domain registration lapses, your website and every email address on that domain go down, and someone else can register it out from under you.',
    whatToDo:
      'Go to the website where you originally bought your domain name (like GoDaddy or Namecheap), log in, and click "renew" next to your domain. Turning on auto-renew there means you\'ll never have to think about this again.',
  },
  spf: {
    label: 'Email spoofing (SPF)',
    whyItMatters:
      'SPF tells other mail servers which servers are allowed to send email as your domain. Without it, scammers can send email that looks like it came from you, often to phish your own customers or vendors.',
    whatToDo:
      'You don\'t need to fix this yourself. Contact whoever manages your business email (your IT person, or the support team for Google Workspace / Microsoft 365 if that\'s who you use) and say: "please set up an SPF record for our domain." It\'s a quick, routine fix on their end.',
  },
  spf_lookup_limit: {
    label: 'SPF lookup limit',
    whyItMatters:
      'SPF records are only allowed to trigger 10 DNS lookups when a mail server checks them. This is easy to go over once you add several tools that send email as you, like Mailchimp, Salesforce, or a CRM, since each one adds its own lookup. If you go over the limit, mail servers are supposed to treat your entire SPF record as broken, which quietly cancels out the protection SPF is supposed to give you, with no obvious warning.',
    whatToDo:
      'Contact whoever manages your business email or IT and say: "our SPF record is over the 10 DNS lookup limit, can you consolidate or flatten it?" This usually means combining redundant entries or using an SPF flattening service. Don\'t try to edit this yourself, it\'s easy to accidentally break all outgoing mail.',
  },
  dkim: {
    label: 'Email spoofing (DKIM)',
    whyItMatters:
      'DKIM adds an invisible digital stamp to your outgoing email so other mail providers can confirm it really came from you. Without it, your mail is more likely to land in spam, and easier for scammers to fake.',
    whatToDo:
      'Contact your email provider\'s support (or your IT person) and ask them to "turn on DKIM" for your domain. For Google Workspace or Microsoft 365, this is usually a single setting they can switch on for you.',
  },
  dmarc: {
    label: 'Email spoofing (DMARC)',
    whyItMatters:
      'DMARC tells other mail providers what to do with email that fails your SPF/DKIM checks. Without it, emails faking your business are much more likely to land in your customers\' inboxes.',
    whatToDo:
      'Contact your IT person or web host and ask them to "add a DMARC record" for your domain. This is a small, one-time change on their end that makes it much harder for scammers to impersonate your business by email.',
  },
  bimi: {
    label: 'Brand logo in inbox (BIMI)',
    whyItMatters:
      "BIMI puts your logo next to your emails in Gmail, Yahoo, and Apple Mail, which makes your business look more legitimate and builds trust with customers. It's completely optional, not a security risk to skip, but it only works once your DMARC policy is set to actively block spoofed email (see the DMARC check).",
    whatToDo:
      'If you want your logo to show up in customer inboxes, first make sure your DMARC check above shows an enforcing policy. Then contact whoever manages your marketing or website and ask them to "set up a BIMI record" with your logo. Many email marketing platforms, like Mailchimp or Constant Contact, have simple guides for this.',
  },
  headers: {
    label: 'Security headers',
    whyItMatters:
      'These are a few invisible settings that tell a visitor\'s browser to automatically block common attacks on your site, things like tricking it into loading unsafe content.',
    whatToDo:
      'If your site is on a modern platform like Squarespace, Wix, or Shopify, this is often handled for you already. Otherwise, send this to whoever built or maintains your website and ask them to "add the missing security headers", it\'s usually a quick fix for a developer.',
  },
  blocklist: {
    label: 'Blocklist status',
    whyItMatters:
      'If your domain ends up on a spam or malware blocklist, your emails stop reaching inboxes and some browsers or antivirus tools may warn people away from your site entirely, even if nothing is actually wrong with your business.',
    whatToDo:
      'This is usually caused by a hacked website, a compromised email account, or a shared hosting neighbor behaving badly. Contact your web host immediately, tell them your domain is blocklisted, and ask them to help you get it removed and secured.',
  },
  cms_version: {
    label: 'Website software version',
    whyItMatters:
      'Outdated website software (like an old version of WordPress) is one of the most common ways small business sites get hacked, since known security holes in old versions are public information that scammers actively scan the internet for.',
    whatToDo:
      'Contact whoever built or maintains your website and ask them to "update WordPress to the latest version." Most sites can do this with one click from the admin dashboard, and it\'s worth doing regularly, not just when we flag it.',
  },
  caa: {
    label: 'Certificate authority restriction (CAA)',
    whyItMatters:
      "This is an optional DNS record that lists which certificate providers are allowed to issue an SSL certificate for your domain. Without it, any certificate authority in the world could technically issue a certificate for your domain, whether by mistake or by an attacker exploiting a weak provider.",
    whatToDo:
      'This is optional, low-priority hygiene, not an urgent fix. If you want it, contact whoever manages your DNS (your host or IT person) and ask them to "add a CAA record" naming your certificate provider.',
  },
  dnssec: {
    label: 'DNS security (DNSSEC)',
    whyItMatters:
      "DNSSEC digitally signs your DNS records so they can't be silently redirected or spoofed by an attacker intercepting DNS traffic. It's an advanced, optional protection most small business domains don't have set up.",
    whatToDo:
      'This is optional, low-priority hygiene, not an urgent fix. If you want it, contact your domain registrar (like GoDaddy or Namecheap) and ask them to "enable DNSSEC" for your domain. Many registrars can turn it on with one click.',
  },
}
