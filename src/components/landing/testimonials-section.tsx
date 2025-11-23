'use client';

import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { gsap } from 'gsap';
import { Icon } from '../ui/icon';

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  avatar: string;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ quote, name, title, avatar }) => (
  <Card className='testimonial-card-anim flex h-full flex-col items-start justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10 dark:bg-white/5 dark:hover:bg-white/10'>
    <div className='mb-6'>
      <Icon name='messageSquare' className='h-8 w-8 text-primary/80' />
      <p className='mt-4 text-lg font-medium leading-relaxed text-foreground/90'>"{quote}"</p>
    </div>
    <div className='flex items-center gap-4'>
      <Avatar className='h-12 w-12 rounded-full border-2 border-primary/20'>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className='rounded-full font-bold bg-primary/10 text-primary'>
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className='text-base font-bold tracking-wide text-foreground'>{name}</h3>
        <p className='text-sm font-medium text-muted-foreground'>{title}</p>
      </div>
    </div>
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
    <section className='bg-background py-24'>
      <div className='container mx-auto px-4'>
        <div className='mb-20 text-center'>
          <h2 className='text-4xl font-bold tracking-tighter text-foreground md:text-6xl'>
            What Our <span className='text-primary'>Users Say</span>
          </h2>
          <p className='mx-auto mt-6 max-w-2xl text-xl font-medium text-muted-foreground'>
            Don't just take our word for it. Hear from real users who have transformed their financial
            lives.
          </p>
        </div>
        <div ref={testimonialsRef} className='mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
