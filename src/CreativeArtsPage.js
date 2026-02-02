import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Image, CreditCard, FileText, Share2, Megaphone } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

const CreativeArtsPage = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, []);

  const services = [
    {
      id: 'brand-identity',
      icon: <Palette className="w-12 h-12" />,
      title: 'Brand Identity Design',
      tagline: 'Logos that capture your essence',
      description: 'Your brand is more than just a logo—it\'s the visual story of who you are. We create distinctive brand identities that resonate with your audience and set you apart from the competition.',
      features: [
        'Custom logo design with multiple concepts',
        'Brand color palette development',
        'Typography selection and pairing',
        'Brand style guide creation',
        'Brand positioning and messaging',
        'Visual identity system design'
      ],
      deliverables: ['Logo files (AI, EPS, PNG, SVG)', 'Brand Guidelines PDF', 'Color Swatches', 'Font Files'],
      color: 'pink'
    },
    {
      id: 'graphic-design',
      icon: <Image className="w-12 h-12" />,
      title: 'Graphic Design',
      tagline: 'Eye-catching visuals for all platforms',
      description: 'From social media graphics to marketing materials, we design stunning visuals that communicate your message effectively and leave a lasting impression on your audience.',
      features: [
        'Social media graphics and templates',
        'Infographics and data visualization',
        'Poster and banner design',
        'Presentation design',
        'Digital and print advertisements',
        'Packaging design'
      ],
      deliverables: ['High-res source files', 'Web-optimized graphics', 'Print-ready PDFs', 'Editable templates'],
      color: 'orange'
    },
    {
      id: 'business-cards',
      icon: <CreditCard className="w-12 h-12" />,
      title: 'Business Cards & Stationery',
      tagline: 'Professional print materials',
      description: 'Make a memorable first impression with professionally designed business cards and stationery that reflect your brand\'s quality and attention to detail.',
      features: [
        'Custom business card design',
        'Letterhead design',
        'Envelope design',
        'Compliment slip design',
        'Email signature design',
        'Print specifications and guidance'
      ],
      deliverables: ['Print-ready files', 'Digital versions', 'Multiple format options', 'Printing recommendations'],
      color: 'rose'
    },
    {
      id: 'business-profiles',
      icon: <FileText className="w-12 h-12" />,
      title: 'Business Profiles',
      tagline: 'Compelling company presentations',
      description: 'Tell your company story with professionally designed business profiles and company presentations that showcase your strengths and attract potential clients and partners.',
      features: [
        'Company profile design and layout',
        'Content structuring and editing',
        'Visual storytelling',
        'Infographic integration',
        'Professional photography sourcing',
        'Interactive PDF creation'
      ],
      deliverables: ['PDF Company Profile', 'PowerPoint/Keynote version', 'Print-ready version', 'Digital flipbook'],
      color: 'purple'
    },
    {
      id: 'social-media',
      icon: <Share2 className="w-12 h-12" />,
      title: 'Social Media Content',
      tagline: 'Engaging posts and graphics',
      description: 'Stand out in crowded social feeds with eye-catching graphics and content designed specifically for each platform to maximize engagement and grow your audience.',
      features: [
        'Platform-specific post designs',
        'Social media template creation',
        'Story and reel graphics',
        'Profile and cover image design',
        'Content calendar planning',
        'Hashtag and caption recommendations'
      ],
      deliverables: ['Optimized graphics', 'Editable templates', 'Content calendar', 'Platform guidelines'],
      color: 'blue'
    },
    {
      id: 'marketing-materials',
      icon: <Megaphone className="w-12 h-12" />,
      title: 'Marketing Materials',
      tagline: 'Brochures, flyers, and promotional content',
      description: 'Drive your marketing campaigns forward with professionally designed collateral that captures attention, communicates your value proposition, and motivates action.',
      features: [
        'Brochure design (bi-fold, tri-fold, multi-page)',
        'Flyer and leaflet design',
        'Catalog design',
        'Trade show materials',
        'Direct mail pieces',
        'Promotional merchandise design'
      ],
      deliverables: ['Print-ready files', 'Digital versions', 'Dieline specifications', 'Production guidance'],
      color: 'amber'
    }
  ];

  const colorVariants = {
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-500',
      text: 'text-pink-600',
      gradient: 'from-pink-500 to-rose-600',
      hover: 'hover:bg-pink-100'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-600',
      gradient: 'from-orange-500 to-red-600',
      hover: 'hover:bg-orange-100'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-500',
      text: 'text-rose-600',
      gradient: 'from-rose-500 to-pink-600',
      hover: 'hover:bg-rose-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-600',
      hover: 'hover:bg-purple-100'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-600',
      hover: 'hover:bg-blue-100'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-500',
      text: 'text-amber-600',
      gradient: 'from-amber-500 to-orange-600',
      hover: 'hover:bg-amber-100'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      <AnimatedBackground />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Creative Arts & Design
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Stunning visual designs that capture attention and communicate your brand's unique story. From logos to marketing materials, we bring your vision to life.
              </p>
              <Link
                to="/#contact"
                className="inline-block bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
              >
                Start Your Design Project
              </Link>

            </div>

            {/* Brochure Mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm lg:max-w-md">
                <img
                  src="/Brochure_Mockup2.png"
                  alt="img"
                  className="w-full h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services-section" className="py-16 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-24">
            {services.map((service, index) => {
              const colors = colorVariants[service.color];
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className="scroll-mt-24"
                >
                  <div className={`${colors.bg} rounded-3xl p-8 md:p-12 shadow-xl border-l-8 ${colors.border} transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Icon Section */}
                      <div className="flex-shrink-0">
                        <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                          {service.icon}
                        </div>
                      </div>

                      {/* Content Section */}
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
                          <h3 className="text-xl font-bold text-gray-800 mb-4">What We Offer:</h3>
                          <div className="grid md:grid-cols-2 gap-3">
                            {service.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.border} border-2 mt-2 flex-shrink-0`}></div>
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-3">What You'll Receive:</h3>
                          <div className="flex flex-wrap gap-2">
                            {service.deliverables.map((deliverable, idx) => (
                              <span
                                key={idx}
                                className={`px-4 py-2 bg-white rounded-full text-sm font-medium ${colors.text} border ${colors.border} ${colors.hover} transition-colors duration-300`}
                              >
                                {deliverable}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-8">
                          <Link
                            to="/#contact"
                            className={`inline-block bg-gradient-to-r ${colors.gradient} text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition-all duration-500 transform hover:scale-105`}
                          >
                            Request {service.title}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-pink-600 to-orange-600 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Elevate Your Brand?</h2>
          <p className="text-lg text-white mb-8">
            Let's create stunning visuals that tell your story and connect with your audience.
            Our creative team is ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/#contact"
              className="bg-white text-pink-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Get Your Design Quote
            </Link>
            <Link
              to="/"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CreativeArtsPage;