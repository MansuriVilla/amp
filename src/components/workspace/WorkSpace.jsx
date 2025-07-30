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
  const sliderRef = useRef(null); // This is imagesContainer in the new code
  const mainScrollTrigger = useRef(null);

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

  // Animation state for the slider, now simplified for the new loop method
  const animationState = useRef({
    slideWidth: 0,
    isSliderInitialized: false, // Track if slider has been initialized
    sequenceWidth: 0, // NEW: Store the width of one full sequence of original slides
  });

  const totalSlideCount = WorkSpaceData.length;

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

          // Set initial states for transition
          gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10, scale: 1 }); // Ensure scale is 1
          gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5, scale: 1 }); // Ensure scale is 1

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
        // Fallback if elements are not found, though they should be with the refs
        setCurrentImageIndex(newIndex);
        updateThumbnailsHighlight(newIndex);
        setIsImageLoading(false);
        navigationInProgress.current = false;
      }
    },
    [currentImageIndex, directionFromCurrent, updateThumbnailsHighlight]
  );

  // Initialize the slider's DOM structure (runs once)
  const initializeSlides = useCallback(() => {
    const track = sliderRef.current;
    if (!track || animationState.current.isSliderInitialized) return;

    track.innerHTML = ""; // Clear existing content
    gsap.set(track, { x: 0 }); // Reset track position

    const copiesMultiplier = 5; // Number of times to duplicate the entire dataset
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
    }

    if (track.children.length > 0) {
      const firstSlide = track.children[0];
      const computedStyle = getComputedStyle(firstSlide);
      const marginRight = parseFloat(computedStyle.marginRight);
      animationState.current.slideWidth = firstSlide.offsetWidth + marginRight;
      // Calculate the total width of one full sequence of original slides
      animationState.current.sequenceWidth = totalSlideCount * animationState.current.slideWidth;
    } else {
      animationState.current.slideWidth = 0;
      animationState.current.sequenceWidth = 0;
    }

    animationState.current.isSliderInitialized = true; // Mark as initialized
  }, [totalSlideCount, openLightbox]);

  // Setup ScrollTrigger and GSAP animations for the slider
  const setupSliderAnimations = useCallback(() => {
    const container = document.querySelector(
      ".slide_in-view__container .slide_in-view__row"
    );
    const imagesContainer = sliderRef.current; // This is the .slide_in-view__images element

    // Ensure elements are available and slider is initialized before setting up animations
    if (!container || !imagesContainer || !animationState.current.isSliderInitialized) {
      console.warn("Slider elements not ready for animation setup.");
      return;
    }

    // Kill any existing main ScrollTrigger to prevent duplicates on re-renders
    if (mainScrollTrigger.current) {
      mainScrollTrigger.current.kill(true);
      mainScrollTrigger.current = null;
    }

    // Ensure initial state for images before animation
    gsap.set(imagesContainer.querySelectorAll(".work-space--slide-item"), {
      opacity: 0,
      x: "100%",
      pointerEvents: "none", // Disable interaction until animated in
    });

    mainScrollTrigger.current = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      // No 'end' property, so it triggers once and the animation continues indefinitely
      // markers: true, // Uncomment for debugging ScrollTrigger
      onEnter: () => {
        // Use a custom data attribute to ensure this block runs only once
        if (imagesContainer.dataset.animationStarted === "true") return;
        imagesContainer.dataset.animationStarted = "true";

        const tl = gsap.timeline({
          onComplete: () => {
            // Re-enable pointer events after initial slide-in animation is complete
            gsap.set(imagesContainer.querySelectorAll(".work-space--slide-item"), {
              pointerEvents: "auto",
            });
          }
        });

        // Initial slide-in animation for individual images
        tl.to(imagesContainer.querySelectorAll(".work-space--slide-item"), {
          opacity: 1,
          x: "0%",
          duration: 1.6,
          stagger: 0.1, // Stagger the animation for each image
          ease: "power4.out",
        });

        // Start the continuous loop of the entire container after the initial slide-in
        // The '<0.5' positions this tween to start 0.5 seconds before the end of the previous tween
        tl.to(imagesContainer, {
          x: -animationState.current.sequenceWidth, // Move by the width of one full sequence
          ease: "none", // Linear ease for continuous motion
          duration: 80, // Adjust duration for desired speed of the loop
          repeat: -1, // Infinite loop
          modifiers: {
            // Use GSAP's wrap utility for seamless looping
            x: gsap.utils.wrap(0, -animationState.current.sequenceWidth)
          }
        }, "<0.5");
      },
      // No onLeaveBack: The animation will continue to loop once triggered
    });
    ScrollTrigger.refresh(); // Refresh ScrollTrigger to ensure correct calculations
  }, []); // Dependencies: none, as it relies on refs and initialized state

  // Main Effect for component mount and unmount (initial setup and cleanup)
  useEffect(() => {
    // 1. Initialize the slider structure ONCE when the component mounts
    initializeSlides();

    // 2. Setup ScrollTrigger and GSAP animations for the slider
    // This will be called after initializeSlides has potentially populated the DOM
    setupSliderAnimations();

    // 3. Handle resize events to refresh ScrollTrigger
    const handleResize = () => {
      // Re-calculate sequenceWidth if layout changes significantly on resize
      const track = sliderRef.current;
      if (track && track.children.length > 0) {
        const firstSlide = track.children[0];
        const computedStyle = getComputedStyle(firstSlide);
        const marginRight = parseFloat(computedStyle.marginRight);
        animationState.current.slideWidth = firstSlide.offsetWidth + marginRight;
        animationState.current.sequenceWidth = totalSlideCount * animationState.current.slideWidth;
      }
      ScrollTrigger.refresh(); // Refresh ScrollTrigger to adjust to new layout
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // Kill all GSAP animations and ScrollTriggers on unmount
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      // Also ensure any ongoing GSAP tweens on sliderRef.current are killed
      gsap.killTweensOf(sliderRef.current);
      // Reset the custom flag on unmount to allow re-triggering if component remounts
      if (sliderRef.current) {
        sliderRef.current.dataset.animationStarted = "false";
      }
    };
  }, [initializeSlides, setupSliderAnimations, totalSlideCount]); // Dependencies for main effect

  // Effect for handling lightbox open/close animations (initial and exit)
  useEffect(() => {
    if (lightboxOpen) {
      setIsLightboxMounted(true);
      document.body.style.overflow = "hidden";
      document.body.classList.add("hide-cursor");

      // Reset all images to hidden before showing the current one
      // This is crucial for the first image entering the lightbox
      lightboxImagesRefs.current.forEach((imgEl, idx) => {
        gsap.set(imgEl, {
          autoAlpha: 0,
          zIndex: 1,
          x: "0%",
          scale: 1, // Ensure scale is reset for all images
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

          // Ensure all images are completely hidden after closing
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

      // Animate out the currently visible image when closing
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
  // This useEffect will now manage ONLY the transition of the main image within the lightbox
  useEffect(() => {
    if (lightboxOpen && isLightboxMounted && !navigationInProgress.current) {
      setIsImageLoading(true);

      const newImageEl = lightboxImagesRefs.current[currentImageIndex];
      if (newImageEl) {
        const img = new Image();
        img.src = WorkSpaceData[currentImageIndex].image_bg;
        img.onload = () => {
          setIsImageLoading(false);
          // Ensure other images are hidden
          lightboxImagesRefs.current.forEach((imgEl, idx) => {
            if (idx !== currentImageIndex) {
              gsap.set(imgEl, { autoAlpha: 0, zIndex: 1, x: "0%", scale: 1 });
            }
          });
          // Animate in the current image
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
  }, [currentImageIndex, lightboxOpen, isLightboxMounted]); // Dependencies for image display

  useLayoutEffect(() => {
    if (lightboxOpen && isLightboxMounted) { // Ensure lightbox is open and mounted for thumbnail update
      updateThumbnailsHighlight(currentImageIndex);
    }
  }, [lightboxOpen, currentImageIndex, isLightboxMounted, updateThumbnailsHighlight]); // Added isLightboxMounted

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
      <section className="wrokSpace_section" ref={sectionRef}>
        <div className="wrokSpace_section-inner site_flex flex_column site_gap">
          <div className="wrokSpace_section-top">
            <div className="site_container reveal-section">
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
                  visibility: "hidden", // Hidden by default, animated by GSAP
                  opacity: 0, // Hidden by default, animated by GSAP
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