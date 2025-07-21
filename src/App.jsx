import { useEffect } from 'react';

import Lenis from 'lenis'
import { gsap } from "gsap";

    
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from './components/footer/Footer';
import VideoBanner from './components/video-banner/VideoBanner.jsx';
import AboutUs from './components/about-us/AboutUs.jsx';
import ProjectsSection from './components/projects/ProjectsSection';
import WorkSpace from './components/workspace/WorkSpace.jsx';
import Review from './components/review/Review.jsx';
import Contact from './components/contact/Contact.jsx';
import { SplittingText } from "./utils/SplittingText.jsx";
import { useZoomInText } from "./utils/ZoomInText.jsx";


import './App.css'

gsap.registerPlugin(ScrollTrigger);

function App() { 
  
  useZoomInText({ selector: "span, h2, p" });
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


  return (
    <>
    <main className="main_content site_flex flex_column site_gap"> 
    {/* <SplittingText /> */}
    <VideoBanner />
    <AboutUs/>
    <ProjectsSection />
    <WorkSpace />
    <Review />
    <Contact />
     <Footer />
    </main>
    </>
  )
}

export default App
