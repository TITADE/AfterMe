# After Me — Pricing & Marketing Strategy

**Document status:** Working reference  
**Last updated:** March 2026  
**Author:** After Me Ltd

---

## The two products

### Annual subscription — £34.99/year

> *Renews automatically · cancel any time*

The low-friction entry point. Removes the commitment barrier for people who want to experience the product before making a long-term financial decision. At under £3/month, it sits below the threshold where most 40–65 year olds weigh a recurring charge consciously — it simply renews.

**What's included:**
- All core features — unlimited document storage
- Family Kit creation and updates
- All 8 document categories
- Personal messages to loved ones
- Encrypted iCloud backup
- Data always exportable in open format

**Positioning note:** The annual plan is an acquisition tool as much as a revenue stream. Once a user has spent one session scanning documents and creating a kit, they are emotionally invested and will convert to lifetime at renewal. Treat annual revenue as a bonus; treat annual subscribers as lifetime customers in waiting.

---

### Lifetime — one-time payment of £79.99

> *Pay once. Never again.*

The hero product. This is what After Me is designed around and what most of your marketing should lead with. A user who pays £79.99 has no churn risk, no renewal anxiety, no payment complications at the time of death, and will advocate harder for a product they feel they own.

**What's included:**
- Everything in the annual plan, permanently
- All future features — no upgrade fees, ever
- No renewal risk at death — your family inherits the access, not the invoice
- Unlimited Family Kit updates
- Priority support
- Open format guarantee — your data is yours, permanently

**Positioning note:** This is not "lifetime access to a subscription." It is the permanent, one-time version of a product that protects your family. Frame it accordingly.

---

## Why these specific numbers

### £34.99/year

Your demographic — adults aged 40–65 — will not compare this to Netflix. They will compare it to:

- A will-writing service: £100–£300
- A solicitor consultation: £200+
- A financial adviser appointment: £150–£300 per hour

Against that frame of reference, £34.99/year is not cheap — it is a serious product at a considered price. It is high enough to signal that After Me is a credible, maintained product by a real company, and low enough that it does not require a committee decision to buy. The original £29/year suggestion — while psychologically clever — risks signalling "hobby app" to a demographic that associates price with trustworthiness.

**£34.99 is still decisively below £35** — the psychological barrier — and sits comfortably in a different mental bracket to streaming services (£6–£15). It says: *this is important, not casual.*

### £79.99 lifetime

At £34.99/year, the lifetime plan pays for itself in **2.3 years**. Most users do that maths immediately and choose lifetime. This is the intended outcome.

Competitor context:
- **GoodTrust** (US): $149/year for a broadly similar concept
- **Farewill** (UK, will writing): £90 one-time
- **Everplans** (US): $75/year

£79.99 sits meaningfully below GoodTrust's annual price for something GoodTrust cannot match: true local-first, zero cloud, zero-knowledge architecture. It is also below the £100 psychological barrier. It is the price of a decent dinner for two. For a product that protects your family's access to everything that matters, that rationalisation is trivial for this demographic.

**Important:** Do not change the lifetime price before you have real conversion data. £79.99 is correctly anchored. After 6 months, A/B test £89.99. Security and legacy products often find that a higher price improves conversion in the 45–65 demographic, because price signals trustworthiness and permanence. But launch at £79.99 — it is proven territory.

---

## How to display pricing

### Rule 1: Anchor high — show lifetime first

Show the lifetime price first, larger, more prominent. Annual appears below as the "start smaller" option. Never reverse this. Showing annual first anchors the user to the lower number and makes lifetime feel expensive. The order should always be:

```
£79.99                    £34.99/year
Pay once. Never again.    Cancel any time.
[Choose lifetime]         [Start with annual]
```

### Rule 2: Frame lifetime around permanence, not price

Do not say: *"£79.99 one-time payment."*

Say: *"£79.99 — then never again."*

The emotional relief your user wants is not saving money. It is removing one more thing they have to think about and one more risk their family has to manage. "Never again" is the feeling. Lead with it.

### Rule 3: Show the maths — make the calculation trivial

On the pricing screen, display this explicitly:

> Annual plan × 3 years = £104.97. Lifetime = £79.99. You break even in under 2.5 years — and everything after that is free.

