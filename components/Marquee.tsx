import React from 'react';

// Edit this line to change the ticker text
const TICKER = '이공일 李空一 gong il lee ';

const Marquee: React.FC = () => {
  const copy = TICKER.repeat(10);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden border-t border-ink bg-paper text-accent">
      <div className="marquee-track font-mono text-[11px] tracking-[0.08em] py-[7px]">
        <span>{copy}</span>
        <span aria-hidden="true">{copy}</span>
      </div>
    </div>
  );
};

export default Marquee;
