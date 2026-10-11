import type { GoalId } from "@/lib/schemas/catalogue";

/*
 * Realistic goal sentences, in English, Hinglish and with typos, each with the
 * goal it should lead to. `parts` lists jobs the plan must also include, and
 * `none` marks sentences that no plan should be made for.
 *
 * Written to cover how people actually type: short forms ("ppt", "clg",
 * "yt"), Hindi words in Latin letters, and half sentences. The corpus checks
 * the interpreter and is not a list of keywords: change a keyword and run
 * `npm run goals:report` to see what moved.
 */
export interface CorpusCase {
  text: string;
  goal?: GoalId;
  /** Jobs that must be among the parts the sentence asks for. */
  parts?: readonly string[];
  /** True when the sentence should not be understood at all. */
  none?: true;
}

const goal = (id: GoalId, texts: readonly string[]): CorpusCase[] =>
  texts.map((text) => ({ text, goal: id }));

export const GOAL_CORPUS: readonly CorpusCase[] = [
  ...goal("portfolio-website", [
    "I want to build a portfolio website to show my projects",
    "make a personal website for my design work",
    "portfolio banana hai for my clg placements",
    "need a website to showcase my photography",
    "personal site with dark mode and a contact form",
    "mujhe apna portfolio website chahiye",
    "portfolo websit for developer",
  ]),
  ...goal("study-plan", [
    "make a study timetable for my semester",
    "how to study for 6 subjects in 3 months",
    "I want to learn organic chemistry from scratch",
    "padhai ka plan banao for next month",
    "plan my revision for the syllabus",
    "daily study routine for class 12",
  ]),
  ...goal("resume-and-job-search", [
    "improve my resume for a software job",
    "write a cover letter for an internship at a startup",
    "resume banao for fresher",
    "naukri dhundna hai help me apply for jobs",
    "update my cv and linkedin profile",
    "help me find a job after college",
    "need an ats friendly resumee",
  ]),
  ...goal("make-a-video", [
    "make a short video for my business",
    "I want to create an explainer video for my product",
    "reel banana hai for instagram",
    "make a promo video with voiceover and thumbnail",
    "yt video script and shooting plan",
    "make a vedio from my images",
  ]),
  ...goal("build-an-app", [
    "build a todo app with login",
    "I need a web app for my side project",
    "app banana hai for my clg project with database",
    "make a simple app without much coding",
    "create an app idea mvp",
    "I want to make an app that tracks expenses",
  ]),
  ...goal("research-and-reading", [
    "research ancient indian history",
    "I want to read the Mahabharata and understand it",
    "find primary sources about the Mughal period",
    "stories from the Panchatantra for kids",
    "reading list on mythology",
    "reserach on indian epics",
  ]),
  ...goal("business-website", [
    "website for my restaurant",
    "I need a company website for my small business",
    "clinic ka website banana hai",
    "salon website with booking form",
    "build a website for my coaching centre",
    "buisness website for my agency",
  ]),
  ...goal("presentation", [
    "make a ppt for my college seminar",
    "pitch deck for investors",
    "presentation banao for class project",
    "slides for my project demo",
    "need a powerpoint on climate change",
    "ppt for clg tomorrow",
    "presentaton on my internship",
  ]),
  ...goal("pick-an-ai", [
    "which ai should I use for my homework",
    "best ai tool for students",
    "konsa ai use karu for writing",
    "recommend an ai to help me choose tools",
    "which ai is best to summarise a pdf",
  ]),
  ...goal("mobile-app", [
    "I want to build an android app",
    "make a mobile app for my college",
    "iphone app idea, how do I start",
    "app for play store using flutter",
    "mobile app banana hai",
    "react native app for my startup",
  ]),
  ...goal("ecommerce-store", [
    "start an online store to sell my products",
    "I want to sell handmade jewellery online",
    "shopify store setup for my brand",
    "online dukaan banani hai",
    "ecommerce website with upi payments",
    "sell my clothes on instagram and a website",
  ]),
  ...goal("blog", [
    "start a blog about travel",
    "I want to write a blog regularly",
    "blog banana hai on technology",
    "wordpress blog for my articles",
    "how to start blogging and earn",
  ]),
  ...goal("landing-page", [
    "need a landing page for my product launch",
    "one page website to collect emails",
    "coming soon page for my startup",
    "landing page banana hai for my event",
    "waitlist page for my app",
  ]),
  ...goal("saas-app", [
    "I want to build a saas product",
    "micro saas idea with subscriptions",
    "startup idea for software people pay monthly for",
    "launch my saas mvp",
    "software as a service for small teams",
  ]),
  ...goal("website-chatbot", [
    "add a chatbot to my website to answer customer questions",
    "whatsapp bot for my shop",
    "customer support chatbot for my business",
    "faq bot for my website",
    "chatbot banana hai for my site",
  ]),
  ...goal("build-browser-extension", [
    "build a chrome extension",
    "chrome extension banana hai",
    "I want to make a firefox addon",
    "extension for my browser that blocks ads",
  ]),
  ...goal("game", [
    "make a simple 2d game",
    "I want to build a game in unity",
    "game banana hai for clg project",
    "browser game with javascript",
    "puzzle game for my phone",
  ]),
  ...goal("data-dashboard", [
    "build a sales dashboard from my csv",
    "kpi dashboard for my team in power bi",
    "show my data in charts on a dashboard",
    "dashboard banana hai",
    "streamlit dashboard for my analytics",
  ]),
  ...goal("task-automation", [
    "automate repetitive tasks at work",
    "connect my apps with zapier",
    "automatic reports every week",
    "same task every day, automate it",
    "boring copy paste work ko automate karna hai",
  ]),
  ...goal("youtube-channel", [
    "start a youtube channel",
    "I want to become a youtuber",
    "yt channel banana hai on cooking",
    "how to grow my youtube channel",
    "youtub chanel for gaming",
  ]),
  ...goal("podcast", [
    "start a podcast",
    "record a podcast episode and publish on spotify",
    "podcast banana hai",
    "I want to host an interview show",
  ]),
  ...goal("social-media-content", [
    "plan content for instagram and linkedin",
    "content calendar for social media",
    "reels ideas for my page",
    "grow my instagram page",
    "daily posts for my brand on social media",
  ]),
  ...goal("logo-and-branding", [
    "I need a logo for my startup",
    "design brand colours and fonts",
    "logo banana hai",
    "branding for my bakery",
    "visiting card and logo for my business",
  ]),
  ...goal("ui-design", [
    "design the screens of my app in figma",
    "ui ux design for my project",
    "make wireframes and a prototype",
    "ui banana hai for my website in figma",
    "clickable prototype for an app",
  ]),
  ...goal("research-paper", [
    "write a research paper with citations",
    "review paper for my journal",
    "paper likhna hai in ieee format",
    "literature review for my paper",
    "conference paper on machine learning",
  ]),
  ...goal("thesis", [
    "help me write my thesis",
    "final year project report",
    "synopsis banana hai",
    "dissertation chapters plan",
    "mtech thesis writing",
  ]),
  ...goal("essay-writing", [
    "write an essay on climate change",
    "assignment likhna hai for my class",
    "help me improve my essay",
    "essay for college application",
    "short essay on my favourite book",
  ]),
  ...goal("exam-preparation", [
    "prepare for my exams in two months",
    "jee preparation plan",
    "exam ki tayyari kaise karein",
    "last minute revision for board exams",
    "upsc preparation roadmap",
    "mock test and pyq practice",
  ]),
  ...goal("learn-to-code", [
    "I want to learn python from scratch",
    "coding seekhna hai",
    "how do I become a developer",
    "learn web development",
    "programming for beginners",
  ]),
  ...goal("language-learning", [
    "I want to learn spanish",
    "improve my spoken english",
    "english speaking practice",
    "prepare for ielts",
    "learn german in six months",
  ]),
  ...goal("interview-preparation", [
    "prepare for my job interview next week",
    "mock interview practice",
    "interview ki tayyari",
    "common hr interview questions",
    "campus placement interview tips",
  ]),
  ...goal("freelancing-setup", [
    "start freelancing and find clients",
    "freelancing shuru karna hai",
    "how to get my first freelance client",
    "set up my upwork profile",
    "work as a freelancer from home",
  ]),
  ...goal("small-business-marketing", [
    "market my small business",
    "how to get more customers for my shop",
    "business promotion ideas",
    "digital marketing plan for my cafe",
    "advertising for my local business",
  ]),
  ...goal("email-newsletter", [
    "start a newsletter",
    "weekly email to my subscribers",
    "substack newsletter for my niche",
    "build an email list",
  ]),
  ...goal("translate-documents", [
    "translate my documents from english to hindi",
    "translate pdf in marathi",
    "hindi me translate karna hai",
    "need a translation of my certificate",
    "translator for my project report",
  ]),
  ...goal("summarise-pdfs", [
    "summarise this long pdf",
    "chat with pdf and ask questions",
    "pdf ka summary chahiye",
    "summarize a book chapter",
    "ask questions from my textbook pdf",
  ]),
  ...goal("meeting-notes", [
    "take notes in my meetings and list action items",
    "transcribe my lecture recording",
    "meeting minutes banana",
    "summary of zoom call",
    "record and transcribe interviews",
  ]),
  ...goal("personal-productivity", [
    "I want to be more productive",
    "organise my work and tasks",
    "daily planner and habit tracker",
    "time management help",
    "plan my day better",
  ]),
  ...goal("music-creation", [
    "make a song",
    "background music for my video",
    "lyrics likhna hai",
    "create lofi beats",
    "compose a jingle for my shop",
  ]),
  ...goal("edit-a-video", [
    "edit my video footage",
    "add subtitles to my video",
    "video edit karna hai",
    "edit reels with capcut",
    "cut and merge clips in my vlog",
  ]),
  ...goal("edit-images", [
    "remove background from my photos",
    "edit photo and resize it",
    "photo edit karna hai",
    "restore an old photo",
    "make passport size photo",
  ]),
  ...goal("3d-models", [
    "create a 3d model in blender",
    "3d model for printing",
    "3d banana hai",
    "3d logo animation",
  ]),
  ...goal("spreadsheet-analysis", [
    "analyse my sales data in excel",
    "excel formula for my sheet",
    "data cleaning in google sheets",
    "pivot table help",
    "excel me report banana hai",
  ]),
  ...goal("ai-agent", [
    "build an ai agent",
    "agent banana hai that uses tools",
    "rag chatbot over my documents",
    "llm app with tool calling",
  ]),
  ...goal("local-private-ai", [
    "run ai on my own laptop offline",
    "private ai for confidential files",
    "install ollama",
    "local llm setup",
    "ai without sending data to the cloud",
  ]),

  // A goal plus parts the goal does not provide on its own.
  {
    text: "build an app with stripe payments",
    goal: "build-an-app",
    parts: ["payments-global"],
  },
  {
    text: "portfolio website with a chatbot",
    goal: "portfolio-website",
    parts: ["chatbot-builder"],
  },
  {
    text: "business website with whatsapp chatbot and seo",
    goal: "business-website",
    parts: ["chatbot-builder", "seo"],
  },
  {
    text: "landing page with stripe checkout",
    goal: "landing-page",
    parts: ["payments-global"],
  },
  {
    text: "make slides with voiceover and background music",
    goal: "presentation",
    parts: ["voice-and-audio", "music-generation"],
  },
  {
    text: "youtube channel with thumbnails and seo",
    goal: "youtube-channel",
    parts: ["seo"],
  },
  {
    text: "study plan with flashcards and an anki deck",
    goal: "study-plan",
    parts: ["flashcards-and-quizzes"],
  },
  {
    text: "blog with a newsletter signup form",
    goal: "blog",
    parts: ["contact-form"],
  },
  {
    text: "transcribe my audio and translate it",
    goal: "meeting-notes",
    parts: ["translation"],
  },
  {
    text: "generate images and edit video with captions",
    goal: "edit-a-video",
    parts: ["image-generation"],
  },
  {
    text: "summarise pdf and make flashcards",
    goal: "summarise-pdfs",
    parts: ["flashcards-and-quizzes"],
  },
  {
    text: "need excel formulas and charts",
    goal: "spreadsheet-analysis",
    parts: ["data-analysis"],
  },
  {
    text: "send follow up emails and schedule posts",
    goal: "social-media-content",
    parts: ["email-writing"],
  },

  // No goal fits, so the jobs named in the sentence make the plan.
  {
    text: "razorpay payments with login and a database",
    parts: ["payments-india", "authentication", "database"],
  },
  {
    text: "razorpay and supabase with google login",
    parts: ["payments-india", "database", "authentication"],
  },
  { text: "need hosting and a custom domain", parts: ["hosting"] },
  { text: "fix a bug in my python script", parts: ["coding-assistant"] },
  { text: "design a poster for the college fest", parts: ["design-tool"] },
  {
    text: "voiceover and noise removal for my recordings",
    parts: ["voice-and-audio"],
  },
  { text: "mermaid flowchart and a whiteboard", parts: ["diagramming"] },

  // Nothing here is a goal for a plan.
  { text: "the weather in Delhi today", none: true },
  { text: "what is the capital of France", none: true },
  { text: "tell me a joke", none: true },
  { text: "who won the cricket match yesterday", none: true },
  { text: "I am feeling sad today", none: true },
  { text: "hello", none: true },
];

