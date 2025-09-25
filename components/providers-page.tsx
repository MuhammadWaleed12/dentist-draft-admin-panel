"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Shield, Clock, Star, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import doctors from '@/assets/images/doctors.jpeg'
const features = [
  {
    icon: TrendingUp,
    title: 'Expand your reach',
    description: 'Connect with a broader patient base actively seeking dental services in your area.'
  },
  {
    icon: Shield,
    title: 'Enhanced visibility',
    description: 'Boost your online presence and attract more patients with optimized profiles and search rankings.'
  },
  {
    icon: Clock,
    title: 'Efficient management',
    description: 'Manage appointments, patient communication, and reviews all in one place for a seamless workflow.'
  }
];

const plans = [
  {
    name: 'Basic',
    price: 'Free',
    period: '/month',
    features: [
      'Profile listing',
      'Basic Analytics',
      'Limited Support'
    ],
    buttonText: 'Get started',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Premium',
    price: '$99',
    period: '/month',
    features: [
      'Enhanced profile',
      'Advanced Analytics',
      'Priority Support',
      'Marketing tools'
    ],
    buttonText: 'Get started',
    buttonVariant: 'default' as const,
    popular: true
  }
];

export function ProvidersPage() {
  const [email, setEmail] = useState('');

  const handleBookDemo = () => {
    if (!email) {
      return;
    }
    // Handle demo booking
    console.log('Book demo for:', email);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Connect with more patients and grow your practice
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Join Dentistar and gain access to a vast network of patients seeking quality dental care. Our platform provides the tools and visibility you need to thrive in today's competitive market.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleBookDemo}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  Book a demo
                </Button>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={doctors}
                  alt="Dental professionals"
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose Dentistar Guide?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform is designed to empower dental practices with the tools they need to succeed. 
              From increased visibility to streamlined management, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Subscription Plans
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that best fits your practice needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.buttonVariant}
                    className="w-full"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to grow your practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of dental professionals who trust Dentistar Guide to connect with new patients and grow their practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Your email"
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
            />
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}