# Overview
Our project will serve as a modernized, community-driven prototype of the 42 Network’s internal management system. While the original Intra focuses on tracking progress and logs, your version shifts the focus toward collaborative learning and real-time communication.

## 1. Core Objectives
The primary goal is to create a secure, multi-user web application that bridges the gap between official school documentation and student-led peer support.

**Security & Identity:** Replicate the 42 authentication flow to ensure a familiar and secure entry point.

**Knowledge Sharing:** Transform static project descriptions into a dynamic, "StackOverflow-style" forum where students can upvote solutions and discuss subject-specific edge cases.

**Instant Connectivity**: Provide a centralized communication hub to replace fragmented Slack/Discord servers for better campus integration.

## 2. Key Functional Pillars

**Feature -- Functionality Description**
**Auth & Profile** -- A secure system handling sign-up/log-in with hashed passwords. This includes a profile page displaying user status and project history.

**Project Forum** -- A specialized board for each project (e.g., "libft", "minishell"). Features include threaded discussions, Markdown support for code snippets, and a "Solution/Best Answer" marking system.

**Real-Time Chat** -- A live messaging system using WebSockets. It will support persistent chat history, typing indicators, and potentially "servers" or "rooms" dedicated to specific campus events.