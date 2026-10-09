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
  "nav.comparePlans": "Compare Plans",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "theme.label": "Theme",
  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",

  // News panel
  "news.title": "AI news",
  "news.sample": "Sample content",
  "news.collapse": "Collapse AI news",
  "news.expand": "Expand AI news",
  "news.visit": "Visit {source} (opens in a new tab)",

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

  // Coming soon pages
  "comingSoon.status": "Coming soon",
  "comingSoon.back": "Back to home",
  "comingSoon.toolLibrary":
    "A browsable library of AI tools, with verified details, is planned for a later release.",
  "comingSoon.whatChanged":
    "A log of verified changes to AI tools and plans is planned for a later release.",
  "comingSoon.comparePlans":
    "Side-by-side comparison of plans from different tools is planned for a later release.",

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
} as const satisfies Record<string, string>;

export type MessageKey = keyof typeof en;
