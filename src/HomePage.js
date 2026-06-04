import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle, Download } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

// ─── Hook: reveal section once it enters the viewport ───────────────────────
const useLazySection = (options = {}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px', ...options }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, visible];
};

// ─── Skeleton placeholder card ───────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-gray-100 rounded-xl h-32 animate-pulse" />
);

// ─── Reusable service card ───────────────────────────────────────────────────
const ServiceCard = React.memo(({ service, to, colorScheme }) => {
  const schemeMap = {
    blue:  { card: 'bg-blue-50',  border: 'border-blue-500'  },
    pink:  { card: 'bg-pink-50',  border: 'border-pink-500'  },
    green: { card: 'bg-green-50', border: 'border-green-500' },
  };
  const { card, border } = schemeMap[colorScheme] ?? schemeMap.blue;

  return (
    <Link
      to={to}
      className={`${card} p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 ${border} transform hover:-translate-y-2 hover:scale-105`}
    >
      <h4 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h4>
      <p className="text-gray-600">{service.desc}</p>
      <p className="text-gray-800 text-xs mt-2">-Learn More...</p>
    </Link>
  );
});
ServiceCard.displayName = 'ServiceCard';

// ─── Reusable contact item ───────────────────────────────────────────────────
const ContactItem = React.memo(({ href, target, rel, bgColor, hoverBg, icon, label, display }) => (
  <a
    href={href}
    target={target}
    rel={rel}
    className="text-center transform transition-all duration-300 hover:scale-110 block"
  >
    <div
      className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-xl ${hoverBg}`}
    >
      {icon}
    </div>
    <h3 className="font-bold text-lg mb-2 text-gray-800">{label}</h3>
    <span className="text-purple-600 hover:underline transition-all duration-300 break-all">
      {display}
    </span>
  </a>
));
ContactItem.displayName = 'ContactItem';

// ─── Service section with its own lazy trigger ───────────────────────────────
const ServiceSection = React.memo(({ title, gradient, services, route, colorScheme }) => {
  const [ref, visible] = useLazySection();

  return (
    <div ref={ref} className="mb-16">
      <h3 className={`text-3xl font-bold mb-8 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {title}
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible
          ? services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                to={`/${route}#${service.id}`}
                colorScheme={colorScheme}
              />
            ))
          : Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
});
ServiceSection.displayName = 'ServiceSection';

