'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5EA]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-3xl text-[#0D0D0D]" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>
              vela<span className="bg-gradient-to-r from-[#00CEC9] to-[#6C5CE7] bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00CEC9 0%, #6C5CE7 100%)' }}>r</span>a
            </span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-[#0D0D0D]/70 hover:text-[#0D0D0D] text-sm font-medium">Features</a>
            <a href="#pricing" className="text-[#0D0D0D]/70 hover:text-[#0D0D0D] text-sm font-medium">Pricing</a>
            <Link href="/login" className="text-[#0D0D0D] hover:text-[#00CEC9] text-sm font-medium">Login</Link>
            <Link href="/register" 
              className="bg-[#0D0D0D] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#00CEC9] hover:text-white transition-all"
              style={{ borderRadius: '12px' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00CEC9]/5 via-transparent to-[#00CEC9]/10" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-block px-4 py-1.5 bg-[#00CEC9]/10 text-[#00CEC9] rounded-full text-sm font-medium mb-6">
            Meta Business Partner
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-[#0D0D0D] mb-6 leading-tight" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>
            The new standard in <span className="bg-gradient-to-r from-[#00CEC9] to-[#6C5CE7] bg-clip-text text-transparent">messaging</span>
          </h1>
          <p className="text-xl text-[#0D0D0D]/60 mb-8 max-w-2xl mx-auto">
            velora brings all your Facebook Messenger conversations into one smart dashboard — faster replies, smarter engagement, 24/7.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" 
              className="bg-[#0D0D0D] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#00CEC9] hover:text-white transition-all"
              style={{ borderRadius: '12px' }}>
              🚀 Start Free Trial
            </Link>
            <a href="#demo" 
              className="border border-[#E5E5EA] text-[#0D0D0D] px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/50 transition-all"
              style={{ borderRadius: '12px' }}>
              Book Demo
            </a>
          </div>
          <p className="text-[#0D0D0D]/40 mt-6 text-sm">14-day free trial • No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-[#0D0D0D] mb-4" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>Powerful Features</h2>
          <p className="text-[#0D0D0D]/60 text-center mb-16 text-lg">Everything you need to manage customer conversations at scale</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📥', title: 'Smart Inbox', desc: 'All conversations in one place. Filter by status, assign to team members, never miss a lead.' },
              { icon: '⚡', title: 'Automation', desc: 'Set up keyword triggers, auto-replies, and workflows to respond instantly 24/7.' },
              { icon: '📢', title: 'Broadcasts', desc: 'Send bulk messages to all customers. Schedule campaigns and track delivery.' },
              { icon: '📊', title: 'Analytics', desc: 'Track response times, conversation volume, and team performance with detailed reports.' },
              { icon: '👥', title: 'Team Collaboration', desc: 'Invite team members, assign conversations, and manage permissions easily.' },
              { icon: '🏷️', title: 'Labels & Tags', desc: 'Organize conversations with custom labels for better workflow management.' },
            ].map((f, i) => (
              <div key={i} className="bg-[#F2F2F7] p-8 rounded-2xl hover:shadow-lg hover:bg-[#00CEC9]/5 transition-all group" style={{ borderRadius: '16px' }}>
                <span className="text-4xl group-hover:scale-110 transition-transform">{f.icon}</span>
                <h3 className="font-bold text-xl text-[#0D0D0D] mt-4 mb-2" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700 }}>{f.title}</h3>
                <p className="text-[#0D0D0D]/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-24 bg-[#F2F2F7]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#0D0D0D] mb-4">Meet Customers Where They Are</h2>
          <p className="text-[#0D0D0D]/60 mb-8">Currently supporting Facebook Messenger with more channels coming soon.</p>
          <div className="flex items-center justify-center gap-8 text-[#0D0D0D]/40 flex-wrap">
            <span className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl font-medium" style={{ borderRadius: '12px' }}>
              📱 Facebook Messenger
            </span>
            <span className="flex items-center gap-2 bg-white/50 px-5 py-3 rounded-xl font-medium opacity-50" style={{ borderRadius: '12px' }}>
              🚧 Instagram (Soon)
            </span>
            <span className="flex items-center gap-2 bg-white/50 px-5 py-3 rounded-xl font-medium opacity-50" style={{ borderRadius: '12px' }}>
              🚧 WhatsApp (Soon)
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-[#0D0D0D] mb-4" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>Simple, Transparent Pricing</h2>
          <p className="text-[#0D0D0D]/60 text-center mb-16 text-lg">Choose the plan that fits your business</p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-[#F2F2F7] p-8 rounded-2xl" style={{ borderRadius: '16px' }}>
              <h3 className="font-bold text-xl text-[#0D0D0D]">Starter</h3>
              <p className="text-[#0D0D0D]/50 text-sm mt-1">For small teams</p>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-[#0D0D0D]">$29</span>
                <span className="text-[#0D0D0D]/50">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-[#0D0D0D]/70 mb-8">
                <li className="flex items-center gap-2">✓ Up to 2 team members</li>
                <li className="flex items-center gap-2">✓ 1 Facebook Page</li>
                <li className="flex items-center gap-2">✓ 1,000 messages/month</li>
                <li className="flex items-center gap-2">✓ Basic automations</li>
                <li className="flex items-center gap-2">✓ Email support</li>
              </ul>
              <Link href="/register" className="block text-center bg-[#0D0D0D] text-white py-4 rounded-xl font-medium hover:bg-[#00CEC9] transition-all" style={{ borderRadius: '12px' }}>
                Start Free
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="bg-gradient-to-b from-[#00CEC9] to-[#6C5CE7] p-8 rounded-2xl relative shadow-xl text-white" style={{ borderRadius: '16px' }}>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0D0D0D] text-white px-4 py-1.5 rounded-full text-sm font-medium">
                Most Popular
              </span>
              <h3 className="font-bold text-xl text-white">Pro</h3>
              <p className="text-white/70 text-sm mt-1">For growing businesses</p>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-white">$59</span>
                <span className="text-white/70">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-white/80 mb-8">
                <li className="flex items-center gap-2">✓ Up to 5 team members</li>
                <li className="flex items-center gap-2">✓ 3 Facebook Pages</li>
                <li className="flex items-center gap-2">✓ 10,000 messages/month</li>
                <li className="flex items-center gap-2">✓ Advanced automations</li>
                <li className="flex items-center gap-2">✓ Broadcasts & campaigns</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
              </ul>
              <Link href="/register" className="block text-center bg-white text-[#00CEC9] py-4 rounded-xl font-medium hover:bg-[#0D0D0D] hover:text-white transition-all" style={{ borderRadius: '12px' }}>
                Start Free
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-[#F2F2F7] p-8 rounded-2xl" style={{ borderRadius: '16px' }}>
              <h3 className="font-bold text-xl text-[#0D0D0D]">Enterprise</h3>
              <p className="text-[#0D0D0D]/50 text-sm mt-1">For large teams</p>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-[#0D0D0D]">$129</span>
                <span className="text-[#0D0D0D]/50">/month</span>
              </div>
              <ul className="space-y-3 text-sm text-[#0D0D0D]/70 mb-8">
                <li className="flex items-center gap-2">✓ Unlimited team members</li>
                <li className="flex items-center gap-2">✓ Unlimited pages</li>
                <li className="flex items-center gap-2">✓ Unlimited messages</li>
                <li className="flex items-center gap-2">✓ Custom automations</li>
                <li className="flex items-center gap-2">✓ API access</li>
                <li className="flex items-center gap-2">✓ 24/7 dedicated support</li>
              </ul>
              <Link href="/contact" className="block text-center bg-[#0D0D0D] text-white py-4 rounded-xl font-medium hover:bg-[#00CEC9] transition-all" style={{ borderRadius: '12px' }}>
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-[#00CEC9] to-[#6C5CE7]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>Ready to Transform Your Customer Communication?</h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of businesses using velora to deliver exceptional customer experiences.</p>
          <Link href="/register" 
            className="inline-block bg-white text-[#00CEC9] px-10 py-4 rounded-xl font-medium text-lg hover:bg-[#0D0D0D] hover:text-white transition-all"
            style={{ borderRadius: '12px' }}>
            Start 14-Day Free Trial
          </Link>
          <p className="text-white/60 mt-6 text-sm">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] text-white/60 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <span className="font-bold text-2xl text-white" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 800 }}>
              vela<span className="bg-gradient-to-r from-[#00CEC9] to-[#6C5CE7] bg-clip-text text-transparent">r</span>a
            </span>
            <p className="text-sm mt-4 text-white/60">The new standard in messaging for modern businesses.</p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="hover:text-[#00CEC9] transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-[#00CEC9] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#00CEC9] transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © 2026 velora. All rights reserved.
        </div>
      </footer>
    </div>
  )
}