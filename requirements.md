Major: Use a framework for both the frontend and backend.
◦ Use a frontend framework (React, Vue, Angular, Svelte, etc.).
◦ Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails,
etc.).
◦ Full-stack frameworks (Next.js, Nuxt.js, SvelteKit) count as both if you use
both their frontend and backend capabilities.
???
 Minor: Use a frontend framework (React, Vue, Angular, Svelte, etc.).
• Minor: Use a backend framework (Express, Fastify, NestJS, Django, etc.). ???

Major: Implement real-time features using WebSockets or similar technology.
◦ Real-time updates across clients.
◦ Handle connection/disconnection gracefully.
◦ Efficient message broadcasting.
• Major: Allow users to interact with other users. The minimum requirements are:
◦ A basic chat system (send/receive messages between users).
◦ A profile system (view user information).
◦ A friends system (add/remove friends, see friends list).

 Minor: Use an ORM for the database

Minor: A complete notification system for all creation, update, and deletion actions.

Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).

Major: Standard user management and authentication.
◦ Users can update their profile information.
◦ Users can upload an avatar (with a default avatar if none provided).
◦ Users can add other users as friends and see their online status.
◦ Users have a profile page displaying their information

Major: Advanced permissions system:
◦ View, edit, and delete users (CRUD).
◦ Roles management (admin, user, guest, moderator, etc.).
◦ Different views and actions based on user role.

Major: Backend as microservices.
◦ Design loosely-coupled services with clear interfaces.
◦ Use REST APIs or message queues for communication.
◦ Each service should have a single responsibility.

15

UI
User Profiles (Auth) (searching, online status, real-time chat)
Project Forums (threads, moderator)
? AI Powered recommendation

Frontend
React + Typescript + Tailwind + Vite

Backend
Python (django, fastapi) (data fetching from DB, and api stuff) 
Java (springboot) (auth, chat)

DB
PostgresSQL
Redis (optional)
