import React from "react";
import { motion } from "framer-motion";
import transitionImg from "../assets/school-transition.png";


export default function Contact() {
  return (
    <div className="contact-page">

      {/* HERO SECTION */}
      <section className="contact-hero">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="contact-title"
        >
          Get in Touch with <span>SCHOOLO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="contact-sub"
        >
          We’re here to support your school’s digital transformation.
        </motion.p>
      </section>

      {/* SCHOOLING TRANSITION IMAGE SECTION */}
      <section className="transition-section">
        <motion.img
          src={transitionImg}
    alt="School Transition"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="transition-img"
        />

        <motion.div
          className="transition-text"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2>Transforming Schools, One Step at a Time</h2>
          <p>
            From student intelligence dashboards to teacher automation tools,
            SCHOOLO brings a complete ecosystem for modern educational
            management.
          </p>
        </motion.div>
      </section>

      {/* CONTACT FORM + MAP */}
      <section className="contact-container">
        {/* CONTACT FORM */}
        <motion.div
          className="contact-form"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h3>Contact Us</h3>

          <form>
            <label>Name</label>
            <input type="text" placeholder="Your name" required />

            <label>Email</label>
            <input type="email" placeholder="Your email" required />

            <label>Message</label>
            <textarea placeholder="Write your message..." rows="5"></textarea>

            <button type="submit">Send Message</button>
          </form>
        </motion.div>

        {/* MAP */}
        <motion.div
          className="contact-map"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15224.432933105256!2d78.3631121518263!3d17.454533019895052!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93d88e9abb73%3A0x2d704b5d2ab689a!2sKrimatix%20Pvt%20Ltd!5e0!3m2!1sen!2sin!4v1763900504589!5m2!1sen!2sin"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </motion.div>
      </section>

      {/* INLINE CSS */}
      <style>{`
        .contact-page {
          font-family: 'Poppins', sans-serif;
          padding: 20px;
          color: #1a1a1a;
        }

        .contact-hero {
          text-align: center;
          padding: 60px 20px;
        }

        .contact-title {
          font-size: 40px;
          font-weight: 700;
        }

        .contact-title span {
          color: #5A4FF3;
        }

        .contact-sub {
          margin-top: 10px;
          font-size: 18px;
          opacity: 0.8;
        }

        /* TRANSITION SECTION */
        .transition-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding: 50px 20px;
          flex-wrap: wrap;
        }

        .transition-img {
          width: 380px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .transition-text {
          max-width: 450px;
        }

        .transition-text h2 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .transition-text p {
          font-size: 16px;
          opacity: 0.8;
        }

        /* CONTACT SECTION */
        .contact-container {
          display: flex;
          gap: 40px;
          padding: 50px 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .contact-form {
          width: 380px;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          background: #fff;
        }

        .contact-form h3 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #5A4FF3;
        }

        .contact-form label {
          display: block;
          margin-top: 10px;
          font-size: 14px;
          opacity: 0.7;
        }

        .contact-form input,
        .contact-form textarea {
          width: 100%;
          padding: 10px;
          margin-top: 5px;
          border-radius: 8px;
          border: 1px solid #ccc;
          outline: none;
          transition: 0.3s;
        }

        .contact-form input:focus,
        .contact-form textarea:focus {
          border-color: #5A4FF3;
        }

        .contact-form button {
          margin-top: 20px;
          width: 100%;
          padding: 12px;
          border: none;
          background: #5A4FF3;
          color: #fff;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: 0.3s;
        }

        .contact-form button:hover {
          background: #473de2;
        }

        /* MAP */
        .contact-map iframe {
          width: 450px;
          height: 380px;
          border: 0;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        /* MOBILE */
        @media (max-width: 768px) {
          .transition-section {
            text-align: center;
          }

          .transition-img {
            width: 90%;
          }

          .contact-map iframe {
            width: 100%;
            height: 350px;
          }

          .contact-form {
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}
