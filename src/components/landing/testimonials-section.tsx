'use client';

import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { gsap } from 'gsap';

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  avatar: string;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ quote, name, title, avatar }) => (
  <Card className='testimonial-card-anim flex flex-col items-center p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:shadow-xl'>
    <Avatar className='mb-4 h-20 w-20'>
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback>
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </AvatarFallback>
    </Avatar>
    <CardContent className='text-muted-foreground text-md mb-4 italic'>"{quote}"</CardContent>
    <h3 className='text-foreground text-lg font-semibold'>{name}</h3>
    <p className='text-muted-foreground text-sm'>{title}</p>
  </Card>
);

const TestimonialsSection = () => {
  const testimonialsRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      '.testimonial-card-anim',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: testimonialsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, []);

  const testimonials = [
    {
      quote:
        'Expense Pro has revolutionized how I manage my finances. The AI insights are a game-changer!',
      name: 'Sarah J.',
      title: 'Small Business Owner',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah+J'
    },
    {
      quote: 'Finally, an app that makes budgeting easy and even enjoyable. Highly recommend!',
      name: 'David L.',
      title: 'Financial Analyst',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=David+L'
    },
    {
      quote: "The best expense tracker I've used. Clean interface and powerful features.",
      name: 'Emily R.',
      title: 'Freelance Designer',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Emily+R'
    }
  ];

  return (
    <section className='bg-background py-20'>
      <div className='container mx-auto px-4 text-center'>
        <h2 className='text-foreground mb-4 text-4xl font-bold'>What Our Users Say</h2>
        <p className='text-muted-foreground mx-auto mb-12 max-w-3xl text-lg'>
          Don't just take our word for it. Hear from real users who have transformed their financial
          lives with Expense Pro.
        </p>
        <div ref={testimonialsRef} className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
