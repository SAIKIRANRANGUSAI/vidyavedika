const express = require("express");
const router = express.Router();
const db = require("../config/db"); // adjust path if needed
const DEFAULT_IMAGE = "/images/default.png";



// GET /about (front-end About Us page)
router.get("/about", async (req, res) => {
    try {
        const [aboutRows] = await db.query("SELECT * FROM about_us WHERE id = 1");
        const [whyChooseUsRows] = await db.query("SELECT * FROM why_choose_us WHERE id = 1");
        const [vmRows] = await db.query("SELECT * FROM vision_mission WHERE id = 1");
        const [teamRows] = await db.query("SELECT * FROM team_section WHERE id = 1");
        const [memberRows] = await db.query("SELECT * FROM team_members ORDER BY id DESC");
        const [mdRows] = await db.query("SELECT * FROM managing_director_message WHERE id = 1");
        const [accreditationsRows] = await db.query("SELECT * FROM accreditations_achievements WHERE id = 1");

const accreditations = accreditationsRows.length
    ? accreditationsRows[0]
    : {
          heading: "Accreditations & Achievements",
          description: "Vidya Vedika IIT & NEET Academy takes pride in its consistent record of academic excellence and student success. Our students have secured top ranks in IIT-JEE, NEET, and other competitive examinations, reflecting the quality of our teaching and mentorship. Over the years, we have been recognized for our commitment to student-oriented education, innovative learning methods, and a strong track record of results. These achievements stand as a testament to our vision of empowering students to reach their highest potential.",
          image: "/images/default1.png"
      };
        const [journeyRows] = await db.query("SELECT * FROM journey_history WHERE id = 1");
    const journey = journeyRows.length ? journeyRows[0] : {
      heading: "Our Journey / History",
      description1: "Vidya Vedika IIT & NEET Academy was established with the vision...",
      description2: "Over the years, our dedicated faculty...",
      image1: "/images/default1.png",
      image2: "/images/default2.png"
    };

        res.render("about", {
            about: aboutRows.length
                ? aboutRows[0]
                : {
                      heading: "Welcome to Vidya Vedika IIT & NEET Academy",
                      paragraph1:
                          "We are delighted to welcome you to our official website! At Vidya Vedika IIT & NEET Academy, we believe in empowering young minds with knowledge, discipline, and confidence to excel in academics and life. Our institution is dedicated to providing student-focused, quality education that prepares learners for Intermediate Boards, IIT-JEE, NEET, and beyond.",
                      paragraph2:
                          "Through our committed faculty, innovative teaching methods, and supportive environment, we aim to shape not just achievers, but responsible and value-driven individuals. We invite you to explore our website, discover our programs and facilities, and join us in this journey of learning, growth, and success.",
                      image1: "/images/default1.png",
                      image2: "/images/default2.png",
                  },
            whyChooseUs: whyChooseUsRows.length
                ? whyChooseUsRows[0]
                : {
                      main_heading: "Why Choose Us",
                      heading_2: "Empowering Students for Future Success",
                      main_description:
                          "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
                      sub_heading_1: "Expert Faculty",
                      description_1: "with years of experience in IIT & NEET coaching.",
                      sub_heading_2: "Comprehensive Study Material",
                      description_2: "that covers every concept in detail.",
                      sub_heading_3: "Regular Tests & Assessments",
                      description_3: "to track progress and boost confidence.",
                      sub_heading_4: "Personalized Guidance",
                      description_4: "for every student’s unique learning journey.",
                      image_1: "images/whychoouse-img-1.png",
                      image_2: "images/whychoouse-img-2.png",
                      image_3: "images/whychoouse-img-3.png",
                  },
                  vm: vmRows.length ? vmRows[0] : {
                vision_heading: "Our Vision",
                vision_text: "To be a dynamic institution that delivers student- and parent-oriented quality education, guided by strong ethics and values, empowering learners to achieve excellence in academics, IIT, NEET, and responsible citizenship",
                vision_image: "images/opportunity.png",
                mission_heading: "Our Mission",
                mission_text: "To empower students with the knowledge, skills, and character to lead meaningful lives and shape a better Nation",
                mission_image: "images/target.png"
            },
            team: teamRows.length ? teamRows[0] : {
                heading: "Our Team",
                description: "Meet the dedicated professionals who guide and mentor our students to success."
            },
            members: memberRows,
            md: mdRows.length ? mdRows[0] : {
                title: "Managing Director’s Message",
                subtitle: "Welcome to Our Community!",
                greeting: "Dear Parents & Students,",
                content: "At Vidya Vedika IIT & NEET Academy, we believe education is a shared journey between the institution, the student, and the parents. Your trust and partnership play a vital role in shaping the future of our children...",
                director_name: "Srinivas Duppalapudi",
                designation: "Managing Director",
                institute_name: "Vidya Vedika IIT & NEET Academy"
            },
            journey,
            accreditations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading Why Choose Us section");
    }
});

module.exports = router;
