/**
 * English is the source of truth. `hi.ts` must define every key here, and the
 * compiler reports any that are missing. Placeholders look like {name}; keys
 * ending in .one and .other are plural forms picked with `tn`.
 */
export const en = {
  // Shell and navigation
  "shell.skipToMain": "Skip to main content",
  "shell.openMenu": "Open menu",
  "shell.closeMenu": "Close menu",
  "shell.mainMenu": "Main menu",
  "sidebar.collapse": "Collapse sidebar",
  "sidebar.expand": "Expand sidebar",
  "nav.primary": "Primary",
  "nav.newPlan": "New plan",
  "nav.home": "Home",
  "nav.projects": "Projects",
  "nav.searches": "Searches",
  "nav.toolLibrary": "Tool Library",
  "nav.whatChanged": "What Changed",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "theme.label": "Theme",
  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",

  // News panel
  "news.title": "AI news",
  "news.collapse": "Collapse AI news",
  "news.expand": "Expand AI news",
  "news.sourceNote":
    "Headlines from official sources, updated about every 30 minutes",
  "news.updated": "Last updated {time}",
  "news.unavailable": "News is temporarily unavailable",
  "news.lastSuccess": "Last successful update: {time}",
  "news.neverUpdated": "No update has succeeded yet.",
  "news.empty": "No recent headlines from official sources yet.",
  "news.new": "New",
  "news.affects": "Affects your plans",
  "news.opensInNewTab": "(opens in a new tab)",
  "news.seeAll": "See all updates",
  "news.tag.new-model": "New model",
  "news.tag.new-tool": "New tool",
  "news.tag.feature-update": "Feature update",
  "news.tag.pricing": "Pricing or plan",
  "news.tag.policy": "Policy",
  "news.tag.research": "Research",
  "news.tag.other": "Other",
  "news.justNow": "just now",

  // What Changed
  "whatChanged.lede":
    "Announcements, release notes and changelogs from the official sites of the tools in the catalogue. Headlines stay in their original language and each one links to the source.",
  "whatChanged.filters.label": "Filter updates",
  "whatChanged.filters.search": "Search headlines",
  "whatChanged.filters.searchPlaceholder": "A tool, a company or a word",
  "whatChanged.filters.tag": "Type",
  "whatChanged.filters.source": "Source",
  "whatChanged.filters.any": "Any",
  "whatChanged.filters.apply": "Apply filters",
  "whatChanged.filters.clear": "Clear filters",
  "whatChanged.count.one": "{count} update",
  "whatChanged.count.other": "{count} updates",
  "whatChanged.countFiltered.one": "{count} update matches, of {total}",
  "whatChanged.countFiltered.other": "{count} updates match, of {total}",
  "whatChanged.empty.title": "No updates match",
  "whatChanged.empty.text":
    "Try fewer filters or a shorter search. Only the last 60 days are kept.",
  "whatChanged.pagination": "Pages",
  "whatChanged.previous": "Previous",
  "whatChanged.next": "Next",
  "whatChanged.page": "Page {page} of {pages}",
  "whatChanged.sources":
    "{count} official sources. Items older than 60 days are left out.",
  "whatChanged.relatedTools": "Related tools",
  "tool.recentNews": "Recent news",
  "tool.recentNewsAll": "All updates",

  // Home
  "home.greeting": "What do you want to do with AI?",
  "home.lead":
    "Describe your goal. WhichAI suggests which AI tools to use and how to use them, at three levels: Simple, Polished and Advanced.",
  "home.announce.understanding":
    "Goal understood. Check the details and confirm.",
  "home.announce.noMatch": "No plan for this goal yet. Pick a goal we cover.",
  "home.announce.plan": "Plan ready",
  "home.editGoal": "Edit your goal",
  "home.yourGoal": "Your goal: ",
  "home.englishOnly": "Goals are understood in English for now.",

  // Goal form
  "goal.submit": "Get a plan",
  "goal.compactPlaceholder": "Describe another goal",
  "goal.suggestions": "Suggestions",
  "goal.errorEmpty": "Describe what you want to do first.",
  "goal.errorTooLong": "Keep it under {max} characters.",
  "goal.errorGeneric": "Check what you typed.",
  "suggest.study": "Study plan",
  "suggest.portfolio": "Portfolio website",
  "suggest.reading": "Reading and stories",
  "suggest.resume": "Resume help",
  "suggest.video": "Make a video",
  "suggest.app": "Build an app",

  // Understanding card
  "understanding.title": "Here's what we understood",
  "understanding.chips": "What we understood",
  "understanding.addLabel": "Add something we missed",
  "understanding.remove": "Remove {label}",
  "understanding.add": "Add {label}",
  "understanding.removed": "Removed {label}.",
  "understanding.added": "Added {label}.",
  "understanding.confirm": "Yes, show my plan",
  "understanding.edit": "Edit",

  // No match
  "noMatch.title": "We don't have a plan for this goal yet",
  "noMatch.text":
    "Nothing we cover matches what you wrote, and we won't guess. For now we can plan the goals below. Tap one, or describe something else.",
  "noMatch.goals": "Goals we cover",

  // Plan view
  "plan.sampleNotice.strong": "Sample data, not verified:",
  "plan.sampleNotice.rest":
    "tool picks are editorial estimates, and prices, limits and dates are placeholders until each record is checked.",
  "plan.levelGroup": "Plan level",
  "plan.showingLevel": "Showing the {level} level.",
  "level.simple": "Simple",
  "level.polished": "Polished",
  "level.advanced": "Advanced",
  "plan.whatToUse": "What to use",
  "plan.overview": "Overview",
  "plan.estimatedCost": "Estimated cost",
  "plan.estimatedTime": "Estimated time",
  "plan.workflow": "Workflow",
  "plan.starterBrief": "Starter brief",
  "plan.starterBriefHint":
    "Fill in the brackets, then paste this into your AI assistant to begin.",
  "plan.checkFacts": "Check the facts",
  "plan.whenToUpgrade": "When to upgrade",
  "plan.commonMistakes": "Common mistakes",
  "plan.tiersTitle": "{tool} plans for this goal",
  "plan.startFree": "Start free.",
  "plan.upgradeOnlyIf": "Upgrade only if {trigger}.",
  "plan.footer":
    "Prices and limits change. Check the official page before paying.",
  "plan.copyBrief": "Copy starter brief",
  "plan.copyPrompt": "Copy example prompt",
  "plan.toolkitTitle": "Your toolkit at a glance",
  "plan.goTo": "Go to {tool}",
  "copy.short": "Copy",
  "copy.done": "Copied",
  "copy.announce": "Copied to clipboard.",
  "copy.failed":
    "Couldn't copy automatically. Select the text and copy it yourself.",

  // Job cards
  "tag.keep": "Keep",
  "tag.better": "Better option",
  "tag.new": "New",
  "source.tested": "Tested",
  "source.official-docs": "Official docs",
  "source.user-reported": "User reported",
  "source.sample": "Sample data",
  "kind.ai-tool": "AI tool",
  "kind.library": "Library",
  "kind.service": "Service",
  "kind.app": "App",
  "kind.template-source": "Template source",
  "category.ai": "AI",
  "category.build": "Build",
  "category.design": "Design",
  "category.media": "Media",
  "category.productivity": "Productivity",
  "category.learning": "Learning",
  "category.research": "Research",
  "job.pricing": "Pricing",
  "job.watchOut": "Watch out for",
  "job.worksWith": "Works with",
  "job.fit": "Fit for this job",
  "job.fitValue": "{score} of 5 (editorial estimate, not a test result)",
  "job.source": "Source: {source}",
  "job.lastVerified": "Last verified: {date}",
  "job.notVerified": "Not verified",
  "job.officialPage": "Official page",
  "job.opensInNewTab": " (opens in a new tab)",
  "job.otherOptions": "See other options",
  "job.chooseIf": "Choose {tool} if {reason}.",
  "job.paidOnly": "Paid only",
  "models.label": "Which model to pick",
  "models.step": "For {task}: {modelClass} model.",
  "models.stepEffort": "For {task}: {modelClass} model, {effort} effort.",
  "models.note":
    "Model names change. Check the tool's model picker and choose the closest match.",
  "models.explain": "What do these mean?",

  // Accuracy card
  "accuracy.title": "Make this more accurate",
  "accuracy.hint":
    "Optional. Your answers stay on this page and are not sent anywhere.",
  "accuracy.toolsQuestion": "Which of these do you already use?",
  "accuracy.budgetQuestion": "Monthly budget?",
  "accuracy.zeroNote":
    "Showing only tools with a free option, or one we have not confirmed yet. Free plans have limits, so check them on the official page.",
  "budget.zero": "{currency}0",
  "budget.under": "Under {amount}",
  "budget.between": "{low} to {high}",
  "budget.more": "More",

  // Sign-in
  "signin.title": "Sign in to WhichAI",
  "signin.lede":
    "Sign in to keep your plans. For now your plans stay in this browser.",
  "signin.continueWith": "Continue with {method}",
  "signin.method.email": "email",
  "signin.method.phone": "phone number",
  "signin.or": "or",
  "signin.comingSoon": "{name} sign-in is coming in an upcoming update.",
  "signin.opening": "Opening {name} sign-in",
  "signin.dismiss": "Continue without signing in",
  "signin.fine":
    "We only receive your name from Google or GitHub. We never see your password.",
  "signin.privacy": "Privacy",
  "signin.close": "Close sign-in",
  "auth.error.not-configured": "Sign-in is not configured on this server.",
  "auth.error.failed": "We couldn't sign you in. Please try again.",
  "auth.error.denied":
    "Sign-in was cancelled. You can try again whenever you like.",
  "auth.error.rate-limited":
    "Too many attempts. Please wait a minute and try again.",

  // Tool Library, tool pages, Get it and Compare
  "nav.compare": "Compare tools",
  "getIt.title": "Get it",
  "getIt.link.web": "Open on the web",
  "getIt.link.windows": "Windows",
  "getIt.link.macos": "macOS",
  "getIt.link.linux": "Linux",
  "getIt.link.android": "Android",
  "getIt.link.ios": "iPhone and iPad",
  "getIt.link.chromeExtension": "Chrome extension",
  "getIt.link.firefoxAddon": "Firefox add-on",
  "getIt.link.edgeAddon": "Edge add-on",
  "getIt.link.vscodeExtension": "VS Code extension",
  "getIt.link.jetbrainsPlugin": "JetBrains plugin",
  "getIt.link.modelPage": "Model page",
  "getIt.checked": "Link checked {date}",
  "getIt.notChecked": "Link not verified yet",
  "getIt.findOnSite": "Find downloads on the official site",
  "getIt.installCommand": "Install command",
  "getIt.copyCommand": "Copy the install command for {tool}",
  "getIt.commandNote":
    "Shown as text only. Read it first, and run it yourself in a terminal only if you trust the source.",
  "getIt.moreOptions": "More ways to get it",
  "getIt.safety":
    "Always check the address bar shows the official site before downloading.",
  "platform.web": "Web",
  "platform.windows": "Windows",
  "platform.macos": "macOS",
  "platform.linux": "Linux",
  "platform.android": "Android",
  "platform.ios": "iPhone and iPad",
  "platform.command-line": "Command line",
  "platform.code": "Code",
  "skill.beginner": "Beginner friendly",
  "skill.intermediate": "Some experience helps",
  "skill.advanced": "Technical",
  "library.title": "Tool Library",
  "library.lede":
    "Search, filter and compare the AI tools and services WhichAI knows about. Every download link points to the tool's own domain or an official app store.",
  "library.description":
    "A searchable list of AI tools, apps, libraries and services. Filter by job, kind, platform and free option, and compare tools side by side.",
  "library.sample":
    "Sample data. Nothing here is verified yet, and prices are not shown until they are checked.",
  "library.filters.label": "Filter tools",
  "library.filters.search": "Search",
  "library.filters.searchPlaceholder": "Name, what it does or a job",
  "library.filters.category": "Category",
  "library.filters.job": "Job",
  "library.filters.kind": "Kind",
  "library.filters.platform": "Platform",
  "library.filters.sort": "Sort by",
  "library.filters.any": "Any",
  "library.filters.only": "Show only",
  "library.filters.free": "Has a free option",
  "library.filters.verified": "Verified only",
  "library.filters.apply": "Apply filters",
  "library.filters.clear": "Clear filters",
  "library.filters.freeNote":
    "Free option shows only tools known to be free. Many others have free plans that are not confirmed yet.",
  "library.sort.name": "Name",
  "library.sort.fit": "Fit for the chosen job",
  "library.sort.verified": "Recently verified",
  "library.count.one": "{count} tool",
  "library.count.other": "{count} tools",
  "library.countFiltered.one": "{count} tool of {total} matches",
  "library.countFiltered.other": "{count} tools of {total} match",
  "library.empty.title": "No tools match",
  "library.empty.text":
    "Try fewer filters or a shorter search. A tool you expected may not be in the catalogue yet.",
  "library.pagination": "Pages",
  "library.previous": "Previous",
  "library.next": "Next",
  "library.page": "Page {page} of {pages}",
  "library.card.jobs": "Jobs",
  "library.card.platforms": "Available on",
  "library.card.free": "Free option",
  "library.card.verifiedOn": "Verified {date}",
  "library.card.notVerified": "Not verified",
  "library.card.details": "Details",
  "library.card.addCompare": "Compare",
  "library.card.removeCompare": "Remove from comparison",
  "library.card.compareFull": "Comparison is full (3 tools)",
  "library.compare.label": "Comparison",
  "library.compare.count.one": "{count} tool picked:",
  "library.compare.count.other": "{count} tools picked:",
  "library.compare.open": "Compare these tools",
  "library.compare.addOne": "Pick one more tool to compare.",
  "library.compare.clear": "Clear selection",
  "tool.breadcrumb": "Breadcrumb",
  "tool.by": "From {provider}",
  "tool.verifiedOn": "Verified {date}",
  "tool.notVerified": "Sample data, not verified",
  "tool.jobs": "What it is used for",
  "tool.fitFor": "(fit {score} of 5)",
  "tool.fitNote":
    "Fit scores are editorial estimates, not test results. They only order options.",
  "tool.strengths": "Strengths",
  "tool.watchOut": "Watch out for",
  "tool.facts": "At a glance",
  "tool.pricingNote": "Not checked yet. See the official pricing page.",
  "tool.freeOption": "Free option",
  "tool.free.yes": "Yes, it has a free option",
  "tool.free.no": "No free option known",
  "tool.free.unknown": "Not confirmed yet",
  "tool.skill": "Skill needed",
  "tool.platforms": "Platforms",
  "tool.tiers": "Plan tiers",
  "tool.tiersNote": "Names only. What each plan includes has not been checked.",
  "tool.worksWith": "Works with",
  "tool.alternatives": "Alternatives",
  "tool.alternativesFor": "For {job}",
  "tool.goals": "Goals this tool can help with",
  "tool.links": "Official site and feedback",
  "tool.compare": "Compare with other tools",
  "tool.report": "Report a problem with this tool",
  "compare.title": "Compare tools",
  "compare.description":
    "Compare two or three AI tools side by side: kind, jobs, free option, platforms, strengths and cautions.",
  "compare.lede":
    "Pick two or three tools to see them side by side. The address of this page holds your choice, so you can share it.",
  "compare.picker": "Tools to compare",
  "compare.remove": "Remove",
  "compare.add": "Add a tool",
  "compare.addPlaceholder": "Start typing a tool name",
  "compare.addButton": "Add to comparison",
  "compare.full": "You have picked three tools. Remove one to add another.",
  "compare.noMatch":
    "No single tool matches “{text}”. Pick a name from the suggestions.",
  "compare.empty.title": "Nothing to compare yet",
  "compare.empty.text":
    "Add a tool above, or press Compare on a tool in the Tool Library.",
  "compare.empty.browse": "Open the Tool Library",
  "compare.addOne": "Add one more tool to see a real comparison.",
  "compare.swipe": "Swipe sideways to see each tool.",
  "compare.region.one": "Comparison of {count} tool",
  "compare.region.other": "Comparison of {count} tools",
  "compare.caption": "Side-by-side comparison of the chosen tools",
  "compare.none": "None listed",
  "compare.row.kind": "Kind",
  "compare.row.jobs": "Jobs",
  "compare.row.free": "Free option",
  "compare.row.pricing": "Pricing",
  "compare.row.platforms": "Platforms",
  "compare.row.strengths": "Strengths",
  "compare.row.watchOut": "Watch out for",
  "compare.row.worksWith": "Works with",
  "compare.row.status": "Verification",
  "compare.row.getIt": "Get it",
  "kind.model": "Model",
  "kind.extension": "Extension",
  "kind.cli": "Command-line tool",

  // Not found
  "notFound.title": "We can't find that page",
  "notFound.text":
    "The link may be old, or the address may have a typo. Nothing is lost: your saved plans are still in this browser.",
  "notFound.home": "Go to the home page",

  "common.cancel": "Cancel",
  "common.undo": "Undo",
  "common.save": "Save",
  "common.close": "Close",
  "common.rename": "Rename",
  "common.delete": "Delete",
  "toast.dismiss": "Dismiss",
  "confirm.typeToConfirm": "Type {text} to confirm",
  "nav.settings": "Settings",
  "nav.help": "Help",
  "storage.limit":
    "You can keep up to {max} saved plans. Delete one to save another.",
  "storage.full":
    "This browser has no room left to store your data. Delete something or export a backup, then try again.",
  "storage.unavailable":
    "Your browser is blocking storage, so this was not saved.",
  "storage.failed": "That could not be saved.",
  "storage.notice":
    "Your browser is blocking storage, so anything you save lasts only until you close this page.",
  "data.export": "Export my data",
  "projects.saved": "Saved to Projects",
  "projects.updated": "Saved plan updated",
  "projects.deleted": "Plan deleted",
  "projects.duplicated": "Plan duplicated",
  "projects.copyTitle": "{title} (copy)",
  "projects.savedOn": "Saved {date}",
  "projects.updatedTools": "Updated tools",
  "projects.updatedHint": "Tools updated since you saved",
  "projects.rebuilt":
    "Tools have been updated since you saved this plan. It was rebuilt with today's data. Save it again to keep the new version.",
  "projects.open": "Open",
  "projects.rename": "Rename {title}",
  "projects.duplicate": "Duplicate {title}",
  "projects.delete": "Delete {title}",
  "projects.renameLabel": "Plan name",
  "projects.menu": "Options for {title}",
  "projects.recent": "Recent projects",
  "projects.viewAll": "View all",
  "projects.search": "Search projects",
  "projects.sort": "Sort by",
  "projects.sort.recent": "Most recent",
  "projects.sort.name": "Name",
  "projects.count.one": "{count} saved plan",
  "projects.count.other": "{count} saved plans",
  "projects.empty.title": "No saved plans yet",
  "projects.empty.text":
    "When you make a plan, choose Save and it will show up here. Plans are kept in this browser only, and you can open, rename or delete them any time.",
  "projects.noMatch": "No saved plans match your search.",
  "plan.save": "Save",
  "plan.saved": "Saved",
  "plan.updateSaved": "Update saved plan",
  "plan.downloadPdf": "Download PDF",
  "plan.copyShareLink": "Copy share link",
  "plan.makeOne": "Make a plan",
  "plan.englishDetails": "Tool details are in English for now.",
  "plan.missing.title": "That saved plan isn't here",
  "plan.missing.text":
    "It may have been deleted, or it was saved in a different browser. Plans are stored only on the device where you saved them.",
  "plan.empty.title": "No plan to show",
  "plan.empty.text":
    "Describe a goal to get a plan, or open one you saved from Projects.",
  "share.copied":
    "Link copied. It holds your plan choices, not your goal text.",
  "share.copyFailed":
    "Couldn't copy the link. Try again, or use a different browser.",
  "share.tooLong": "This plan has too many choices to fit in a share link.",
  "share.openedNotice":
    "Opened from a share link. The plan was rebuilt with today's tool data.",
  "share.error.title": "We can't open this link",
  "share.error.tooLarge":
    "This share link is too large, so we did not open it.",
  "share.error.malformed":
    "This share link looks damaged or incomplete. Ask for a new one.",
  "share.error.invalid":
    "This share link doesn't hold a plan we recognise, so we did not open it.",
  "searches.group.today": "Today",
  "searches.group.yesterday": "Yesterday",
  "searches.group.week": "Previous 7 days",
  "searches.group.older": "Older",
  "searches.count.one": "{count} search",
  "searches.count.other": "{count} searches",
  "searches.clearAll": "Clear all history",
  "searches.clearTitle": "Clear all search history?",
  "searches.clearText":
    "This removes every search saved in this browser. Your saved plans are not affected. This can't be undone.",
  "searches.clearConfirm": "Clear history",
  "searches.off":
    "Search history is off, so new searches are not being recorded.",
  "searches.openSettings": "Change this in Settings",
  "searches.empty.title": "No searches yet",
  "searches.empty.text":
    "Goals you search for will be listed here, kept in this browser only, so you can run them again later.",
  "searches.noMatch": "No plan yet",
  "searches.rerun": "Run again: {goal}",
  "searches.rerunShort": "Run again",
  "searches.delete": "Delete from history: {goal}",
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.search": "Focus the search",
  "shortcuts.newPlan": "Start a new plan",
  "shortcuts.help": "Show this list",
  "shortcuts.note": "Shortcuts don't work while you are typing in a field.",

  "common.on": "On",
  "common.off": "Off",
  "settings.title": "Settings",
  "settings.lede":
    "Changes apply straight away and are saved in this browser only.",
  "settings.general": "General",
  "settings.language": "Language",
  "settings.language.help":
    "Changes buttons, menus and messages. Tool details stay in English for now.",
  "settings.theme": "Theme",
  "settings.theme.help": "System follows your device's light or dark setting.",
  "settings.motion": "Reduce motion",
  "settings.motion.help":
    "On keeps movement to a minimum. Off keeps animation even if your device asks for less. System follows your device.",
  "settings.level": "Default plan level",
  "settings.level.help":
    "The level a plan opens on. Automatic picks one from your goal.",
  "settings.level.auto": "Automatic",
  "settings.budget": "Default budget",
  "settings.budget.help":
    "Used to filter tools when you start a plan. You can still change it on each plan.",
  "settings.budget.none": "Not set",
  "settings.currency": "Currency display",
  "settings.currency.help":
    "Changes how budget choices are labelled. Dollar amounts are rounded equivalents, not live exchange rates.",
  "settings.privacy": "Privacy and data",
  "settings.history": "Save search history",
  "settings.history.help":
    "When on, the goals you search for are listed on the Searches page. They stay in this browser and are never sent anywhere.",
  "settings.export": "Export my data",
  "settings.export.help":
    "Download your saved plans, search history and settings as one file.",
  "settings.import": "Import data",
  "settings.import.help":
    "Choose a backup file you exported from WhichAI. Files up to 1 MB. Nothing is uploaded.",
  "settings.import.choose": "Choose a backup file",
  "settings.clear": "Clear all data on this device",
  "settings.clear.help":
    "Deletes your saved plans, search history and settings from this browser. This can't be undone.",
  "settings.clear.button": "Clear all data",
  "settings.clear.title": "Clear all data on this device?",
  "settings.clear.text":
    "This deletes every saved plan, your search history and your settings from this browser. Export a backup first if you might want them back.",
  "settings.clear.confirm": "Clear everything",
  "settings.cleared": "All data on this device was cleared.",
  "import.plans.one": "{count} saved plan",
  "import.plans.other": "{count} saved plans",
  "import.history.one": "{count} search",
  "import.history.other": "{count} searches",
  "import.settingsIncluded": "your settings",
  "import.preview": "This file contains: {items}.",
  "import.skipped.one":
    "{count} item in the file was not valid and will be left out.",
  "import.skipped.other":
    "{count} items in the file were not valid and will be left out.",
  "import.mode": "How should it be imported?",
  "import.merge": "Merge with what is here",
  "import.merge.help":
    "Keeps everything you have and adds what is new. For a plan in both, the newer copy wins. Your current settings stay.",
  "import.replace": "Replace what is here",
  "import.replace.help":
    "Deletes your current plans and history and uses the file instead.",
  "import.button": "Import",
  "import.replaceTitle": "Replace your data with this file?",
  "import.replaceText":
    "Your current saved plans and search history will be deleted and replaced by the file's contents. This can't be undone.",
  "import.replaceConfirm": "Replace my data",
  "import.done": "Import finished.",
  "import.dropped.one":
    "{count} item was left out because a limit was reached.",
  "import.dropped.other":
    "{count} items were left out because a limit was reached.",
  "import.failed": "The import could not be saved.",
  "import.error.tooLarge": "That file is larger than 1 MB, so it was not read.",
  "import.error.notJson":
    "That file is not a valid backup. It could not be read.",
  "import.error.wrongShape":
    "That file is not a WhichAI backup, or it is from a newer version.",
  "import.error.empty": "That backup has nothing in it to import.",
  "import.error.unreadable": "That file could not be read.",
  "settings.account": "Account",
  "settings.account.signedIn": "Signed in as {name} with {provider}.",
  "settings.account.signedOut":
    "You are not signed in. You can use everything without an account.",
  "settings.account.signIn": "Sign in",
  "settings.about": "About",
  "settings.about.version": "Version {version}",
  "settings.about.privacy": "Privacy",
  "settings.about.security": "Security policy",
  "settings.about.github": "GitHub repository",
  "settings.about.feedback": "Send feedback",
  "settings.about.about": "About WhichAI",
  "settings.about.help": "Help",
  "link.newTab": " (opens in a new tab)",

  "content.back": "Back to home",
  "help.title": "Help",
  "help.lede": "Short answers to the questions people ask most.",
  "help.q1": "What does WhichAI do?",
  "help.a1":
    "You describe a goal, and WhichAI suggests which AI tools to use and how to use them, at three levels: Simple, Polished and Advanced. It is a guide, not a chatbot, and it never does the task for you.",
  "help.q2": 'Why do tools say "Not verified"?',
  "help.a2":
    "Every tool record is still a sample until someone checks it against the tool's official page. Until then, picks are editorial estimates, and prices, limits and dates are placeholders. Each card says so, and shows a check date once there is one.",
  "help.q3": "Where is my data stored?",
  "help.a3":
    "On your own device, in your browser. Saved plans, search history and settings never leave it, and we have no database. Your theme and language are also kept in a small preference cookie so pages load the way you like them. The Privacy page has the details.",
  "help.q4": "How do I share a plan?",
  "help.a4":
    "Open a plan and choose Copy share link. The link holds your plan choices, not the words you typed, and they sit after the # so they are never sent to our server. Whoever opens the link sees the plan rebuilt with today's tool data.",
  "help.q5": "How do I delete my data?",
  "help.a5":
    "Delete one plan from Projects or one search from Searches, or open Settings and choose Clear all data on this device. Export a backup first if you might want it back.",
  "help.q6": "Is it free?",
  "help.a6":
    "Yes. There are no ads, no trackers and no paid services behind WhichAI. If a tool in a plan has a paid tier, the plan says so.",
  "help.moreTitle": "More",
  "help.shortcuts": "Press ? anywhere to see the keyboard shortcuts.",
  "help.more.about": "How recommendations are made",
  "help.more.privacy": "Privacy",
  "help.more.feedback": "Send feedback",
  "about.title": "About WhichAI",
  "about.lede":
    "WhichAI is a neutral guide to which AI tools to use for a goal you have.",
  "about.what.title": "What it is",
  "about.what.text":
    "You say what you want to do, for example build a portfolio website or make a study plan. WhichAI picks tools for each step and shows one plan at three levels, so you can start simple and grow. It is not a chatbot, and it does not do the task for you.",
  "about.how.title": "How recommendations are made",
  "about.how.text1":
    "Recommendations come from reviewed data kept in this project, not from generated text. A set of plain rules reads your goal, then picks tools by how well they fit each job, your level, your budget and the tools you already use. The same input gives the same plan.",
  "about.how.text2":
    "Fit scores are editorial estimates, not test results. Nobody pays to be included or ranked higher.",
  "about.honest.title": "Honesty",
  "about.honest.item1":
    "A tool is marked Not verified until its record has been checked against an official page.",
  "about.honest.item2":
    "If WhichAI has no plan for your goal, it says so instead of guessing.",
  "about.honest.item3":
    "Prices and limits change, so every plan tells you to check the official page before paying.",
  "about.free.title": "Free, with no tracking",
  "about.free.text":
    "WhichAI runs on free tools only. It uses no paid services, no ads and no analytics, and what you save stays on your device.",
  "about.source": "The code is open on GitHub",
  "privacy.title": "Privacy",
  "privacy.lede":
    "What WhichAI does with your information, in plain language. Last updated {date}.",
  "privacy.receive.title": "What we receive",
  "privacy.receive.text1":
    "When you sign in with Google or GitHub, they tell us your name and an identifier that is unique to your account with them. We use the name to greet you and the identifier to recognise the same account next time.",
  "privacy.receive.text2":
    "The permissions we ask for also cover your email address. We do not read it, keep it or use it. We never see your password; you type it on Google's or GitHub's own page.",
  "privacy.store.title": "What we store",
  "privacy.store.text1":
    "One cookie on your device when you sign in. It holds the sign-in provider, your account identifier and your name, encrypted so only this site can read it. It lasts seven days. During sign-in a second cookie lives for ten minutes to check that the response really came from the provider, then it is deleted.",
  "privacy.store.text2":
    "We have no database. Nothing about you is stored on our servers.",
  "privacy.device.title": "What stays on your device",
  "privacy.device.text1":
    "Saved plans, search history and settings are kept in your browser, in IndexedDB or, if that is not available, in local storage. They never leave your device, we cannot see them, and nobody backs them up for you. Use Export my data in Settings to keep a copy.",
  "privacy.device.item1":
    "Saved plans: the choices that rebuild a plan (goal type, options, level, budget, tools you use) and a title you can change. The plan itself is rebuilt each time.",
  "privacy.device.item2":
    "Search history: the goals you searched for, with the date. You can turn this off in Settings, delete single entries, or clear it all.",
  "privacy.device.item3":
    "Settings: language, theme, motion, plan defaults and currency display.",
  "privacy.device.text2":
    "Your theme and language are also saved in two small preference cookies for a year, so the server can show the right look and language with no flash. They hold one word each and nothing else.",
  "privacy.device.text3":
    "Share links keep the plan choices after the # in the address. Browsers never send that part to a server, so we never receive it.",
  "privacy.device.news":
    "The AI news is read by our server from the public feeds of official sites, and your browser never contacts those sites until you open a headline. Which headlines affect your saved plans is worked out on your device from your saved plans, and nothing about it is sent anywhere.",
  "privacy.device.text4":
    "To delete all of it, open Settings and choose Clear all data on this device, or clear this site's data in your browser.",
  "privacy.never.title": "What we don't do",
  "privacy.never.item1": "We don't sell or share your information.",
  "privacy.never.item2": "We don't track you or show ads.",
  "privacy.never.item3": "We don't collect passwords.",
  "privacy.never.item4": "We don't send you email.",
  "privacy.signout.title": "Signing out and leaving",
  "privacy.signout.text":
    "Choose your name at the bottom of the sidebar, then Sign out. That deletes the cookie. To also remove WhichAI's access, revoke it in your Google account's security settings or in GitHub under Settings, Applications.",
  "privacy.contact.title": "Contact",
  "privacy.contact.text":
    "Questions or concerns: {email}. Security problems can also be reported privately through the Security tab of the project's GitHub repository.",

  // Plans and pricing
  "plan.label": "{plan} plan",
  "plan.guest": "Guest",
  "plan.upgrade": "Upgrade plan",
  "plan.subscription": "Subscription",
  "pricing.title": "Pricing",
  "pricing.description":
    "WhichAI plans in Indian rupees. Free covers planning, the Tool Library and Compare; paid plans are not open yet.",
  "pricing.lede":
    "Free covers planning, the Tool Library, Compare and live news. Paid plans add alerts, sync and team features, and they open in an upcoming update.",
  "pricing.billing.label": "Billing period",
  "pricing.billing.monthly": "Monthly",
  "pricing.billing.yearly": "Yearly",
  "pricing.billing.yearlyNote": "Yearly billing: {saving}",
  "pricing.perMonth": "/month",
  "pricing.perYear": "/year",
  "pricing.monthsFree.one": "{count} month free",
  "pricing.monthsFree.other": "{count} months free",
  "pricing.saveAmount": "Save {amount} a year",
  "pricing.smallPrint": "Prices in Indian rupees. Taxes may apply.",
  "pricing.plannedNote":
    "Features on paid plans are planned. They are not available yet, and nobody can subscribe yet.",
  "pricing.plans.label": "Plans",
  "pricing.included.label": "What {plan} includes",
  "pricing.everythingIn": "Everything in {plan}, plus:",
  "pricing.choose": "Choose {plan}",
  "pricing.currentPlan": "Current plan",
  "pricing.contactUs": "Contact us",
  "pricing.institution.audience": "For colleges and coaching centres",
  "pricing.institution.priceNote": "There is no fixed price. Contact us.",
  "pricing.institution.subject": "WhichAI for our institution",
  "pricing.institution.body":
    "Hello,\n\nWe would like to know more about WhichAI for our institution.\n\nInstitution name:\nNumber of students:\nWhat we need:\n",
  "pricing.table.title": "Compare plans",
  "pricing.table.feature": "Feature",
  "pricing.table.included": "Included",
  "pricing.table.notIncluded": "Not included",
  "pricing.table.limits": "Limits",
  "pricing.faq.title": "Questions",
  "pricing.faq.q1": "Can I use WhichAI for free?",
  "pricing.faq.a1":
    "Yes. The Free plan has everything that works today: plans at three levels, the Tool Library and Compare, live AI news, saved plans in this browser, share links, PDF export, and English and Hindi. It has no time limit.",
  "pricing.faq.q2": "What happens to my saved plans if I upgrade?",
  "pricing.faq.a2":
    "Nothing. Your saved plans stay where they are, in this browser, and keep working. Syncing them across devices is one of the planned Plus features.",
  "pricing.faq.q3": "Can I cancel anytime?",
  "pricing.faq.a3":
    "That is the plan: you will be able to cancel from Settings whenever you like. Paid plans are not open yet, so there is nothing to cancel today. The details are in the draft refund policy.",
  "pricing.faq.q4": "Is there a student discount?",
  "pricing.faq.a4":
    "Not yet. There is no discount today. Colleges and coaching centres can ask about the Institution plan, which is meant for student access.",
  "pricing.faq.q5": "When can I subscribe?",
  "pricing.faq.a5":
    "Paid plans open in an upcoming update. No date has been set. Until then everyone is on the Free plan and nothing is charged.",

  // Checkout preview
  "checkout.title": "Checkout preview",
  "checkout.lede":
    "This is a preview of the checkout. Payments are not open yet, so nothing can be bought.",
  "checkout.summary": "Order summary",
  "checkout.plan": "Plan",
  "checkout.billing": "Billing",
  "checkout.billing.label": "Billing period",
  "checkout.price": "Price",
  "checkout.account": "Account",
  "checkout.included": "What you get",
  "checkout.changePlan": "Change plan",
  "checkout.signedInAs": "Signed in as {name}",
  "checkout.signInNeeded": "You will be asked to sign in",
  "checkout.pay": "Pay {amount}",
  "checkout.noDetails": "This page does not ask for card, UPI or bank details.",

  // Subscription dialog and settings
  "subscription.dialog.title": "Payments are not open yet",
  "subscription.dialog.text":
    "Payments are coming in an upcoming update. No money has been taken and no payment details were collected.",
  "subscription.dialog.back": "Back to plans",
  "subscription.dialog.close": "Close",
  "settings.subscription": "Subscription",
  "settings.subscription.current": "Current plan",
  "settings.subscription.price": "{amount} a month",
  "settings.subscription.includes": "Your plan includes",
  "settings.subscription.note":
    "Paid plans open in an upcoming update. Nothing is billed today.",
  "settings.subscription.viewPlans": "View plans",
  "settings.subscription.manage": "Manage subscription",

  // Legal pages
  "legal.draft": "Draft: will be reviewed before paid plans launch.",
  "legal.updated": "Last updated {date}",
  "legal.nav.label": "Legal and contact",
  "legal.terms": "Terms",
  "legal.refund": "Refund policy",
  "legal.privacy": "Privacy",
  "legal.contact": "Contact",
  "terms.title": "Terms of Service",
  "terms.lede":
    "These are the rules for using WhichAI, written to be read. They are short on purpose.",
  "terms.use.title": "What WhichAI is",
  "terms.use.text":
    "WhichAI suggests which AI tools to use for a goal and how to use them. It does not do the task for you, and it is not legal, financial or professional advice.",
  "terms.free.title": "The free plan",
  "terms.free.text":
    "Using WhichAI on the Free plan costs nothing. Paid plans do not exist yet, and nobody is charged for anything today.",
  "terms.paid.title": "Paid plans, when they open",
  "terms.paid.text":
    "Before anyone can pay, the price, the billing period, the tax and what is included will be shown on the checkout page. Prices are in Indian rupees. Renewal and cancellation work as described in the refund policy.",
  "terms.accuracy.title": "Accuracy of what you see",
  "terms.accuracy.text":
    "Tool details come from a catalogue that is still being checked, and most records say Not verified. Prices, limits and features change often. Check the tool's own website before you pay for anything.",
  "terms.data.title": "Your data",
  "terms.data.text":
    "Plans and history you save stay in your browser. How the site handles information is described in the privacy page.",
  "terms.conduct.title": "Fair use",
  "terms.conduct.item1": "Do not try to break, overload or probe the service.",
  "terms.conduct.item2": "Do not use it to do something illegal.",
  "terms.conduct.item3":
    "Do not copy the catalogue in bulk and present it as your own.",
  "terms.changes.title": "Changes",
  "terms.changes.text":
    "These terms may change. The date is at the top of the page, and a change that affects paid plans will be announced before it applies.",
  "terms.contact.title": "Questions",
  "terms.contact.text": "Write to us through the contact page.",
  "refund.title": "Refund and Cancellation Policy",
  "refund.lede":
    "How cancelling and refunds are meant to work once paid plans open.",
  "refund.today.title": "Today",
  "refund.today.text":
    "Nothing can be bought yet and nobody has been charged, so there is nothing to cancel or refund.",
  "refund.cancel.title": "Cancelling",
  "refund.cancel.text":
    "You will be able to cancel from Settings at any time. Cancelling stops the next renewal. You keep the plan until the end of the period you already paid for.",
  "refund.refunds.title": "Refunds",
  "refund.refunds.text":
    "The refund rules, including any time limit, will be written here and shown on the checkout page before anyone can pay. This draft does not promise a refund window yet.",
  "refund.how.title": "How to ask",
  "refund.how.text":
    "Use the contact page and say which plan and which payment you mean. Do not send card, UPI or bank details by email.",
  "contact.title": "Contact",
  "contact.lede":
    "WhichAI is a small project run by one person. Replies can take a few days.",
  "contact.email.title": "Email",
  "contact.email.missing": "The contact email has not been added yet.",
  "contact.email.text": "For questions about plans, pricing or your data:",
  "contact.feedback.title": "Feedback on GitHub",
  "contact.feedback.text":
    "For a wrong tool record, a bug or an idea, open an issue. It is public, so leave out personal details.",
  "contact.feedback.link": "Send feedback",
  "contact.security.title": "Security problems",
  "contact.security.text":
    "Report these privately. Do not open a public issue.",
  "contact.security.link": "Security policy",
  "contact.institution.title": "Colleges and coaching centres",
  "contact.institution.text":
    "Ask about the Institution plan by email. Tell us roughly how many students you have.",
  "contact.institution.link": "Email about the Institution plan",
} as const satisfies Record<string, string>;

export type MessageKey = keyof typeof en;