/*
 * A second set, written after the first one was tuned against and not used to
 * choose keywords at the time it was written. It shows how the interpreter
 * does on sentences it was not shaped by.
 */
export const HELD_OUT_CORPUS: readonly CorpusCase[] = [
  {
    text: "make me a portfolio site for my UI design projects",
    goal: "portfolio-website",
  },
  {
    text: "I have an interview tomorrow at TCS, help me practise",
    goal: "interview-preparation",
  },
  {
    text: "help me draft an email newsletter for my college club",
    goal: "email-newsletter",
  },
  { text: "build an iOS app for tracking my workouts", goal: "mobile-app" },
  {
    text: "I want to open an online shop for my pickles",
    goal: "ecommerce-store",
  },
  {
    text: "need to prepare a ppt on renewable energy for tomorrow's class",
    goal: "presentation",
  },
  {
    text: "yaar mujhe ek resume banana hai fresher ke liye",
    goal: "resume-and-job-search",
  },
  { text: "I would like to write a blog on personal finance", goal: "blog" },
  {
    text: "can you help me plan my GATE exam preparation",
    goal: "exam-preparation",
  },
  {
    text: "help me write my final year project report in latex",
    goal: "thesis",
  },
  {
    text: "design a mobile app UI for a food delivery startup",
    goal: "ui-design",
  },
  {
    text: "translate my resume from English to German",
    goal: "translate-documents",
  },
  {
    text: "summarise my class notes pdf into key points",
    goal: "summarise-pdfs",
  },
  { text: "make a 3d printable phone stand", goal: "3d-models" },
  { text: "I need a landing page for my yoga classes", goal: "landing-page" },
  {
    text: "chatbot to answer questions on my college website",
    goal: "website-chatbot",
  },
  { text: "learn javascript in 30 days", goal: "learn-to-code" },
  { text: "make a quiz game for kids", goal: "game" },
  { text: "how can I make my study schedule better", goal: "study-plan" },
  { text: "record my zoom classes and get notes", goal: "meeting-notes" },
  {
    text: "set up a freelance profile as a video editor",
    goal: "freelancing-setup",
  },
  { text: "turn my excel sheet into a nice dashboard", goal: "data-dashboard" },
  {
    text: "automate sending invoices to clients every month",
    goal: "task-automation",
  },
  { text: "ai tool to remove object from photo", goal: "edit-images" },
  { text: "write a song about my college days", goal: "music-creation" },
  {
    text: "I want a self hosted chatgpt alternative for my company",
    goal: "local-private-ai",
  },
  {
    text: "give me ideas for instagram reels for my gym",
    goal: "social-media-content",
  },
  { text: "create an agent that books meetings for me", goal: "ai-agent" },
  {
    text: "research paper on blockchain, need references",
    goal: "research-paper",
  },
  {
    text: "need to write a 1000 word essay on social media",
    goal: "essay-writing",
  },
  {
    text: "how to get customers for my tuition classes",
    goal: "small-business-marketing",
  },
  { text: "learn french basics for a trip", goal: "language-learning" },
  {
    text: "make a browser extension to highlight text",
    goal: "build-browser-extension",
  },
  {
    text: "create a podcast intro and publish my first episode",
    goal: "podcast",
  },
  { text: "make a logo and colours for my cafe", goal: "logo-and-branding" },
  {
    text: "I want to build a saas for freelancers to send invoices",
    goal: "saas-app",
  },
  { text: "make my photo background white", goal: "edit-images" },
  {
    text: "need a corporate website for my manufacturing company",
    goal: "business-website",
  },
  { text: "edit my wedding video and add songs", goal: "edit-a-video" },
  {
    text: "organise my daily tasks and deadlines",
    goal: "personal-productivity",
  },
  {
    text: "stories from the Ramayana for my kids",
    goal: "research-and-reading",
  },
  { text: "which ai can write code for me", goal: "pick-an-ai" },
  {
    text: "need stripe and paypal for global payments",
    parts: ["payments-global"],
  },
  { text: "host my site on vercel with a custom domain", parts: ["hosting"] },
  {
    text: "blog with razorpay donations",
    goal: "blog",
    parts: ["payments-india"],
  },
  { text: "weather forecast for next week", none: true },
  { text: "good morning", none: true },
  { text: "how many calories in a banana", none: true },
];
