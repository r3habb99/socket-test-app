import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  API_URL,
  SOCKET_URL,
  API_HOST,
  LEGACY_API_HOSTS
} from '../../../constants';
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
    const currentApiHost = API_HOST;

    // Check if the src includes any of the known API hosts
    if (src.includes(currentApiHost) || LEGACY_API_HOSTS.some(host => src.includes(host))) {
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
        // Remove /api prefix if it's already in the API_URL
        const baseUrl = API_URL.endsWith('/api')
          ? API_URL.substring(0, API_URL.length - 4)
          : API_URL;

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
    if (SOCKET_URL && processedSrc.includes(new URL(SOCKET_URL).hostname)) {
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

      // Additional debugging for IP address issues
      const legacyHostFound = LEGACY_API_HOSTS.find(host => processedSrc.includes(host));

      if (legacyHostFound) {
        console.error(`Detected old IP address (${legacyHostFound}) in image URL. This should have been replaced with the current API URL.`);

        // Try to fix the URL on error
        const currentHostPort = API_HOST;

        // Create a regex to replace the legacy host with the current host
        const legacyHostRegex = new RegExp(legacyHostFound.replace(/\./g, '\\.'), 'g');
        const fixedUrl = processedSrc.replace(legacyHostRegex, currentHostPort);
        console.log('Attempting to fix URL on error:', fixedUrl);

        // Try loading with fixed URL
        const retryImg = new Image();
        retryImg.onload = () => {
          console.log('Successfully loaded image with fixed URL:', fixedUrl);
          setImageSrc(fixedUrl);
          setError(false);
          setLoading(false);
          if (onLoad) onLoad();
        };

        retryImg.onerror = () => {
          console.error('Still failed to load image with fixed URL:', fixedUrl);
          setImageSrc(defaultSrc);
          setError(true);
          setLoading(false);
          if (onError) onError(e);
        };

        retryImg.src = fixedUrl;
        return;
      }

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
