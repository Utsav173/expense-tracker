import { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Privacy Policy - Expense Tracker',
  description:
    'Read the privacy policy for Expense Tracker. Learn how we collect, use, and protect your personal and financial information.',
  keywords: [
    'privacy policy',
    'data privacy',
    'expense tracker privacy',
    'financial data security'
  ],
  openGraph: {
    title: 'Privacy Policy - Expense Tracker',
    description: 'Understand our commitment to your data privacy and security.',
    url: 'https://expense-pro.vercel.app/legal/privacy-policy',
    type: 'website',
    images: [
      {
        url: 'https://expense-pro.vercel.app/og-image-privacy.png',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Privacy Policy'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - Expense Tracker',
    description: 'Your privacy is our priority. Learn about our data handling practices.',
    images: ['https://expense-pro.vercel.app/og-image-privacy.png']
  },
  verification: {
    google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
  }
};

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  url: 'https://expense-pro.vercel.app/legal/privacy-policy',
  description:
    'Official privacy policy of Expense Tracker, detailing data collection, usage, and protection.'
};

const PrivacyPolicyPage = () => {
  return (
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <div className='bg-background min-h-screen px-4 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <div className='mb-12 text-center'>
            <ShieldAlert className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400' />
            <h1 className='text-foreground text-4xl font-bold md:text-5xl'>Privacy Policy</h1>
          </div>
          <article className='prose prose-slate dark:prose-invert lg:prose-lg mx-auto'>
            <p>
              Welcome to Expense Pro! Your privacy is critically important to us. This Privacy
              Policy document outlines the types of personal information that is received and
              collected by Expense Pro and how it is used.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              <strong>a. Account Information:</strong> When you register for an account, we collect
              information such as your name, email address, and password (stored securely hashed).
              You may optionally provide a profile picture.
            </p>
            <p>
              <strong>b. Financial Data:</strong> You provide financial data including account
              names, balances, transaction details (description, amount, category, date), budget
              information, savings goals, investment details, and debt information. This data is
              essential for the functionality of the application.
            </p>
            <p>
              <strong>c. AI API Keys:</strong> If you choose to use the AI Assistant feature, you
              may provide your own API key (e.g., for Google AI). We store this key securely
              encrypted using AES-GCM encryption and only decrypt it on the server when needed to
              process your AI requests. We do not have access to the raw key after it&apos;s
              encrypted.
            </p>
            <p>
              <strong>d. Usage Data:</strong> We may collect information on how the Service is
              accessed and used (&quot;Usage Data&quot;). This UsageData may include information
              such as your computer&apos;s Internet Protocol address (e.g. IP address), browser
              type, browser version, the pages of our Service that you visit, the time and date of
              your visit, the time spent on those pages, unique device identifiers and other
              diagnostic data.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>We use the collected data for various purposes:</p>
            <ul>
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>
                To allow you to participate in interactive features of our Service when you choose
                to do so
              </li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>
                To process your financial data as per the application&apos;s functionality (e.g.,
                calculating balances, generating reports).
              </li>
              <li>
                If you provide an AI API Key, to use that key to interact with the respective AI
                provider on your behalf for the AI Assistant feature.
              </li>
            </ul>

            <h2>3. Data Security</h2>
            <p>
              The security of your data is important to us. We use industry-standard practices to
              protect your information, including password hashing (bcrypt) for authentication
              credentials and AES-GCM encryption for sensitive data like AI API keys. JWTs are used
              for session management. However, remember that no method of transmission over the
              Internet or method of electronic storage is 100% secure.
            </p>

            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              Expense Pro will not rent or sell potentially personally-identifying and
              personally-identifying information to anyone. We may disclose your Personal
              Information only in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>With Your Consent:</strong> For example, when you share an account with
                another user.
              </li>
              <li>
                <strong>Service Providers:</strong> We may employ third-party companies and
                individuals to facilitate our Service, provide the Service on our behalf, or perform
                Service-related services. These third parties have access to your Personal
                Information only to perform these tasks on our behalf and are obligated not to
                disclose or use it for any other purpose. (e.g., email provider for notifications).
              </li>
              <li>
                <strong>For Legal Requirements:</strong> If required to do so by law or in response
                to valid requests by public authorities.
              </li>
              <li>
                <strong>AI Providers:</strong> If you use the AI Assistant, your prompts and
                relevant (anonymized where possible) context data will be sent to the AI provider
                (e.g., Google AI) using your provided API key. Their use of this data is governed by
                their respective privacy policies.
              </li>
            </ul>

            <h2>5. User Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information. You can
              manage your account information through your profile settings. For deletion of your
              entire account and associated data, please contact us.
            </p>

            <h2>6. Cookies</h2>
            <p>
              We use cookies for session management and to ensure the proper functioning of our
              application. Our primary use of cookies is for authentication (e.g., storing your JWT
              in an HttpOnly cookie).
            </p>

            <h2>7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page. You are advised to review this Privacy
              Policy periodically for any changes.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our{' '}
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

export default PrivacyPolicyPage;
