import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { featuresList } from '@/lib/data/features-list';
import { IconName } from '@/components/ui/icon-map';

export const runtime = 'edge';

export const alt = 'Expense Pro Feature';
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

// Icon components that return JSX directly (Satori compatible)
function getIconComponent(iconName: IconName) {
  const iconProps = {
    width: 48,
    height: 48,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (iconName) {
    case 'lock':
      return (
        <svg {...iconProps}>
          <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
          <path d='M7 11V7a5 5 0 0 1 10 0v4' />
        </svg>
      );
    case 'users':
      return (
        <svg {...iconProps}>
          <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      );
    case 'arrowLeftRight':
      return (
        <svg {...iconProps}>
          <path d='M17 11h6m0 0l-3-3m3 3l-3 3M7 11H1m0 0l3-3m-3 3l3 3' />
        </svg>
      );
    case 'filter':
      return (
        <svg {...iconProps}>
          <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
        </svg>
      );
    case 'fileDown':
      return (
        <svg {...iconProps}>
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <polyline points='14 2 14 8 20 8' />
          <line x1='12' y1='18' x2='12' y2='12' />
          <polyline points='9 15 12 18 15 15' />
        </svg>
      );
    case 'tag':
      return (
        <svg {...iconProps}>
          <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
          <line x1='7' y1='7' x2='7.01' y2='7' />
        </svg>
      );
    case 'target':
      return (
        <svg {...iconProps}>
          <circle cx='12' cy='12' r='10' />
          <circle cx='12' cy='12' r='6' />
          <circle cx='12' cy='12' r='2' />
        </svg>
      );
    case 'scale':
      return (
        <svg {...iconProps}>
          <path d='M12 3v18' />
          <path d='M5 7l7-4 7 4' />
          <path d='M5 17l7 4 7-4' />
        </svg>
      );
    case 'trendingUp':
      return (
        <svg {...iconProps}>
          <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
          <polyline points='17 6 23 6 23 12' />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
      );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    const feature = featuresList.find((f) => f.slug === slug);

    if (!feature) {
      return new Response('Feature not found', { status: 404 });
    }

    // Fetch Inter font from a reliable CDN
    const fontRegularData = fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff'
    ).then((res) => res.arrayBuffer());

    const fontBoldData = fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'
    ).then((res) => res.arrayBuffer());

    const [fontRegular, fontBold] = await Promise.all([fontRegularData, fontBoldData]);

    return new ImageResponse(
      (
        <div
          style={{
            fontFamily: 'Inter',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            color: '#0f172a',
            position: 'relative',
            background: 'white'
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)'
            }}
          />

          {/* Decorative corner accent - top left */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 200,
              height: 200,
              backgroundImage:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, transparent 70%)'
            }}
          />

          {/* Decorative corner accent - bottom right */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 250,
              height: 250,
              backgroundImage:
                'linear-gradient(315deg, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
            }}
          />

          {/* Logo and brand */}
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: 52,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <img
              src='https://expense-pro.khatriutsav.com/apple-touch-icon.png'
              width={40}
              height={40}
              alt='logo'
            />
            <span
              style={{
                marginLeft: 14,
                fontSize: 28,
                fontWeight: 600,
                color: '#1e293b',
                letterSpacing: '-0.02em'
              }}
            >
              Expense Pro
            </span>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Icon container with modern aesthetic */}
            <div
              style={{
                display: 'flex',
                height: 110,
                width: 110,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow:
                  '0 20px 60px -12px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.1)'
              }}
            >
              <div style={{ color: 'white', display: 'flex' }}>
                {getIconComponent(feature.icon)}
              </div>
            </div>

            {/* Title with refined typography */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 700,
                marginTop: 36,
                letterSpacing: '-0.04em',
                margin: '36px 0 0 0',
                color: '#0f172a',
                lineHeight: 1.1
              }}
            >
              {feature.title}
            </h1>

            {/* Description with better readability */}
            <p
              style={{
                marginTop: 28,
                fontSize: 32,
                maxWidth: 880,
                color: '#475569',
                margin: '28px 0 0 0',
                lineHeight: 1.5,
                fontWeight: 400
              }}
            >
              {feature.description}
            </p>
          </div>

          {/* Subtle bottom badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 44,
              right: 52,
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: 'rgba(241, 245, 249, 0.8)',
              borderRadius: 100,
              fontSize: 18,
              color: '#64748b',
              fontWeight: 500
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                marginRight: 10
              }}
            />
            Feature
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: fontRegular, style: 'normal', weight: 400 },
          { name: 'Inter', data: fontBold, style: 'normal', weight: 700 }
        ]
      }
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
