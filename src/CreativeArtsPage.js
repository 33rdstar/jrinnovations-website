import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Image, CreditCard, FileText, Share2, Megaphone } from 'lucide-react';

import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

// =====================
// Lazy Section Hook
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
      <div className="w-20 h-20 rounded-2xl bg-gray-200" />
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
// Service Card
// =====================
const ServiceCard = React.memo(({ service, colors }) => {
  const [ref, visible] = useLazySection();

  return (
    <div ref={ref} id={service.id} className="scroll-mt-24">
      {visible ? (
        <div className={`${colors.bg} rounded-3xl p-8 md:p-12 shadow-xl border-l-8 ${colors.border} transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
          <div className="flex flex-col md:flex-row gap-8">

            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                {service.icon}
              </div>
            </div>

            {/* Content */}
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

              {/* Deliverables */}
              <div>
                <h3 className="text-xl font-bold mb-3">What You'll Receive:</h3>
                <div className="flex flex-wrap gap-2">
                  {service.deliverables.map((d) => (
                    <span
                      key={d}
                      className={`px-4 py-2 bg-white rounded-full text-sm font-medium ${colors.text} border ${colors.border}`}
                    >
                      {d}
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
                  Request {service.title}
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
const CreativeArtsPage = () => {

  // Scroll to hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(hash.substring(1));
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.pageYOffset - 80,
          behavior: 'smooth',
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Colors (memoized)
  const colorVariants = useMemo(() => ({
    pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-600', gradient: 'from-pink-500 to-rose-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', gradient: 'from-orange-500 to-red-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-600', gradient: 'from-rose-500 to-pink-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', gradient: 'from-purple-500 to-pink-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', gradient: 'from-blue-500 to-cyan-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' }
  }), []);

  // Services (memoized)
  const services = useMemo(() => [
    {
      id: 'brand-identity',
      icon: <Palette className="w-12 h-12" />,
      title: 'Brand Identity Design',
      tagline: 'Logos that capture your essence',
      description: 'We create distinctive brand identities that resonate with your audience.',
      features: ['Custom logo design', 'Brand palette', 'Typography', 'Style guide'],
      deliverables: ['Logo files', 'Brand Guidelines', 'Color Swatches'],
      color: 'pink'
    },
    {
      id: 'graphic-design',
      icon: <Image className="w-12 h-12" />,
      title: 'Graphic Design',
      tagline: 'Eye-catching visuals',
      description: 'We design stunning visuals that communicate your message.',
      features: ['Social media graphics', 'Infographics', 'Posters'],
      deliverables: ['Source files', 'Print-ready PDFs'],
      color: 'orange'
    },
    {
      id: 'business-cards',
      icon: <CreditCard className="w-12 h-12" />,
      title: 'Business Cards & Stationery',
      tagline: 'Professional print materials',
      description: 'Make a memorable first impression.',
      features: ['Cards', 'Letterheads', 'Email signatures'],
      deliverables: ['Print files', 'Digital versions'],
      color: 'rose'
    },
    {
      id: 'business-profiles',
      icon: <FileText className="w-12 h-12" />,
      title: 'Business Profiles',
      tagline: 'Company storytelling',
      description: 'Tell your story with powerful visuals.',
      features: ['Profiles', 'Layouts', 'Infographics'],
      deliverables: ['PDF', 'PowerPoint'],
      color: 'purple'
    },
    {
      id: 'social-media',
      icon: <Share2 className="w-12 h-12" />,
      title: 'Social Media Content',
      tagline: 'Engaging content',
      description: 'Grow your audience with strong visuals.',
      features: ['Templates', 'Posts', 'Reels'],
      deliverables: ['Graphics', 'Templates'],
      color: 'blue'
    },
    {
      id: 'marketing-materials',
      icon: <Megaphone className="w-12 h-12" />,
      title: 'Marketing Materials',
      tagline: 'Promotional content',
      description: 'Drive campaigns with powerful design.',
      features: ['Brochures', 'Flyers', 'Catalogs'],
      deliverables: ['Print files', 'Guides'],
      color: 'amber'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      <AnimatedBackground />
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Creative Arts & Design
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Stunning visuals that tell your story.
            </p>
          </div>

          <img
            src="/Brochure_Mockup2.png"
            alt="Brochure preview"
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

export default CreativeArtsPage;