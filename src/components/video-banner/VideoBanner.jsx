import bannerVideo from "/assets/images/banner-video.mp4";
import "./VideoBanner.css";

function VideoBanner() {
  return (
    <section className="hero_banner_section">
      <div className="hero_banner">
        <video
          src={bannerVideo}
          autoPlay
          loop
          muted
          playsInline
          className="video-banner"
        ></video>
      </div>
    </section>
  );
}

export default VideoBanner;
