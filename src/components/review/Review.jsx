import ReviewData from "../../data/ReviewData.json";
import "./review.css";


function Review() {
  return (
    <>
      <section className="review_section">
        <div className="review_section-inner site_flex flex_column site_gap">
          <div className="review_section-top project_section-top">
            <div className="site_container">
              <span className="section_name">REVIEWS</span>
              <h2>Clients, Not Critics</h2>
            </div>
          </div>
          <div className="review_section-bottom ">
            <div className="site_container">
              <div className="review_clinet-feedback">
                <div className="review_rows site_flex site_gap flex_column">
                  {ReviewData.map((review) => (
                    <div
                      className="review_row site_flex flex_column site_gap"
                      
                      
                      key={review.id}
                    >
                      
                      <h4
                        className="Review_text"
                        dangerouslySetInnerHTML={{ __html: review.text }}
                      ></h4>
                      <div className="site_flex review_client-details">
                       
                        <p className="review-client_name" dangerouslySetInnerHTML={{ __html: review.name }}></p>
                       
                        <p className="light client_at" dangerouslySetInnerHTML={{ __html: review.companyName }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Review;