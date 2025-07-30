import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import "./workspace.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function WorkSpace() {
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null);

  // ... (Lightbox and Custom Cursor states and refs remain the same)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isLightboxMounted, setIsLightboxMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const lightboxRef = useRef(null);
  const lightboxContentRef = useRef(null);
  const lightboxThumbnailsRef = useRef(null);

  const [customCursorVisible, setCustomCursorVisible] = useState(false);
  const [customCursorPosition, setCustomCursorPosition] = useState({
    x: 0,
    y: 0,
  });
  const [customCursorType, setCustomCursorType] = useState("default");
  const customCursorRef = useRef(null);

  const lightboxImagesRefs = useRef([]);
  const lightboxThumbnailElementsRefs = useRef([]);

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

  // Cleanup for CTA triggers (not directly related to slider, but kept)
  useEffect(() => {
    const ctaTriggers = [];
    return () => {
      ctaTriggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  // Define updateThumbnailsHighlight here
  const updateThumbnailsHighlight = useCallback((index) => {
    lightboxThumbnailElementsRefs.current.forEach((thumbnail, i) => {
      if (thumbnail) {
        if (i === index) {
          thumbnail.classList.add("active");
        } else {
          thumbnail.classList.remove("active");
        }
      }
    });

    // Optional: Scroll the active thumbnail into view
    const activeThumbnail = lightboxThumbnailElementsRefs.current[index];
    if (activeThumbnail && lightboxThumbnailsRef.current) {
      const thumbnailsContainer = lightboxThumbnailsRef.current;
      const thumbnailRect = activeThumbnail.getBoundingClientRect();
      const containerRect = thumbnailsContainer.getBoundingClientRect();

      // Check if thumbnail is out of view to the left
      if (thumbnailRect.left < containerRect.left) {
        thumbnailsContainer.scrollLeft += thumbnailRect.left - containerRect.left;
      }
      // Check if thumbnail is out of view to the right
      else if (thumbnailRect.right > containerRect.right) {
        thumbnailsContainer.scrollLeft += thumbnailRect.right - containerRect.right;
      }
    }
  }, []);

  // Use a ref for animation state to persist across renders and avoid re-closures
  const animationState = useRef({
    currentX: 0,
    targetX: 0,
    slideWidth: 0,
    slides: [],
    isMobile: false,
    animationId: null,
    isAnimationActive: false,
    isSliderInitialized: false, // NEW: Track if slider has been initialized
  });

  const config = {
    SCROLL_SPEED: 1.5,
    LERP_FACTOR: 0.05,
  };
  const totalSlideCount = WorkSpaceData.length;

  // Memoize these functions to avoid re-creation on every render
  const checkMobile = useCallback(() => {
    animationState.current.isMobile = window.innerWidth <= 768;
  }, []);

  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const directionFromCurrent = useCallback(
    (currentIndex, targetIndex, totalCount) => {
      const diff = targetIndex - currentIndex;
      const absDiff = Math.abs(diff);

      if (absDiff > totalCount / 2) {
        if (diff > 0) {
          return "-100%";
        } else {
          return "100%";
        }
      } else {
        if (diff > 0) {
          return "100%";
        } else {
          return "-100%";
        }
      }
    },
    []
  );

  const navigationInProgress = useRef(false);

  const navigateLightbox = useCallback(
    (direction, specificIndex = null) => {
      if (navigationInProgress.current) return;

      const totalCount = WorkSpaceData.length;
      let newIndex = currentImageIndex;

      if (specificIndex !== null) {
        if (specificIndex === currentImageIndex) return;
        newIndex = specificIndex;
      } else if (direction === "next") {
        newIndex = (currentImageIndex + 1) % totalCount;
      } else if (direction === "prev") {
        newIndex = (currentImageIndex - 1 + totalCount) % totalCount;
      }

      if (newIndex === currentImageIndex && specificIndex === null) {
        return;
      }

      navigationInProgress.current = true;
      setIsImageLoading(true);

      const oldImageEl = lightboxImagesRefs.current[currentImageIndex];
      const newImageEl = lightboxImagesRefs.current[newIndex];

      if (oldImageEl && newImageEl) {
        const startXNew = directionFromCurrent(
          currentImageIndex,
          newIndex,
          totalCount
        );
        const endXOld = startXNew === "100%" ? "-100%" : "100%";

        const img = new Image();
        img.src = WorkSpaceData[newIndex].image_bg;
        img.onload = () => {
          setIsImageLoading(false);

          gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10, scale: 1 });
          gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5, scale: 1 });

          gsap
            .timeline({
              onComplete: () => {
                gsap.set(oldImageEl, { autoAlpha: 0, x: "0%", zIndex: 1 });
                gsap.set(newImageEl, { autoAlpha: 1, x: "0%", zIndex: 10 });
                setCurrentImageIndex(newIndex);
                updateThumbnailsHighlight(newIndex);
                navigationInProgress.current = false;
              },
            })
            .to(
              oldImageEl,
              { x: endXOld, duration: 0.6, ease: "power2.inOut" },
              0
            )
            .to(
              newImageEl,
              { x: "0%", duration: 0.6, ease: "power2.inOut" },
              0
            );
        };
        img.onerror = () => {
          console.error("Failed to load image:", img.src);
          setIsImageLoading(false);
          navigationInProgress.current = false;
        };
      } else {
        setCurrentImageIndex(newIndex);
        updateThumbnailsHighlight(newIndex);
        setIsImageLoading(false);
        navigationInProgress.current = false;
      }
    },
    [currentImageIndex, directionFromCurrent, updateThumbnailsHighlight]
  );


  // Initial setup for the slider (should only run once)
  const initializeSlides = useCallback(() => {
    const track = sliderRef.current;
    if (!track || animationState.current.isSliderInitialized) return; // Prevent re-initialization

    track.innerHTML = "";
    animationState.current.slides = [];
    gsap.set(track, { x: 0 }); // Ensure track is reset
    cancelAnimationFrame(animationState.current.animationId);
    animationState.current.isAnimationActive = false;

    checkMobile(); // Check mobile status

    const copiesMultiplier = 5;
    const totalSlidesInTrack = totalSlideCount * copiesMultiplier;

    for (let i = 0; i < totalSlidesInTrack; i++) {
      const dataIndex = i % totalSlideCount;
      const slide = document.createElement("div");
      slide.className = "work-space--slide-item slide_in-view__image";
      slide.dataset.index = dataIndex;
      slide.innerHTML = `
        <div class="item_bg">
          <img src="${WorkSpaceData[dataIndex].image_bg}" alt="${
        WorkSpaceData[dataIndex].name
      }" decoding="async" loading="lazy" />
        </div>
      `;

      slide.addEventListener("click", () => {
        openLightbox(dataIndex);
      });

      track.appendChild(slide);
      animationState.current.slides.push(slide);
    }

    if (animationState.current.slides.length > 0) {
      const firstSlide = animationState.current.slides[0];
      const computedStyle = getComputedStyle(firstSlide);
      const marginRight = parseFloat(computedStyle.marginRight);
      animationState.current.slideWidth = firstSlide.offsetWidth + marginRight;
    } else {
      animationState.current.slideWidth = 0;
    }

    // Set initial position for seamless looping
    const initialOffset =
      totalSlideCount * animationState.current.slideWidth * Math.floor(copiesMultiplier / 2);
    animationState.current.currentX = -initialOffset;
    animationState.current.targetX = -initialOffset;

    // Apply initial transform immediately after setup
    track.style.transform = `translate3d(${animationState.current.currentX}px, 0, 0)`;

    animationState.current.isSliderInitialized = true; // Mark as initialized
  }, [totalSlideCount, checkMobile, openLightbox]); // Dependencies for useCallback

  const updateSlidePositions = useCallback(() => {
    const track = sliderRef.current;
    if (!track) return;

    const sequenceWidth = totalSlideCount * animationState.current.slideWidth;

    if (sequenceWidth === 0) {
      return;
    }

    const middleSequenceIndex = Math.floor(WorkSpaceData.length / 2);
    const minX = -sequenceWidth * (middleSequenceIndex + 1.5);
    const maxX = -sequenceWidth * (middleSequenceIndex - 0.5);

    if (animationState.current.currentX < minX) {
      animationState.current.currentX += sequenceWidth;
      animationState.current.targetX += sequenceWidth;
    } else if (animationState.current.currentX > maxX) {
      animationState.current.currentX -= sequenceWidth;
      animationState.current.targetX -= sequenceWidth;
    }

    // Only apply transform if animation is active
    if (animationState.current.isAnimationActive) {
      track.style.transform = `translate3d(${animationState.current.currentX}px, 0, 0)`;
    }
    // No else: if not active, let ScrollTrigger handle initial positioning or keep it at 0
  }, [totalSlideCount]);


  const updateParallax = useCallback(() => {
    if (!animationState.current.isAnimationActive) return;

    const viewportCenter = window.innerWidth / 2;
    animationState.current.slides.forEach((slide) => {
      const img = slide.querySelector(".item_bg img");
      if (!img) return;

      const slideRect = slide.getBoundingClientRect();

      if (slideRect.right < 0 || slideRect.left > window.innerWidth) {
        img.style.transform = "scale(1.8) translateX(0px)";
        return;
      }

      const slideCenter = slideRect.left + slideRect.width / 2;
      const distanceFromCenter = slideCenter - viewportCenter;
      const parallaxOffset = distanceFromCenter * -0.25;

      img.style.transform = `translateX(${parallaxOffset}px) scale(1.8)`;
    });
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    if (!animationState.current.isAnimationActive) {
      cancelAnimationFrame(animationState.current.animationId);
      animationState.current.animationId = null;
      return;
    }
    animationState.current.currentX +=
      (animationState.current.targetX - animationState.current.currentX) * config.LERP_FACTOR;
    animationState.current.targetX -= config.SCROLL_SPEED;
    updateSlidePositions();
    updateParallax();
    animationState.current.animationId = requestAnimationFrame(animate);
  }, [updateParallax, updateSlidePositions]);

  // Setup ScrollTrigger (should manage start/stop of the *already initialized* animation)
  const setupScrollTrigger = useCallback(() => {
    const container = document.querySelector(
      ".slide_in-view__container .slide_in-view__row"
    );
    if (!container || !sliderRef.current) {
      console.warn("Slide-in view elements not found");
      return;
    }
  
    if (mainScrollTrigger.current) {
      mainScrollTrigger.current.kill(true);
      mainScrollTrigger.current = null;
    }
  
    mainScrollTrigger.current = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      onEnter: () => {
        if (!hasInitiallyAnimated.current) {
          // Run initial animation only the first time
          gsap.fromTo(
            ".slide_in-view__images .work-space--slide-item",
            {
              opacity: 0,
              x: "100%",
            },
            {
              opacity: 1,
              x: "0%",
              duration: 1.6,
              stagger: 0.1,
              ease: "power4.out",
              onComplete: () => {
                gsap.set(".slide_in-view__images .work-space--slide-item", {
                  pointerEvents: "auto",
                  x: "0%", // Reset individual slide transforms
                });
                hasInitiallyAnimated.current = true;
                // Start the continuous loop after initial animation
                animationState.current.isAnimationActive = true;
                animate();
              },
            }
          );
        } else {
          // On subsequent enters, just resume the loop
          if (!animationState.current.isAnimationActive) {
            animationState.current.isAnimationActive = true;
            animate();
          }
        }
      },
      onLeaveBack: () => {
        // Stop the animation without resetting position
        animationState.current.isAnimationActive = false;
        cancelAnimationFrame(animationState.current.animationId);
        animationState.current.animationId = null;
        gsap.set(".slide_in-view__images .work-space--slide-item", {
          pointerEvents: "none",
        });
        // Removed: gsap.to(sliderRef.current, { x: 0, ... })
      },
    });
    ScrollTrigger.refresh();
  }, [animate]);

  // Main Effect for component mount and unmount (Initial setup and cleanup)
  useEffect(() => {
    // 1. Initialize the slider structure ONCE when the component mounts
    initializeSlides();

    // 2. Setup ScrollTrigger, which will now only *control* the animation loop
    setupScrollTrigger();

    // 3. Handle resize events to refresh ScrollTrigger and check mobile
    const handleResize = () => {
      checkMobile();
      ScrollTrigger.refresh();
      // On mobile, if we decided to stop the animation, ensure it's visually reset
      if (animationState.current.isMobile) {
        gsap.set(sliderRef.current, { x: 0 });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // Ensure all GSAP animations and ScrollTriggers are killed on unmount
      if (animationState.current.animationId) {
        cancelAnimationFrame(animationState.current.animationId);
      }
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill(true);
        mainScrollTrigger.current = null;
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [initializeSlides, setupScrollTrigger, checkMobile]); // These are stable useCallback functions

  // ... (Lightbox open/close and image loading effects remain largely the same)
  // Effect for handling lightbox open/close animations (initial and exit)
  useEffect(() => {
    if (lightboxOpen) {
      setIsLightboxMounted(true);
      document.body.style.overflow = "hidden";
      document.body.classList.add("hide-cursor");

      lightboxImagesRefs.current.forEach((imgEl, idx) => {
        gsap.set(imgEl, {
          autoAlpha: 0,
          zIndex: 1,
          x: "0%",
          scale: 1,
        });
      });

      gsap.to(lightboxRef.current, {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out",
      });

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
    } else if (isLightboxMounted) {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLightboxMounted(false);
          document.body.style.overflow = "auto";
          document.body.classList.remove("hide-cursor");
          setCustomCursorVisible(false);

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
  }, [lightboxOpen, isLightboxMounted, currentImageIndex]); // currentImageIndex is important here for exit animation

  // New useEffect to handle image display and loading when currentImageIndex changes
  useEffect(() => {
    if (lightboxOpen && isLightboxMounted && !navigationInProgress.current) {
      setIsImageLoading(true);

      const newImageEl = lightboxImagesRefs.current[currentImageIndex];
      if (newImageEl) {
        const img = new Image();
        img.src = WorkSpaceData[currentImageIndex].image_bg;
        img.onload = () => {
          setIsImageLoading(false);
          lightboxImagesRefs.current.forEach((imgEl, idx) => {
            if (idx !== currentImageIndex) {
              gsap.set(imgEl, { autoAlpha: 0, zIndex: 1, x: "0%", scale: 1 });
            }
          });
          gsap.fromTo(
            newImageEl,
            { scale: 0.8, autoAlpha: 0, zIndex: 10 },
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5,
              ease: "back.out(1.7)",
              delay: 0.1,
            }
          );
        };
        img.onerror = () => {
          console.error("Failed to load image:", img.src);
          setIsImageLoading(false);
        };
      }
    }
  }, [currentImageIndex, lightboxOpen, isLightboxMounted]);

  useLayoutEffect(() => {
    if (lightboxOpen && isLightboxMounted) {
      updateThumbnailsHighlight(currentImageIndex);
    }
  }, [lightboxOpen, currentImageIndex, isLightboxMounted, updateThumbnailsHighlight]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isLightboxMounted) return;

      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        navigateLightbox("next");
      } else if (event.key === "ArrowLeft") {
        navigateLightbox("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxMounted, closeLightbox, navigateLightbox]);

  const handleMouseMove = useCallback(
    (e) => {
      if (
        !isLightboxMounted ||
        !lightboxRef.current ||
        !customCursorRef.current
      ) {
        setCustomCursorVisible(false);
        return;
      }

      const lightboxRect = lightboxRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isWithinLightboxBounds =
        mouseX >= lightboxRect.left &&
        mouseX <= lightboxRect.right &&
        mouseY >= lightboxRect.top &&
        mouseY <= lightboxRect.bottom;

      if (!isWithinLightboxBounds) {
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
    },
    [isLightboxMounted]
  );

  const handleMouseDown = useCallback(
    (e) => {
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
    },
    [isLightboxMounted, isImageLoading, navigateLightbox]
  );

  const handleMouseLeave = useCallback(() => {
    setCustomCursorVisible(false);
  }, []);

  useEffect(() => {
    if (isLightboxMounted) {
      window.addEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.addEventListener("mousedown", handleMouseDown);
        lightboxRef.current.addEventListener("mouseleave", handleMouseLeave);
      }
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.removeEventListener("mousedown", handleMouseDown);
        lightboxRef.current.removeEventListener("mouseleave", handleMouseLeave);
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

  useEffect(() => {
    if (customCursorRef.current) {
      if (customCursorVisible) {
        gsap.to(customCursorRef.current, { autoAlpha: 1, duration: 0.3 });
      } else {
        gsap.to(customCursorRef.current, { autoAlpha: 0, duration: 0.3 });
      }
    }
  }, [customCursorVisible]);

  return (
    <>
      <section className="wrokSpace_section reveal-section" ref={sectionRef}>
        <div className="wrokSpace_section-inner site_flex flex_column site_gap">
          <div className="wrokSpace_section-top">
            <div className="site_container ">
              <span className="section_name reveal-text">WORKSPACE</span>
              <h2 className="reveal-text">Inside the Studio</h2>
              <p className="h2 light reveal-text">
                No sterile cubicles. No corporate vibes. Just a cozy, cluttered,
                creative space where Arizona where ideas come to life.
              </p>
            </div>
          </div>
          <div className="wrokSpace_section-bottom slide_in-view__container">
            <div className="scroll_slider slide_in-view__row">
              <div
                className="slider_items slide_in-view__images work-space_items site_flex site_gap"
                ref={sliderRef}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {isLightboxMounted && (
        <div
          className="lightbox-overlay"
          ref={lightboxRef}
          onClick={closeLightbox}
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div
            className="lightbox-content"
            ref={lightboxContentRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="lightbox-close" onClick={closeLightbox}>
              &times;
            </button>

            {isImageLoading && (
              <div className="lightbox-loader">
                <div className="spinner"></div>
              </div>
            )}

            {WorkSpaceData.map((data, index) => (
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

            <div className="lightbox-thumbnails" ref={lightboxThumbnailsRef}>
              {WorkSpaceData.map((data, index) => (
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
      )}
      {isLightboxMounted && (
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
      )}
    </>
  );
}

export default WorkSpace;