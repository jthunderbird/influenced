import { useRef, useState, useEffect } from 'react';
import VideoCard from './VideoCard';

function HorizontalVideoScroll({ videos, showArrows = true }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const canLeft = container.scrollLeft > 0;
    const canRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Check scroll state after mount and after content loads
    const timer = setTimeout(checkScroll, 100);
    container.addEventListener('scroll', checkScroll);
    
    // Also check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);
    
    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [videos]);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  // Show arrows only if we have more videos than can fit in one view
  // or if we have more than a minimum number
  const minToScroll = 3;
  const showScrollButtons = showArrows && videos.length >= minToScroll;

  return (
    <div className="horizontal-scroll-wrapper">
      {showScrollButtons && canScrollLeft && (
        <button 
          className="scroll-arrow scroll-arrow-left" 
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <div 
        className="horizontal-scroll-container" 
        ref={scrollContainerRef}
        onScroll={checkScroll}
      >
        {videos.map((video) => (
          <div key={video.id} className="horizontal-scroll-item">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      {showScrollButtons && canScrollRight && (
        <button 
          className="scroll-arrow scroll-arrow-right" 
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default HorizontalVideoScroll;