Users who see the calculation will choose lifetime at a significantly higher rate. Do not make them do mental arithmetic. Do it for them.

### Rule 4: Surface the death risk — honestly

This is unique to After Me. Say it plainly:

> *"With an annual plan, your family may need to manage a renewal after you're gone. With lifetime, they never will."*

This is not manipulation. It is a genuine, important, and differentiating product truth. It directly serves your user's goal — which is to simplify things for their family, not add complications. Users who understand this will consistently choose lifetime.

### Rule 5: Avoid "less than a coffee"

This phrase is overused in SaaS pricing and your demographic will find it patronising. They know what things cost. The "break even in under 2.5 years" and "never again" framings are far stronger. Do not dilute them.

---

## Free tier

**7-day full trial → read-only free tier, up to 5 documents**

The free tier is not a revenue tier. It is a conversion funnel.

Users who have scanned and stored 5 documents — a will, a passport, an insurance policy, a bank account summary, a personal message — are emotionally invested. They have experienced what the product does. The 5-document limit will feel natural rather than punitive, because the value of those 5 documents is already clear. They will pay to add more.

**Do not make the free tier feel broken.** It should work well. The limit should feel like a natural boundary, not a punishment. Users who feel punished by free tiers leave and do not return.

---

## What to configure in App Store Connect

| Product | Type | App Store Connect ID | Price |
|---|---|---|---|
| Annual subscription | Auto-Renewable Subscription | `com.afterme.app.premium.annual` | £34.99/year |
| Lifetime access | Non-Consumable | `com.afterme.app.premium.lifetime` | £79.99 |

**Subscription group:** Create a single subscription group. Name it "After Me Premium." Add the annual product to it. The lifetime product is a separate non-consumable, outside the subscription group.

**Trial:** Configure the 7-day free trial on the annual subscription via the subscription group settings in App Store Connect.

---

## Upgrade path — annual to lifetime

Build this before launch. At the annual renewal point (and surfaceable at any time in Settings), show:

> *"Switch to lifetime for £[discounted amount]. You've already paid £34.99 — put that towards owning After Me permanently."*

The discounted amount should reflect some credit for the annual payment, even if nominal. This is a high-conversion moment. Users who are renewing have already proven they value the product. Present them the permanent option before they process the renewal charge.

A suggested upgrade price: **£54.99** — splitting the difference and framing it as a reward for being an early user. This is psychologically compelling and fair.

---

## What to avoid at launch

**Do not launch a Family plan.** It sounds attractive. It doubles your support surface, complicates vault architecture, requires multi-user testing, and splits your marketing message. Launch with Personal only in two price points. Add Family as a named "coming soon" feature on the pricing screen to generate aspiration without the build burden. Revisit after your first 500 users.

---

## 6-month review triggers

After 6 months of live data, revisit the following:

1. **Annual-to-lifetime conversion rate.** If it is above 60%, the lifetime price may be too low. Test £89.99.
2. **Trial-to-paid conversion rate.** If it is below 15%, the 5-document limit may be too restrictive, or the paywall UX needs work.
3. **Churn rate on annual.** If annual churn is above 20%, the annual plan may be attracting the wrong user. Consider whether a higher annual price self-selects more committed users.
4. **Lifetime A/B test.** Run £79.99 vs £89.99 for 60 days. Security products often convert better at higher prices in the 45–65 demographic.

---

## Competitor reference

| Product | Model | Price | Notes |
|---|---|---|---|
| GoodTrust | Annual | ~$75–$149/yr | Cloud-first, US-focused, no local encryption |
| Everplans | Annual | ~$75/yr | US-focused, cloud-based |
| Farewill | One-time (will writing) | £90 | UK, different product but comparable demographic |
| Legacybox | One-time | $59–$159 | Digitisation service, not vault |
| **After Me** | Annual + Lifetime | £34.99/yr · £79.99 | Local-first, zero-knowledge, UK GDPR, family kit |

After Me's unique differentiator in this competitive set is not price — it is architecture. No competitor offers true local-first, zero-knowledge encryption with an open file format and family access designed around the actual death scenario. Lead with this in all marketing.

---

*This document is a working strategy reference. Update it as pricing data becomes available post-launch.*
