import { useEffect, useRef, useState, useCallback } from "react";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import "./workspace.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function WorkSpace() {
  const itemsRef = useRef([]); // This ref seems unused in the provided code, keeping it for consistency if it's used elsewhere.
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lightboxRef = useRef(null);
  const lightboxContentRef = useRef(null); // Ref for the lightbox content container
  const lightboxThumbnailsRef = useRef(null); // Ref for the thumbnails container

  // NEW: Ref to hold all lightbox image elements
  const lightboxImagesRefs = useRef([]);
  // Callback ref to assign each image element to the array
  const addLightboxImageRef = useCallback((el) => {
    if (el && !lightboxImagesRefs.current.includes(el)) {
      lightboxImagesRefs.current.push(el);
      // Sort them by their data-index if they are added out of order
      lightboxImagesRefs.current.sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index));
    }
  }, []);


  // Function to get surrounding image indices for thumbnails, EXCLUDING the current image
  const getThumbnailIndices = useCallback((currentIndex, totalCount, displayCount = 5) => {
    const indices = [];
    const uniqueIndices = new Set(); // Use a Set to avoid duplicates if displayCount is large relative to totalCount

    let count = 0;
    let offset = 1;

    while (count < displayCount && uniqueIndices.size < totalCount - 1) {
      let nextIndex = (currentIndex + offset) % totalCount;
      if (nextIndex !== currentIndex && !uniqueIndices.has(nextIndex)) {
        indices.push(nextIndex);
        uniqueIndices.add(nextIndex);
        count++;
        if (count === displayCount) break;
      }

      let prevIndex = (currentIndex - offset + totalCount) % totalCount;
      if (prevIndex !== currentIndex && !uniqueIndices.has(prevIndex)) {
        indices.push(prevIndex);
        uniqueIndices.add(prevIndex);
        count++;
        if (count === displayCount) break;
      }
      offset++;

      if (offset > totalCount && count < displayCount) {
        break;
      }
    }
    return indices.sort((a, b) => a - b);
  }, []);


  // Animation for individual CTA elements (from your original code)
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

  // Horizontal Scroll and Parallax (from your original code)
  useEffect(() => {
    const config = {
      SCROLL_SPEED: 0.5,
      LERP_FACTOR: 0.05,
      MAX_VELOCITY: 150,
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

    function checkMobile() {
      state.isMobile = window.innerWidth < 1000;
      state.slideWidth = state.isMobile ? (175 + 2 * 10) : (350 + 2 * 20);
    }

    function initializeSlides() {
      const track = sliderRef.current;
      if (!track) return;

      track.innerHTML = "";
      state.slides = [];
      checkMobile();

      const copiesMultiplier = 5;
      const totalSlidesInTrack = totalSlideCount * copiesMultiplier;

      for (let i = 0; i < totalSlidesInTrack; i++) {
        const dataIndex = i % totalSlideCount;
        const slide = document.createElement("div");
        slide.className = "work-space--slide-item slide_in-view__image";
        slide.dataset.index = dataIndex;
        slide.innerHTML = `
          <div class="item_bg">
            <img src="${WorkSpaceData[dataIndex].image_bg}" alt="${WorkSpaceData[dataIndex].name}" decoding="async" />
          </div>
        `;
        slide.addEventListener("click", () => openLightbox(dataIndex));
        track.appendChild(slide);
        state.slides.push(slide);
      }

      const initialOffset = (totalSlideCount * state.slideWidth) * Math.floor(copiesMultiplier / 2);
      state.currentX = -initialOffset;
      state.targetX = -initialOffset;
      updateSlidePositions();
    }

    function updateSlidePositions() {
      const track = sliderRef.current;
      if (!track) return;

      const sequenceWidth = totalSlideCount * state.slideWidth;

      if (state.currentX < -sequenceWidth * 3) {
        state.currentX += sequenceWidth;
        state.targetX += sequenceWidth;
      } else if (state.currentX > -sequenceWidth * 2) {
        state.currentX -= sequenceWidth;
        state.targetX -= sequenceWidth;
      }

      track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
    }

    function updateParallax() {
      const viewportCenter = window.innerWidth / 2;
      state.slides.forEach((slide) => {
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
    }

    function animate() {
      state.currentX += (state.targetX - state.currentX) * config.LERP_FACTOR;
      state.targetX -= config.SCROLL_SPEED;
      updateSlidePositions();
      updateParallax();
      state.animationId = requestAnimationFrame(animate);
    }

    function slideInView() {
      const container = document.querySelector(".slide_in-view__container .slide_in-view__row");
      if (!container || !sliderRef.current) {
        console.warn("Slide-in view elements not found");
        return;
      }

      let initSlides = false;

      mainScrollTrigger.current = ScrollTrigger.create({
        trigger: container,
        start: "10% 83%",
        end: "10% top",
        onEnter: () => {
          if (initSlides) return;
          initSlides = true;

          initializeSlides();

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

          animate();
        },
        onLeaveBack: () => {
          if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
          }
          initSlides = false;
        },
      });

      ScrollTrigger.refresh();
    }

    slideInView();
    window.addEventListener("resize", initializeSlides);

    return () => {
      window.removeEventListener("resize", initializeSlides);
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill();
        mainScrollTrigger.current = null;
      }
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === document.querySelector(".slide_in-view__container .slide_in-view__row")) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Function to update the thumbnails display
  const updateThumbnails = useCallback((index) => {
    if (!lightboxThumbnailsRef.current) return;

    const thumbnailContainer = lightboxThumbnailsRef.current;
    thumbnailContainer.innerHTML = ''; // Clear existing thumbnails

    // Fetch indices for thumbnails, excluding the current image
    const indicesToDisplay = getThumbnailIndices(index, WorkSpaceData.length, 5); // Display 5 thumbnails

    indicesToDisplay.forEach(thumbIndex => {
      const thumbData = WorkSpaceData[thumbIndex];
      const thumbDiv = document.createElement('div');
      // No 'active' class for the current image as it's excluded
      thumbDiv.className = `lightbox-thumbnail`;
      thumbDiv.innerHTML = `<img src="${thumbData.image_bg}" alt="${thumbData.name}" />`;
      thumbDiv.addEventListener('click', () => navigateLightbox(null, thumbIndex)); // Pass thumbIndex directly
      thumbnailContainer.appendChild(thumbDiv);
    });
  }, [getThumbnailIndices]);


  // Lightbox functions
  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    updateThumbnails(index); // Initialize thumbnails when opening

    // Prepare all images for animation by setting their initial positions
    // This runs once when the lightbox opens
    if (lightboxImagesRefs.current.length > 0) {
        lightboxImagesRefs.current.forEach((imgEl, i) => {
            if (i === index) {
                gsap.set(imgEl, { x: '0%', autoAlpha: 1, zIndex: 10 }); // Active image visible
            } else {
                gsap.set(imgEl, { x: directionFromCurrent(index, i, WorkSpaceData.length), autoAlpha: 0, zIndex: 1 }); // Other images off-screen and hidden
            }
        });
    }


    gsap.timeline({ onComplete: () => {
      // After opening animation, ensure the correct image is fully visible and others are hidden
      // This is mostly for safety/reset, as navigateLightbox handles the state transitions
      if (lightboxImagesRefs.current[index]) {
        gsap.set(lightboxImagesRefs.current[index], { x: '0%', autoAlpha: 1, scale: 1, zIndex: 10 });
      }
    }})
      .set(lightboxRef.current, { display: "flex", autoAlpha: 0 })
      .to(lightboxRef.current, { autoAlpha: 1, duration: 0.5, ease: "power2.out" })
      // Animate the current image from a slightly scaled down state to 1
      .fromTo(lightboxImagesRefs.current[index], { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.7)" }, "<0.2")
      .fromTo(lightboxThumbnailsRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "<0.1");


    document.body.style.overflow = "hidden";
  }, [updateThumbnails]);

  const closeLightbox = useCallback(() => {
    gsap.timeline({ onComplete: () => {
      setLightboxOpen(false);
      // Reset all lightbox image styles after closing for next open
      if (lightboxImagesRefs.current.length > 0) {
        lightboxImagesRefs.current.forEach(imgEl => {
          gsap.set(imgEl, { x: '0%', autoAlpha: 0, scale: 1, zIndex: 1 });
        });
      }
    }})
      .to(lightboxThumbnailsRef.current, { y: 20, autoAlpha: 0, duration: 0.2 })
      .to(lightboxImagesRefs.current[currentImageIndex], { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "<0.1")
      .to(lightboxRef.current, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "<0.1");

    document.body.style.overflow = "auto";
  }, [currentImageIndex]);

  // Helper to determine initial direction for off-screen images (important for initial setup)
  const directionFromCurrent = useCallback((currentIndex, targetIndex, totalCount) => {
    const diff = targetIndex - currentIndex;
    const absDiff = Math.abs(diff);

    // Check for wrap-around
    if (absDiff > totalCount / 2) {
      if (diff > 0) { // e.g., current 0, target 9, total 10 -> diff +9. Closer path is -1
        return '-100%';
      } else { // e.g., current 9, target 0, total 10 -> diff -9. Closer path is +1
        return '100%';
      }
    } else {
      if (diff > 0) {
        return '100%';
      } else {
        return '-100%';
      }
    }
  }, []);

  const navigateLightbox = useCallback((direction, specificIndex = null) => {
    const totalCount = WorkSpaceData.length;
    let newIndex = currentImageIndex;

    if (specificIndex !== null) {
      newIndex = specificIndex;
    } else if (direction === "next") {
      newIndex = (currentImageIndex + 1) % totalCount;
    } else if (direction === "prev") {
      newIndex = (currentImageIndex - 1 + totalCount) % totalCount;
    }

    if (newIndex === currentImageIndex && specificIndex === null) {
        return;
    }

    const oldImageEl = lightboxImagesRefs.current[currentImageIndex];
    const newImageEl = lightboxImagesRefs.current[newIndex];

    if (oldImageEl && newImageEl) {
      // Set initial positions for the slide
      const startXNew = (direction === "next" || newIndex > currentImageIndex) ? '100%' : '-100%';
      const endXOld = (direction === "next" || newIndex > currentImageIndex) ? '-100%' : '100%';

      // Ensure the new image is visible and old is visible before starting animation
      gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10 }); // Bring new image to front and set start position
      gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5 }); // Keep old image visible but behind the new one

      gsap.timeline({
        onComplete: () => {
          // After animation, hide the old image and ensure new is correctly positioned
          gsap.set(oldImageEl, { autoAlpha: 0, x: '0%', zIndex: 1 }); // Reset old image's position and hide it
          gsap.set(newImageEl, { x: '0%', autoAlpha: 1, zIndex: 10 }); // Ensure new image is perfectly centered

          setCurrentImageIndex(newIndex); // Update the state after animation completes
          updateThumbnails(newIndex);
        }
      })
      .to(oldImageEl, { x: endXOld, duration: 0.6, ease: "power2.inOut" }, 0)
      .to(newImageEl, { x: '0%', duration: 0.6, ease: "power2.inOut" }, 0); // Use 0 for simultaneous animation
    } else {
      // Fallback for initial load or if refs are not ready
      setCurrentImageIndex(newIndex);
      updateThumbnails(newIndex);
    }
  }, [currentImageIndex, updateThumbnails, directionFromCurrent]);


  // Effect to handle keyboard navigation (Escape to close, arrows for next/prev)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!lightboxOpen) return;

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
  }, [lightboxOpen, closeLightbox, navigateLightbox]);

  return (
    <>
      <section className="wrokSpace_section" ref={sectionRef}>
        <div className="wrokSpace_section-inner site_flex flex_column site_gap">
          <div className="wrokSpace_section-top">
            <div className="site_container">
              <span className="section_name">WORKSPACE</span>
              <h2>Inside the Studio</h2>
              <p className="h2 light">
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
              >
                {/* Slides will be dynamically inserted here by initializeSlides() */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Gallery */}
      {lightboxOpen && (
        <div className="lightbox-overlay" ref={lightboxRef} onClick={closeLightbox}>
          <div className="lightbox-content" ref={lightboxContentRef} onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
            <button className="lightbox-nav lightbox-prev" onClick={() => navigateLightbox("prev")}>&#10094;</button>

            {/* Render all images initially, hidden and positioned off-screen */}
            {WorkSpaceData.map((data, index) => (
              <img
                key={index} // Use index as key if data doesn't have a unique ID
                ref={addLightboxImageRef} // Use the callback ref to populate lightboxImagesRefs
                data-index={index} // Add data-index for sorting refs if needed
                src={data.image_bg}
                alt={`Gallery Image ${index + 1}`}
                className="lightbox-image"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0, // Initial state, will be managed by GSAP x-transform
                  width: '100%',
                  height: '100%',
                  
                  transform: 'translateX(0%)', // GSAP will override this
                  visibility: 'hidden', // Initially hidden, GSAP autoAlpha will manage
                  opacity: 0, // Initially hidden, GSAP autoAlpha will manage
                  zIndex: 1, // Default z-index, current image will have higher
                }}
              />
            ))}

            <button className="lightbox-nav lightbox-next" onClick={() => navigateLightbox("next")}>&#10095;</button>
            {/* Thumbnail Navigation */}
            <div className="lightbox-thumbnails" ref={lightboxThumbnailsRef}>
              {/* Thumbnails will be dynamically inserted here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WorkSpace;