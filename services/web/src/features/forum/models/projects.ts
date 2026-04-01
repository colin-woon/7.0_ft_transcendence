export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface ForumPost {
  id: number;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  upvotes: number;
  category: string;
  timestamp: string;
  preview: string;
  isHot: boolean;
  isPinned: boolean;
}

export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string;
  
  difficulty: string;
  xp: number;
  duration: string;
  teamSize: string;
  tags: string[];
  students: number;
  color: string;
  posts: ForumPost[];
}

export const projects: Project[] = [
  {
    id: 1,
    slug: "libft",
    name: "Libft",
    description: "Re-implement a set of standard C library functions. The foundation of all future 42 projects — you'll use this library throughout the whole cursus.",
    
    difficulty: "Beginner",
    xp: 462,
    duration: "~1 week",
    teamSize: "Solo",
    tags: ["C", "Algorithms", "Memory"],
    students: 4821,
    color: "from-blue-400 to-blue-600",
    posts: [
      { id: 1, title: "ft_strlcpy vs strncpy — what's the actual difference?", author: "cptr42", avatar: "🧑‍💻", replies: 14, views: 340, upvotes: 32, category: "Question", timestamp: "2h ago", preview: "I keep mixing them up. Can someone clarify the return value difference?", isHot: false, isPinned: false },
      { id: 2, title: "My Libft passed 100/100! Tips inside", author: "norminette_god", avatar: "🎉", replies: 56, views: 1200, upvotes: 143, category: "Show & Tell", timestamp: "1d ago", preview: "After 3 weeks of pain, I finally got a perfect score. Here's what tricked me the most.", isHot: true, isPinned: true },
      { id: 3, title: "Help: my ft_memset is failing weird test cases", author: "newbie42", avatar: "😵", replies: 8, views: 90, upvotes: 3, category: "Help", timestamp: "5h ago", preview: "The moulinette fails on the edge case where n=0. My implementation returns early but the tester disagrees.", isHot: false, isPinned: false },
      { id: 4, title: "Linked list bonus — is it worth doing?", author: "curious_cadet", avatar: "🤔", replies: 22, views: 450, upvotes: 18, category: "Discussion", timestamp: "3d ago", preview: "I'm halfway through the mandatory part. Should I bother with linked lists now or push it to later?", isHot: false, isPinned: false },
    ],
  },
  {
    id: 2,
    slug: "ft_printf",
    name: "ft_printf",
    description: "Recode the printf function from scratch. Learn variadic functions, format specifiers, and how to handle complex formatted output in C.",
    difficulty: "Beginner",
    xp: 462,
    duration: "~1 week",
    teamSize: "Solo",
    tags: ["C", "Variadic", "Parsing"],
    students: 4102,
    color: "from-green-400 to-green-600",
    posts: [
      { id: 1, title: "How do you handle the %* width specifier?", author: "formatwiz", avatar: "🧪", replies: 11, views: 210, upvotes: 27, category: "Question", timestamp: "3h ago", preview: "My bonus part breaks on dynamic width — anyone dealt with this?", isHot: false, isPinned: false },
      { id: 2, title: "Printf bonus: flags -, 0, # — all passing!", author: "flag_master", avatar: "🚩", replies: 34, views: 780, upvotes: 89, category: "Show & Tell", timestamp: "2d ago", preview: "Just finished the bonus with all flags passing francinette. Here's my approach to the flag parsing logic.", isHot: true, isPinned: false },
      { id: 3, title: "va_list on ARM vs x86 — different behavior?", author: "arch_nerd", avatar: "💻", replies: 6, views: 130, upvotes: 14, category: "Discussion", timestamp: "1d ago", preview: "Running on an M2 Mac and seeing weird behavior with va_arg on double types. Anyone else?", isHot: false, isPinned: false },
    ],
  },
  {
    id: 3,
    slug: "get_next_line",
    name: "get_next_line",
    description: "Write a function that reads a line from a file descriptor. Master static variables, buffer management, and edge case handling in C.",
    difficulty: "Beginner",
    xp: 462,
    duration: "~1 week",
    teamSize: "Solo",
    tags: ["C", "File I/O", "Buffers"],
    students: 3987,
    color: "from-yellow-400 to-orange-500",
    posts: [
      { id: 1, title: "Buffer size of 1 — should it still work?", author: "edge_caser", avatar: "⚡", replies: 19, views: 420, upvotes: 41, category: "Question", timestamp: "1h ago", preview: "My GNL passes BUFFER_SIZE=42 but fails when compiled with -D BUFFER_SIZE=1. Static variable issue?", isHot: true, isPinned: false },
      { id: 2, title: "Memory leak with multiple fds — how I fixed it", author: "valgrind_pro", avatar: "🧠", replies: 28, views: 650, upvotes: 76, category: "Tutorial", timestamp: "4d ago", preview: "Sharing my approach to managing multiple static variables for the bonus part without any leaks.", isHot: false, isPinned: true },
      { id: 3, title: "What happens when read() returns 0?", author: "syscall_fan", avatar: "📡", replies: 7, views: 180, upvotes: 12, category: "Discussion", timestamp: "2d ago", preview: "I'm confused about whether I should free and return NULL or return an empty string at EOF.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 4,
    slug: "born2beroot",
    name: "Born2beRoot",
    description: "Set up a minimal Debian/Rocky Linux server with strict security rules. Introduction to system administration, firewalls, and user management.",
    difficulty: "Beginner",
    xp: 462,
    duration: "~2 weeks",
    teamSize: "Solo",
    tags: ["Linux", "VirtualBox", "Security"],
    students: 3654,
    color: "from-slate-400 to-slate-600",
    posts: [
      { id: 1, title: "What questions did they ask in your defense?", author: "defense_prep", avatar: "😰", replies: 67, views: 2100, upvotes: 198, category: "Discussion", timestamp: "6h ago", preview: "My defense is tomorrow. Sharing all the questions I've been asked or seen asked in past defenses.", isHot: true, isPinned: true },
      { id: 2, title: "UFW vs firewalld — which did you use?", author: "sysadmin_jr", avatar: "🔥", replies: 23, views: 540, upvotes: 34, category: "Discussion", timestamp: "1d ago", preview: "Rocky Linux defaults to firewalld but the subject hints UFW. What's the standard choice people use?", isHot: false, isPinned: false },
      { id: 3, title: "My monitoring.sh script — feel free to use!", author: "script_sharer", avatar: "📋", replies: 45, views: 1300, upvotes: 112, category: "Resource", timestamp: "3d ago", preview: "Clean implementation with all required stats. Comments explaining each command for the defense.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 5,
    slug: "push_swap",
    name: "push_swap",
    description: "Sort a stack of integers using a limited set of operations. Optimize for the fewest moves possible — performance is graded.",
    difficulty: "Intermediate",
    xp: 462,
    duration: "~2 weeks",
    teamSize: "Solo",
    tags: ["C", "Sorting", "Algorithms"],
    students: 3201,
    color: "from-pink-400 to-pink-600",
    posts: [
      { id: 1, title: "Radix sort vs Turk algorithm — which is better?", author: "algo_debate", avatar: "⚖️", replies: 89, views: 3200, upvotes: 245, category: "Discussion", timestamp: "4h ago", preview: "I see people using both. Radix is simpler but Turk gets fewer moves. Let's compare.", isHot: true, isPinned: false },
      { id: 2, title: "Getting under 700 moves for 100 numbers", author: "optimizer", avatar: "📊", replies: 41, views: 1100, upvotes: 134, category: "Tutorial", timestamp: "2d ago", preview: "My first attempt was 1100 moves. Here's how I got it down to 650 with chunk sorting.", isHot: true, isPinned: false },
      { id: 3, title: "Checker bonus: how to read from stdin?", author: "bonus_guy", avatar: "✅", replies: 12, views: 290, upvotes: 18, category: "Help", timestamp: "1d ago", preview: "My checker reads the numbers fine but hangs waiting for instructions. Using get_next_line(0).", isHot: false, isPinned: false },
    ],
  },
  {
    id: 6,
    slug: "pipex",
    name: "Pipex",
    description: "Replicate the behavior of the shell `|` operator. Understand process creation, file descriptors, dup2, and execve in depth.",
    difficulty: "Intermediate",
    xp: 462,
    duration: "~1 week",
    teamSize: "Solo",
    tags: ["C", "Processes", "Unix"],
    students: 2988,
    color: "from-teal-400 to-teal-600",
    posts: [
      { id: 1, title: "dup2 vs dup — when to use which?", author: "fd_wizard", avatar: "🔌", replies: 17, views: 380, upvotes: 44, category: "Question", timestamp: "8h ago", preview: "I see both used in solutions online. Is there a case where dup is actually the right choice?", isHot: false, isPinned: false },
      { id: 2, title: "Here_doc bonus — handling signals in child process", author: "signal_handler", avatar: "📶", replies: 29, views: 620, upvotes: 58, category: "Help", timestamp: "3d ago", preview: "My here_doc doesn't catch Ctrl+C properly. The parent process gets the signal instead of the child.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 7,
    slug: "philosophers",
    name: "Philosophers",
    description: "Solve the dining philosophers problem with threads and mutexes. Deep dive into concurrency, race conditions, and deadlock prevention.",
    difficulty: "Intermediate",
    xp: 462,
    duration: "~2 weeks",
    teamSize: "Solo",
    tags: ["C", "Threads", "Concurrency"],
    students: 2754,
    color: "from-amber-400 to-amber-600",
    posts: [
      { id: 1, title: "How do you prevent a philosopher from dying at time_to_die exactly?", author: "race_cond", avatar: "⏱️", replies: 52, views: 1800, upvotes: 167, category: "Question", timestamp: "3h ago", preview: "My philo dies at exactly time_to_die ms but the checker says it should still be alive. Off by one?", isHot: true, isPinned: true },
      { id: 2, title: "usleep accuracy — it's not actually microseconds!", author: "time_nerd", avatar: "🕰️", replies: 38, views: 990, upvotes: 121, category: "Tutorial", timestamp: "2d ago", preview: "usleep can sleep much longer than you asked for. Here's why and how to work around it with gettimeofday.", isHot: true, isPinned: false },
      { id: 3, title: "1 philosopher case — should they die?", author: "edge42", avatar: "🤨", replies: 14, views: 320, upvotes: 29, category: "Discussion", timestamp: "5d ago", preview: "With 1 philo, they can't pick up two forks. Most people return after the first wait but the subject is ambiguous.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 8,
    slug: "minishell",
    name: "Minishell",
    description: "Build a mini bash. Implement a lexer, parser, redirections, pipes, signal handling, and all required built-in commands.",
    difficulty: "Intermediate",
    xp: 882,
    duration: "~4 weeks",
    teamSize: "2 people",
    tags: ["C", "Shell", "Parsing", "Processes"],
    students: 2341,
    color: "from-lime-400 to-lime-600",
    posts: [
      { id: 1, title: "AST vs linked list approach — which did you choose?", author: "parse_master", avatar: "🌳", replies: 78, views: 2900, upvotes: 312, category: "Discussion", timestamp: "1h ago", preview: "My team debated for a week. We went with AST but the linked-list approach seems way simpler. Thoughts?", isHot: true, isPinned: false },
      { id: 2, title: "Heredoc + pipe combo crashes my shell", author: "piped_in", avatar: "💥", replies: 23, views: 510, upvotes: 41, category: "Help", timestamp: "6h ago", preview: "cmd << EOF | cmd2 works in bash but segfaults in mine. Fork order issue or heredoc fd not being closed?", isHot: false, isPinned: false },
      { id: 3, title: "Signal handling: Ctrl+C in child vs parent", author: "sig42", avatar: "🚦", replies: 34, views: 790, upvotes: 67, category: "Tutorial", timestamp: "4d ago", preview: "The trickiest part of minishell is getting signals right. Here's the exact setup that passed the moulinette.", isHot: false, isPinned: true },
      { id: 4, title: "Expanding $? inside double quotes", author: "quote_parser", avatar: "❝", replies: 16, views: 340, upvotes: 23, category: "Question", timestamp: "3d ago", preview: "bash -c 'echo \"$?\"' prints the exit code. My shell prints the literal string. How do I expand inside quotes?", isHot: false, isPinned: false },
    ],
  },
  {
    id: 9,
    slug: "netpractice",
    name: "NetPractice",
    description: "Learn TCP/IP networking through 10 practical exercises. Configure hosts, routers, and fix broken network topologies.",
    difficulty: "Intermediate",
    xp: 462,
    duration: "~1 week",
    teamSize: "Solo",
    tags: ["Networking", "TCP/IP", "Subnetting"],
    students: 2198,
    color: "from-cyan-400 to-cyan-600",
    posts: [
      { id: 1, title: "Level 10 is impossible — or am I dumb?", author: "subnet_pain", avatar: "🤯", replies: 43, views: 1500, upvotes: 89, category: "Help", timestamp: "2h ago", preview: "I've reset the level 7 times. The router routing table keeps rejecting my subnet. Sharing my config.", isHot: true, isPinned: false },
      { id: 2, title: "Cheat sheet: subnetting formulas I used", author: "cidr_king", avatar: "📐", replies: 61, views: 2300, upvotes: 234, category: "Resource", timestamp: "1w ago", preview: "2^n hosts, 2^(32-n) addresses, useful CIDR table. Saved me a lot of time.", isHot: false, isPinned: true },
    ],
  },
  {
    id: 10,
    slug: "cub3d",
    name: "cub3D",
    description: "Create a 3D maze game using raycasting inspired by Wolfenstein 3D. Render textured walls in real-time using only the MiniLibX graphics library.",
    difficulty: "Advanced",
    xp: 882,
    duration: "~4 weeks",
    teamSize: "2 people",
    tags: ["C", "Graphics", "Raycasting"],
    students: 1876,
    color: "from-red-400 to-red-600",
    posts: [
      { id: 1, title: "DDA vs Bresenham raycasting — which is faster?", author: "ray_caster", avatar: "📡", replies: 31, views: 870, upvotes: 76, category: "Discussion", timestamp: "5h ago", preview: "I implemented DDA and it's fast enough, but I've seen people use Bresenham. Any real perf difference?", isHot: false, isPinned: false },
      { id: 2, title: "Texture mapping — getting the correct column offset", author: "tex_map", avatar: "🗺️", replies: 19, views: 540, upvotes: 52, category: "Help", timestamp: "2d ago", preview: "My textures show but they're stretched at certain angles. I think my wallX calculation is off.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 11,
    slug: "minirt",
    name: "miniRT",
    description: "Build a raytracer from scratch. Render spheres, planes, and cylinders with ambient, diffuse lighting and hard shadows in C.",
    difficulty: "Advanced",
    xp: 882,
    duration: "~4 weeks",
    teamSize: "2 people",
    tags: ["C", "Graphics", "Raytracing", "Math"],
    students: 1543,
    color: "from-violet-400 to-violet-600",
    posts: [
      { id: 1, title: "Cylinder intersection formula — my derivation", author: "math42", avatar: "📐", replies: 27, views: 710, upvotes: 98, category: "Tutorial", timestamp: "3d ago", preview: "The cylinder was the hardest shape for me. Here's the full quadratic derivation with edge cap handling.", isHot: true, isPinned: true },
      { id: 2, title: "Shadow acne — epsilon value too small or too large?", author: "shadow_bug", avatar: "👻", replies: 14, views: 320, upvotes: 34, category: "Help", timestamp: "1d ago", preview: "My spheres have black spots on them. I know it's shadow acne but I can't find the right epsilon.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 12,
    slug: "inception",
    name: "Inception",
    description: "Orchestrate a multi-service infrastructure using Docker Compose. Set up NGINX, WordPress, and MariaDB — all from custom Dockerfiles.",
    difficulty: "Advanced",
    xp: 882,
    duration: "~3 weeks",
    teamSize: "Solo",
    tags: ["Docker", "DevOps", "Linux"],
    students: 1932,
    color: "from-sky-400 to-sky-600",
    posts: [
      { id: 1, title: "WordPress keeps restarting in a loop", author: "php_pain", avatar: "🔄", replies: 36, views: 1100, upvotes: 87, category: "Help", timestamp: "4h ago", preview: "My compose up looks fine but WordPress exits with code 1. MariaDB health check is passing. Logs inside.", isHot: true, isPinned: false },
      { id: 2, title: "TLS 1.2/1.3 config for NGINX that actually passes", author: "ssl_done", avatar: "🔒", replies: 28, views: 890, upvotes: 112, category: "Resource", timestamp: "5d ago", preview: "Sharing my nginx.conf with the exact ssl_protocols line that got full marks.", isHot: false, isPinned: true },
      { id: 3, title: "Why can't we use :latest in Dockerfiles?", author: "docker_newb", avatar: "📦", replies: 18, views: 420, upvotes: 29, category: "Discussion", timestamp: "1w ago", preview: "The subject says no latest tag but doesn't explain why. Is it just for reproducibility?", isHot: false, isPinned: false },
    ],
  },
  {
    id: 13,
    slug: "ft_irc",
    name: "ft_irc",
    description: "Build a fully functional IRC server in C++98. Handle multiple clients with poll(), channels, operators, and all required IRC commands.",
    difficulty: "Advanced",
    xp: 882,
    duration: "~4 weeks",
    teamSize: "3 people",
    tags: ["C++", "Networking", "Sockets"],
    students: 1287,
    color: "from-indigo-400 to-indigo-600",
    posts: [
      { id: 1, title: "poll() vs select() vs epoll — what do you use?", author: "io_multi", avatar: "🔀", replies: 44, views: 1400, upvotes: 156, category: "Discussion", timestamp: "6h ago", preview: "Subject says poll() but some people use select for portability. epoll is Linux-only. Which is cleanest?", isHot: true, isPinned: false },
      { id: 2, title: "Partial sends — are you handling them?", author: "send_loop", avatar: "📤", replies: 21, views: 560, upvotes: 67, category: "Tutorial", timestamp: "3d ago", preview: "send() can return less than you asked. Most solutions forget to loop. Here's the wrapper I use.", isHot: false, isPinned: false },
    ],
  },
  {
    id: 14,
    slug: "ft_transcendence",
    name: "ft_transcendence",
    description: "The final 42 project. Build a full-stack Pong web application with real-time multiplayer, tournament mode, live chat, and OAuth login.",
    difficulty: "Expert",
    xp: 7140,
    duration: "~8 weeks",
    teamSize: "3–5 people",
    tags: ["TypeScript", "NestJS", "React", "WebSocket"],
    students: 987,
    color: "from-[#0f6f6b] to-[#8EE7E3]",
    posts: [
      { id: 1, title: "Microservices vs monolith — what's easier to defend?", author: "arch_debate", avatar: "🏗️", replies: 112, views: 4500, upvotes: 389, category: "Discussion", timestamp: "1h ago", preview: "Our team split over this. Microservices look impressive but the jury might drill into your Docker setup.", isHot: true, isPinned: true },
      { id: 2, title: "WebSocket auth — JWT in cookie or header?", author: "ws_auth", avatar: "🔑", replies: 34, views: 980, upvotes: 87, category: "Question", timestamp: "8h ago", preview: "Browser WebSocket API doesn't allow custom headers. Sharing how I handle auth on the WS handshake.", isHot: false, isPinned: false },
      { id: 3, title: "Pong game loop in the browser — requestAnimationFrame pitfalls", author: "game_loop", avatar: "🎮", replies: 28, views: 760, upvotes: 64, category: "Tutorial", timestamp: "2d ago", preview: "Fixed timestep vs variable frame rate. How to sync your canvas game loop with WebSocket events from the server.", isHot: false, isPinned: false },
      { id: 4, title: "42 OAuth with NestJS Passport — working setup", author: "oauth_ninja", avatar: "🔐", replies: 51, views: 1800, upvotes: 198, category: "Resource", timestamp: "1w ago", preview: "Sharing my exact Passport strategy for 42 API OAuth that worked on first try in production.", isHot: true, isPinned: false },
    ],
  },
];
