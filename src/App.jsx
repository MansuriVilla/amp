import { useEffect } from "react";

import Lenis from "lenis";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "./components/footer/Footer";
import VideoBanner from "./components/video-banner/VideoBanner.jsx";
import AboutUs from "./components/about-us/AboutUs.jsx";
import ProjectsSection from "./components/projects/ProjectsSection";
import WorkSpace from "./components/workspace/WorkSpace.jsx";
import Review from "./components/review/Review.jsx";
import Contact from "./components/contact/Contact.jsx";


import "./App.css";

gsap.registerPlugin(ScrollTrigger);

function App() {
  

  useEffect(() => {
    const lenis = new Lenis();

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const revealText = document.querySelectorAll('.reveal-text');
    
    if (revealText.length === 0) {
        console.warn("No elements with class 'reveal-text' found.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);

    // Wait for fonts to load
    document.fonts.ready.then(() => {
        revealText.forEach(reveal => {
            // Create SplitText instance for the current reveal element
            const split = new SplitText(reveal, { type: "words" });
            const words = split.words; // Array of word elements
            const revealSection = reveal.closest('.reveal-section');

            if (words.length === 0) {
                console.warn("No words found in SplitText for element:", reveal);
                return;
            }

            gsap.fromTo(words,
                { opacity: 0, scale: 0.5 },
                {
                    opacity: 1,
                    scale: 1,
                    ease: "power2.out",
                    stagger: 0.05,
                    scrollTrigger: {
                        trigger: revealSection,
                        start: "top 50%",
                        end: "+=" + (revealSection.offsetHeight * 3.5),
                        // markers:true,
                        toggleActions: "play reverse play reverse",
                    }
                }
            );
        });
    });

}, []);



  return (
    <>
      <main className="main_content site_flex flex_column site_gap">
        <VideoBanner />
        <AboutUs />
        <ProjectsSection />
        <WorkSpace />
        <Review />
        <Contact />
        <Footer />
      </main>
    </>
  );
}

export default App;
