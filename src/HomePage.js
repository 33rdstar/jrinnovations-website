import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

const HomePage = () => {
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const services = {
    innovation: [
      { title: 'Custom Software Development', desc: 'Tailored solutions for your unique business needs', id: 'custom-software' },
      { title: 'Web Applications', desc: 'Responsive, modern websites that drive results', id: 'web-applications' },
      { title: 'Mobile App Development', desc: 'iOS and Android apps that users love', id: 'mobile-apps' },
      { title: 'IT Consulting', desc: 'Strategic technology guidance for growth', id: 'it-consulting' },
      { title: 'E-Commerce Solutions', desc: 'Complete online store setup and management', id: 'ecommerce' },
      { title: 'System Integration', desc: 'Seamless connection of your business tools', id: 'system-integration' }
    ],
    creative: [
      { title: 'Brand Identity Design', desc: 'Logos that capture your essence', id: 'brand-identity' },
      { title: 'Graphic Design', desc: 'Eye-catching visuals for all platforms', id: 'graphic-design' },
      { title: 'Business Cards & Stationery', desc: 'Professional print materials', id: 'business-cards' },
      { title: 'Business Profiles', desc: 'Compelling company presentations', id: 'business-profiles' },
      { title: 'Social Media Content', desc: 'Engaging posts and graphics', id: 'social-media' },
      { title: 'Marketing Materials', desc: 'Brochures, flyers, and promotional content', id: 'marketing-materials' }
    ],
    entertainment: [
      { title: 'Artist Management', desc: 'Career development and representation', id: 'artist-management' },
      { title: 'Event Planning & Production', desc: 'Memorable experiences, flawlessly executed', id: 'event-planning' },
      { title: 'Content Creation', desc: 'Video and audio production services', id: 'content-creation' },
      { title: 'Talent Booking', desc: 'Connect with the perfect performers', id: 'talent-booking' },
      { title: 'Brand Partnerships', desc: 'Strategic collaborations for artists', id: 'brand-partnerships' },
      { title: 'Digital Distribution', desc: 'Get your content on all platforms', id: 'digital-distribution' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      <AnimatedBackground />
      <Navigation />

      {/* Hero Section */}
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
          
          {/* Laptop Mockup */}
          <div className="mb-12 flex justify-center">
            <img 
              src="/laptop-mockup2.png"  
              alt=" "
              className="w-full max-w-2xl h-auto transform transition-all duration-700 hover:scale-105 hover:-translate-y-2 drop-shadow-2xl"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#services" 
              onClick={(e) => handleNavClick(e, 'services')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Explore Our Services
            </a>
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

      {/* Core Business Areas */}
      <section 
        className="py-16 bg-gradient-to-b from-white to-gray-50 relative z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/core-business-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-5xl font-bold text-gray-100 text-center mb-1">Our Core Business</h2>
          <p className="text-center text-2xl text-gray-100 mb-12">Three pillars of excellence driving your success</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Link 
              to="/innovation"
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-6 flex items-center justify-center text-white text-2xl font-bold">
                I
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Innovation</h3>
              <p className="text-gray-600">Cutting-edge technology solutions that propel your business forward in the digital landscape.</p>
            </Link>

            <Link 
              to="/creative-arts"
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl font-bold">
                C
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Creative Arts</h3>
              <p className="text-gray-600">Stunning visual designs that capture attention and communicate your brand's unique story.</p>
            </Link>

            <Link 
              to="/entertainment"
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl mb-6 flex items-center justify-center text-white text-2xl font-bold">
                E
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Entertainment</h3>
              <p className="text-gray-600">Comprehensive artist management and event services that create unforgettable experiences.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Our Services</h2>

          {/* Innovation Services */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Innovation & Technology
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.innovation.map((service, idx) => (
                <Link
                  key={idx}
                  to={`/innovation#${service.id}`}
                  className="bg-blue-50 p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 border-blue-500 transform hover:-translate-y-2 hover:scale-105"
                >
                  <h4 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h4>
                  <p className="text-gray-600">{service.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Creative Services */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              Creative Arts & Design
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.creative.map((service, idx) => (
                <Link
                  key={idx}
                  to={`/creative-arts#${service.id}`}
                  className="bg-pink-50 p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 border-pink-500 transform hover:-translate-y-2 hover:scale-105"
                >
                  <h4 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h4>
                  <p className="text-gray-600">{service.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Entertainment Services */}
          <div>
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Entertainment & Management
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.entertainment.map((service, idx) => (
                <Link
                  key={idx}
                  to={`/entertainment#${service.id}`}
                  className="bg-green-50 p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 border-green-500 transform hover:-translate-y-2 hover:scale-105"
                >
                  <h4 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h4>
                  <p className="text-gray-600">{service.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-gradient-to-b from-blue-600 to-blue-800 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
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

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Get In Touch</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center transform transition-all duration-300 hover:scale-110">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-xl hover:bg-green-600">
                <MessageCircle className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
              <a href="https://wa.me/260964978222" className="text-purple-600 hover:underline transition-all duration-300">
                +260 964 978 222
              </a>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-110">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-xl hover:bg-blue-600">
                <Phone className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Phone</h3>
              <a href="tel:+260964978222" className="text-purple-600 hover:underline transition-all duration-300">
                +260 964 978 222
              </a>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-110">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:shadow-xl hover:bg-red-600">
                <Mail className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <a href="mailto:juniorinnovations33@gmail.com" className="text-purple-600 hover:underline break-all transition-all duration-300">
                juniorinnovations33@gmail.com
              </a>
            </div>
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