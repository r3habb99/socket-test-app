import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getApiUrl, getSocketUrl } from '../../utils/envUtils';
import './ImageProxy.css';

/**
 * ImageProxy component that handles CORS/CORP issues with images
 * It converts external images to data URLs or falls back to a default image
 *
 * @param {Object} props - Component props
 * @param {string} props.src - Source URL of the image
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.defaultSrc - Default image to use if loading fails
 * @param {string} props.className - CSS class for the image
 * @param {boolean} props.noCache - Whether to add a cache-busting parameter to the URL
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @returns {React.ReactElement} Image component
 */
const ImageProxy = ({
  src,
  alt,
  defaultSrc,
  className,
  noCache = false,
  onLoad,
  onError,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const prevSrcRef = useRef(null);

  useEffect(() => {
    // If the src hasn't changed, don't reload the image
    if (prevSrcRef.current === src && imageSrc && !loading) {
      return;
    }

    // Update the previous src reference
    prevSrcRef.current = src;

    // Debug log for image loading
    console.log('ImageProxy loading image:', src);

    // Reset state when src changes
    setLoading(true);
    setError(false);

    // If no src, use the default
    if (!src) {
      setImageSrc(defaultSrc);
      setLoading(false);
      return;
    }

    // If it's already a data URL, use it directly
    if (src.startsWith('data:')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Special case for URLs that might have the full path but are missing the protocol
    // For example: 192.168.1.7:5050/uploads/profile-pictures/image.jpg
    if (src.includes('192.168.1.7:5050') || src.includes('localhost:5050')) {
      // Add http:// protocol if missing
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        const fullUrl = src.startsWith('//') ? `http:${src}` : `http://${src}`;
        console.log('Fixed URL with protocol in ImageProxy:', fullUrl);
        setImageSrc(fullUrl);
        setLoading(false);
        return;
      }
    }

    // Add cache-busting parameter if noCache is true
    let processedSrc = src;
    if (noCache && !src.includes('t=')) {
      const timestamp = new Date().getTime();
      processedSrc = src.includes('?')
        ? `${src}&t=${timestamp}`
        : `${src}?t=${timestamp}`;
    }

    // If src is a relative path to our public folder, use it directly
    if (processedSrc.startsWith('/')) {
      // Check if it's an API path (like /uploads/) that needs the API base URL
      if (processedSrc.startsWith('/uploads/')) {
        const API_BASE_URL = getApiUrl();

        // Remove /api prefix if it's already in the API_BASE_URL
        const baseUrl = API_BASE_URL.endsWith('/api')
          ? API_BASE_URL.substring(0, API_BASE_URL.length - 4)
          : API_BASE_URL;

        // Don't add /api prefix to /uploads/ paths
        setImageSrc(`${baseUrl}${processedSrc}`);

        console.log('Image URL for uploads:', `${baseUrl}${processedSrc}`);
      } else {
        setImageSrc(processedSrc);
      }
      setLoading(false);
      return;
    }

    // For external URLs that might have CORS/CORP issues, we'll handle them differently
    // If the URL is from our API server, we'll use it directly but handle errors
    const serverUrl = getSocketUrl();
    if (serverUrl && processedSrc.includes(new URL(serverUrl).hostname)) {
      setImageSrc(processedSrc);
      setLoading(false);
      return;
    }

    const img = new Image();

    img.onload = () => {
      setImageSrc(processedSrc);
      setLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = (e) => {
      console.warn(`Failed to load image: ${processedSrc}`, e);
      console.error('Image load error details:', {
        originalSrc: src,
        processedSrc,
        error: e
      });
      setImageSrc(defaultSrc);
      setError(true);
      setLoading(false);
      if (onError) onError(e);
    };

    // Set the src to trigger loading
    img.src = processedSrc;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, defaultSrc, onLoad, onError, noCache, imageSrc, loading]);

  if (loading) {
    return <div className={`image-proxy-loading ${className || ''}`} />;
  }

  return (
    <img
      src={imageSrc || defaultSrc}
      alt={alt}
      className={`image-proxy ${error ? 'image-proxy-error' : ''} ${className || ''}`}
      {...rest}
    />
  );
};

ImageProxy.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  defaultSrc: PropTypes.string.isRequired,
  className: PropTypes.string,
  noCache: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default ImageProxy;
