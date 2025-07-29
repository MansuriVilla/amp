import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import "./workspace.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function WorkSpace() {
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const [lightboxOpen, setLightboxOpen] = useState(false); // Controls animation start/end
  const [isLightboxMounted, setIsLightboxMounted] = useState(false); // Controls actual DOM rendering
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lightboxRef = useRef(null);
  const lightboxContentRef = useRef(null);
  const lightboxThumbnailsRef = useRef(null);

  const lightboxImagesRefs = useRef([]);
  const lightboxThumbnailElementsRefs = useRef([]);

  // Callback to add image refs, ensuring they are sorted by data-index
  const addLightboxImageRef = useCallback((el) => {
    if (el && !lightboxImagesRefs.current.includes(el)) {
      lightboxImagesRefs.current.push(el);
      lightboxImagesRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  // Callback to add individual thumbnail refs
  const addLightboxThumbnailRef = useCallback((el) => {
    if (el && !lightboxThumbnailElementsRefs.current.includes(el)) {
      lightboxThumbnailElementsRefs.current.push(el);
      lightboxThumbnailElementsRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  // GSAP animation for individual slide item CTAs
  useEffect(() => {
    const slideItems = document.querySelectorAll(".work-space--slide-item");

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".wrokSpace_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 });

        gsap.to(cta, {
          y: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: slideItem,
            start: "left center",
            end: "left 20%",
            toggleActions: "play none none reverse",
          },
        });
      }
    });

    // Cleanup function for ScrollTrigger instances
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (
          trigger.trigger &&
          trigger.trigger.classList &&
          trigger.trigger.classList.contains("work-space--slide-item")
        ) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Horizontal scroll animation and parallax effect
  useEffect(() => {
    const config = {
      SCROLL_SPEED: 1.5,
      LERP_FACTOR: 0.05,
    };
    const totalSlideCount = WorkSpaceData.length;
    const state = {
      currentX: 0,
      targetX: 0,
      slideWidth: 0,
      slides: [],
      isMobile: false,
      animationId: null,
    };

    const checkMobile = () => {
      state.isMobile = window.innerWidth < 1000;
      state.slideWidth = state.isMobile ? 175 + 2 * 10 : 350 + 2 * 20; // Width + 2 * margin
    };

    const initializeSlides = () => {
      const track = sliderRef.current;
      if (!track) return;

      track.innerHTML = ""; // Clear existing slides
      state.slides = [];
      checkMobile();

      const copiesMultiplier = 5; // To create an infinite scroll effect
      const totalSlidesInTrack = totalSlideCount * copiesMultiplier;

      for (let i = 0; i < totalSlidesInTrack; i++) {
        const dataIndex = i % totalSlideCount;
        const slide = document.createElement("div");
        slide.className = "work-space--slide-item slide_in-view__image";
        slide.dataset.index = dataIndex; // Store original index
        slide.innerHTML = `
          <div class="item_bg">
            <img src="${WorkSpaceData[dataIndex].image_bg}" alt="${WorkSpaceData[dataIndex].name}" decoding="async" />
          </div>

        `;
        slide.addEventListener("click", () => openLightbox(dataIndex));
        track.appendChild(slide);
        state.slides.push(slide);
      }

      // Set initial position to be in the middle of the copied slides
      const initialOffset =
        totalSlideCount * state.slideWidth * Math.floor(copiesMultiplier / 2);
      state.currentX = -initialOffset;
      state.targetX = -initialOffset;
      updateSlidePositions();
    };

    const updateSlidePositions = () => {
      const track = sliderRef.current;
      if (!track) return;

      const sequenceWidth = totalSlideCount * state.slideWidth;

      // Loop the scroll
      if (state.currentX < -sequenceWidth * 3) {
        state.currentX += sequenceWidth;
        state.targetX += sequenceWidth;
      } else if (state.currentX > -sequenceWidth * 2) {
        state.currentX -= sequenceWidth;
        state.targetX -= sequenceWidth;
      }

      track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
    };

    const updateParallax = () => {
      const viewportCenter = window.innerWidth / 2;
      state.slides.forEach((slide) => {
        const img = slide.querySelector(".item_bg img");
        if (!img) return;

        const slideRect = slide.getBoundingClientRect();

        // Optimize: if slide is out of view, reset transform
        if (slideRect.right < 0 || slideRect.left > window.innerWidth) {
          img.style.transform = "scale(1.8) translateX(0px)";
          return;
        }

        const slideCenter = slideRect.left + slideRect.width / 2;
        const distanceFromCenter = slideCenter - viewportCenter;
        const parallaxOffset = distanceFromCenter * -0.25; // Adjust parallax intensity

        img.style.transform = `translateX(${parallaxOffset}px) scale(1.8)`;
      });
    };

    const animate = () => {
      state.currentX += (state.targetX - state.currentX) * config.LERP_FACTOR;
      state.targetX -= config.SCROLL_SPEED; // Continuous scroll
      updateSlidePositions();
      updateParallax();
      state.animationId = requestAnimationFrame(animate);
    };

    // ScrollTrigger to initialize and animate the slider when it enters view
    const slideInView = () => {
      const container = document.querySelector(
        ".slide_in-view__container .slide_in-view__row"
      );
      if (!container || !sliderRef.current) {
        console.warn("Slide-in view elements not found");
        return;
      }

      let initSlides = false; // Flag to prevent re-initialization on every enter

      mainScrollTrigger.current = ScrollTrigger.create({
        trigger: container,
        start: "top 80%", // When the top of the container hits 80% of the viewport height
        onEnter: () => {
          if (initSlides) return;
          initSlides = true;

          initializeSlides(); // Populate and position slides

          // Initial GSAP animation for slides coming into view
          gsap.set(".slide_in-view__images .work-space--slide-item", {
            opacity: 0,
            x: "100%",
          });

          gsap.to(".slide_in-view__images .work-space--slide-item", {
            opacity: 1,
            x: "0%",
            duration: 1.6,
            stagger: 0.1,
            ease: "power4.out",
          });

          animate(); // Start the continuous scroll animation
        },
        onLeaveBack: () => {
          // Stop animation and reset on leaving the view
          if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
          }
          initSlides = false;
        },
      });

      ScrollTrigger.refresh(); // Recalculate positions
    };

    slideInView();
    window.addEventListener("resize", initializeSlides); // Reinitialize on resize

    // Cleanup for this useEffect
    return () => {
      window.removeEventListener("resize", initializeSlides);
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill();
        mainScrollTrigger.current = null;
      }
      // Kill specific ScrollTrigger if it exists
      ScrollTrigger.getAll().forEach((trigger) => {
        if (
          trigger.trigger ===
          document.querySelector(
            ".slide_in-view__container .slide_in-view__row"
          )
        ) {
          trigger.kill();
        }
      });
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Updated to simply set the active class on the current thumbnail
  const updateThumbnailsHighlight = useCallback(
    (index) => {
      if (lightboxThumbnailElementsRefs.current.length > 0) {
        lightboxThumbnailElementsRefs.current.forEach((thumb, i) => {
          if (i === index) {
            thumb.classList.add("active");
            // Optional: Scroll active thumbnail into view
            thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          } else {
            thumb.classList.remove("active");
          }
        });
      }
    },
    []
  );

  // This useEffect manages the mounting/unmounting and initial/exit animations of the lightbox
  useEffect(() => {
    if (lightboxOpen) {
      // If lightbox is supposed to be open, ensure it's mounted
      setIsLightboxMounted(true);
      document.body.style.overflow = "hidden"; // Prevent body scroll
    } else if (isLightboxMounted) {
      // If lightbox is supposed to be closed and is currently mounted, animate out
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLightboxMounted(false); // Unmount after animation
          document.body.style.overflow = "auto"; // Restore body scroll
        },
      });

      // Animate individual thumbnails out
      if (lightboxThumbnailElementsRefs.current.length > 0) {
        tl.to(
          lightboxThumbnailElementsRefs.current,
          { y: 20, autoAlpha: 0, scale: 0.8, duration: 0.3, stagger: 0.03, ease: "power2.in" },
          0
        );
      }

      // Animate current image out
      if (lightboxImagesRefs.current[currentImageIndex]) {
        tl.to(
          lightboxImagesRefs.current[currentImageIndex],
          { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: "power2.in" },
          "<0.1"
        );
      }

      // Animate the entire lightbox overlay out
      if (lightboxRef.current) {
        tl.to(
          lightboxRef.current,
          { autoAlpha: 0, duration: 0.4, ease: "power2.in" },
          "<0.1"
        );
      }
    }
  }, [lightboxOpen, isLightboxMounted, currentImageIndex]); // Dependencies for this effect

  const openLightbox = useCallback(
    (index) => {
      setCurrentImageIndex(index);
      setLightboxOpen(true); // Trigger mounting and enter animation
      setIsImageLoading(true);

      // Initial state for all lightbox images (before animation starts)
      // This is now handled by the main useEffect for `lightboxOpen`
      gsap.set(lightboxImagesRefs.current, { x: "0%", autoAlpha: 0, scale: 1, zIndex: 1 });
      if (lightboxImagesRefs.current[index]) {
        gsap.set(lightboxImagesRefs.current[index], { autoAlpha: 1, zIndex: 10 });
      }


      // Initial state for all thumbnails: hidden and slightly off-position
      if (lightboxThumbnailElementsRefs.current.length > 0) {
        gsap.set(lightboxThumbnailElementsRefs.current, {
          y: 20,
          autoAlpha: 0,
          scale: 0.8
        });
      }

      gsap
        .timeline({
          onComplete: () => {
            // Ensure the correct image is fully visible and in place after initial animation
            if (lightboxImagesRefs.current[index]) {
              gsap.set(lightboxImagesRefs.current[index], {
                x: "0%",
                autoAlpha: 1,
                scale: 1,
                zIndex: 10,
              });
            }
            updateThumbnailsHighlight(index); // Highlight current thumbnail
          },
        })
        .set(lightboxRef.current, { display: "flex", autoAlpha: 0 }) // Ensure lightbox is visible for animation
        .to(lightboxRef.current, {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
        })
        .fromTo(
          lightboxImagesRefs.current[index],
          { scale: 0.8, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.7)" },
          "<0.2" // Start main image animation slightly after lightbox opens
        )
        .to(
          lightboxThumbnailElementsRefs.current, // Animate individual thumbnails
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.3,
            stagger: 0.05, // Stagger them for a nice effect
            ease: "power2.out",
          },
          "<0.1" // Animate thumbnails up after main image
        );
    },
    [updateThumbnailsHighlight]
  );

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false); // This will trigger the useEffect to run the exit animation
    // No direct GSAP timeline here as it's handled by the useEffect now
  }, []);

  // Helper to determine slide direction for animation
  const directionFromCurrent = useCallback(
    (currentIndex, targetIndex, totalCount) => {
      const diff = targetIndex - currentIndex;
      const absDiff = Math.abs(diff);

      if (absDiff > totalCount / 2) {
        // Handle wrap-around for shortest path
        if (diff > 0) {
          return "-100%"; // Move from right to left (shortest path via end)
        } else {
          return "100%"; // Move from left to right (shortest path via start)
        }
      } else {
        if (diff > 0) {
          return "100%"; // Move from left to right
        } else {
          return "-100%"; // Move from right to left
        }
      }
    },
    []
  );

  const navigateLightbox = useCallback(
    (direction, specificIndex = null) => {
      const totalCount = WorkSpaceData.length;
      let newIndex = currentImageIndex;

      if (specificIndex !== null) {
        newIndex = specificIndex;
      } else if (direction === "next") {
        newIndex = (currentImageIndex + 1) % totalCount;
      } else if (direction === "prev") {
        newIndex = (currentImageIndex - 1 + totalCount) % totalCount;
      }

      // If already at the target index, do nothing (unless it's an explicit specificIndex click)
      if (newIndex === currentImageIndex && specificIndex === null) {
        return;
      }

      setIsImageLoading(true);
      const oldImageEl = lightboxImagesRefs.current[currentImageIndex];
      const newImageEl = lightboxImagesRefs.current[newIndex];

      if (oldImageEl && newImageEl) {
        // Determine the animation direction
        const startXNew = directionFromCurrent(currentImageIndex, newIndex, totalCount);
        const endXOld = startXNew === "100%" ? "-100%" : "100%"; // Opposite for old image

        // Set initial state for the new image and current image's zIndex
        gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10 });
        gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5 }); // Old image below new one

        gsap
          .timeline({
            onComplete: () => {
              // Reset old image after animation
              gsap.set(oldImageEl, { autoAlpha: 0, x: "0%", zIndex: 1 });
              // Ensure new image is in its final state
              gsap.set(newImageEl, { x: "0%", autoAlpha: 1, zIndex: 10 });
              setCurrentImageIndex(newIndex); // Update state to new index
              updateThumbnailsHighlight(newIndex); // Update thumbnail highlight
            },
          })
          .to(
            oldImageEl,
            { x: endXOld, duration: 0.6, ease: "power2.inOut" },
            0 // Start at the same time
          )
          .to(newImageEl, { x: "0%", duration: 0.6, ease: "power2.inOut" }, 0); // Start at the same time
      } else {
        setCurrentImageIndex(newIndex); // Fallback if elements not found
        updateThumbnailsHighlight(newIndex);
      }
    },
    [currentImageIndex, directionFromCurrent, updateThumbnailsHighlight]
  );

  // Effect to update thumbnail highlight when lightbox opens or currentImageIndex changes
  useLayoutEffect(() => {
    if (lightboxOpen) {
      updateThumbnailsHighlight(currentImageIndex);
    }
  }, [lightboxOpen, currentImageIndex, updateThumbnailsHighlight]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isLightboxMounted) return; // Check isLightboxMounted, not lightboxOpen

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
  }, [isLightboxMounted, closeLightbox, navigateLightbox]); // Dependency updated to isLightboxMounted

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
    style={{ opacity: 0, visibility: 'hidden' }}
  >
    <div
      className="lightbox-content"
      ref={lightboxContentRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="lightbox-close" onClick={closeLightbox}>
        &times;
      </button>
      <button
        className="lightbox-nav lightbox-prev"
        onClick={() => navigateLightbox("prev")}
      >
        &#10094;
      </button>

      {/* Loading Indicator */}
      {isImageLoading && (
        <div className="lightbox-loader">
          <div className="spinner"></div> {/* Basic spinner, style with CSS */}
        </div>
      )}

      {/* Render all images for the lightbox, controlled by GSAP */}
      {WorkSpaceData.map((data, index) => (
        <img
          key={index}
          ref={addLightboxImageRef}
          data-index={index}
          src={data.image_bg}
          alt={`Gallery Image ${index + 1}`}
          className="lightbox-image"
          onLoad={() => {
            if (index === currentImageIndex) {
              setIsImageLoading(false);
            }
          }}
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
            // Hide the image until it's loaded and it's the current one
            // display: (index === currentImageIndex && !isImageLoading) ? 'block' : 'none'
          }}
        />
      ))}

      <button
        className="lightbox-nav lightbox-next"
        onClick={() => navigateLightbox("next")}
      >
        &#10095;
      </button>
      <div
        className="lightbox-thumbnails"
        ref={lightboxThumbnailsRef}
      >
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
    </>
  );
}

export default WorkSpace;