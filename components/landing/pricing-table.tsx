'use client'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: PlanFeature[]
  cta: string
  highlighted: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '\u00A30',
    period: 'forever',
    description: 'Get started with basic monitoring',
    features: [
      { text: '5 monitors', included: true },
      { text: '5-minute check interval', included: true },
      { text: 'Email alerts', included: true },
      { text: '1 status page', included: true },
      { text: '7-day data retention', included: true },
      { text: 'AI reports', included: false },
      { text: 'Slack & Teams alerts', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '\u00A319',
    period: '/month',
    description: 'For growing teams and projects',
    features: [
      { text: '25 monitors', included: true },
      { text: '1-minute check interval', included: true },
      { text: 'Email & Slack alerts', included: true },
      { text: '5 status pages', included: true },
      { text: '90-day data retention', included: true },
      { text: 'AI reports (5/month)', included: true },
      { text: 'Webhook alerts', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '\u00A349',
    period: '/month',
    description: 'Full power for serious monitoring',
    features: [
      { text: '100 monitors', included: true },
      { text: '30-second check interval', included: true },
      { text: 'All alert channels', included: true },
      { text: 'Unlimited status pages', included: true },
      { text: '1-year data retention', included: true },
      { text: 'Unlimited AI reports', included: true },
      { text: 'Webhook + HMAC signing', included: true },
      { text: 'Full API access', included: true },
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '\u00A3149',
    period: 'one-time',
    description: 'White-label monitoring for agencies',
    features: [
      { text: 'Unlimited monitors', included: true },
      { text: '30-second check interval', included: true },
      { text: 'All alert channels', included: true },
      { text: 'Unlimited status pages', included: true },
      { text: '1-year data retention', included: true },
      { text: 'Unlimited AI reports', included: true },
      { text: 'White-label branding', included: true },
      { text: '75/25 revenue sharing', included: true },
    ],
    cta: 'Get Started',
    highlighted: false,
  },
]

export default function PricingTable(): React.ReactElement {
  return (
    <section className="landing-section landing-pricing" id="pricing">
      <div className="landing-container">
        <h2 className="landing-section-title">Simple, transparent pricing</h2>
        <p className="landing-section-subtitle">
          Start free. Scale as you grow. No hidden fees.
        </p>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
            >
              {plan.highlighted && (
                <div className="pricing-badge">Most Popular</div>
              )}
              <div className="pricing-card-header">
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-price">
                  <span className="pricing-amount">{plan.price}</span>
                  <span className="pricing-period">{plan.period}</span>
                </div>
                <p className="pricing-description">{plan.description}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`pricing-feature ${!feature.included ? 'pricing-feature-disabled' : ''}`}
                  >
                    <span className="pricing-feature-icon">
                      {feature.included ? '\u2713' : '\u2014'}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/signup"
                className={`btn btn-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
