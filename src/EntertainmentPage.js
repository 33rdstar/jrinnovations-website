import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, Calendar, Video, Mic2, Handshake, Radio } from 'lucide-react';

import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

// =====================
// Lazy Hook
// =====================
const useLazySection = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return [ref, visible];
};

// =====================
// Skeleton
// =====================
const ServiceSkeleton = () => (
  <div className="rounded-3xl p-8 md:p-12 shadow-xl border-l-8 border-gray-200 bg-gray-100 animate-pulse">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  </div>
);

// =====================
// Card
// =====================
const ServiceCard = React.memo(({ service, colors }) => {
  const [ref, visible] = useLazySection();

  return (
    <div ref={ref} id={service.id} className="scroll-mt-24">
      {visible ? (
        <div className={`${colors.bg} rounded-3xl p-8 md:p-12 shadow-xl border-l-8 ${colors.border} transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
          <div className="flex flex-col md:flex-row gap-8">

            <div className="flex-shrink-0">
              <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                {service.icon}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">
                {service.title}
              </h2>

              <p className={`text-lg ${colors.text} font-semibold mb-4`}>
                {service.tagline}
              </p>

              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">What We Offer:</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <div className={`w-2 h-2 mt-2 rounded-full border-2 ${colors.border}`} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-xl font-bold mb-3">Our Services Include:</h3>
                <div className="flex flex-wrap gap-2">
                  {service.services.map((s) => (
                    <span
                      key={s}
                      className={`px-4 py-2 bg-white rounded-full text-sm font-medium ${colors.text} border ${colors.border}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Link
                  to="/#contact"
                  className={`inline-block bg-gradient-to-r ${colors.gradient} text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-transform hover:scale-105`}
                >
                  Learn More About {service.title}
                </Link>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <ServiceSkeleton />
      )}
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

// =====================
// MAIN PAGE
// =====================
const EntertainmentPage = () => {

  // Scroll-to-hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(hash.substring(1));
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.pageYOffset - 80,
          behavior: 'smooth'
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Memoized colors
  const colorVariants = useMemo(() => ({
    green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', gradient: 'from-green-500 to-emerald-600' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-600', gradient: 'from-teal-500 to-cyan-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-600', gradient: 'from-cyan-500 to-blue-600' },
    lime: { bg: 'bg-lime-50', border: 'border-lime-500', text: 'text-lime-600', gradient: 'from-lime-500 to-green-600' }
  }), []);

  // Memoized services
  const services = useMemo(() => [
    {
      id: 'artist-management',
      icon: <Users className="w-12 h-12" />,
      title: 'Artist Management',
      tagline: 'Career development and representation',
      description: 'We manage the business so artists focus on creativity.',
      features: ['Career strategy', 'Brand building', 'Contracts', 'Financial planning'],
      services: ['Management', 'Consulting', 'Branding'],
      color: 'green'
    },
    {
      id: 'event-planning',
      icon: <Calendar className="w-12 h-12" />,
      title: 'Event Planning & Production',
      tagline: 'Memorable experiences',
      description: 'We plan and execute high-quality events.',
      features: ['Concept design', 'Venues', 'Production', 'Coordination'],
      services: ['Events', 'Festivals', 'Launches'],
      color: 'teal'
    },
    {
      id: 'content-creation',
      icon: <Video className="w-12 h-12" />,
      title: 'Content Creation',
      tagline: 'Video and audio production',
      description: 'End-to-end content production services.',
      features: ['Video', 'Audio', 'Editing', 'Podcasts'],
      services: ['Production', 'Recording'],
      color: 'emerald'
    },
    {
      id: 'talent-booking',
      icon: <Mic2 className="w-12 h-12" />,
      title: 'Talent Booking',
      tagline: 'Find the right performers',
      description: 'We connect events with the right talent.',
      features: ['Artists', 'Negotiation', 'Coordination'],
      services: ['Bands', 'DJs', 'Speakers'],
      color: 'cyan'
    },
    {
      id: 'brand-partnerships',
      icon: <Handshake className="w-12 h-12" />,
      title: 'Brand Partnerships',
      tagline: 'Strategic collaborations',
      description: 'Connecting artists with brands.',
      features: ['Sponsorships', 'Campaigns'],
      services: ['Deals', 'Endorsements'],
      color: 'lime'
    },
    {
      id: 'digital-distribution',
      icon: <Radio className="w-12 h-12" />,
      title: 'Digital Distribution',
      tagline: 'Reach global platforms',
      description: 'Distribute content worldwide.',
      features: ['Streaming', 'Analytics'],
      services: ['Music', 'Video'],
      color: 'green'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      <Helmet>
        <title>Entertainment & Management | JR Innovations Zambia</title>
        <meta
          name="description"
          content="Turning talent into success stories — entertainment and artist management services from JR Innovations Zambia."
        />
        <link rel="canonical" href="https://www.jrinnovationszambia.com/entertainment" />
        <meta property="og:title" content="Entertainment & Management | JR Innovations Zambia" />
        <meta
          property="og:description"
          content="Turning talent into success stories — entertainment and artist management services from JR Innovations Zambia."
        />
        <meta property="og:url" content="https://www.jrinnovationszambia.com/entertainment" />
        <meta name="twitter:title" content="Entertainment & Management | JR Innovations Zambia" />
        <meta
          name="twitter:description"
          content="Turning talent into success stories — entertainment and artist management services from JR Innovations Zambia."
        />
      </Helmet>
      <AnimatedBackground />
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Entertainment & Management
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Turning talent into success stories.
            </p>
          </div>

          <img
            src="/hiphop-mockup1.jpg"
            alt="Entertainment preview"
            fetchpriority="high"
            decoding="async"
            width="448"
            height="560"
            className="max-w-md w-full h-auto drop-shadow-2xl transition-transform hover:scale-105"
          />
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-24">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              colors={colorVariants[s.color]}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EntertainmentPage;