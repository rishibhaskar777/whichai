import type {
  Alternative,
  GoalType,
  JobRecommendation,
  Plan,
} from "@/lib/schemas/plan";

/*
 * Sample plans for the plan view. Tool names are well-known examples. Every
 * price, limit, tier detail and date is a placeholder and must be replaced by
 * verified data before a plan is presented as real.
 */

const VERIFY = "[verify on official page]";
const PLAN_PRICING = `Free tier and paid plans: ₹[verify] per month. ${VERIFY}`;
const USAGE_PRICING = `Plans and usage limits: ₹[verify]. ${VERIFY}`;
const OPEN_SOURCE_PRICING = `Free and open source. Hosting costs are separate. ${VERIFY}`;

interface JobInput {
  jobName: string;
  toolName: string;
  why: string;
  tag: JobRecommendation["tag"];
  pricing?: string;
  watchOutFor: string;
  officialUrl: string;
  alternatives?: Alternative[];
}

function job(input: JobInput): JobRecommendation {
  return {
    ...input,
    pricing: input.pricing ?? PLAN_PRICING,
    sourceLabel: "sample",
    lastVerified: null,
    alternatives: input.alternatives ?? [],
  };
}

const PORTFOLIO_BRIEF = [
  "Goal: a portfolio website for [your name], [your role].",
  "Audience: [who should see it, for example hiring managers or clients].",
  "Pages: Home, Work (3 to 5 projects), About, Contact.",
  "Tone: plain, confident, no buzzwords.",
  "Must have: fast on a phone, easy to update, readable in dark mode.",
  "Budget: ₹[your limit] per month.",
  "My experience with websites: [none / some / comfortable with code].",
  "Ask me anything you need before suggesting a design.",
].join("\n");

const STUDY_BRIEF = [
  "Goal: prepare for [exam or subject] on [exam date].",
  "Time available: [hours per day] on weekdays, [hours] on weekends.",
  "Where I am now: [topics I know well] and [topics I find hard].",
  "Materials I have: [syllabus, textbook, past papers].",
  "How I learn best: [reading, practice questions, discussion].",
  "Ask me anything you need, then tell me honestly if this goal is realistic.",
].join("\n");

const HONEST_PLAN_PROMPT =
  "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.";