// ─── HomePage ────────────────────────────────────────────────────────────────
const HomePage = () => {
  // Preconnect to external domains used in contact section
  useEffect(() => {
    const hints = ['https://wa.me', 'https://web.facebook.com'];
    hints.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offsetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  // Memoised so the object reference is stable across renders
  const services = useMemo(
    () => ({
      innovation: [
        { title: 'Custom Software Development', desc: 'Tailored solutions for your unique business needs',    id: 'custom-software'    },
        { title: 'Web Applications',            desc: 'Responsive, modern websites that drive results',        id: 'web-applications'   },
        { title: 'Mobile App Development',      desc: 'iOS and Android apps that users love',                 id: 'mobile-apps'        },
        { title: 'IT Consulting',               desc: 'Strategic technology guidance for growth',              id: 'it-consulting'      },
        { title: 'E-Commerce Solutions',        desc: 'Complete online store setup and management',           id: 'ecommerce'          },
        { title: 'System Integration',          desc: 'Seamless connection of your business tools',           id: 'system-integration' },
      ],
      creative: [
        { title: 'Brand Identity Design',   desc: 'Logos that capture your essence',                id: 'brand-identity'       },
        { title: 'Graphic Design',          desc: 'Eye-catching visuals for all platforms',          id: 'graphic-design'       },
        { title: 'Business Cards & Stationery', desc: 'Professional print materials',               id: 'business-cards'       },
        { title: 'Business Profiles',       desc: 'Compelling company presentations',               id: 'business-profiles'    },
        { title: 'Social Media Content',    desc: 'Engaging posts and graphics',                    id: 'social-media'         },
        { title: 'Marketing Materials',     desc: 'Brochures, flyers, and promotional content',     id: 'marketing-materials'  },
      ],
      entertainment: [
        { title: 'Artist Management',       desc: 'Career development and representation',          id: 'artist-management'    },
        { title: 'Event Planning & Production', desc: 'Memorable experiences, flawlessly executed', id: 'event-planning'       },
        { title: 'Content Creation',        desc: 'Video and audio production services',            id: 'content-creation'     },
        { title: 'Talent Booking',          desc: 'Connect with the perfect performers',            id: 'talent-booking'       },
        { title: 'Brand Partnerships',      desc: 'Strategic collaborations for artists',           id: 'brand-partnerships'   },
        { title: 'Digital Distribution',    desc: 'Get your content on all platforms',             id: 'digital-distribution' },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative pb-16 md:pb-0">
      <AnimatedBackground />
      <Navigation />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section id="home" className="pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-500 via-purple-600 to-green-600 bg-clip-text text-transparent">
              Beyond Imagination
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your partner in Innovation, Creative Arts, and Entertainment.
            We transform ideas into reality and help businesses thrive in the digital age.
          </p>

          {/* LCP image — high priority, no lazy loading */}
          <div className="mb-12 flex justify-center">
            <img
              src="/laptop-mockup2.png"
              alt="Yanga app preview"
              fetchPriority="high"
              decoding="async"
              width="672"
              height="420"
              className="w-full max-w-2xl h-auto transform transition-all duration-700 hover:scale-105 hover:-translate-y-2 drop-shadow-2xl"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, 'services')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Explore Our Services
            </a>

            <Link
              to="/app-store"
              className="relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white overflow-hidden group transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed, #db2777)' }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                style={{ background: 'linear-gradient(135deg, #db2777, #7c3aed, #1d4ed8)' }}
              />
              <Download className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10">Visit JR App Store</span>
              <span className="relative z-10 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
            </Link>

            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, 'contact')}
              className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-purple-50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 hover:shadow-xl"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      {/* ── Core Business ─────────────────────────────────────────────────── */}
      <section
        className="py-16 relative z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/core-business-bg.jpg)',
          backgroundAttachment: 'local',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-5xl font-bold text-gray-100 text-center mb-1">Our Core Business</h2>
          <p className="text-center text-2xl text-gray-100 mb-12">
            Three pillars of excellence driving your success
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                to: '/innovation',
                gradient: 'from-blue-500 to-purple-600',
                letter: 'I',
                title: 'Innovation',
                desc: 'Cutting-edge technology solutions that propel your business forward in the digital landscape.',
              },
              {
                to: '/creative-arts',
                gradient: 'from-pink-500 to-orange-500',
                letter: 'C',
                title: 'Creative Arts',
                desc: "Stunning visual designs that capture attention and communicate your brand's unique story.",
              },
              {
                to: '/entertainment',
                gradient: 'from-green-500 to-teal-500',
                letter: 'E',
                title: 'Entertainment',
                desc: 'Comprehensive artist management and event services that create unforgettable experiences.',
              },
            ].map(({ to, gradient, letter, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl mb-6 flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {letter}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Our Services</h2>

          <ServiceSection
            title="Innovation & Technology"
            gradient="from-blue-600 to-purple-600"
            services={services.innovation}
            route="innovation"
            colorScheme="blue"
          />
          <ServiceSection
            title="Creative Arts & Design"
            gradient="from-pink-600 to-orange-600"
            services={services.creative}
            route="creative-arts"
            colorScheme="pink"
          />
          <ServiceSection
            title="Entertainment & Management"
            gradient="from-green-600 to-teal-600"
            services={services.entertainment}
            route="entertainment"
            colorScheme="green"
          />
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <section
        id="about"
        className="py-20 px-4 relative z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/About-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 text-white">About JR Innovations</h2>
          <p className="text-lg text-white mb-6">
            At JR Innovations, we believe in pushing boundaries and thinking beyond imagination.
            As Zambia's premier multidisciplinary agency, we combine technological innovation,
            creative excellence, and entertainment expertise to deliver exceptional results.
          </p>
          <p className="text-lg text-white">
            Whether you're launching a startup, refreshing your brand, or managing talent,
            our dedicated team brings passion, expertise, and creativity to every project.
            We don't just meet expectations—we exceed them.
          </p>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Get In Touch</h2>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <ContactItem
              href="https://wa.me/260964978222"
              bgColor="bg-green-500"
              hoverBg="hover:bg-green-600"
              icon={<MessageCircle className="text-white" size={32} />}
              label="WhatsApp"
              display="+260 964 978 222"
            />
            <ContactItem
              href="tel:+260964978222"
              bgColor="bg-blue-500"
              hoverBg="hover:bg-blue-600"
              icon={<Phone className="text-white" size={32} />}
              label="Phone"
              display="+260 964 978 222"
            />
            <ContactItem
              href="mailto:juniorinnovations33@gmail.com"
              bgColor="bg-red-500"
              hoverBg="hover:bg-red-600"
              icon={<Mail className="text-white" size={32} />}
              label="Email"
              display="juniorinnovations33@gmail.com"
            />
            <ContactItem
              href="https://web.facebook.com/Juniorinnovations33"
              target="_blank"
              rel="noopener noreferrer"
              bgColor="bg-blue-600"
              hoverBg="hover:bg-blue-700"
              icon={
                <svg className="text-white w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              }
              label="Facebook"
              display="Follow Us"
            />
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Ready to start your project?</h3>
            <p className="mb-6">Let's discuss how we can help bring your vision to life</p>
            <a
              href="https://wa.me/260964978222"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Contact Us Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
