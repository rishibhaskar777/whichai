/*
 * The Terms of Service, in English. It is a draft that has not had a legal
 * review, and the page says so at the top. The text is kept here, apart from
 * the interface strings, because it is long and is shown in English in every
 * language until it has been reviewed and translated.
 */

export interface TermsLink {
  href: string;
  label: string;
  /** Opens in a new tab, for places outside this site. */
  external?: boolean;
}

export type TermsBlock =
  | string
  | { text: string; link: TermsLink; after?: string }
  | { list: readonly string[] };

export interface TermsSection {
  id: string;
  title: string;
  blocks: readonly TermsBlock[];
}

export const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    id: "acceptance",
    title: "1. Accepting these terms",
    blocks: [
      "By using WhichAI, whether as a guest, with a preview account or by signing in with Google, you agree to these terms. If you do not agree to them, please do not use the service.",
      {
        text: "These terms work together with our",
        link: { href: "/privacy", label: "Privacy page" },
        after: ", which explains how information is handled.",
      },
    ],
  },
  {
    id: "who-we-are",
    title: "2. Who we are",
    blocks: [
      "WhichAI is an independent guide that suggests which AI tools to use for a goal. It is an open-source project run by its maintainers.",
      "WhichAI is not owned by, made by or paid for by the companies whose tools it describes. Nobody pays to be included or ranked higher.",
    ],
  },
  {
    id: "eligibility",
    title: "3. Who can use WhichAI",
    blocks: [
      "You must be at least 13 years old to use WhichAI.",
      "If you are under 18, the law in India may require a parent or guardian to agree to the way your personal data is handled. Please ask one before you create an account. Where the law requires a parent or guardian's consent for something you do on WhichAI, you must have it.",
      "If you use WhichAI for an organisation, you confirm that you may agree to these terms for it.",
    ],
  },
  {
    id: "accounts",
    title: "4. Accounts and security",
    blocks: [
      "You can sign in with Google, or make a preview account with an email address and password. A preview account is stored only in the browser where you made it, and it is not available on other browsers or devices.",
      "You are responsible for what happens under your account. Choose a long password that you do not use anywhere else, and keep it private. Do not share your account.",
      "Please give us a real email address and your own name when you register. Do not pretend to be someone else.",
      "We may limit how often a password can be tried, to protect accounts from guessing.",
      "Preview accounts are a temporary feature. They may change, and may not carry over when online accounts launch.",
    ],
  },
  {
    id: "guests",
    title: "5. Using WhichAI as a guest",
    blocks: [
      "You can use WhichAI without an account. Choosing to continue as a guest saves a random identifier and the date in your browser, with no name, email address or other personal detail.",
      "Plans, history and settings you save are kept in your browser. If you clear your browser's data, they are gone, and we cannot bring them back.",
    ],
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable use",
    blocks: [
      "Please use WhichAI fairly and lawfully. You agree not to:",
      {
        list: [
          "break, overload, scan or probe the service, or try to get around any limit or security measure;",
          "use it to do something illegal, or to harm, harass or deceive other people;",
          "copy the tool catalogue or the plans in bulk and present them as your own, or sell access to them;",
          "use automated tools to send large numbers of requests;",
          "try to access accounts or data that are not yours.",
        ],
      },
    ],
  },
  {
    id: "service",
    title: "7. What the service is",
    blocks: [
      "WhichAI gives guidance. It suggests AI tools for a goal and shows a plan at three levels. It does not do the task for you, and it is not a chatbot.",
      "We do not sell or resell AI tools, and we do not provide them. Every tool you see is made and run by someone else.",
      "Each third-party tool has its own terms, privacy rules and prices, and these can change at any time, without notice to us or to you. You deal with the tool's maker directly, and you should read their terms before you rely on a tool or pay for it.",
      "We may change, pause or stop any part of WhichAI.",
    ],
  },
  {
    id: "accuracy",
    title: "8. Accuracy and no professional advice",
    blocks: [
      "Our catalogue is put together by people and checked as often as we can, but it is not perfect. Many records are marked as not yet verified. Prices, limits and features change often, and fit scores are editorial estimates, not test results.",
      "What you see is general information. It is not legal, financial, medical, tax or other professional advice, and it does not take your particular situation into account. Check the tool's own website before you decide or pay.",
    ],
  },
  {
    id: "payments",
    title: "9. Subscriptions and payments",
    blocks: [
      "Paid plans do not exist yet, and nobody is charged for anything today. The pricing and checkout pages are a preview.",
      "Before anyone can pay, the price, the billing period, any tax and what is included will be shown clearly at checkout, in Indian rupees. Paid plans will not start without a separate, clear agreement from you.",
    ],
  },
  {
    id: "refunds",
    title: "10. Refunds",
    blocks: [
      {
        text: "How cancelling and refunds are meant to work once paid plans open is set out in the",
        link: {
          href: "/refund-policy",
          label: "Refund and Cancellation Policy",
        },
        after:
          ". Nothing can be bought yet, so there is nothing to refund today.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "11. Intellectual property",
    blocks: [
      "The WhichAI name, design and the way the catalogue and plans are organised belong to the project and its contributors, except where the project's repository says otherwise.",
      "Tool names, logos and descriptions belong to their owners. We use them only to say what a tool is. Their use here does not mean they endorse WhichAI.",
      "You keep ownership of anything you write, such as a goal or a plan title. You allow us to process it only as needed to show you results and to keep it in your browser.",
    ],
  },
  {
    id: "feedback",
    title: "12. Your feedback",
    blocks: [
      "If you send us feedback, a correction or an idea, we may use it to improve WhichAI without paying you or crediting you. Please do not send anything confidential or personal in a public issue, because those are visible to everyone.",
    ],
  },
  {
    id: "third-party-links",
    title: "13. Third-party links",
    blocks: [
      "WhichAI links to websites and tools that we do not control. We are not responsible for their content, their security, their availability or what they do with your information. A link is not an endorsement. Opening one is your choice and at your risk.",
    ],
  },
  {
    id: "disclaimers",
    title: "14. Disclaimers",
    blocks: [
      "WhichAI is provided as it is and as it is available, without any promise that it will be accurate, complete, uninterrupted, error-free or fit for a particular purpose. We do not promise that a tool we suggest will suit you, work as described or stay available at the same price.",
      "To the extent the law allows, we do not give any warranty beyond what these terms state.",
    ],
  },
  {
    id: "liability",
    title: "15. Limits on our liability",
    blocks: [
      "To the extent the law allows, we are not liable for any loss or damage that comes from using WhichAI or relying on it, including a choice of tool, money spent on a tool, lost data or lost time. Because WhichAI is free today, our total liability to you for any claim is limited to the amount you have paid us, which is nothing.",
      "Nothing in these terms limits anything that the law does not allow us to limit.",
    ],
  },
  {
    id: "indemnity",
    title: "16. Your responsibility for misuse",
    blocks: [
      "If you break these terms or the law while using WhichAI, and that causes a claim, loss or cost for us or for another person, you agree to be responsible for it, to the extent the law allows.",
    ],
  },
  {
    id: "termination",
    title: "17. Ending your use",
    blocks: [
      "You can stop using WhichAI at any time, and you can delete your local account and data from Settings.",
      "We may suspend or end your access if you break these terms or put the service or other people at risk. When access ends, the parts of these terms that are meant to continue, such as the disclaimers and limits on liability, continue.",
    ],
  },
  {
    id: "changes",
    title: "18. Changes to these terms",
    blocks: [
      "We may update these terms. The effective date is at the top of the page. If a change materially affects you, for example a change that applies to paid plans, we will tell you in the service before it applies. If you keep using WhichAI after a change takes effect, you accept the updated terms.",
    ],
  },
  {
    id: "governing-law",
    title: "19. Governing law",
    blocks: [
      "These terms are governed by the laws of India. Any dispute about them or about WhichAI will be subject to the courts of India. Before starting a formal dispute, please contact us so that we can try to settle it.",
    ],
  },
  {
    id: "contact",
    title: "20. Contact",
    blocks: [
      {
        text: "For questions about these terms, use the",
        link: { href: "/contact", label: "contact page" },
        after: ".",
      },
    ],
  },
];