const portfolioWebsite: Plan = {
  id: "sample-portfolio-website",
  goalType: "portfolio-website",
  headline: "Your portfolio website plan",
  isSample: true,
  levels: {
    simple: {
      summary:
        "Start from a finished template, let an AI assistant draft your text, and publish it with a drag-and-drop host. You edit words and images; you do not write code.",
      estimatedCost: "₹[verify] to start",
      estimatedTime: "About a weekend (sample estimate)",
      jobs: [
        job({
          jobName: "AI assistant",
          toolName: "ChatGPT",
          why: "Drafts your about text and project descriptions, and tells you what a visitor needs to see first.",
          tag: "new",
          watchOutFor:
            "It will happily invent achievements. Only keep sentences that are true about you.",
          officialUrl: "https://chatgpt.com",
          alternatives: [
            {
              toolName: "Claude",
              chooseIf: "you prefer a calmer writing style",
              paidOnly: false,
            },
            {
              toolName: "Gemini",
              chooseIf: "you already live in a Google account",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "UI templates",
          toolName: "Astro themes",
          why: "A finished layout means you edit text and images instead of designing from nothing.",
          tag: "new",
          pricing: `Free and paid themes: ₹[verify]. ${VERIFY}`,
          watchOutFor:
            "Some themes need a build step. Pick one that lists a no-code or one-click setup.",
          officialUrl: "https://astro.build/themes",
          alternatives: [
            {
              toolName: "Framer templates",
              chooseIf: "you want to design visually in a browser",
              paidOnly: true,
            },
            {
              toolName: "Carrd",
              chooseIf: "you only need a single page",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Deployment",
          toolName: "Netlify",
          why: "Drag a folder in and get a public link, with no server to set up.",
          tag: "new",
          pricing: USAGE_PRICING,
          watchOutFor:
            "Free plans have bandwidth limits. Check them if you expect a lot of visitors.",
          officialUrl: "https://www.netlify.com",
          alternatives: [
            {
              toolName: "GitHub Pages",
              chooseIf: "your files already live on GitHub",
              paidOnly: false,
            },
            {
              toolName: "Cloudflare Pages",
              chooseIf: "you want a custom domain with few limits",
              paidOnly: false,
            },
          ],
        }),
      ],
      tiers: null,
      workflow: [
        {
          title: "Collect your material",
          detail:
            "Gather 3 to 5 projects with a photo, a one-line result and a link for each, plus a short bio.",
          examplePrompt: null,
        },
        {
          title: "Draft the words",
          detail:
            "Ask the assistant for a first version of your about text, then rewrite it in your own voice.",
          examplePrompt:
            "Write a short about section for my portfolio. I am a [role] who works on [type of work]. Keep it under 80 words and plain.",
        },
        {
          title: "Pick and fill a template",
          detail:
            "Choose a template with the pages you listed. Replace every placeholder before you publish.",
          examplePrompt: null,
        },
        {
          title: "Publish and test",
          detail:
            "Deploy it, then open the link on your phone and ask a friend to find your contact details.",
          examplePrompt: null,
        },
      ],
      starterBrief: PORTFOLIO_BRIEF,
      checkTheFacts: null,
      whenToUpgrade: [
        "You want custom animation or layout the template cannot do.",
        "You need your own domain name and a contact form.",
        "You keep editing the site every week.",
      ],
      commonMistakes: [
        "Showing ten projects instead of the three you are proudest of.",
        "Leaving template placeholder text in place.",
        "Publishing without checking the page on a phone.",
      ],
    },
    polished: {
      summary:
        "Build with a React framework and a ready component kit, add motion where it helps, and deploy from a Git repository so each change goes live on its own.",
      estimatedCost: "₹[verify] per month",
      estimatedTime: "About 1 to 2 weeks of evenings (sample estimate)",
      jobs: [
        job({
          jobName: "AI assistant",
          toolName: "Claude",
          why: "Explains code you do not understand and reviews your layout and copy.",
          tag: "better",
          watchOutFor:
            "Generated code can look right and still be wrong. Run it and read it before you commit it.",
          officialUrl: "https://claude.ai",
          alternatives: [
            {
              toolName: "ChatGPT",
              chooseIf: "you already use it and like its style",
              paidOnly: false,
            },
            {
              toolName: "Gemini",
              chooseIf: "you want to ask about screenshots of your design",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Framework",
          toolName: "Next.js",
          why: "Gives you pages, routing and fast loading without wiring them yourself.",
          tag: "new",
          pricing: OPEN_SOURCE_PRICING,
          watchOutFor:
            "It has a learning curve. Stay on the basics: pages, links and images.",
          officialUrl: "https://nextjs.org",
          alternatives: [
            {
              toolName: "Astro",
              chooseIf: "your site is mostly text and images",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "UI components",
          toolName: "shadcn/ui",
          why: "Accessible buttons, forms and menus you copy into your project and restyle.",
          tag: "better",
          pricing: `Free and open source. ${VERIFY}`,
          watchOutFor:
            "Left unchanged, every site built with it looks alike. Change colours, type and spacing.",
          officialUrl: "https://ui.shadcn.com",
          alternatives: [
            {
              toolName: "Radix Themes",
              chooseIf: "you want a complete look with fewer decisions",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Animation library",
          toolName: "Motion",
          why: "Adds entrance and layout animation with a small amount of code.",
          tag: "new",
          pricing: `Free core library. ${VERIFY}`,
          watchOutFor:
            "Too much movement slows the page and annoys readers. Respect reduced-motion settings.",
          officialUrl: "https://motion.dev",
          alternatives: [
            {
              toolName: "CSS transitions",
              chooseIf: "you only need simple fades and slides",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Deployment",
          toolName: "Vercel",
          why: "Publishes your repository on every push and gives each change a preview link.",
          tag: "better",
          pricing: USAGE_PRICING,
          watchOutFor:
            "Free plans can limit commercial use. Read the terms if the site earns money.",
          officialUrl: "https://vercel.com",
          alternatives: [
            {
              toolName: "Netlify",
              chooseIf:
                "you want a similar service with form handling built in",
              paidOnly: false,
            },
            {
              toolName: "Cloudflare Pages",
              chooseIf: "you want generous traffic limits",
              paidOnly: false,
            },
          ],
        }),
      ],
      tiers: {
        toolName: "Claude",
        tiers: [
          {
            name: "Free",
            forThisGoal:
              "Enough to draft copy and ask questions while you learn. Limits: [verify on official page].",
          },
          {
            name: "Pro",
            forThisGoal:
              "Useful if you hit free limits during long build sessions. Price: ₹[verify].",
          },
          {
            name: "Max",
            forThisGoal:
              "Aimed at heavy daily use. A portfolio rarely needs it. Price: ₹[verify].",
          },
        ],
        upgradeTrigger:
          "you run out of free messages in the middle of work, two weeks in a row",
      },
      workflow: [
        {
          title: "Set up the project",
          detail:
            "Create the repository, start a Next.js project and deploy the empty page first so publishing is never a surprise.",
          examplePrompt:
            "I am making a portfolio with Next.js. List the exact steps to create the project, push it to GitHub and deploy it, for a beginner.",
        },
        {
          title: "Build the layout from components",
          detail:
            "Add a header, a project grid and a footer from the component kit. Change the colours and type to match you.",
          examplePrompt: null,
        },
        {
          title: "Write the content",
          detail:
            "Keep project text in one file so changing a project never means editing layout code.",
          examplePrompt: null,
        },
        {
          title: "Add motion with restraint",
          detail:
            "Animate the first screen and project cards only. Test with reduced motion switched on.",
          examplePrompt: null,
        },
        {
          title: "Check and ship",
          detail:
            "Run Lighthouse, test on a real phone, then merge to publish.",
          examplePrompt: null,
        },
      ],
      starterBrief: PORTFOLIO_BRIEF,
      checkTheFacts: null,
      whenToUpgrade: [
        "You want to edit projects without touching code.",
        "Visitors should be able to contact you through a form.",
        "You want to know which projects people look at.",
      ],
      commonMistakes: [
        "Adding libraries before the basic pages work.",
        "Animating everything, which hurts speed and readability.",
        "Pasting generated code you have not read.",
      ],
    },
    advanced: {
      summary:
        "Add a content system so you can edit projects without code, a working contact form and privacy-friendly analytics, with an AI coding assistant helping inside your editor.",
      estimatedCost: "₹[verify] per month",
      estimatedTime: "About 3 to 4 weeks of evenings (sample estimate)",
      jobs: [
        job({
          jobName: "AI coding assistant",
          toolName: "Cursor",
          why: "Edits several files at once and explains the project as it grows.",
          tag: "better",
          watchOutFor:
            "Review every change it makes. It can quietly remove code you wanted to keep.",
          officialUrl: "https://cursor.com",
          alternatives: [
            {
              toolName: "GitHub Copilot",
              chooseIf: "you want suggestions inside your current editor",
              paidOnly: false,
            },
            {
              toolName: "Claude Code",
              chooseIf: "you are comfortable working from the terminal",
              paidOnly: true,
            },
          ],
        }),
        job({
          jobName: "Framework",
          toolName: "Next.js",
          why: "Handles pages, images and server code in one place.",
          tag: "keep",
          pricing: OPEN_SOURCE_PRICING,
          watchOutFor:
            "Major versions change defaults. Read the upgrade notes before updating.",
          officialUrl: "https://nextjs.org",
        }),
        job({
          jobName: "UI components",
          toolName: "shadcn/ui",
          why: "Keeps interface parts accessible and consistent as the site grows.",
          tag: "keep",
          pricing: `Free and open source. ${VERIFY}`,
          watchOutFor:
            "Components are copied into your project, so updates are manual.",
          officialUrl: "https://ui.shadcn.com",
        }),
        job({
          jobName: "Animation library",
          toolName: "GSAP",
          why: "Fine control over timelines and scroll-driven effects.",
          tag: "better",
          pricing: `Licence terms and price: ₹[verify]. ${VERIFY}`,
          watchOutFor:
            "Check the licence for your use. Heavy scroll effects can hurt phones.",
          officialUrl: "https://gsap.com",
          alternatives: [
            {
              toolName: "Motion",
              chooseIf: "you want a lighter option that fits React",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Content management",
          toolName: "Sanity",
          why: "Lets you edit projects and text in a form, not in code.",
          tag: "new",
          pricing: USAGE_PRICING,
          watchOutFor:
            "It adds a second system to learn. Start with two content types: project and page.",
          officialUrl: "https://www.sanity.io",
          alternatives: [
            {
              toolName: "Markdown files in your repository",
              chooseIf: "you are happy to edit text files",
              paidOnly: false,
            },
            {
              toolName: "Contentful",
              chooseIf: "a team will edit the content",
              paidOnly: true,
            },
          ],
        }),
        job({
          jobName: "Contact form",
          toolName: "Formspree",
          why: "Receives messages from your form without running your own server.",
          tag: "new",
          pricing: USAGE_PRICING,
          watchOutFor:
            "Add spam protection and tell visitors what happens to their message.",
          officialUrl: "https://formspree.io",
          alternatives: [
            {
              toolName: "Netlify Forms",
              chooseIf: "you already host on Netlify",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Analytics",
          toolName: "Plausible",
          why: "Shows which pages people read, without tracking individuals.",
          tag: "new",
          pricing: USAGE_PRICING,
          watchOutFor:
            "Numbers from a small site are noisy. Do not redesign around a handful of visits.",
          officialUrl: "https://plausible.io",
          alternatives: [
            {
              toolName: "Umami",
              chooseIf: "you want to host analytics yourself",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Deployment",
          toolName: "Vercel",
          why: "Previews every change and publishes on merge.",
          tag: "keep",
          pricing: USAGE_PRICING,
          watchOutFor:
            "Usage-based limits apply to forms, images and bandwidth. Watch the dashboard.",
          officialUrl: "https://vercel.com",
        }),
      ],
      tiers: {
        toolName: "Vercel",
        tiers: [
          {
            name: "Hobby",
            forThisGoal:
              "Fits a personal portfolio with modest traffic. Limits: [verify on official page].",
          },
          {
            name: "Pro",
            forThisGoal:
              "Worth a look if the site earns money or needs team access. Price: ₹[verify].",
          },
          {
            name: "Enterprise",
            forThisGoal:
              "Built for companies. Not needed for a personal portfolio.",
          },
        ],
        upgradeTrigger:
          "the site brings in client work and the free plan's terms or limits no longer fit",
      },
      workflow: [
        {
          title: "Model your content",
          detail:
            "Define a project type and a page type in the content system before you build screens for them.",
          examplePrompt:
            "Suggest a content model for a designer's portfolio with projects, a bio and contact details. List each field and why it is needed.",
        },
        {
          title: "Connect the content to pages",
          detail:
            "Fetch projects at build time so pages stay fast, and show a clear message when content is missing.",
          examplePrompt: null,
        },
        {
          title: "Add the contact form",
          detail:
            "Validate the fields, add spam protection and show a confirmation that says what happens next.",
          examplePrompt: null,
        },
        {
          title: "Measure and tune",
          detail:
            "Add analytics, then check page speed and accessibility before you share the link.",
          examplePrompt: null,
        },
      ],
      starterBrief: PORTFOLIO_BRIEF,
      checkTheFacts: null,
      whenToUpgrade: [
        "Several people need to edit the site.",
        "You need paid features on the content or hosting plan.",
        "Your traffic or form volume passes the free limits.",
      ],
      commonMistakes: [
        "Building a content system for three projects that never change.",
        "Collecting analytics without telling visitors.",
        "Skipping accessibility checks on custom animation.",
      ],
    },
  },
};

const studyPlan: Plan = {
  id: "sample-study-plan",
  goalType: "study-plan",
  headline: "Your 60-day study plan",
  isSample: true,
  levels: {
    simple: {
      summary:
        "Use an AI assistant to turn your syllabus into a day-by-day plan, keep notes in one place, and test yourself every week with a quiz tool.",
      estimatedCost: "₹[verify] to start",
      estimatedTime: "About 30 minutes to set up (sample estimate)",
      jobs: [
        job({
          jobName: "AI assistant for planning",
          toolName: "ChatGPT",
          why: "Turns your syllabus, exam date and free hours into a day-by-day plan you can adjust.",
          tag: "new",
          watchOutFor:
            "Assistants tend to agree with you and will call almost any plan achievable. Ask for honest pushback and the biggest risks.",
          officialUrl: "https://chatgpt.com",
          alternatives: [
            {
              toolName: "Gemini",
              chooseIf: "you want it to read your Google Docs or Calendar",
              paidOnly: false,
            },
            {
              toolName: "Claude",
              chooseIf: "you want longer, more careful explanations",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Note-taking",
          toolName: "Notion",
          why: "One place for notes, the plan and a daily checklist.",
          tag: "new",
          watchOutFor:
            "Setting up a perfect system can become a way to avoid studying. Keep it to one page per subject.",
          officialUrl: "https://www.notion.com",
          alternatives: [
            {
              toolName: "Google Keep",
              chooseIf: "you only need quick notes and checklists",
              paidOnly: false,
            },
            {
              toolName: "OneNote",
              chooseIf: "you like handwriting on a tablet",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Practice and quizzes",
          toolName: "Quizlet",
          why: "Flashcards and self-tests make you recall answers instead of rereading them.",
          tag: "new",
          watchOutFor:
            "Cards made by other people can contain mistakes. Check them against your syllabus.",
          officialUrl: "https://quizlet.com",
          alternatives: [
            {
              toolName: "Anki",
              chooseIf: "you want spaced repetition with no limits",
              paidOnly: false,
            },
          ],
        }),
      ],
      tiers: null,
      workflow: [
        {
          title: "Write down the facts",
          detail:
            "Note the exam date, the topics on the syllabus and how many hours you can really study each day.",
          examplePrompt: null,
        },
        {
          title: "Ask for a plan, with pushback",
          detail:
            "Paste your facts and ask for a plan. Make the assistant say if it will not work.",
          examplePrompt: HONEST_PLAN_PROMPT,
        },
        {
          title: "Move the plan into your notes",
          detail:
            "Copy the plan into a checklist you will see every day. Add a rest day each week.",
          examplePrompt: null,
        },
        {
          title: "Test yourself every week",
          detail:
            "Turn each week's topics into 20 quiz questions and answer them without looking.",
          examplePrompt: null,
        },
      ],
      starterBrief: STUDY_BRIEF,
      checkTheFacts:
        "AI assistants can state wrong facts, dates and formulas with confidence. Check anything you will be examined on against your textbook or syllabus.",
      whenToUpgrade: [
        "The plan falls behind two weeks in a row.",
        "You want to quiz yourself on your own notes.",
        "Free limits stop you from finishing a session.",
      ],
      commonMistakes: [
        "Planning every hour of the day with no slack.",
        "Rereading notes instead of testing yourself.",
        "Trusting a plan without checking it against the syllabus.",
      ],
    },
    polished: {
      summary:
        "Keep notes as linked files you own, schedule reviews with spaced repetition, and use the assistant to critique your plan and explain what you get wrong.",
      estimatedCost: "₹[verify] per month",
      estimatedTime: "About 2 hours to set up (sample estimate)",
      jobs: [
        job({
          jobName: "AI assistant for planning",
          toolName: "Claude",
          why: "Builds the plan, then reviews it each week against what you actually finished.",
          tag: "better",
          watchOutFor:
            "Assistants agree too easily. Ask it to argue against your plan, and treat its praise as weak evidence.",
          officialUrl: "https://claude.ai",
          alternatives: [
            {
              toolName: "ChatGPT",
              chooseIf: "you already use it and it works for you",
              paidOnly: false,
            },
            {
              toolName: "Gemini",
              chooseIf: "your notes and calendar are in Google",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Note-taking",
          toolName: "Obsidian",
          why: "Notes are plain files on your device, linked by topic, that you keep even if the app changes.",
          tag: "better",
          pricing: `Free for personal use; add-ons are extra. ${VERIFY}`,
          watchOutFor:
            "Plugins are tempting. Use none for the first two weeks.",
          officialUrl: "https://obsidian.md",
          alternatives: [
            {
              toolName: "Notion",
              chooseIf: "you want notes and a plan in one tool",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Practice and quizzes",
          toolName: "Anki",
          why: "Spaced repetition shows each card just before you would forget it.",
          tag: "better",
          pricing: `Prices differ by device. ${VERIFY}`,
          watchOutFor:
            "Missing reviews creates a backlog. Cap new cards per day.",
          officialUrl: "https://apps.ankiweb.net",
          alternatives: [
            {
              toolName: "Quizlet",
              chooseIf: "you want ready-made sets to start from",
              paidOnly: false,
            },
          ],
        }),
      ],
      tiers: {
        toolName: "Claude",
        tiers: [
          {
            name: "Free",
            forThisGoal:
              "Enough for building the plan and a weekly review. Limits: [verify on official page].",
          },
          {
            name: "Pro",
            forThisGoal:
              "Helps if you study with it daily and hit the free limits. Price: ₹[verify].",
          },
          {
            name: "Max",
            forThisGoal:
              "Built for very heavy use. A study plan rarely needs it. Price: ₹[verify].",
          },
        ],
        upgradeTrigger:
          "you reach the free limit before your daily session is finished",
      },
      workflow: [
        {
          title: "Set up your notes",
          detail:
            "Create one note per topic and link each to the syllabus line it covers.",
          examplePrompt: null,
        },
        {
          title: "Ask for a plan, with pushback",
          detail:
            "Share your syllabus and hours. Ask the assistant to challenge the plan, not only to write it.",
          examplePrompt: HONEST_PLAN_PROMPT,
        },
        {
          title: "Make cards from your notes",
          detail:
            "Write questions in your own words. Cards you wrote yourself are remembered better.",
          examplePrompt: null,
        },
        {
          title: "Review weekly",
          detail:
            "Each Sunday, compare what you planned with what you did, and ask the assistant to adjust the next week.",
          examplePrompt:
            "Here is what I planned this week and what I finished: [paste]. Where am I behind, and what should I cut or move next week?",
        },
      ],
      starterBrief: STUDY_BRIEF,
      checkTheFacts:
        "Check formulas, dates and definitions the assistant gives you against your textbook before they go onto a card.",
      whenToUpgrade: [
        "You want to ask questions about your own PDFs and notes.",
        "Your card backlog grows faster than you clear it.",
        "You are studying several subjects at once.",
      ],
      commonMistakes: [
        "Making cards for everything instead of what is examined.",
        "Letting the assistant write the cards, so you never practise recall.",
        "Skipping the weekly review.",
      ],
    },
    advanced: {
      summary:
        "Add a tool that answers questions from your own sources, track weak topics from your quiz results, and re-plan every week from data instead of feel.",
      estimatedCost: "₹[verify] per month",
      estimatedTime: "About half a day to set up (sample estimate)",
      jobs: [
        job({
          jobName: "AI assistant for planning",
          toolName: "Claude",
          why: "Re-plans each week from your results and points out topics you keep missing.",
          tag: "keep",
          watchOutFor:
            "Assistants lean towards agreeing with you. Ask for the three biggest risks every time you re-plan.",
          officialUrl: "https://claude.ai",
          alternatives: [
            {
              toolName: "ChatGPT",
              chooseIf: "you prefer its voice mode for oral practice",
              paidOnly: false,
            },
          ],
        }),
        job({
          jobName: "Questions on your own sources",
          toolName: "NotebookLM",
          why: "Answers questions using only the notes and PDFs you upload, and shows where each answer came from.",
          tag: "new",
          watchOutFor:
            "It can only be as right as your sources. Open the cited passage before you rely on an answer.",
          officialUrl: "https://notebooklm.google.com",
          alternatives: [
            {
              toolName: "Claude Projects",
              chooseIf:
                "you want to keep the planning chat and sources together",
              paidOnly: true,
            },
          ],
        }),
        job({
          jobName: "Note-taking",
          toolName: "Obsidian",
          why: "Linked notes make gaps between topics visible.",
          tag: "keep",
          pricing: `Free for personal use; add-ons are extra. ${VERIFY}`,
          watchOutFor:
            "A large vault needs tidy names. Decide on a naming rule now.",
          officialUrl: "https://obsidian.md",
        }),
        job({
          jobName: "Practice and quizzes",
          toolName: "Anki",
          why: "Review history shows which cards you fail, so you can spend time on them.",
          tag: "keep",
          pricing: `Prices differ by device. ${VERIFY}`,
          watchOutFor:
            "Do not chase a streak. Consistent short reviews beat long, irregular ones.",
          officialUrl: "https://apps.ankiweb.net",
        }),
      ],
      tiers: {
        toolName: "Claude",
        tiers: [
          {
            name: "Free",
            forThisGoal:
              "Fine for weekly re-planning. Limits: [verify on official page].",
          },
          {
            name: "Pro",
            forThisGoal:
              "Worth considering if you work with long documents most days. Price: ₹[verify].",
          },
          {
            name: "Max",
            forThisGoal:
              "Only for people who use an assistant for hours every day. Price: ₹[verify].",
          },
        ],
        upgradeTrigger:
          "you regularly work with long documents and the free limits stop you",
      },
      workflow: [
        {
          title: "Load your sources",
          detail:
            "Upload the syllabus, lecture notes and past papers into the source-based tool.",
          examplePrompt: null,
        },
        {
          title: "Ask for a plan, with pushback",
          detail:
            "Give the assistant your sources and hours, and ask it to find weak points in its own plan.",
          examplePrompt: HONEST_PLAN_PROMPT,
        },
        {
          title: "Quiz from the sources",
          detail:
            "Ask for questions at exam level, answer them first, then check the cited passages.",
          examplePrompt:
            "Using only my uploaded notes, ask me 10 exam-style questions on [topic]. Do not show answers until I reply.",
        },
        {
          title: "Track weak topics",
          detail:
            "List the topics you miss most. Give them extra time in next week's plan.",
          examplePrompt: null,
        },
      ],
      starterBrief: STUDY_BRIEF,
      checkTheFacts:
        "Answers from source-based tools still need checking. Open the cited passage and confirm it says what the answer claims.",
      whenToUpgrade: [
        "You need to study from sources that are too large for free limits.",
        "You are preparing for several exams at once.",
        "You want a tutor or study group, which tools cannot replace.",
      ],
      commonMistakes: [
        "Spending more time tuning the system than studying.",
        "Accepting answers without opening the cited source.",
        "Ignoring weak topics because they feel uncomfortable.",
      ],
    },
  },
};

export const samplePlans: readonly Plan[] = [portfolioWebsite, studyPlan];

export function getSamplePlan(goalType: GoalType): Plan {
  const plan = samplePlans.find((candidate) => candidate.goalType === goalType);
  if (!plan) throw new Error(`No sample plan for ${goalType}`);
  return plan;
}
