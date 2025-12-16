import { useState, useRef, useEffect, memo } from "react";
import PropTypes from "prop-types";
import ImageProxy from "../ImageProxy/ImageProxy";
import "./LazyImage.css";

/**
 * LazyImage component with intersection observer for lazy loading
 * Wraps ImageProxy with lazy loading capabilities for better performance
 */
const LazyImage = memo(({
  src,
  alt,
  defaultSrc,
  className = "",
  placeholderClassName = "",
  threshold = 0.1,
  rootMargin = "50px",
  ...rest
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setHasLoaded(true);
    if (rest.onLoad) {
      rest.onLoad();
    }
  };

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-container ${className}`}
      aria-busy={!hasLoaded}
    >
      {isInView ? (
        <ImageProxy
          src={src}
          alt={alt}
          defaultSrc={defaultSrc}
          className={`lazy-image ${hasLoaded ? "lazy-image--loaded" : "lazy-image--loading"}`}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
          {...rest}
        />
      ) : (
        <div 
          className={`lazy-image-placeholder ${placeholderClassName}`}
          aria-hidden="true"
          role="img"
          aria-label={alt}
        />
      )}
    </div>
  );
});

LazyImage.displayName = "LazyImage";

LazyImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  defaultSrc: PropTypes.string.isRequired,
  className: PropTypes.string,
  placeholderClassName: PropTypes.string,
  threshold: PropTypes.number,
  rootMargin: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default LazyImage;

