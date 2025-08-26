// WorkSpace.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import CustomLightbox from "../lightbox/CustomLightbox.jsx";
import "./workspace.css";

gsap.registerPlugin(ScrollTrigger);

// Animation configuration
const ANIMATION_CONFIG = {
  SCROLL_SPEED: 1.5,
  LERP_FACTOR: 0.05,
  COPIES_MULTIPLIER: 5,
};

function WorkSpace() {
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null);
  const hasInitiallyAnimated = useRef(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Animation state
  const animationState = useRef({
    currentX: 0,
    targetX: 0,
    slideWidth: 0,
    slides: [],
    isMobile: false,
    animationId: null,
    isAnimationActive: false,
    isSliderInitialized: false,
  });

  const totalSlideCount = WorkSpaceData.length;

  // Utility functions
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

  // Slide creation and management
  const createSlideElement = useCallback((dataIndex) => {
    const slide = document.createElement("div");
    slide.className = "work-space--slide-item slide_in-view__image";
    slide.dataset.index = dataIndex;
    slide.innerHTML = `
      <div class="item_bg">
        <img src="${WorkSpaceData[dataIndex].image_bg}" 
             alt="${WorkSpaceData[dataIndex].name}" 
             decoding="async" 
             loading="lazy" />
      </div>
    `;

    slide.addEventListener("click", () => openLightbox(dataIndex));
    return slide;
  }, [openLightbox]);

  const initializeSlides = useCallback(() => {
    const track = sliderRef.current;
    if (!track || animationState.current.isSliderInitialized) return;

    // Reset track
    track.innerHTML = "";
    animationState.current.slides = [];
    gsap.set(track, { x: 0 });
    cancelAnimationFrame(animationState.current.animationId);
    animationState.current.isAnimationActive = false;

    checkMobile();
    const totalSlidesInTrack = totalSlideCount * ANIMATION_CONFIG.COPIES_MULTIPLIER;

    // Create slides
    for (let i = 0; i < totalSlidesInTrack; i++) {
      const dataIndex = i % totalSlideCount;
      const slide = createSlideElement(dataIndex);
      track.appendChild(slide);
      animationState.current.slides.push(slide);
    }

    // Calculate slide dimensions
    if (animationState.current.slides.length > 0) {
      const firstSlide = animationState.current.slides[0];
      const computedStyle = getComputedStyle(firstSlide);
      const marginRight = parseFloat(computedStyle.marginRight);
      animationState.current.slideWidth = firstSlide.offsetWidth + marginRight;
    }

    // Set initial position
    const initialOffset =
      totalSlideCount * 
      animationState.current.slideWidth * 
      Math.floor(ANIMATION_CONFIG.COPIES_MULTIPLIER / 2);
    
    animationState.current.currentX = -initialOffset;
    animationState.current.targetX = -initialOffset;
    track.style.transform = `translate3d(${animationState.current.currentX}px, 0, 0)`;

    animationState.current.isSliderInitialized = true;
  }, [totalSlideCount, checkMobile, createSlideElement]);

  // Animation functions
  const updateSlidePositions = useCallback(() => {
    const track = sliderRef.current;
    if (!track) return;

    const sequenceWidth = totalSlideCount * animationState.current.slideWidth;
    if (sequenceWidth === 0) return;

    const middleSequenceIndex = Math.floor(WorkSpaceData.length / 2);
    const minX = -sequenceWidth * (middleSequenceIndex + 1.5);
    const maxX = -sequenceWidth * (middleSequenceIndex - 0.5);

    // Handle infinite scroll wrapping
    if (animationState.current.currentX < minX) {
      animationState.current.currentX += sequenceWidth;
      animationState.current.targetX += sequenceWidth;
    } else if (animationState.current.currentX > maxX) {
      animationState.current.currentX -= sequenceWidth;
      animationState.current.targetX -= sequenceWidth;
    }

    if (animationState.current.isAnimationActive) {
      track.style.transform = `translate3d(${animationState.current.currentX}px, 0, 0)`;
    }
  }, [totalSlideCount]);

  const updateParallax = useCallback(() => {
    if (!animationState.current.isAnimationActive) return;

    const viewportCenter = window.innerWidth / 2;
    animationState.current.slides.forEach((slide) => {
      const img = slide.querySelector(".item_bg img");
      if (!img) return;

      const slideRect = slide.getBoundingClientRect();

      // Skip if slide is outside viewport
      if (slideRect.right < 0 || slideRect.left > window.innerWidth) {
        img.style.transform = "scale(1.6) translateX(0px)";
        return;
      }

      // Apply parallax effect
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distanceFromCenter = slideCenter - viewportCenter;
      const parallaxOffset = distanceFromCenter * -0.25;

      img.style.transform = `translateX(${parallaxOffset}px) scale(1.6)`;
    });
  }, []);

  const animate = useCallback(() => {
    if (!animationState.current.isAnimationActive) {
      cancelAnimationFrame(animationState.current.animationId);
      animationState.current.animationId = null;
      return;
    }

    // Smooth animation with lerp
    animationState.current.currentX +=
      (animationState.current.targetX - animationState.current.currentX) * 
      ANIMATION_CONFIG.LERP_FACTOR;
    
    animationState.current.targetX -= ANIMATION_CONFIG.SCROLL_SPEED;
    
    updateSlidePositions();
    updateParallax();
    
    animationState.current.animationId = requestAnimationFrame(animate);
  }, [updateParallax, updateSlidePositions]);

  // ScrollTrigger setup
  const setupScrollTrigger = useCallback(() => {
    const container = document.querySelector(
      ".slide_in-view__container .slide_in-view__row"
    );
    
    if (!container || !sliderRef.current) {
      console.warn("Slide-in view elements not found");
      return;
    }

    // Clean up existing trigger
    if (mainScrollTrigger.current) {
      mainScrollTrigger.current.kill(true);
      mainScrollTrigger.current = null;
    }

    mainScrollTrigger.current = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      onEnter: () => {
        // Start animation
        if (!animationState.current.isAnimationActive) {
          animationState.current.isAnimationActive = true;
          animate();
        }

        // Initial slide animation
        if (!hasInitiallyAnimated.current) {
          gsap.fromTo(
            ".slide_in-view__images .work-space--slide-item",
            { opacity: 0, x: "100%" },
            {
              opacity: 1,
              x: "0%",
              duration: 1.6,
              stagger: 0.1,
              ease: "power4.out",
              onComplete: () => {
                gsap.set(".slide_in-view__images .work-space--slide-item", {
                  pointerEvents: "auto",
                  x: "0%",
                });
                hasInitiallyAnimated.current = true;
              },
            }
          );
        } else {
          gsap.set(".slide_in-view__images .work-space--slide-item", {
            pointerEvents: "auto",
          });
        }
      },
      onLeaveBack: () => {
        // Stop animation when leaving
        animationState.current.isAnimationActive = false;
        cancelAnimationFrame(animationState.current.animationId);
        animationState.current.animationId = null;
        gsap.set(".slide_in-view__images .work-space--slide-item", {
          pointerEvents: "none",
        });
      },
    });

    ScrollTrigger.refresh();
  }, [animate]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationState.current.animationId) {
      cancelAnimationFrame(animationState.current.animationId);
    }
    if (mainScrollTrigger.current) {
      mainScrollTrigger.current.kill(true);
      mainScrollTrigger.current = null;
    }
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, []);

  // Effects
  useEffect(() => {
    initializeSlides();
    setupScrollTrigger();

    const handleResize = () => {
      checkMobile();
      ScrollTrigger.refresh();
      if (animationState.current.isMobile) {
        gsap.set(sliderRef.current, { x: 0 });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [initializeSlides, setupScrollTrigger, checkMobile, cleanup]);

  // CTA triggers cleanup
  useEffect(() => {
    const ctaTriggers = [];
    return () => {
      ctaTriggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <section className="wrokSpace_section reveal-section" ref={sectionRef}>
        <div className="wrokSpace_section-inner site_flex flex_column site_gap">
          <div className="wrokSpace_section-top">
            <div className="site_container">
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
              />
            </div>
          </div>
        </div>
      </section>

      <CustomLightbox
        isOpen={lightboxOpen}
        currentImageIndex={currentImageIndex}
        images={WorkSpaceData}
        onClose={closeLightbox}
        onNavigate={setCurrentImageIndex}
      />
    </>
  );
}

export default WorkSpace;