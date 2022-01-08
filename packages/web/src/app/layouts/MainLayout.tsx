import React, { ReactNode } from 'react';

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="main-layout">
      {children}
      <style jsx>{`
        .main-layout {
        }
      `}</style>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        @font-face {
          font-family: 'VCR_OSD';
          src: url('/fonts/VCR_OSD_MONO.ttf');
          font-style: medium;
          font-weight: 500;
        }
        html,
        body {
           {
            /* font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol'; */
          }
          font-family: 'VCR_OSD', monospace;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
