'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Project } from '../../models/projects';
import { ProjectCard } from './ProjectCard2';

type AnimatedProjectsGridProps = {
  pageKey: string;
  projects: Project[];
};

export function AnimatedProjectsGrid({
  pageKey,
  projects,
}: AnimatedProjectsGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={true}>
      <motion.div
        key={pageKey}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="grid w-full max-w-7xl mx-auto justify-center justify-items-center grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        // className="grid w-full content-start grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
