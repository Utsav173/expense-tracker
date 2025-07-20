'use client';

import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service',
  url: 'https://expense-pro.vercel.app/legal/terms-of-service',
  description:
    'Official terms of service for Expense Tracker, detailing user agreements and service usage.'
};

const TermsOfServicePage = () => {
  return (
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <div className='bg-background min-h-screen px-4 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <div className='text-center mb-12'>
            <FileText className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400' />
            <h1 className='text-foreground text-4xl font-bold md:text-5xl'>Terms of Service</h1>
          </div>
          <article className='prose prose-slate dark:prose-invert lg:prose-lg mx-auto'>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Expense Pro (the &quot;Service&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms,
              then you may not access the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Expense Pro provides users with tools and features for personal financial management,
              including but not limited to expense tracking, budgeting, goal setting, investment
              monitoring, debt management, and an AI-powered financial assistant.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must register for an account. You are
              responsible for maintaining the confidentiality of your account password and for all
              activities that occur under your account. You agree to notify us immediately of any
              unauthorized use of your account.
            </p>

            <h2>4. User Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Upload or transmit any content that is unlawful, harmful, threatening, abusive, or
                otherwise objectionable.
              </li>
              <li>Impersonate any person or entity.</li>
              <li>
                Interfere with or disrupt the Service or servers or networks connected to the Service.
              </li>
            </ul>
            <p>
              If using the AI Assistant feature, you are responsible for the API key you provide and
              its usage limits with the third-party AI provider (e.g., Google AI). Expense Pro is not
              responsible for any charges incurred from your AI provider.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding Content provided by users), features,
              and functionality are and will remain the exclusive property of Expense Pro and its
              licensors.
            </p>

            <h2>6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
              Expense Pro makes no warranties, expressed or implied, and hereby disclaims and negates
              all other warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual
              property or other violation of rights.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall Expense Pro, nor its directors, employees, partners, agents,
              suppliers, or affiliates, be liable for any indirect, incidental, special, consequential
              or punitive damages, including without limitation, loss of profits, data, use, goodwill,
              or other intangible losses, resulting from your access to or use of or inability to
              access or use the Service.
            </p>

            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately,
              without prior notice or liability, under our sole discretion, for any reason whatsoever
              and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2>9. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of India,
              without regard to its conflict of law provisions.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any
              time. If a revision is material we will try to provide at least 30 days&apos; notice
              prior to any new terms taking effect.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us via our{' '}
              <Link
                href='/support/contact'
                className='text-sky-600 hover:underline dark:text-sky-400'
              >
                Contact Support page
              </Link>
              .
            </p>
          </article>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
