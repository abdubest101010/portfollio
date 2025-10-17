"use client";
import React, { useState, useRef } from "react";
import ProjectCard from "./ProjectCard";
import ProjectTag from "./ProjectTag";
import { motion, useInView } from "framer-motion";

const projectsData = [
   {
    id: 1,
    title: "ClinicFlow – Healthcare Management for Ethiopian Clinics",
    description: "ClinicFlow is a modern, all-in-one clinic management platform built for Ethiopian healthcare settings. Designed for receptionists, doctors, and laboratory staff, it digitizes the entire patient journey—from registration and appointment scheduling to vital checks, doctor consultations, lab testing, and finalization.",
    image: "/images/projects/ClinicPhoto.jpg",
    tag: ["All", "Web"],
    gitUrl: "https://github.com/abdubest101010/Electronic-Health-Solution",
    previewUrl: "https://niswa-clinic.vercel.app",
  },
  {
    id: 2,
    title: "Question and answer Website",
    description: "a website design for students to discuss question and answer",
    image: "/images/projects/Q&A.jpg",
    tag: ["All", "Web"],
    gitUrl: "https://github.com/abdubest101010/EvangadiForumProject",
    previewUrl: "https://abdu-evangai-forum-project.vercel.app/",
  },
  {
    id: 3,
    title: "Amazon clone",
    description: "Amazon website specially login and cart page",
    image: "/images/projects/images.jfif",
    tag: ["All", "Web"],
    gitUrl: "https://github.com/abdubest101010/Abdu_Amazon_Clone_project",
    previewUrl: "https://abdu-projects-amazon-clone.netlify.app/",
  },
  {
    id: 4,
    title: "A social media web app people can interact eachother",
    description: "a website design for users to interact eachother and they can post their ideas and get response from other and can post day to day stories and so much",
    image: "/images/projects/Social-Media-Engagement.png",
    tag: ["All", "Web"],
    gitUrl: "https://github.com/abdubest101010/social-media",
    previewUrl: "https://abdu-social-media.vercel.app",
  },
{
    id: 5,
    title: "Todolist website integrated with telegram",
    description: "a website design for users to schedule their work and get notified",
    image: "/images/projects/todolist.jpg",
    tag: ["All", "Web"],
    gitUrl: "https://github.com/abdubest101010/todolist-web-with-notification",
    previewUrl: "https://t.me/todolistwithNotification_bot",
  } 
];

const ProjectsSection = () => {
  const [tag, setTag] = useState("All");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const handleTagChange = (newTag) => {
    setTag(newTag);
  };

  const filteredProjects = projectsData.filter((project) =>
    project.tag.includes(tag)
  );

  const cardVariants = {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

  return (
    <section id="projects">
      <h2 className="text-center text-4xl font-bold text-white mt-4 mb-8 md:mb-12">
        My Projects
      </h2>
      <div className="text-white flex flex-row justify-center items-center gap-2 py-6 ">
        {/* <ProjectTag
          onClick={handleTagChange}
          name="All"
          isSelected={tag === "All"}
        />
        <ProjectTag
          onClick={handleTagChange}
          name="Web"
          isSelected={tag === "Web"}
        />
        <ProjectTag
          onClick={handleTagChange}
          name="Mobile"
          isSelected={tag === "Mobile"}
        /> */}
      </div>
      <ul ref={ref} className="grid md:grid-cols-3 gap-8 md:gap-12 ">
        {filteredProjects.map((project, index) => (
          <motion.li
            key={index}
            variants={cardVariants}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            transition={{ duration: 0.3, delay: index * 0.4 }}
          >
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              imgUrl={project.image}
              gitUrl={project.gitUrl}
              previewUrl={project.previewUrl}
            />
          </motion.li>
        ))}
      </ul>
    </section>
  );
};

export default ProjectsSection;
