import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, Smartphone, Globe, Lightbulb, ShoppingCart, Network } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import Navigation from './Navigation';
import Footer from './Footer';

const InnovationPage = () => {
  useEffect(() => {
    // Scroll to the section if there's a hash in the URL
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
      id: 'custom-software',
      icon: <Code className="w-12 h-12" />,
      title: 'Custom Software Development',
      tagline: 'Tailored solutions for your unique business needs',
      description: 'We design and develop bespoke software applications that perfectly align with your business processes and goals. Our custom solutions streamline operations, increase efficiency, and give you a competitive edge.',
      features: [
        'Requirements analysis and system design',
        'Full-stack development with modern technologies',
        'API development and integration',
        'Database design and optimization',
        'Testing and quality assurance',
        'Deployment and maintenance support'
      ],
      technologies: ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker'],
      color: 'blue'
    },
    {
      id: 'web-applications',
      icon: <Globe className="w-12 h-12" />,
      title: 'Web Applications',
      tagline: 'Responsive, modern websites that drive results',
      description: 'From stunning landing pages to complex web applications, we create responsive, fast, and user-friendly websites that engage your audience and achieve your business objectives.',
      features: [
        'Responsive design for all devices',
        'SEO optimization for better visibility',
        'Fast loading speeds and performance',
        'Content management systems (CMS)',
        'E-commerce functionality',
        'Analytics and tracking integration'
      ],
      technologies: ['React', 'Next.js', 'Tailwind CSS', 'WordPress', 'Shopify', 'Webflow'],
      color: 'blue'
    },
    {
      id: 'mobile-apps',
      icon: <Smartphone className="w-12 h-12" />,
      title: 'Mobile App Development',
      tagline: 'iOS and Android apps that users love',
      description: 'We build native and cross-platform mobile applications that deliver exceptional user experiences on both iOS and Android devices, helping you reach your audience wherever they are.',
      features: [
        'Native iOS and Android development',
        'Cross-platform solutions with React Native',
        'Intuitive UI/UX design',
        'App Store and Google Play submission',
        'Push notifications and real-time features',
        'Backend API integration'
      ],
      technologies: ['React Native', 'Swift', 'Kotlin', 'Flutter', 'Firebase', 'Redux'],
      color: 'purple'
    },
    {
      id: 'it-consulting',
      icon: <Lightbulb className="w-12 h-12" />,
      title: 'IT Consulting',
      tagline: 'Strategic technology guidance for growth',
      description: 'Our experienced consultants help you make informed technology decisions, optimize your IT infrastructure, and develop comprehensive digital strategies that drive business growth.',
      features: [
        'Technology stack assessment and recommendations',
        'Digital transformation roadmaps',
        'IT infrastructure planning',
        'Security audits and compliance',
        'Process optimization',
        'Vendor selection and management'
      ],
      technologies: ['Cloud Services', 'DevOps', 'Cybersecurity', 'Data Analytics', 'AI/ML'],
      color: 'indigo'
    },
    {
      id: 'ecommerce',
      icon: <ShoppingCart className="w-12 h-12" />,
      title: 'E-Commerce Solutions',
      tagline: 'Complete online store setup and management',
      description: 'Launch and grow your online business with our comprehensive e-commerce solutions. We handle everything from store setup to payment processing and inventory management.',
      features: [
        'Custom online store development',
        'Payment gateway integration',
        'Inventory management systems',
        'Order processing and fulfillment',
        'Customer relationship management',
        'Marketing and analytics tools'
      ],
      technologies: ['Shopify', 'WooCommerce', 'Magento', 'Stripe', 'PayPal', 'Square'],
      color: 'green'
    },
    {
      id: 'system-integration',
      icon: <Network className="w-12 h-12" />,
      title: 'System Integration',
      tagline: 'Seamless connection of your business tools',
      description: 'We connect your disparate systems and applications to work together harmoniously, eliminating data silos and improving workflow efficiency across your organization.',
      features: [
        'API development and integration',
        'Third-party service connections',
        'Data migration and synchronization',
        'Workflow automation',
        'Legacy system modernization',
        'Real-time data exchange'
      ],
      technologies: ['REST APIs', 'GraphQL', 'Webhooks', 'Zapier', 'Make', 'Microservices'],
      color: 'teal'
    }
  ];

  const colorVariants = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-600',
      gradient: 'from-blue-500 to-purple-600',
      hover: 'hover:bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-600',
      hover: 'hover:bg-purple-100'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-500',
      text: 'text-indigo-600',
      gradient: 'from-indigo-500 to-blue-600',
      hover: 'hover:bg-indigo-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-600',
      gradient: 'from-green-500 to-teal-600',
      hover: 'hover:bg-green-100'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-500',
      text: 'text-teal-600',
      gradient: 'from-teal-500 to-cyan-600',
      hover: 'hover:bg-teal-100'
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
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Innovation & Technology
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Cutting-edge technology solutions that propel your business forward. From custom software to mobile apps, we transform your digital vision into reality.
          </p>
          <Link 
            to="/#contact"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
          >
            Start Your Project
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

                        {/* Technologies */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-3">Technologies We Use:</h3>
                          <div className="flex flex-wrap gap-2">
                            {service.technologies.map((tech, idx) => (
                              <span 
                                key={idx}
                                className={`px-4 py-2 bg-white rounded-full text-sm font-medium ${colors.text} border ${colors.border} ${colors.hover} transition-colors duration-300`}
                              >
                                {tech}
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
                            Get Started with {service.title}
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
      <section className="py-20 px-4 bg-gradient-to-b from-blue-600 to-blue-800 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Innovate?</h2>
          <p className="text-lg text-white mb-8">
            Let's discuss how our technology solutions can transform your business. 
            Our team is ready to turn your ideas into reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/#contact"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
            >
              Contact Us Today
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

export default InnovationPage;