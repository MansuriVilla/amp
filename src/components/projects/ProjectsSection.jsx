import ProjectData from "../../data/ProjectData.json";
import "./projectsection.css"

function ProjectsSection() {
  return (
    <section className="projects_section">
      <div className="projects_section-inner site_flex flex_column site_gap">
        <div className="project_section-top">
          <div className="site_container">
            <span className="section_name">PROJECTS</span>
            <h2>Built, Not Bragged</h2>
            <p>
              Launched. Delivered. Live. These aren’t mockups — they’re real
              projects we’ve brought into the world.
            </p>
          </div>
        </div>
        <div className="project_section-bottom">
          <div className="scroll_slider">
            <div className="slider_items site_flex site_gap">
              {ProjectData.map((data) => (
                <div className="item" key={data.id}>
                  <div className="item_bg">
                    <img src={data.image_bg} alt={`${data.image_bg}`} />
                  </div>
                  <div className="item_content">
                    <img src={data.logo} alt={`${data.logo}`} />
                    <a href="javascriptvoid(0);">{data.button_text}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;
