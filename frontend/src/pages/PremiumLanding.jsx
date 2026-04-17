import { motion } from 'framer-motion';
import { useState } from 'react';
import { PremiumCard, PremiumCardGrid } from '../components/PremiumCard';
import { PremiumButton } from '../components/PremiumButton';
import { PremiumInput } from '../components/PremiumInput';
import { PremiumNav } from '../components/PremiumNav';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function PremiumLanding() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Navigation */}
      <PremiumNav logo="layeroi" items={navItems} />

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold font-serif mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Know Which AI Agents Make Money
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Real-time profitability tracking for every AI agent. Watch your LLM ROI in a live P&L
            dashboard.
          </motion.p>

          {/* CTA Section */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            variants={itemVariants}
          >
            <PremiumButton variant="primary" size="lg">
              Start Free Trial →
            </PremiumButton>
            <PremiumButton variant="secondary" size="lg">
              Watch Demo
            </PremiumButton>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="relative h-96 bg-gradient-to-b from-blue-100 to-transparent rounded-2xl overflow-hidden"
            variants={itemVariants}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ duration: 20, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-30"
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full blur-3xl opacity-20"
              animate={{
                x: [0, -30, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl sm:text-5xl font-bold font-serif mb-4">
              Enterprise Features
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to track, optimize, and scale your AI infrastructure
            </p>
          </motion.div>

          <PremiumCardGrid cols={3} gap={24}>
            {[
              {
                icon: '📊',
                title: 'Real-Time P&L',
                description: 'Live profitability dashboard for every agent, updated every minute',
              },
              {
                icon: '🤖',
                title: 'Multi-Agent Support',
                description: 'Track unlimited agents across OpenAI, Anthropic, Google, Azure',
              },
              {
                icon: '💰',
                title: 'Cost Optimization',
                description: 'Identify unprofitable agents and optimization opportunities',
              },
              {
                icon: '📈',
                title: 'Forecasting',
                description: 'Predict Q1/Q2 LLM costs based on usage trends',
              },
              {
                icon: '🔔',
                title: 'Smart Alerts',
                description: 'Get notified when agents exceed ROI thresholds',
              },
              {
                icon: '🔌',
                title: 'API First',
                description: 'REST API for integration with your existing workflows',
              },
            ].map((feature, idx) => (
              <PremiumCard key={idx} delay={idx * 0.1} interactive elevated>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </PremiumCard>
            ))}
          </PremiumCardGrid>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl sm:text-5xl font-bold font-serif mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-lg">Pay only for what you use</p>
          </motion.div>

          <PremiumCardGrid cols={3} gap={24}>
            {[
              {
                name: 'Starter',
                price: '$99',
                period: '/month',
                description: 'Perfect for small teams',
                features: ['Up to 5 agents', 'Basic analytics', 'Email support'],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Professional',
                price: '$299',
                period: '/month',
                description: 'For growing companies',
                features: ['Unlimited agents', 'Advanced analytics', 'Priority support', 'API access'],
                cta: 'Start Free Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large organizations',
                features: [
                  'Everything in Professional',
                  'Dedicated support',
                  'Custom integrations',
                  'SLA guarantee',
                ],
                cta: 'Contact Sales',
                highlighted: false,
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                whileHover={plan.highlighted ? { y: -10 } : { y: -5 }}
                className={plan.highlighted ? 'relative -mt-6' : ''}
              >
                {plan.highlighted && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.5 }}
                  >
                    Most Popular
                  </motion.div>
                )}
                <PremiumCard
                  elevated={plan.highlighted}
                  className={plan.highlighted ? 'ring-2 ring-green-500' : ''}
                >
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <PremiumButton
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    {plan.cta}
                  </PremiumButton>
                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <motion.div
                        key={fidx}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + fidx * 0.05 + 0.3 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </PremiumCardGrid>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <PremiumCard elevated interactive className="bg-gradient-to-br from-gray-50 to-white">
            <motion.div className="text-center" variants={itemVariants}>
              <h2 className="text-4xl font-bold font-serif mb-6">
                Ready to Know Your AI Agent ROI?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                15-minute setup. No infrastructure changes. Start tracking ROI today.
              </p>

              <div className="max-w-md mx-auto space-y-4">
                {!submitted ? (
                  <>
                    <PremiumInput
                      label="Work Email"
                      placeholder="you@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon="✉️"
                    />
                    <PremiumButton
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => setSubmitted(true)}
                    >
                      Get Started Free
                    </PremiumButton>
                  </>
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-lg font-semibold text-green-600">
                      Check your email for next steps!
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </PremiumCard>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2026 layeroi. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </motion.footer>
    </div>
  );
}
