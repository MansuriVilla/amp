import { useEffect } from 'react';

import Lenis from 'lenis'
import { gsap } from "gsap";
    
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from './components/footer/Footer';
import VideoBanner from './components/video-banner/VideoBanner.jsx';


import './App.css'

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


  return (
    <>
    <main className="site_flex flex_column site_gap"> 
    <VideoBanner />
     <Footer />
    </main>
    </>
  )
}

export default App
