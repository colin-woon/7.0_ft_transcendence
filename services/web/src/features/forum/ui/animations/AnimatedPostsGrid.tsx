"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ForumPost } from "../../models";
import type { Project } from "../../models/projects";
import PostRow from "../posts/components/PostRow";

interface AnimatedPostsGridProps {
  pageKey: string;
  posts: ForumPost[];
  project: Project;
  isBusy?: boolean;
  onDeletePost?: (postId: number) => Promise<void>;
  onEditPost?: (postId: number) => void;
}

export function AnimatedPostsGrid({
  pageKey,
  posts,
  project,
  isBusy = false,
  onDeletePost,
  onEditPost,
}: AnimatedPostsGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full grid grid-cols-1 gap-3"
      >
        {posts.map((post) => (
          <PostRow
            key={post.id}
            project={project}
            post={post}
            isBusy={isBusy}
            onDeletePost={onDeletePost}
            onEditPost={onEditPost}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
