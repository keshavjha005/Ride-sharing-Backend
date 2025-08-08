import React, { useState, useRef, useEffect } from 'react';
import { Building2 } from 'lucide-react';

/**
 * BrandLogo Component
 * A reusable component for displaying vehicle brand logos with fallbacks and optimization
 * 
 * Features:
 * - Lazy loading for performance
 * - Error handling with fallback
 * - Loading state
 * - Responsive sizing
 * - Accessibility support
 */

const BrandLogo = ({ 
  logoUrl, 
  brandName, 
  size = 'md',
  className = '',
  showFallbackText = true,
  lazy = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef(null);



  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-sm',
    '2xl': 'text-base'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;
  const textSize = textSizes[size] || textSizes.md;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image load error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Generate initials from brand name for text fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Render fallback content
  const renderFallback = () => (
    <div className={`${sizeClass} bg-background-tertiary rounded-lg border border-border flex items-center justify-center ${className}`}>
      {showFallbackText ? (
        <span className={`text-text-muted font-medium ${textSize}`}>
          {getInitials(brandName)}
        </span>
      ) : (
        <Building2 size={iconSize} className="text-text-muted" />
      )}
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className={`${sizeClass} bg-background-secondary rounded-lg border border-border flex items-center justify-center animate-pulse ${className}`}>
      <div className="w-full h-full bg-background-tertiary rounded-lg"></div>
    </div>
  );

  // If no logo URL provided, show fallback immediately
  if (!logoUrl) {
    return renderFallback();
  }

  return (
    <div ref={imgRef} className={`relative ${sizeClass} ${className}`}>
      {/* Loading state */}
      {isLoading && isVisible && renderLoading()}
      
      {/* Error fallback */}
      {hasError && renderFallback()}
      
      {/* Placeholder for lazy loading */}
      {!isVisible && renderLoading()}
      
      {/* Actual image */}
      {!hasError && isVisible && (
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className={`${sizeClass} object-contain rounded-lg border border-border bg-white transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager" // We handle lazy loading with Intersection Observer
          decoding="async"
          // Add accessibility attributes
          role="img"
          aria-label={`${brandName} brand logo`}
        />
      )}
    </div>
  );
};

export default BrandLogo;
