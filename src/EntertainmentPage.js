import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Video, Mic2, Handshake, Radio } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

const EntertainmentPage = () => {
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
      id: 'artist-management',
      icon: <Users className="w-12 h-12" />,
      title: 'Artist Management',
      tagline: 'Career development and representation',
      description: 'We provide comprehensive management services that help artists focus on their craft while we handle the business side. From career strategy to contract negotiations, we\'re your partner in success.',
      features: [
        'Career planning and strategy development',
        'Brand building and image consulting',
        'Contract negotiation and legal support',
        'Financial management and budgeting',
        'Tour planning and logistics',
        'Media relations and publicity'
      ],
      services: ['Full-service management', 'Career consulting', 'Brand development', 'Industry connections'],
      color: 'green'
    },
    {
      id: 'event-planning',
      icon: <Calendar className="w-12 h-12" />,
      title: 'Event Planning & Production',
      tagline: 'Memorable experiences, flawlessly executed',
      description: 'From intimate gatherings to large-scale productions, we plan and execute events that leave lasting impressions. Our attention to detail ensures every moment is perfect.',
      features: [
        'Concept development and theme design',
        'Venue selection and management',
        'Technical production (sound, lighting, staging)',
        'Artist booking and coordination',
        'Budget management',
        'Day-of coordination and execution'
      ],
      services: ['Corporate events', 'Concerts & festivals', 'Private parties', 'Product launches'],
      color: 'teal'
    },
    {
      id: 'content-creation',
      icon: <Video className="w-12 h-12" />,
      title: 'Content Creation',
      tagline: 'Video and audio production services',
      description: 'Create compelling content that engages your audience with our professional video and audio production services. We handle everything from concept to final delivery.',
      features: [
        'Music video production',
        'Documentary filming',
        'Audio recording and mixing',
        'Podcast production',
        'Social media content',
        'Post-production and editing'
      ],
      services: ['Video production', 'Audio recording', 'Editing & mixing', 'Content strategy'],
      color: 'emerald'
    },
    {
      id: 'talent-booking',
      icon: <Mic2 className="w-12 h-12" />,
      title: 'Talent Booking',
      tagline: 'Connect with the perfect performers',
      description: 'Access our extensive network of talented performers across all genres. We match the right artists to your event, ensuring entertainment that resonates with your audience.',
      features: [
        'Artist roster across multiple genres',
        'Custom talent recommendations',
        'Contract negotiation',
        'Logistics coordination',
        'Technical rider management',
        'Performance quality assurance'
      ],
      services: ['Musicians & bands', 'DJs', 'Comedians', 'Speakers & MCs'],
      color: 'cyan'
    },
    {
      id: 'brand-partnerships',
      icon: <Handshake className="w-12 h-12" />,
      title: 'Brand Partnerships',
      tagline: 'Strategic collaborations for artists',
      description: 'We connect artists with brands for mutually beneficial partnerships that enhance visibility, create revenue streams, and build long-term relationships.',
      features: [
        'Brand partnership identification',
        'Sponsorship deal negotiation',
        'Collaboration strategy',
        'Campaign development',
        'Performance metrics tracking',
        'Relationship management'
      ],
      services: ['Sponsorship deals', 'Endorsements', 'Collaborations', 'Ambassador programs'],
      color: 'lime'
    },
    {
      id: 'digital-distribution',
      icon: <Radio className="w-12 h-12" />,
      title: 'Digital Distribution',
      tagline: 'Get your content on all platforms',
      description: 'Maximize your reach with our digital distribution services. We ensure your music, videos, and content are available on all major platforms worldwide.',
      features: [
        'Distribution to major streaming platforms',
        'Release strategy and timing',
        'Metadata optimization',
        'Rights management',
        'Royalty collection and reporting',
        'Analytics and insights'
      ],
      services: ['Music distribution', 'Video distribution', 'Playlist pitching', 'Analytics reporting'],
      color: 'green'
    }
  ];

  const colorVariants = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-600',
      gradient: 'from-green-500 to-emerald-600',
      hover: 'hover:bg-green-100'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-500',
      text: 'text-teal-600',
      gradient: 'from-teal-500 to-cyan-600',
      hover: 'hover:bg-teal-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-500',
      text: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-600',
      hover: 'hover:bg-emerald-100'
    },
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-500',
      text: 'text-cyan-600',
      gradient: 'from-cyan-500 to-blue-600',
      hover: 'hover:bg-cyan-100'
    },
    lime: {
      bg: 'bg-lime-50',
      border: 'border-lime-500',
      text: 'text-lime-600',
      gradient: 'from-lime-500 to-green-600',
      hover: 'hover:bg-lime-100'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      <AnimatedBackground />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Entertainment & Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive artist management and event services that create unforgettable experiences. We turn talent into success stories.
          </p>
          <Link 
            to="/#contact"
            className="inline-block bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
          >
            Let's Work Together
          </Link>
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

                        {/* Services */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-3">Our Services Include:</h3>
                          <div className="flex flex-wrap gap-2">
                            {service.services.map((serviceItem, idx) => (
                              <span 
                                key={idx}
                                className={`px-4 py-2 bg-white rounded-full text-sm font-medium ${colors.text} border ${colors.border} ${colors.hover} transition-colors duration-300`}
                              >
                                {serviceItem}
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
                            Learn More About {service.title}
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
      <section className="py-20 px-4 bg-gradient-to-b from-green-600 to-teal-600 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Take Your Entertainment to the Next Level?</h2>
          <p className="text-lg text-white mb-8">
            Whether you're an artist looking for management or planning an unforgettable event, 
            we have the expertise and connections to make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/#contact"
              className="bg-white text-green-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Start Your Journey
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

export default EntertainmentPage;