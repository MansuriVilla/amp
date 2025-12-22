// CustomLightbox.jsx
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { gsap } from "gsap";

const CustomLightbox = ({ 
  isOpen, 
  currentImageIndex, 
  images, 
  onClose, 
  onNavigate 
}) => {
  const [isLightboxMounted, setIsLightboxMounted] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [customCursorVisible, setCustomCursorVisible] = useState(false);
  const [customCursorPosition, setCustomCursorPosition] = useState({ x: 0, y: 0 });
  const [customCursorType, setCustomCursorType] = useState("default");

  // Refs
  const lightboxRef = useRef(null);
  const lightboxContentRef = useRef(null);
  const lightboxThumbnailsRef = useRef(null);
  const closeButtonRef = useRef(null);
  const customCursorRef = useRef(null);
  const navigationInProgress = useRef(false);
  const hasOpenedRef = useRef(false);
  const lightboxImagesRefs = useRef([]);
  const lightboxThumbnailElementsRefs = useRef([]);

  // Ref management functions
  const addLightboxImageRef = useCallback((el) => {
    if (el && !lightboxImagesRefs.current.includes(el)) {
      lightboxImagesRefs.current.push(el);
      lightboxImagesRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  const addLightboxThumbnailRef = useCallback((el) => {
    if (el && !lightboxThumbnailElementsRefs.current.includes(el)) {
      lightboxThumbnailElementsRefs.current.push(el);
      lightboxThumbnailElementsRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  // Thumbnail highlighting
  const updateThumbnailsHighlight = useCallback((index) => {
    lightboxThumbnailElementsRefs.current.forEach((thumbnail, i) => {
      if (thumbnail) {
        thumbnail.classList.toggle("active", i === index);
      }
    });

    // Scroll active thumbnail into view
    const activeThumbnail = lightboxThumbnailElementsRefs.current[index];
    if (activeThumbnail && lightboxThumbnailsRef.current) {
      const thumbnailsContainer = lightboxThumbnailsRef.current;
      const thumbnailRect = activeThumbnail.getBoundingClientRect();
      const containerRect = thumbnailsContainer.getBoundingClientRect();

      if (thumbnailRect.left < containerRect.left) {
        thumbnailsContainer.scrollLeft += thumbnailRect.left - containerRect.left;
      } else if (thumbnailRect.right > containerRect.right) {
        thumbnailsContainer.scrollLeft += thumbnailRect.right - containerRect.right;
      }
    }
  }, []);

  // Navigation direction calculation
  const directionFromCurrent = useCallback((currentIndex, targetIndex, totalCount) => {
    const diff = targetIndex - currentIndex;
    const absDiff = Math.abs(diff);

    if (absDiff > totalCount / 2) {
      return diff > 0 ? "-100%" : "100%";
    } else {
      return diff > 0 ? "100%" : "-100%";
    }
  }, []);

  // Lightbox navigation
  const navigateLightbox = useCallback((direction, specificIndex = null) => {
    if (navigationInProgress.current) return;

    const totalCount = images.length;
    let newIndex = currentImageIndex;

    if (specificIndex !== null) {
      if (specificIndex === currentImageIndex) return;
      newIndex = specificIndex;
    } else if (direction === "next") {
      newIndex = (currentImageIndex + 1) % totalCount;
    } else if (direction === "prev") {
      newIndex = (currentImageIndex - 1 + totalCount) % totalCount;
    }

    if (newIndex === currentImageIndex && specificIndex === null) return;

    navigationInProgress.current = true;
    setIsImageLoading(true);

    const oldImageEl = lightboxImagesRefs.current[currentImageIndex];
    const newImageEl = lightboxImagesRefs.current[newIndex];

    if (oldImageEl && newImageEl) {
      const startXNew = directionFromCurrent(currentImageIndex, newIndex, totalCount);
      const endXOld = startXNew === "100%" ? "-100%" : "100%";

      // Preload image
      const img = new Image();
      img.src = images[newIndex].image_bg;
      
      img.onload = () => {
        setIsImageLoading(false);

        gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10, scale: 1 });
        gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5, scale: 1 });

        gsap.timeline({
          onComplete: () => {
            gsap.set(oldImageEl, { autoAlpha: 0, x: "0%", zIndex: 1 });
            gsap.set(newImageEl, { autoAlpha: 1, x: "0%", zIndex: 10 });
            onNavigate(newIndex);
            updateThumbnailsHighlight(newIndex);
            navigationInProgress.current = false;
          },
        })
        .to(oldImageEl, { x: endXOld, duration: 0.6, ease: "power2.inOut" }, 0)
        .to(newImageEl, { x: "0%", duration: 0.6, ease: "power2.inOut" }, 0);
      };

      img.onerror = () => {
        console.error("Failed to load image:", img.src);
        setIsImageLoading(false);
        navigationInProgress.current = false;
      };
    } else {
      onNavigate(newIndex);
      updateThumbnailsHighlight(newIndex);
      setIsImageLoading(false);
      navigationInProgress.current = false;
    }
  }, [currentImageIndex, images, onNavigate, directionFromCurrent, updateThumbnailsHighlight]);

  // Custom cursor handlers
  const handleMouseMove = useCallback((e) => {
    if (!isLightboxMounted || !lightboxRef.current || !customCursorRef.current || !closeButtonRef.current) {
      setCustomCursorVisible(false);
      return;
    }

    const lightboxRect = lightboxRef.current.getBoundingClientRect();
    const closeButtonRect = closeButtonRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const isWithinLightboxBounds =
      mouseX >= lightboxRect.left &&
      mouseX <= lightboxRect.right &&
      mouseY >= lightboxRect.top &&
      mouseY <= lightboxRect.bottom;

    const isOverCloseButton =
      mouseX >= closeButtonRect.left &&
      mouseX <= closeButtonRect.right &&
      mouseY >= closeButtonRect.top &&
      mouseY <= closeButtonRect.bottom;

    if (!isWithinLightboxBounds || isOverCloseButton) {
      setCustomCursorVisible(false);
      return;
    }

    setCustomCursorPosition({ x: mouseX, y: mouseY });
    setCustomCursorVisible(true);

    const contentRect = lightboxContentRef.current.getBoundingClientRect();
    const contentThreshold = contentRect.width * 0.2;
    const relativeMouseX = mouseX - contentRect.left;

    if (relativeMouseX < contentThreshold) {
      setCustomCursorType("left");
    } else if (relativeMouseX > contentRect.width - contentThreshold) {
      setCustomCursorType("right");
    } else {
      setCustomCursorType("default");
    }
  }, [isLightboxMounted]);

  const handleMouseDown = useCallback((e) => {
    if (!isLightboxMounted || !lightboxRef.current || isImageLoading) return;

    const contentRect = lightboxContentRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const relativeMouseX = mouseX - contentRect.left;
    const threshold = contentRect.width * 0.2;

    if (relativeMouseX < threshold) {
      navigateLightbox("prev");
    } else if (relativeMouseX > contentRect.width - threshold) {
      navigateLightbox("next");
    }
  }, [isLightboxMounted, isImageLoading, navigateLightbox]);

  const handleMouseLeave = useCallback(() => {
    setCustomCursorVisible(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isLightboxMounted) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          navigateLightbox("next");
          break;
        case "ArrowLeft":
          navigateLightbox("prev");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxMounted, onClose, navigateLightbox]);

  // Mouse event listeners
  useEffect(() => {
    if (isLightboxMounted) {
      window.addEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.addEventListener("mousedown", handleMouseDown);
        lightboxRef.current.addEventListener("mouseleave", handleMouseLeave);
      }
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.removeEventListener("mousedown", handleMouseDown);
        lightboxRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isLightboxMounted, handleMouseMove, handleMouseDown, handleMouseLeave]);

  // Custom cursor visibility animation
  useEffect(() => {
    if (customCursorRef.current) {
      gsap.to(customCursorRef.current, {
        autoAlpha: customCursorVisible ? 1 : 0,
        duration: 0.3
      });
    }
  }, [customCursorVisible]);

  // Main lightbox open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsLightboxMounted(true);
      document.body.style.overflow = "hidden";
      document.body.classList.add("hide-cursor");

      // Reset all images
      lightboxImagesRefs.current.forEach((imgEl) => {
        gsap.set(imgEl, {
          autoAlpha: 0,
          zIndex: 1,
          x: "0%",
          scale: 1,
        });
      });

      // Animate lightbox in
      if (!hasOpenedRef.current) {
        gsap.to(lightboxRef.current, {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
        });

        // Animate thumbnails in
        gsap.fromTo(
          lightboxThumbnailElementsRefs.current,
          { y: 20, autoAlpha: 0, scale: 0.8 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.2,
          }
        );
      }

      // Load and animate initial image
      const initialImageEl = lightboxImagesRefs.current[currentImageIndex];
      if (initialImageEl) {
        setIsImageLoading(true);
        const img = new Image();
        img.src = images[currentImageIndex].image_bg;
        
        img.onload = () => {
          setIsImageLoading(false);
          
          if (!hasOpenedRef.current) {
            gsap.fromTo(
              initialImageEl,
              { scale: 0.8, autoAlpha: 0, zIndex: 10 },
              {
                scale: 1,
                autoAlpha: 1,
                duration: 0.5,
                ease: "back.out(1.7)",
                delay: 0.1,
                onComplete: () => {
                  hasOpenedRef.current = true;
                }
              }
            );
          } else {
            // If already opened, just ensure it's visible without the opening animation
            gsap.set(initialImageEl, { autoAlpha: 1, zIndex: 10, scale: 1 });
          }
        };
        
        img.onerror = () => {
          console.error("Failed to load image:", img.src);
          setIsImageLoading(false);
        };
      }
    } else if (isLightboxMounted) {
      // Animate lightbox out
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLightboxMounted(false);
          hasOpenedRef.current = false;
          document.body.style.overflow = "auto";
          document.body.classList.remove("hide-cursor");
          setCustomCursorVisible(false);

          // Reset all images
          lightboxImagesRefs.current.forEach((imgEl) => {
            gsap.set(imgEl, { autoAlpha: 0, x: "0%", zIndex: 1, scale: 1 });
          });
        },
      });

      if (lightboxThumbnailElementsRefs.current.length > 0) {
        tl.to(
          lightboxThumbnailElementsRefs.current,
          {
            y: 20,
            autoAlpha: 0,
            scale: 0.8,
            duration: 0.3,
            stagger: 0.03,
            ease: "power2.in",
          },
          0
        );
      }

      if (lightboxImagesRefs.current[currentImageIndex]) {
        tl.to(
          lightboxImagesRefs.current[currentImageIndex],
          { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: "power2.in" },
          "<0.1"
        );
      }

      if (lightboxRef.current) {
        tl.to(
          lightboxRef.current,
          { autoAlpha: 0, duration: 0.4, ease: "power2.in" },
          "<0.1"
        );
      }
    }
  }, [isOpen, isLightboxMounted, currentImageIndex, images]);

  // Update thumbnails when current image changes
  useLayoutEffect(() => {
    if (isOpen && isLightboxMounted) {
      updateThumbnailsHighlight(currentImageIndex);
    }
  }, [isOpen, currentImageIndex, isLightboxMounted, updateThumbnailsHighlight]);

  if (!isLightboxMounted) return null;

  return (
    <>
      <div
        className="lightbox-overlay"
        ref={lightboxRef}
        onClick={onClose}
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          className="lightbox-content"
          ref={lightboxContentRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="lightbox-close" 
            ref={closeButtonRef} 
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
          >
            &times;
          </button>

          {isImageLoading && (
            <div className="lightbox-loader">
              <div className="spinner"></div>
            </div>
          )}

          {images.map((data, index) => (
            <img
              key={index}
              ref={addLightboxImageRef}
              data-index={index}
              src={data.image_bg}
              alt={`Gallery Image ${index + 1}`}
              className="lightbox-image"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "translateX(0%)",
                visibility: "hidden",
                opacity: 0,
                zIndex: 1,
              }}
            />
          ))}

          <div 
            className="lightbox-thumbnails" 
            ref={lightboxThumbnailsRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {images.map((data, index) => (
              <div
                key={index}
                ref={addLightboxThumbnailRef}
                data-index={index}
                className={`lightbox-thumbnail ${
                  index === currentImageIndex ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(null, index);
                }}
              >
                <img src={data.image_bg} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={customCursorRef}
        className={`custom-cursor ${customCursorType} ${
          customCursorVisible ? "active" : ""
        }`}
        style={{ left: customCursorPosition.x, top: customCursorPosition.y }}
      >
        {customCursorType === "left" && <span>&#10094;</span>}
        {customCursorType === "right" && <span>&#10095;</span>}
      </div>
    </>
  );
};

export default CustomLightbox;