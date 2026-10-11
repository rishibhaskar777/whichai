/**
 * Hindi interface strings. They have not been reviewed by a native speaker
 * yet; see docs/decisions/0010-i18n.md. Brand and tool names stay in Latin
 * script on purpose, and tool details from the catalogue stay in English.
 */
import type { MessageKey } from "./en";

export const hi: Record<MessageKey, string> = {
  // Shell and navigation
  "shell.skipToMain": "मुख्य सामग्री पर जाएँ",
  "shell.openMenu": "मेन्यू खोलें",
  "shell.closeMenu": "मेन्यू बंद करें",
  "shell.mainMenu": "मुख्य मेन्यू",
  "sidebar.collapse": "साइडबार छोटा करें",
  "sidebar.expand": "साइडबार बड़ा करें",
  "nav.primary": "मुख्य",
  "nav.newPlan": "नई योजना",
  "nav.home": "होम",
  "nav.projects": "प्रोजेक्ट",
  "nav.searches": "खोजें",
  "nav.toolLibrary": "टूल लाइब्रेरी",
  "nav.whatChanged": "क्या बदला",
  "nav.signIn": "साइन इन करें",
  "nav.signOut": "साइन आउट करें",
  "theme.label": "थीम",
  "theme.system": "सिस्टम",
  "theme.light": "हल्की",
  "theme.dark": "गहरी",

  // News panel
  "news.title": "AI समाचार",
  "news.collapse": "AI समाचार छोटा करें",
  "news.expand": "AI समाचार बड़ा करें",
  "news.sourceNote": "आधिकारिक स्रोतों की सुर्खियाँ, लगभग हर 30 मिनट में अपडेट",
  "news.updated": "आखिरी अपडेट: {time}",
  "news.unavailable": "समाचार अभी उपलब्ध नहीं हैं",
  "news.lastSuccess": "आखिरी सफल अपडेट: {time}",
  "news.neverUpdated": "अभी तक कोई अपडेट सफल नहीं हुआ है।",
  "news.empty": "आधिकारिक स्रोतों से अभी कोई ताज़ा सुर्खी नहीं है।",
  "news.new": "नया",
  "news.affects": "आपके प्लान पर असर",
  "news.opensInNewTab": "(नए टैब में खुलेगा)",
  "news.seeAll": "सभी अपडेट देखें",
  "news.tag.new-model": "नया मॉडल",
  "news.tag.new-tool": "नया टूल",
  "news.tag.feature-update": "फ़ीचर अपडेट",
  "news.tag.pricing": "कीमत या प्लान",
  "news.tag.policy": "नीति",
  "news.tag.research": "शोध",
  "news.tag.other": "अन्य",
  "news.justNow": "अभी-अभी",

  // What Changed
  "whatChanged.lede":
    "कैटलॉग के टूल की आधिकारिक साइटों से घोषणाएँ, रिलीज़ नोट और चेंजलॉग। सुर्खियाँ अपनी मूल भाषा में ही रहती हैं और हर एक स्रोत से जुड़ी है।",
  "whatChanged.filters.label": "अपडेट फ़िल्टर करें",
  "whatChanged.filters.search": "सुर्खियाँ खोजें",
  "whatChanged.filters.searchPlaceholder": "कोई टूल, कंपनी या शब्द",
  "whatChanged.filters.tag": "प्रकार",
  "whatChanged.filters.source": "स्रोत",
  "whatChanged.filters.any": "कोई भी",
  "whatChanged.filters.apply": "फ़िल्टर लगाएँ",
  "whatChanged.filters.clear": "फ़िल्टर हटाएँ",
  "whatChanged.count.one": "{count} अपडेट",
  "whatChanged.count.other": "{count} अपडेट",
  "whatChanged.countFiltered.one": "{total} में से {count} अपडेट मेल खाता है",
  "whatChanged.countFiltered.other":
    "{total} में से {count} अपडेट मेल खाते हैं",
  "whatChanged.empty.title": "कोई अपडेट नहीं मिला",
  "whatChanged.empty.text":
    "कम फ़िल्टर या छोटी खोज आज़माएँ। केवल पिछले 60 दिन के अपडेट रखे जाते हैं।",
  "whatChanged.pagination": "पेज",
  "whatChanged.previous": "पिछला",
  "whatChanged.next": "अगला",
  "whatChanged.page": "पेज {page} / {pages}",
  "whatChanged.sources":
    "{count} आधिकारिक स्रोत। 60 दिन से पुराने अपडेट शामिल नहीं हैं।",
  "whatChanged.relatedTools": "संबंधित टूल",
  "tool.recentNews": "हाल की खबरें",
  "tool.recentNewsAll": "सभी अपडेट",

  // Home
  "home.greeting": "आप AI से क्या करना चाहते हैं?",
  "home.lead":
    "अपना लक्ष्य बताइए। WhichAI बताता है कि कौन से AI टूल इस्तेमाल करें और कैसे, तीन स्तरों पर: सरल, निखरा हुआ और उन्नत।",
  "home.announce.understanding":
    "लक्ष्य समझ लिया गया। जानकारी देखिए और पुष्टि कीजिए।",
  "home.announce.noMatch":
    "इस लक्ष्य की योजना अभी नहीं है। हमारे लक्ष्यों में से कोई चुनिए।",
  "home.announce.plan": "योजना तैयार है",
  "home.editGoal": "अपना लक्ष्य बदलें",
  "home.yourGoal": "आपका लक्ष्य: ",
  "home.englishOnly":
    "अपना लक्ष्य अंग्रेज़ी में लिखिए। अंग्रेज़ी अक्षरों में हिंदी शब्द, जैसे banana hai, भी चलते हैं।",

  // Goal form
  "goal.submit": "योजना पाएँ",
  "goal.compactPlaceholder": "कोई और लक्ष्य बताइए",
  "goal.suggestions": "सुझाव",
  "goal.errorEmpty": "पहले बताइए कि आप क्या करना चाहते हैं।",
  "goal.errorTooLong": "इसे {max} अक्षरों से कम रखिए।",
  "goal.errorGeneric": "जो लिखा है उसे जाँच लीजिए।",
  "suggest.study": "पढ़ाई की योजना",
  "suggest.portfolio": "पोर्टफ़ोलियो वेबसाइट",
  "suggest.reading": "पढ़ना और कहानियाँ",
  "suggest.resume": "रिज़्यूमे में मदद",
  "suggest.video": "वीडियो बनाएँ",
  "suggest.app": "ऐप बनाएँ",

  // Understanding card
  "understanding.title": "हमने यह समझा है",
  "understanding.chips": "हमने जो समझा",
  "understanding.addLabel": "जो छूट गया हो वह जोड़ें",
  "understanding.remove": "{label} हटाएँ",
  "understanding.add": "{label} जोड़ें",
  "understanding.removed": "{label} हटा दिया।",
  "understanding.added": "{label} जोड़ दिया।",
  "understanding.confirm": "हाँ, मेरी योजना दिखाइए",
  "understanding.edit": "बदलें",

  // No match
  "noMatch.title": "इस लक्ष्य की योजना अभी हमारे पास नहीं है",
  "noMatch.text":
    "आपने जो लिखा, वह हमारे किसी लक्ष्य से मेल नहीं खाता, और हम अंदाज़ा नहीं लगाते। अभी हम नीचे दिए लक्ष्यों की योजना बना सकते हैं। एक चुनिए, या कुछ और बताइए।",
  "noMatch.goals": "हमारे लक्ष्य",

  // Plan view
  "plan.levelGroup": "योजना का स्तर",
  "plan.showingLevel": "{level} स्तर दिखाया जा रहा है।",
  "level.simple": "सरल",
  "level.polished": "निखरा हुआ",
  "level.advanced": "उन्नत",
  "plan.whatToUse": "क्या इस्तेमाल करें",
  "plan.overview": "सारांश",
  "plan.estimatedCost": "अनुमानित खर्च",
  "plan.estimatedTime": "अनुमानित समय",
  "plan.workflow": "काम के चरण",
  "plan.starterBrief": "शुरुआती निर्देश",
  "plan.starterBriefHint":
    "कोष्ठक भर दीजिए, फिर शुरू करने के लिए इसे अपने AI असिस्टेंट में चिपका दीजिए।",
  "plan.checkFacts": "तथ्य जाँच लें",
  "plan.whenToUpgrade": "कब अपग्रेड करें",
  "plan.commonMistakes": "आम गलतियाँ",
  "plan.tiersTitle": "इस लक्ष्य के लिए {tool} के प्लान",
  "plan.startFree": "मुफ़्त से शुरू करें।",
  "plan.upgradeOnlyIf": "अपग्रेड तभी करें जब {trigger}।",
  "plan.footer":
    "कीमतें और सीमाएँ बदलती रहती हैं। पैसे देने से पहले आधिकारिक पेज देख लें।",
  "plan.copyBrief": "शुरुआती निर्देश कॉपी करें",
  "plan.copyPrompt": "उदाहरण प्रॉम्प्ट कॉपी करें",
  "plan.toolkitTitle": "आपके टूल एक नज़र में",
  "plan.goTo": "{tool} पर जाएँ",
  "copy.short": "कॉपी",
  "copy.done": "कॉपी हो गया",
  "copy.announce": "क्लिपबोर्ड पर कॉपी हो गया।",
  "copy.failed":
    "अपने आप कॉपी नहीं हो सका। लिखे हुए को चुनकर खुद कॉपी कर लीजिए।",

  // Job cards
  "tag.keep": "रखें",
  "tag.better": "बेहतर विकल्प",
  "tag.new": "नया",
  "kind.ai-tool": "AI टूल",
  "kind.library": "लाइब्रेरी",
  "kind.service": "सेवा",
  "kind.app": "ऐप",
  "kind.template-source": "टेम्पलेट का स्रोत",
  "category.ai": "AI",
  "category.build": "बनाना",
  "category.design": "डिज़ाइन",
  "category.media": "मीडिया",
  "category.productivity": "काम की रफ़्तार",
  "category.learning": "सीखना",
  "category.research": "शोध",
  "job.pricing": "कीमत",
  "job.watchOut": "ध्यान रखें",
  "job.worksWith": "इनके साथ चलता है",
  "job.fit": "इस काम के लिए उपयुक्तता",
  "job.fitValue": "5 में से {score} (संपादकीय अनुमान, परीक्षण का नतीजा नहीं)",
  "job.verifiedOn": "जाँचा गया: {date}",
  "job.pricingChecked": "आधिकारिक कीमत वाले पेज से, जाँच की तारीख़: {date}",
  "job.seePricing": "कीमत देखें",
  "job.viewDetails": "पूरी जानकारी देखें",
  "job.switchBack": "{tool} पर वापस जाएँ",
  "job.swapped": "{job} के लिए अब {tool} दिख रहा है।",
  "getIt.officialSite": "आधिकारिक साइट",
  "plan.dataNote":
    "टूल की जानकारी आधिकारिक साइटों से आती है। फ़िट स्कोर हमारे अपने अनुमान हैं।",
  "plan.dataNote.link": "हम डेटा कैसे जाँचते हैं",
  "about.data.title": "हम डेटा कैसे जाँचते हैं",
  "about.data.intro":
    "हर टूल का रिकॉर्ड उसकी अपनी साइट से आता है। यहाँ वे तारीख़ें और निशान हैं जो आपको दिख सकते हैं, और हर एक का मतलब।",
  "about.data.links":
    "लिंक की जाँच: उस तारीख़ को हमने पता खोला और देखा कि वह टूल की आधिकारिक साइट पर ही पहुँचता है। डाउनलोड बटन सिर्फ़ उन लिंक के लिए दिखते हैं जो जाँच में सही निकले। कोई सही न निकले तो एक आधिकारिक साइट बटन दिखता है।",
  "about.data.pricing":
    "कीमत की जाँच: उस तारीख़ को हमने टूल का आधिकारिक कीमत वाला पेज पढ़ा और नोट किया कि मुफ़्त प्लान है या नहीं और सशुल्क प्लान की शुरुआती कीमत क्या है, उसी मुद्रा में जो पेज पर थी। हम मुद्रा कभी बदलते नहीं। पेज बंद, अस्पष्ट या देश के हिसाब से अलग हो तो हम इसकी जगह कीमत देखें लिंक दिखाते हैं।",
  "about.data.verified":
    "सत्यापित: किसी व्यक्ति ने पूरा रिकॉर्ड आधिकारिक पेजों से जाँचकर मंज़ूर किया है। बिना निशान वाला रिकॉर्ड सही हो सकता है, पर अभी किसी ने उसे मंज़ूर नहीं किया।",
  "about.data.scores":
    "फ़िट स्कोर संपादकीय हैं: कोई टूल किसी काम के लिए कितना ठीक है, इसका हमारा अपना अनुमान, जो सिर्फ़ विकल्पों को क्रम देने के काम आता है। ये परीक्षण के नतीजे नहीं हैं, और ऊँचे स्कोर के लिए कोई पैसे नहीं देता।",
  "about.data.change":
    "कीमतें और सीमाएँ बदलती रहती हैं। भुगतान से पहले आधिकारिक पेज देखें।",
  "job.officialPage": "आधिकारिक पेज",
  "job.opensInNewTab": " (नए टैब में खुलेगा)",
  "job.otherOptions": "दूसरे विकल्प देखें",
  "job.chooseIf": "अगर {reason} तो {tool} चुनें।",
  "job.paidOnly": "सिर्फ़ पैसे देकर",
  "models.label": "कौन सा मॉडल चुनें",
  "models.step": "{task} के लिए: {modelClass} मॉडल।",
  "models.stepEffort": "{task} के लिए: {modelClass} मॉडल, {effort} मेहनत।",
  "models.note":
    "मॉडल के नाम बदलते रहते हैं। टूल का मॉडल चुनने वाला मेन्यू देखिए और सबसे मिलता-जुलता चुनिए।",
  "models.explain": "इनका मतलब क्या है?",
  "job.headline": "{tool} से यह करें: {task}",
  "job.about": "{tool} के बारे में: {summary}",
  "plan.goodFor": "किसके लिए: {text}",
  "getMore.toggle": "{tool} से और पाएँ",
  "getMore.model": "इस लक्ष्य के लिए सबसे अच्छा मॉडल",
  "getMore.modelsAsOf": "{date} तक, टूल के अपने पेज पर दिए नामों के अनुसार:",
  "getMore.modelsSource": "स्रोत",
  "getMore.classesOnly":
    "इस टूल के मॉडल नाम दर्ज नहीं हैं। अपनी ज़रूरत के हिसाब से चुनें:",
  "getMore.tips": "काम की सेटिंग",
  "getMore.tipsChecked": "{date} को दस्तावेज़ों से मिलाया गया।",
  "getMore.tipSource": "स्रोत",
  "getMore.addOns": "ऐड-ऑन",
  "getMore.freePlan": "मुफ़्त सीमा में रहने के लिए",
  "getMore.prompt": "इस लक्ष्य के लिए शुरुआती प्रॉम्प्ट",
  "getMore.copyPrompt": "{tool} के लिए शुरुआती प्रॉम्प्ट कॉपी करें",

  // Accuracy card
  "accuracy.title": "इसे और सटीक बनाएँ",
  "accuracy.hint":
    "वैकल्पिक। आपके जवाब इसी पेज पर रहते हैं और कहीं भेजे नहीं जाते।",
  "accuracy.toolsQuestion": "इनमें से आप पहले से कौन से इस्तेमाल करते हैं?",
  "accuracy.budgetQuestion": "महीने का बजट?",
  "accuracy.zeroNote":
    "सिर्फ़ वे टूल दिखाए जा रहे हैं जिनका मुफ़्त विकल्प है, या जिनकी हमने अभी पुष्टि नहीं की है। मुफ़्त प्लान की सीमाएँ होती हैं, इसलिए आधिकारिक पेज पर देख लें।",
  "budget.zero": "{currency}0",
  "budget.under": "{amount} से कम",
  "budget.between": "{low} से {high}",
  "budget.more": "इससे ज़्यादा",

  // Sign-in
  "signin.login.title": "WhichAI में लॉग इन करें",
  "signin.login.lede":
    "वापस स्वागत है। जहाँ छोड़ा था, वहीं से आगे बढ़ने के लिए लॉग इन करें।",
  "signin.register.title": "अपना WhichAI खाता बनाएँ",
  "signin.registerWith": "{method} से रजिस्टर करें",
  "signin.login.submit": "लॉग इन करें",
  "signin.login.submitting": "लॉग इन हो रहा है",
  "signin.register.submit": "अभी रजिस्टर करें",
  "signin.register.submitting": "आपका खाता बन रहा है",
  "signin.login.new": "WhichAI पर नए हैं?",
  "signin.login.registerLink": "रजिस्टर करें",
  "signin.register.existing": "पहले से WhichAI पर हैं?",
  "signin.register.loginLink": "लॉग इन करें",
  "signin.register.success": "खाता बन गया। जारी रखने के लिए लॉग इन करें।",
  "signin.forgot": "पासवर्ड भूल गए?",
  "signin.forgot.note": "पासवर्ड रीसेट आने वाले अपडेट में खातों के साथ आएगा।",
  "signin.preview":
    "प्रीव्यू: ऑनलाइन खाते शुरू होने तक खाते केवल इसी ब्राउज़र में सहेजे जाते हैं।",
  "signin.password.show": "पासवर्ड दिखाएँ",
  "signin.password.hide": "पासवर्ड छिपाएँ",
  "auth.field.email": "ईमेल",
  "auth.field.password": "पासवर्ड",
  "auth.field.firstName": "पहला नाम",
  "auth.field.lastName": "अंतिम नाम",
  "auth.password.hint": "कम से कम 8 अक्षर, अधिकतम 128। चिह्न ज़रूरी नहीं।",
  "auth.password.hint.more":
    "{count} और चाहिए। अधिकतम 128 अक्षर, चिह्न ज़रूरी नहीं।",
  "auth.password.hint.ok": "काफ़ी लंबा है। अधिकतम 128 अक्षर।",
  "auth.password.hint.over": "यह 128 अक्षरों से ज़्यादा है। कृपया छोटा करें।",
  "auth.terms.label": "मैं {terms} और {privacy} से सहमत हूँ",
  "auth.terms.privacy": "गोपनीयता नीति",
  "auth.error.summary": "जारी रखने के लिए इन्हें ठीक करें:",
  "auth.error.email.required": "अपना ईमेल पता दर्ज करें।",
  "auth.error.email.invalid": "सही ईमेल पता दर्ज करें, जैसे name@example.com।",
  "auth.error.password.required": "अपना पासवर्ड दर्ज करें।",
  "auth.error.password.short": "कम से कम 8 अक्षर रखें।",
  "auth.error.password.long": "128 या उससे कम अक्षर रखें।",
  "auth.error.password.common": "यह पासवर्ड बहुत आम है। कोई और चुनें।",
  "auth.error.firstName.required": "अपना पहला नाम दर्ज करें।",
  "auth.error.firstName.invalid":
    "केवल अक्षर, स्पेस, हाइफ़न और अपॉस्ट्रॉफ़ी का उपयोग करें।",
  "auth.error.firstName.long": "50 या उससे कम अक्षर रखें।",
  "auth.error.lastName.required": "अपना अंतिम नाम दर्ज करें।",
  "auth.error.lastName.invalid":
    "केवल अक्षर, स्पेस, हाइफ़न और अपॉस्ट्रॉफ़ी का उपयोग करें।",
  "auth.error.lastName.long": "50 या उससे कम अक्षर रखें।",
  "auth.error.terms.required":
    "रजिस्टर करने के लिए सेवा की शर्तों और गोपनीयता नीति से सहमत हों।",
  "auth.error.credentials": "ईमेल या पासवर्ड सही नहीं है।",
  "auth.error.duplicate":
    "इस ईमेल का खाता इस ब्राउज़र में पहले से मौजूद है। इसके बजाय लॉग इन करें।",
  "auth.error.locked":
    "बहुत सारी कोशिशें हो चुकी हैं। {seconds} सेकंड बाद फिर कोशिश करें।",
  "auth.error.storage":
    "यह ब्राउज़र आपकी जानकारी सहेज नहीं सका। जाँचें कि साइट स्टोरेज की अनुमति है और फिर कोशिश करें।",
  "auth.error.invalid": "कृपया अपनी जानकारी जाँचें और फिर कोशिश करें।",
  "account.guest": "अतिथि",
  "settings.account.signedInLocal":
    "{name} के रूप में लॉग इन हैं। यह खाता केवल इसी ब्राउज़र में सहेजा गया है।",
  "settings.account.guest":
    "आप WhichAI को अतिथि के रूप में इस्तेमाल कर रहे हैं। खाते के बिना सब कुछ इस्तेमाल किया जा सकता है।",
  "settings.account.deleteLocal": "लोकल खाता और डेटा हटाएँ",
  "settings.account.deleteLocal.help":
    "इस ब्राउज़र से प्रीव्यू खाते, आपका लॉग इन और अतिथि प्रोफ़ाइल, साथ ही सहेजी योजनाएँ, खोज इतिहास और सेटिंग हटा देता है। इसे वापस नहीं किया जा सकता।",
  "settings.account.deleteLocal.title": "लोकल खाता और डेटा हटाएँ?",
  "settings.account.deleteLocal.confirm": "हटाएँ",
  "settings.account.deleteLocal.done": "लोकल खाता और डेटा हटा दिया गया।",
  "legal.draftReview": "मसौदा, कानूनी समीक्षा बाकी है।",
  "terms.englishOnly":
    "समीक्षा के दौरान इन शर्तों का पूरा पाठ केवल अंग्रेज़ी में दिखाया जाता है।",
  "terms.effective": "प्रभावी तिथि: {date}",
  "privacy.preview.title": "प्रीव्यू खाते",
  "privacy.preview.text1":
    "ईमेल पते और पासवर्ड से बनाया गया खाता प्रीव्यू खाता है। यह केवल इसी ब्राउज़र में रहता है और इसके बारे में कुछ भी हमें नहीं भेजा जाता। इसमें आपका ईमेल पता, पहला और अंतिम नाम, रजिस्टर करने की तारीख और आपके पासवर्ड का हैश रहता है।",
  "privacy.preview.text2":
    "आपका पासवर्ड वैसा नहीं रखा जाता जैसा आपने लिखा। उसे PBKDF2 (SHA-256, 6,00,000 राउंड और एक यादृच्छिक सॉल्ट) से हैश में बदला जाता है, इसलिए सहेजा गया मान सीधे पढ़ा नहीं जा सकता। हैश कमज़ोर पासवर्ड को सुरक्षित नहीं बना देता, इसलिए लंबा पासवर्ड चुनें जो कहीं और इस्तेमाल न हो।",
  "privacy.preview.text3":
    "चूँकि खाता इसी ब्राउज़र में है, यह दूसरे ब्राउज़र या डिवाइस पर आपके साथ नहीं जाता, और इस साइट का डेटा साफ़ करने पर हट जाता है। पाँच बार गलत पासवर्ड के बाद लॉग इन 30 सेकंड के लिए रुक जाता है; यह जाँच भी केवल आपके ब्राउज़र में होती है। ऑनलाइन खाते योजना में हैं, और हो सकता है कि प्रीव्यू खाते उनमें आगे न जाएँ।",
  "privacy.guest.title": "अतिथि प्रोफ़ाइल",
  "privacy.guest.text":
    "यदि आप “बिना साइन इन किए जारी रखें” चुनते हैं, तो यह ब्राउज़र एक यादृच्छिक पहचानकर्ता और तारीख सहेजता है, ताकि साइडबार में अतिथि दिखे। इसमें कोई नाम, ईमेल पता या अन्य निजी जानकारी नहीं होती।",
  "privacy.cookies.title": "कुकीज़",
  "privacy.cookies.text1":
    "हम केवल वही कुकीज़ इस्तेमाल करते हैं जो साइट को चाहिए, कोई एनालिटिक्स या विज्ञापन कुकी नहीं।",
  "privacy.cookies.item1":
    "साइन इन: Google से साइन इन करने पर एक कुकी में साइन इन देने वाला, आपके खाते की पहचान और आपका नाम रहता है, एन्क्रिप्ट किया हुआ ताकि सिर्फ़ यह साइट उसे पढ़ सके। वह सात दिन चलती है। साइन इन के दौरान दस मिनट के लिए एक दूसरी कुकी रहती है, जो जाँचती है कि जवाब सचमुच उसी प्रदाता से आया है, फिर वह मिटा दी जाती है।",
  "privacy.cookies.item2":
    "पसंद: आपकी थीम और भाषा दो छोटी कुकी में एक साल के लिए रखी जाती हैं, ताकि पेज बिना झपकी के सही रूप और भाषा दिखा सके। हर कुकी में एक शब्द होता है, और कुछ नहीं।",
  "privacy.cookies.text2":
    "प्रीव्यू खाते और अतिथि प्रोफ़ाइल कुकी नहीं हैं। वे आपके ब्राउज़र के स्टोरेज में रहते हैं और कभी किसी सर्वर को नहीं भेजे जाते।",
  "privacy.news.title": "AI समाचार",
  "privacy.rights.title": "भारत के DPDP अधिनियम, 2023 के तहत आपके अधिकार",
  "privacy.rights.text1":
    "भारत का डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 आपको, उस व्यक्ति के रूप में जिसका डेटा है, यह अधिकार देता है कि आप अपने बारे में प्रोसेस किए गए व्यक्तिगत डेटा का सार माँगें, उसे सही कराएँ या मिटवाएँ, शिकायत का निपटारा करवाएँ, और यदि आप खुद न कर सकें तो अपनी ओर से कार्य करने के लिए किसी को नामित करें।",
  "privacy.rights.text2":
    "WhichAI जो कुछ रखता है, वह लगभग सब आपके अपने ब्राउज़र में है, इसलिए आप ये अधिकार खुद इस्तेमाल कर सकते हैं: सेटिंग में देखें, एक्सपोर्ट करें और हटाएँ। कोई चिंता या अनुरोध उठाना हो तो संपर्क पेज का उपयोग करें। यदि आप 18 वर्ष से कम हैं, तो अधिनियम में आपके व्यक्तिगत डेटा के प्रोसेस होने के लिए माता-पिता या अभिभावक की सहमति अपेक्षित है, इसलिए खाता बनाने से पहले कृपया उनसे पूछ लें।",
  "privacy.delete.title": "अपना डेटा हटाना",
  "privacy.delete.text1":
    "सेटिंग खोलें, फिर खाता, और “लोकल खाता और डेटा हटाएँ” चुनें। पुष्टि के बाद यह इस ब्राउज़र से प्रीव्यू खाते, आपका लॉग इन और अतिथि प्रोफ़ाइल, साथ ही सहेजी योजनाएँ, खोज इतिहास और सेटिंग हटा देता है।",
  "privacy.delete.text2":
    "“इस डिवाइस का सारा डेटा मिटाएँ” योजनाएँ, इतिहास और सेटिंग हटाता है पर आपके खाते रखता है। आप अपने ब्राउज़र में इस साइट का डेटा भी साफ़ कर सकते हैं।",
  "signin.continueWith": "{method} से जारी रखें",
  "signin.or": "या",
  "signin.comingSoon": "{name} से साइन इन अगले अपडेट में आ रहा है।",
  "signin.opening": "{name} साइन इन खुल रहा है",
  "signin.dismiss": "बिना साइन इन किए जारी रखें",
  "signin.close": "साइन इन बंद करें",
  "auth.error.not-configured": "इस सर्वर पर साइन इन चालू नहीं किया गया है।",
  "auth.error.failed": "हम आपको साइन इन नहीं कर सके। कृपया फिर कोशिश कीजिए।",
  "auth.error.denied":
    "साइन इन रद्द कर दिया गया। आप जब चाहें फिर कोशिश कर सकते हैं।",
  "auth.error.rate-limited":
    "बहुत ज़्यादा कोशिशें हो गईं। कृपया एक मिनट रुककर फिर कोशिश कीजिए।",

  // Tool Library, tool pages, Get it and Compare
  "nav.compare": "टूल की तुलना",
  "getIt.title": "इसे पाएँ",
  "getIt.link.web": "वेब पर खोलें",
  "getIt.link.windows": "Windows",
  "getIt.link.macos": "macOS",
  "getIt.link.linux": "Linux",
  "getIt.link.android": "Android",
  "getIt.link.ios": "iPhone और iPad",
  "getIt.link.chromeExtension": "Chrome एक्सटेंशन",
  "getIt.link.firefoxAddon": "Firefox ऐड-ऑन",
  "getIt.link.edgeAddon": "Edge ऐड-ऑन",
  "getIt.link.vscodeExtension": "VS Code एक्सटेंशन",
  "getIt.link.jetbrainsPlugin": "JetBrains प्लगइन",
  "getIt.link.modelPage": "मॉडल का पेज",
  "getIt.checked": "लिंक की जाँच: {date}",
  "getIt.installCommand": "इंस्टॉल कमांड",
  "getIt.copyCommand": "{tool} की इंस्टॉल कमांड कॉपी करें",
  "getIt.commandNote":
    "यह सिर्फ़ टेक्स्ट है। पहले इसे पढ़ें, और स्रोत पर भरोसा हो तभी इसे टर्मिनल में खुद चलाएँ।",
  "getIt.moreOptions": "पाने के और तरीके",
  "getIt.safety":
    "डाउनलोड आधिकारिक साइट पर खुलते हैं। इंस्टॉल करने से पहले एड्रेस बार जाँच लें।",
  "platform.web": "वेब",
  "platform.windows": "Windows",
  "platform.macos": "macOS",
  "platform.linux": "Linux",
  "platform.android": "Android",
  "platform.ios": "iPhone और iPad",
  "platform.command-line": "कमांड लाइन",
  "platform.code": "कोड",
  "skill.beginner": "शुरुआत करने वालों के लिए",
  "skill.intermediate": "थोड़ा अनुभव काम आएगा",
  "skill.advanced": "तकनीकी",
  "library.title": "टूल लाइब्रेरी",
  "library.lede":
    "WhichAI जिन AI टूल और सेवाओं को जानता है, उन्हें खोजें, छाँटें और उनकी तुलना करें। हर डाउनलोड लिंक टूल के अपने डोमेन या किसी आधिकारिक ऐप स्टोर पर जाता है।",
  "library.description":
    "AI टूल, ऐप, लाइब्रेरी और सेवाओं की खोजने योग्य सूची। काम, प्रकार, प्लेटफ़ॉर्म और मुफ़्त विकल्प से छाँटें, और टूल की आमने-सामने तुलना करें।",
  "library.sample":
    "नमूना डेटा। यहाँ कुछ भी अभी सत्यापित नहीं है, और कीमतें जाँचे जाने तक नहीं दिखाई जातीं।",
  "library.filters.label": "टूल छाँटें",
  "library.filters.search": "खोजें",
  "library.filters.searchPlaceholder": "नाम, वह क्या करता है, या कोई काम",
  "library.filters.category": "श्रेणी",
  "library.filters.job": "काम",
  "library.filters.kind": "प्रकार",
  "library.filters.platform": "प्लेटफ़ॉर्म",
  "library.filters.sort": "क्रम",
  "library.filters.any": "कोई भी",
  "library.filters.only": "सिर्फ़ यही दिखाएँ",
  "library.filters.free": "मुफ़्त विकल्प है",
  "library.filters.verified": "सिर्फ़ सत्यापित",
  "library.filters.apply": "फ़िल्टर लगाएँ",
  "library.filters.clear": "फ़िल्टर हटाएँ",
  "library.filters.freeNote":
    "मुफ़्त विकल्प में सिर्फ़ वही टूल आते हैं जिनका मुफ़्त होना पता है। कई दूसरे टूल में मुफ़्त प्लान होते हैं, जिनकी पुष्टि अभी नहीं हुई।",
  "library.sort.name": "नाम",
  "library.sort.fit": "चुने हुए काम के लिए उपयुक्तता",
  "library.sort.verified": "हाल में सत्यापित",
  "library.count.one": "{count} टूल",
  "library.count.other": "{count} टूल",
  "library.countFiltered.one": "{total} में से {count} टूल मेल खाता है",
  "library.countFiltered.other": "{total} में से {count} टूल मेल खाते हैं",
  "library.empty.title": "कोई टूल नहीं मिला",
  "library.empty.text":
    "कम फ़िल्टर या छोटी खोज आज़माएँ। हो सकता है आप जो टूल ढूँढ रहे हैं वह अभी सूची में न हो।",
  "library.pagination": "पेज",
  "library.previous": "पिछला",
  "library.next": "अगला",
  "library.page": "पेज {page} / {pages}",
  "library.card.jobs": "काम",
  "library.card.platforms": "इन पर उपलब्ध",
  "library.card.free": "मुफ़्त विकल्प",
  "library.card.verifiedOn": "सत्यापित: {date}",
  "library.card.details": "ब्योरा",
  "library.card.addCompare": "तुलना करें",
  "library.card.removeCompare": "तुलना से हटाएँ",
  "library.card.compareFull": "तुलना भरी हुई है (3 टूल)",
  "library.compare.label": "तुलना",
  "library.compare.count.one": "{count} टूल चुना गया:",
  "library.compare.count.other": "{count} टूल चुने गए:",
  "library.compare.open": "इन टूल की तुलना करें",
  "library.compare.addOne": "तुलना के लिए एक और टूल चुनें।",
  "library.compare.clear": "चयन हटाएँ",
  "tool.breadcrumb": "ब्रेडक्रंब",
  "tool.by": "{provider} की ओर से",
  "tool.verifiedOn": "सत्यापित: {date}",
  "tool.jobs": "इसका उपयोग किस काम में होता है",
  "tool.fitFor": "(उपयुक्तता {score} में से 5)",
  "tool.fitNote":
    "उपयुक्तता के अंक संपादकीय अनुमान हैं, परीक्षण के नतीजे नहीं। वे सिर्फ़ विकल्पों को क्रम देते हैं।",
  "tool.strengths": "खूबियाँ",
  "tool.watchOut": "ध्यान रखें",
  "tool.facts": "एक नज़र में",
  "tool.freeOption": "मुफ़्त विकल्प",
  "tool.free.yes": "मुफ़्त प्लान उपलब्ध है",
  "tool.free.no": "केवल सशुल्क",
  "tool.free.unknown": "आधिकारिक साइट देखें",
  "tool.skill": "ज़रूरी कौशल",
  "tool.platforms": "प्लेटफ़ॉर्म",
  "tool.tiers": "प्लान के स्तर",
  "tool.tiersNote":
    "सिर्फ़ नाम। हर प्लान में क्या मिलता है, यह अभी जाँचा नहीं गया।",
  "tool.worksWith": "इनके साथ चलता है",
  "tool.alternatives": "विकल्प",
  "tool.alternativesFor": "{job} के लिए",
  "tool.goals": "ये लक्ष्य जिनमें यह टूल काम आ सकता है",
  "tool.links": "आधिकारिक साइट और सुझाव",
  "tool.compare": "दूसरे टूल से तुलना करें",
  "tool.report": "इस टूल की गड़बड़ी बताएँ",
  "compare.title": "टूल की तुलना",
  "compare.description":
    "दो या तीन AI टूल की आमने-सामने तुलना करें: प्रकार, काम, मुफ़्त विकल्प, प्लेटफ़ॉर्म, खूबियाँ और सावधानियाँ।",
  "compare.lede":
    "दो या तीन टूल चुनें और उन्हें आमने-सामने देखें। इस पेज के पते में आपका चयन रहता है, इसलिए आप इसे साझा कर सकते हैं।",
  "compare.picker": "तुलना के लिए टूल",
  "compare.remove": "हटाएँ",
  "compare.add": "टूल जोड़ें",
  "compare.addPlaceholder": "टूल का नाम लिखना शुरू करें",
  "compare.addButton": "तुलना में जोड़ें",
  "compare.full": "आपने तीन टूल चुन लिए हैं। नया जोड़ने के लिए एक हटाएँ।",
  "compare.noMatch":
    "“{text}” से कोई एक टूल नहीं मिला। सुझावों में से कोई नाम चुनें।",
  "compare.empty.title": "तुलना के लिए अभी कुछ नहीं",
  "compare.empty.text":
    "ऊपर से कोई टूल जोड़ें, या टूल लाइब्रेरी में किसी टूल पर तुलना दबाएँ।",
  "compare.empty.browse": "टूल लाइब्रेरी खोलें",
  "compare.addOne": "सही तुलना देखने के लिए एक और टूल जोड़ें।",
  "compare.swipe": "हर टूल देखने के लिए बगल में स्वाइप करें।",
  "compare.region.one": "{count} टूल की तुलना",
  "compare.region.other": "{count} टूल की तुलना",
  "compare.caption": "चुने हुए टूल की आमने-सामने तुलना",
  "compare.none": "कुछ सूचीबद्ध नहीं",
  "compare.row.kind": "प्रकार",
  "compare.row.jobs": "काम",
  "compare.row.free": "मुफ़्त विकल्प",
  "compare.row.pricing": "कीमत",
  "compare.row.platforms": "प्लेटफ़ॉर्म",
  "compare.row.strengths": "खूबियाँ",
  "compare.row.watchOut": "ध्यान रखें",
  "compare.row.worksWith": "इनके साथ चलता है",
  "compare.row.status": "सत्यापन",
  "compare.row.getIt": "इसे पाएँ",
  "kind.model": "मॉडल",
  "kind.extension": "एक्सटेंशन",
  "kind.cli": "कमांड-लाइन टूल",

  // Not found
  "notFound.title": "यह पेज नहीं मिला",
  "notFound.text":
    "हो सकता है लिंक पुराना हो, या पते में कोई गलती हो। कुछ भी खोया नहीं है: आपकी सहेजी हुई योजनाएँ इसी ब्राउज़र में हैं।",
  "notFound.home": "होम पेज पर जाएँ",

  "common.cancel": "रद्द करें",
  "common.undo": "वापस लें",
  "common.save": "सहेजें",
  "common.close": "बंद करें",
  "common.rename": "नाम बदलें",
  "common.delete": "हटाएँ",
  "toast.dismiss": "हटा दें",
  "confirm.typeToConfirm": "पुष्टि के लिए {text} लिखें",
  "nav.settings": "सेटिंग",
  "nav.more": "और",
  "nav.plansPricing": "प्लान और कीमतें",
  "nav.section.work": "आपका काम",
  "nav.section.explore": "खोजें",
  "theme.switchToDark": "डार्क मोड पर जाएँ",
  "theme.switchToLight": "लाइट मोड पर जाएँ",
  "nav.help": "मदद",
  "storage.limit":
    "आप अधिकतम {max} योजनाएँ सहेज सकते हैं। नई योजना सहेजने के लिए कोई एक हटाइए।",
  "storage.full":
    "इस ब्राउज़र में आपके डेटा के लिए जगह नहीं बची। कुछ हटाइए या बैकअप निकालिए, फिर कोशिश कीजिए।",
  "storage.unavailable":
    "आपका ब्राउज़र स्टोरेज रोक रहा है, इसलिए यह सहेजा नहीं गया।",
  "storage.failed": "यह सहेजा नहीं जा सका।",
  "storage.notice":
    "आपका ब्राउज़र स्टोरेज रोक रहा है, इसलिए जो भी सहेजेंगे वह इस पेज को बंद करने तक ही रहेगा।",
  "data.export": "मेरा डेटा निकालें",
  "projects.saved": "प्रोजेक्ट में सहेज दिया",
  "projects.updated": "सहेजी हुई योजना अपडेट हो गई",
  "projects.deleted": "योजना हटा दी गई",
  "projects.duplicated": "योजना की कॉपी बन गई",
  "projects.copyTitle": "{title} (कॉपी)",
  "projects.savedOn": "सहेजा गया: {date}",
  "projects.updatedTools": "टूल अपडेट हुए",
  "projects.updatedHint": "आपके सहेजने के बाद टूल अपडेट हुए हैं",
  "projects.rebuilt":
    "आपने यह योजना जब सहेजी थी, उसके बाद टूल अपडेट हुए हैं। इसे आज के डेटा से दोबारा बनाया गया है। नया रूप रखने के लिए इसे फिर से सहेजिए।",
  "projects.open": "खोलें",
  "projects.rename": "{title} का नाम बदलें",
  "projects.duplicate": "{title} की कॉपी बनाएँ",
  "projects.delete": "{title} हटाएँ",
  "projects.renameLabel": "योजना का नाम",
  "projects.menu": "{title} के विकल्प",
  "projects.recent": "हाल के प्रोजेक्ट",
  "projects.viewAll": "सभी देखें",
  "projects.search": "प्रोजेक्ट खोजें",
  "projects.sort": "क्रम",
  "projects.sort.recent": "सबसे नए",
  "projects.sort.name": "नाम",
  "projects.count.one": "{count} सहेजी हुई योजना",
  "projects.count.other": "{count} सहेजी हुई योजनाएँ",
  "projects.empty.title": "अभी कोई योजना सहेजी नहीं है",
  "projects.empty.text":
    "जब आप कोई योजना बनाएँ, तो “सहेजें” चुनिए और वह यहाँ दिखेगी। योजनाएँ सिर्फ़ इसी ब्राउज़र में रहती हैं, और आप उन्हें कभी भी खोल, उनका नाम बदल या उन्हें हटा सकते हैं।",
  "projects.noMatch": "आपकी खोज से कोई सहेजी हुई योजना मेल नहीं खाती।",
  "plan.save": "सहेजें",
  "plan.saved": "सहेजा गया",
  "plan.updateSaved": "सहेजी योजना अपडेट करें",
  "plan.downloadPdf": "PDF डाउनलोड करें",
  "plan.copyShareLink": "शेयर लिंक कॉपी करें",
  "plan.makeOne": "योजना बनाएँ",
  "plan.englishDetails": "टूल की जानकारी अभी अंग्रेज़ी में है।",
  "plan.missing.title": "वह सहेजी हुई योजना यहाँ नहीं है",
  "plan.missing.text":
    "हो सकता है उसे हटा दिया गया हो, या वह किसी दूसरे ब्राउज़र में सहेजी गई थी। योजनाएँ सिर्फ़ उसी डिवाइस पर रहती हैं जहाँ आपने उन्हें सहेजा।",
  "plan.empty.title": "दिखाने के लिए कोई योजना नहीं",
  "plan.empty.text":
    "योजना पाने के लिए अपना लक्ष्य बताइए, या प्रोजेक्ट में से कोई सहेजी हुई योजना खोलिए।",
  "share.copied":
    "लिंक कॉपी हो गया। इसमें आपकी योजना के चुनाव हैं, आपका लिखा लक्ष्य नहीं।",
  "share.copyFailed":
    "लिंक कॉपी नहीं हो सका। फिर कोशिश कीजिए, या दूसरा ब्राउज़र इस्तेमाल कीजिए।",
  "share.tooLong":
    "इस योजना में चुनाव इतने ज़्यादा हैं कि वे शेयर लिंक में नहीं समा सकते।",
  "share.openedNotice":
    "शेयर लिंक से खोला गया। योजना को आज के टूल डेटा से दोबारा बनाया गया है।",
  "share.error.title": "हम यह लिंक नहीं खोल सकते",
  "share.error.tooLarge":
    "यह शेयर लिंक बहुत बड़ा है, इसलिए हमने इसे नहीं खोला।",
  "share.error.malformed":
    "यह शेयर लिंक टूटा हुआ या अधूरा लगता है। नया लिंक माँग लीजिए।",
  "share.error.invalid":
    "इस शेयर लिंक में ऐसी योजना नहीं है जिसे हम पहचानते हों, इसलिए हमने इसे नहीं खोला।",
  "searches.group.today": "आज",
  "searches.group.yesterday": "कल",
  "searches.group.week": "पिछले 7 दिन",
  "searches.group.older": "इससे पुरानी",
  "searches.count.one": "{count} खोज",
  "searches.count.other": "{count} खोजें",
  "searches.clearAll": "पूरा इतिहास मिटाएँ",
  "searches.clearTitle": "क्या पूरा खोज इतिहास मिटाना है?",
  "searches.clearText":
    "इससे इस ब्राउज़र में सहेजी हर खोज हट जाएगी। आपकी सहेजी हुई योजनाओं पर कोई असर नहीं पड़ेगा। इसे वापस नहीं किया जा सकता।",
  "searches.clearConfirm": "इतिहास मिटाएँ",
  "searches.off": "खोज इतिहास बंद है, इसलिए नई खोजें दर्ज नहीं हो रहीं।",
  "searches.openSettings": "इसे सेटिंग में बदलें",
  "searches.empty.title": "अभी कोई खोज नहीं",
  "searches.empty.text":
    "आप जो लक्ष्य खोजेंगे वे यहाँ दिखेंगे, सिर्फ़ इसी ब्राउज़र में, ताकि आप उन्हें बाद में फिर चला सकें।",
  "searches.noMatch": "अभी योजना नहीं है",
  "searches.rerun": "फिर चलाएँ: {goal}",
  "searches.rerunShort": "फिर चलाएँ",
  "searches.delete": "इतिहास से हटाएँ: {goal}",
  "shortcuts.title": "कीबोर्ड शॉर्टकट",
  "shortcuts.search": "खोज बॉक्स पर जाएँ",
  "shortcuts.newPlan": "नई योजना शुरू करें",
  "shortcuts.help": "यह सूची दिखाएँ",
  "shortcuts.note": "किसी बॉक्स में लिखते समय शॉर्टकट काम नहीं करते।",

  "common.on": "चालू",
  "common.off": "बंद",
  "settings.title": "सेटिंग",
  "settings.lede":
    "बदलाव तुरंत लागू होते हैं और सिर्फ़ इसी ब्राउज़र में सहेजे जाते हैं।",
  "settings.general": "सामान्य",
  "settings.language": "भाषा",
  "settings.language.help":
    "बटन, मेन्यू और संदेशों की भाषा बदलती है। टूल की जानकारी अभी अंग्रेज़ी में ही रहती है।",
  "settings.theme": "थीम",
  "settings.theme.help":
    "सिस्टम आपके डिवाइस की हल्की या गहरी सेटिंग के अनुसार चलता है।",
  "settings.motion": "हलचल कम करें",
  "settings.motion.help":
    "चालू करने पर हलचल बहुत कम रहती है। बंद करने पर डिवाइस के कहने पर भी एनिमेशन चलता रहता है। सिस्टम आपके डिवाइस की सेटिंग मानता है।",
  "settings.background": "एनिमेटेड पृष्ठभूमि",
  "settings.background.help":
    "चालू होने पर पेज के पीछे की हल्की नीली रोशनी धीरे-धीरे हिलती है। बंद होने पर वह स्थिर रहती है। हलचल कम करें चालू हो या डिवाइस डेटा बचा रहा हो, तब भी वह स्थिर रहती है।",
  "settings.level": "डिफ़ॉल्ट योजना स्तर",
  "settings.level.help":
    "योजना जिस स्तर पर खुलती है। स्वचालित में स्तर आपके लक्ष्य से चुना जाता है।",
  "settings.level.auto": "स्वचालित",
  "settings.budget": "डिफ़ॉल्ट बजट",
  "settings.budget.help":
    "योजना शुरू करते समय टूल छाँटने के काम आता है। हर योजना पर आप इसे बदल सकते हैं।",
  "settings.budget.none": "तय नहीं",
  "settings.currency": "मुद्रा का प्रदर्शन",
  "settings.currency.help":
    "बजट के विकल्पों के नाम बदलता है। डॉलर की रकमें करीब-करीब बराबर की हैं, आज का विनिमय दर नहीं।",
  "settings.privacy": "गोपनीयता और डेटा",
  "settings.history": "खोज इतिहास सहेजें",
  "settings.history.help":
    "चालू होने पर आपके खोजे हुए लक्ष्य “खोजें” पेज पर दिखते हैं। वे इसी ब्राउज़र में रहते हैं और कहीं भेजे नहीं जाते।",
  "settings.export": "मेरा डेटा निकालें",
  "settings.export.help":
    "अपनी सहेजी योजनाएँ, खोज इतिहास और सेटिंग एक फ़ाइल में डाउनलोड करें।",
  "settings.import": "डेटा लाएँ",
  "settings.import.help":
    "WhichAI से निकाली हुई बैकअप फ़ाइल चुनिए। फ़ाइल 1 MB तक की हो सकती है। कुछ भी अपलोड नहीं होता।",
  "settings.import.choose": "बैकअप फ़ाइल चुनें",
  "settings.clear": "इस डिवाइस का सारा डेटा मिटाएँ",
  "settings.clear.help":
    "इस ब्राउज़र से आपकी सहेजी योजनाएँ, खोज इतिहास और सेटिंग मिट जाती हैं। इसे वापस नहीं किया जा सकता।",
  "settings.clear.button": "सारा डेटा मिटाएँ",
  "settings.clear.title": "क्या इस डिवाइस का सारा डेटा मिटाना है?",
  "settings.clear.text":
    "इससे इस ब्राउज़र से हर सहेजी योजना, आपका खोज इतिहास और आपकी सेटिंग मिट जाएँगी। अगर कभी वापस चाहिए हो सकती हैं, तो पहले बैकअप निकाल लीजिए।",
  "settings.clear.confirm": "सब कुछ मिटाएँ",
  "settings.cleared": "इस डिवाइस का सारा डेटा मिटा दिया गया।",
  "import.plans.one": "{count} सहेजी हुई योजना",
  "import.plans.other": "{count} सहेजी हुई योजनाएँ",
  "import.history.one": "{count} खोज",
  "import.history.other": "{count} खोजें",
  "import.settingsIncluded": "आपकी सेटिंग",
  "import.preview": "इस फ़ाइल में है: {items}।",
  "import.skipped.one": "फ़ाइल की {count} चीज़ सही नहीं थी और छोड़ दी जाएगी।",
  "import.skipped.other":
    "फ़ाइल की {count} चीज़ें सही नहीं थीं और छोड़ दी जाएँगी।",
  "import.mode": "इसे कैसे लाना है?",
  "import.merge": "जो यहाँ है उसमें जोड़ें",
  "import.merge.help":
    "आपके पास जो है वह रखता है और नया जोड़ता है। अगर कोई योजना दोनों में है, तो नई वाली रहती है। आपकी मौजूदा सेटिंग वैसी ही रहती हैं।",
  "import.replace": "जो यहाँ है उसे बदल दें",
  "import.replace.help":
    "आपकी मौजूदा योजनाएँ और इतिहास मिटाकर फ़ाइल की सामग्री रख देता है।",
  "import.button": "लाएँ",
  "import.replaceTitle": "क्या अपना डेटा इस फ़ाइल से बदलना है?",
  "import.replaceText":
    "आपकी मौजूदा सहेजी योजनाएँ और खोज इतिहास मिट जाएँगे और उनकी जगह फ़ाइल की सामग्री आ जाएगी। इसे वापस नहीं किया जा सकता।",
  "import.replaceConfirm": "मेरा डेटा बदलें",
  "import.done": "डेटा आ गया।",
  "import.dropped.one": "सीमा पूरी हो जाने से {count} चीज़ छोड़ दी गई।",
  "import.dropped.other": "सीमा पूरी हो जाने से {count} चीज़ें छोड़ दी गईं।",
  "import.failed": "डेटा सहेजा नहीं जा सका।",
  "import.error.tooLarge": "वह फ़ाइल 1 MB से बड़ी है, इसलिए पढ़ी नहीं गई।",
  "import.error.notJson": "वह फ़ाइल सही बैकअप नहीं है। उसे पढ़ा नहीं जा सका।",
  "import.error.wrongShape":
    "वह फ़ाइल WhichAI का बैकअप नहीं है, या किसी नए संस्करण की है।",
  "import.error.empty": "उस बैकअप में लाने लायक कुछ नहीं है।",
  "import.error.unreadable": "वह फ़ाइल पढ़ी नहीं जा सकी।",
  "settings.account": "खाता",
  "settings.account.signedIn": "{provider} से {name} के रूप में साइन इन हैं।",
  "settings.account.signedOut":
    "आप साइन इन नहीं हैं। खाते के बिना भी आप सब कुछ इस्तेमाल कर सकते हैं।",
  "settings.account.signIn": "साइन इन करें",
  "settings.about": "परिचय और कानूनी",
  "settings.about.version": "संस्करण {version}",
  "settings.about.privacy": "गोपनीयता",
  "settings.about.security": "सुरक्षा नीति",
  "settings.about.github": "GitHub रिपॉज़िटरी",
  "settings.about.feedback": "सुझाव भेजें",
  "settings.about.about": "WhichAI के बारे में",
  "settings.about.help": "मदद",
  "link.newTab": " (नए टैब में खुलेगा)",

  "content.back": "होम पर वापस जाएँ",
  "help.title": "मदद",
  "help.lede": "सबसे ज़्यादा पूछे जाने वाले सवालों के छोटे जवाब।",
  "help.q1": "WhichAI क्या करता है?",
  "help.a1":
    "आप अपना लक्ष्य बताते हैं, और WhichAI बताता है कि कौन से AI टूल इस्तेमाल करें और कैसे, तीन स्तरों पर: सरल, निखरा हुआ और उन्नत। यह एक मार्गदर्शक है, चैटबॉट नहीं, और यह आपका काम खुद नहीं करता।",
  "help.q2": "टूल पर “जाँचा नहीं गया” क्यों लिखा है?",
  "help.a2":
    "हर टूल का रिकॉर्ड तब तक नमूना ही है जब तक कोई उसे टूल के आधिकारिक पेज से मिलाकर जाँच न ले। तब तक सुझाव संपादकीय अनुमान हैं, और कीमतें, सीमाएँ और तारीखें अस्थायी हैं। हर कार्ड यह बताता है, और जाँच होने पर जाँच की तारीख दिखाता है।",
  "help.q3": "मेरा डेटा कहाँ रहता है?",
  "help.a3":
    "आपके अपने डिवाइस पर, आपके ब्राउज़र में। सहेजी योजनाएँ, खोज इतिहास और सेटिंग उससे बाहर नहीं जातीं, और हमारे पास कोई डेटाबेस नहीं है। आपकी थीम और भाषा एक छोटी पसंद वाली कुकी में भी रखी जाती हैं ताकि पेज आपकी पसंद के अनुसार खुलें। ब्योरा गोपनीयता पेज पर है।",
  "help.q4": "योजना कैसे शेयर करूँ?",
  "help.a4":
    "कोई योजना खोलिए और “शेयर लिंक कॉपी करें” चुनिए। लिंक में आपकी योजना के चुनाव होते हैं, आपके लिखे शब्द नहीं, और वे # के बाद रहते हैं इसलिए हमारे सर्वर को कभी नहीं भेजे जाते। जो भी लिंक खोलेगा, उसे आज के टूल डेटा से दोबारा बनी योजना दिखेगी।",
  "help.q5": "अपना डेटा कैसे मिटाऊँ?",
  "help.a5":
    "प्रोजेक्ट से कोई एक योजना या खोजें से कोई एक खोज हटाइए, या सेटिंग खोलकर “इस डिवाइस का सारा डेटा मिटाएँ” चुनिए। वापस चाहिए हो सकता है तो पहले बैकअप निकाल लीजिए।",
  "help.q6": "क्या यह मुफ़्त है?",
  "help.a6":
    "हाँ। WhichAI के पीछे न विज्ञापन हैं, न ट्रैकर, न कोई पैसे वाली सेवा। अगर किसी योजना के टूल का पैसे वाला प्लान है, तो योजना यह बताती है।",
  "help.moreTitle": "और",
  "help.shortcuts": "कहीं भी ? दबाइए, कीबोर्ड शॉर्टकट दिख जाएँगे।",
  "help.more.about": "सुझाव कैसे बनते हैं",
  "help.more.privacy": "गोपनीयता",
  "help.more.feedback": "सुझाव भेजें",
  "about.title": "WhichAI के बारे में",
  "about.lede":
    "WhichAI एक निष्पक्ष मार्गदर्शक है जो बताता है कि आपके लक्ष्य के लिए कौन से AI टूल इस्तेमाल करें।",
  "about.what.title": "यह क्या है",
  "about.what.text":
    "आप बताते हैं कि क्या करना चाहते हैं, जैसे पोर्टफ़ोलियो वेबसाइट बनाना या पढ़ाई की योजना। WhichAI हर चरण के लिए टूल चुनता है और एक ही योजना तीन स्तरों पर दिखाता है, ताकि आप सरल से शुरू करके आगे बढ़ सकें। यह चैटबॉट नहीं है, और आपका काम खुद नहीं करता।",
  "about.how.title": "सुझाव कैसे बनते हैं",
  "about.how.text1":
    "सुझाव इस प्रोजेक्ट में रखे जाँचे हुए डेटा से आते हैं, बनाए हुए लिखित पाठ से नहीं। सीधे-सादे नियम आपका लक्ष्य पढ़ते हैं, फिर देखते हैं कि कौन सा टूल हर काम, आपके स्तर, आपके बजट और आप जो टूल पहले से इस्तेमाल करते हैं, उनसे कितना मेल खाता है। एक जैसे इनपुट पर योजना भी एक जैसी बनती है।",
  "about.how.text2":
    "उपयुक्तता के अंक संपादकीय अनुमान हैं, परीक्षण के नतीजे नहीं। शामिल होने या ऊपर दिखने के लिए कोई पैसे नहीं देता।",
  "about.honest.title": "ईमानदारी",
  "about.honest.item1":
    "किसी टूल को सत्यापित तभी माना जाता है जब किसी व्यक्ति ने उसका रिकॉर्ड आधिकारिक पेज से जाँच लिया हो।",
  "about.honest.item2":
    "अगर आपके लक्ष्य की योजना WhichAI के पास नहीं है, तो वह अंदाज़ा लगाने की जगह साफ़ कह देता है।",
  "about.honest.item3":
    "कीमतें और सीमाएँ बदलती रहती हैं, इसलिए हर योजना पैसे देने से पहले आधिकारिक पेज देखने को कहती है।",
  "about.free.title": "मुफ़्त और बिना ट्रैकिंग",
  "about.free.text":
    "WhichAI सिर्फ़ मुफ़्त चीज़ों पर चलता है। इसमें कोई पैसे वाली सेवा, विज्ञापन या एनालिटिक्स नहीं है, और आप जो सहेजते हैं वह आपके डिवाइस पर ही रहता है।",
  "about.source": "कोड GitHub पर खुला है",
  "privacy.title": "गोपनीयता",
  "privacy.lede":
    "WhichAI आपकी जानकारी के साथ क्या करता है, सीधी भाषा में। आख़िरी अपडेट: {date}।",
  "privacy.receive.title": "हमें क्या मिलता है",
  "privacy.receive.text1":
    "जब आप Google से साइन इन करते हैं, तो Google हमें आपका नाम और उसके यहाँ आपके खाते की अलग पहचान बताता है। हम नाम से आपका स्वागत करते हैं और पहचान से अगली बार उसी खाते को पहचानते हैं।",
  "privacy.receive.text2":
    "हम जो अनुमतियाँ माँगते हैं उनमें आपका ईमेल पता भी आता है। हम उसे न पढ़ते हैं, न रखते हैं, न इस्तेमाल करते हैं। आपका Google पासवर्ड हम कभी नहीं देखते; आप उसे Google के अपने पेज पर ही लिखते हैं। ईमेल पते और पासवर्ड से बने खातों के बारे में प्रीव्यू खाते वाला भाग देखें।",
  "privacy.store.title": "हम क्या रखते हैं",
  "privacy.store.text1":
    "हमारे पास कोई डेटाबेस नहीं है। आपके बारे में कुछ भी हमारे सर्वर पर नहीं रखा जाता। हम आपके डिवाइस पर जो रखते हैं, वह कुकीज़ और आपके डिवाइस पर क्या रहता है में बताया गया है।",
  "privacy.device.title": "आपके डिवाइस पर क्या रहता है",
  "privacy.device.text1":
    "सहेजी योजनाएँ, खोज इतिहास और सेटिंग आपके ब्राउज़र में रहती हैं, IndexedDB में, या वह न मिले तो लोकल स्टोरेज में। वे आपके डिवाइस से बाहर नहीं जातीं, हम उन्हें नहीं देख सकते, और उनका बैकअप कोई नहीं रखता। एक कॉपी रखने के लिए सेटिंग में “मेरा डेटा निकालें” इस्तेमाल कीजिए।",
  "privacy.device.item1":
    "सहेजी योजनाएँ: योजना को दोबारा बनाने वाले चुनाव (लक्ष्य का प्रकार, विकल्प, स्तर, बजट, आपके इस्तेमाल के टूल) और एक नाम जिसे आप बदल सकते हैं। योजना खुद हर बार नए सिरे से बनती है।",
  "privacy.device.item2":
    "खोज इतिहास: आपके खोजे हुए लक्ष्य, तारीख के साथ। इसे सेटिंग में बंद कर सकते हैं, एक-एक करके हटा सकते हैं, या पूरा साफ़ कर सकते हैं।",
  "privacy.device.item3":
    "सेटिंग: भाषा, थीम, हलचल, योजना के डिफ़ॉल्ट और मुद्रा का प्रदर्शन।",
  "privacy.device.text3":
    "शेयर लिंक में योजना के चुनाव पते में # के बाद रहते हैं। ब्राउज़र वह हिस्सा किसी सर्वर को नहीं भेजते, इसलिए हमें वह कभी नहीं मिलता।",
  "privacy.device.news":
    "AI समाचार हमारा सर्वर आधिकारिक साइटों की सार्वजनिक फ़ीड से पढ़ता है, और जब तक आप कोई सुर्खी नहीं खोलते आपका ब्राउज़र उन साइटों से संपर्क नहीं करता। कौन-सी सुर्खी आपके सहेजे प्लान पर असर डालती है, यह आपके डिवाइस पर आपके सहेजे प्लान से तय होता है, और इसमें से कुछ भी कहीं नहीं भेजा जाता।",
  "privacy.never.title": "जो हम नहीं करते",
  "privacy.never.item1": "हम आपकी जानकारी बेचते या बाँटते नहीं।",
  "privacy.never.item2": "हम आपको ट्रैक नहीं करते और विज्ञापन नहीं दिखाते।",
  "privacy.never.item3":
    "हम पासवर्ड न पाते हैं, न इकट्ठा करते हैं। प्रीव्यू खाते का पासवर्ड आपके ब्राउज़र के भीतर जाँचा जाता है और वहीं सिर्फ़ हैश के रूप में रहता है।",
  "privacy.never.item4": "हम आपको ईमेल नहीं भेजते।",
  "privacy.signout.title": "साइन आउट करना और छोड़ना",
  "privacy.signout.text":
    "साइडबार में नीचे अपना नाम चुनिए, फिर “साइन आउट करें”। Google साइन इन में इससे कुकी मिट जाती है; WhichAI की पहुँच भी हटानी हो तो उसे अपने Google खाते की सुरक्षा सेटिंग में रद्द कर दीजिए। प्रीव्यू खाते में इससे सत्र खत्म होता है, पर खाता इस ब्राउज़र में तब तक रहता है जब तक आप उसे हटा न दें। अतिथि उसी मेन्यू से “साइन इन करें” चुन सकते हैं।",
  "privacy.contact.title": "संपर्क",
  "privacy.contact.text":
    "सवाल या चिंता: संपर्क पेज इस्तेमाल करें, जो GitHub पर एक इश्यू खोलता है। सुरक्षा की समस्याएँ प्रोजेक्ट के GitHub रिपॉज़िटरी के Security टैब से निजी तौर पर बताई जा सकती हैं।",
  "privacy.contact.email": "आप {email} पर भी लिख सकते हैं।",
  "account.menu": "खाता मेन्यू",

  // Plans and pricing
  "plan.label": "{plan} प्लान",
  "plan.upgrade": "प्लान अपग्रेड करें",
  "plan.subscription": "सब्सक्रिप्शन",
  "pricing.title": "कीमतें",
  "pricing.description":
    "भारतीय रुपये में WhichAI के प्लान। फ्री में योजना बनाना, टूल लाइब्रेरी और तुलना शामिल है; सशुल्क प्लान अभी शुरू नहीं हुए हैं।",
  "pricing.lede":
    "फ्री में योजना बनाना, टूल लाइब्रेरी, तुलना और लाइव समाचार शामिल हैं। सशुल्क प्लान में अलर्ट, सिंक और टीम सुविधाएँ जुड़ती हैं, और वे आने वाले अपडेट में खुलेंगे।",
  "pricing.billing.label": "बिलिंग अवधि",
  "pricing.billing.monthly": "मासिक",
  "pricing.billing.yearly": "वार्षिक",
  "pricing.billing.yearlyNote": "वार्षिक बिलिंग: {saving}",
  "pricing.perMonth": "/माह",
  "pricing.perYear": "/वर्ष",
  "pricing.monthsFree.one": "{count} महीना मुफ़्त",
  "pricing.monthsFree.other": "{count} महीने मुफ़्त",
  "pricing.saveAmount": "साल में {amount} की बचत",
  "pricing.smallPrint": "कीमतें भारतीय रुपये में हैं। कर लग सकते हैं।",
  "pricing.plannedNote":
    "सशुल्क प्लान की सुविधाएँ योजना में हैं। वे अभी उपलब्ध नहीं हैं, और अभी कोई सब्सक्राइब नहीं कर सकता।",
  "pricing.plans.label": "प्लान",
  "pricing.included.label": "{plan} में क्या शामिल है",
  "pricing.everythingIn": "{plan} की सब सुविधाएँ, और साथ में:",
  "pricing.choose": "{plan} चुनें",
  "pricing.currentPlan": "मौजूदा प्लान",
  "pricing.contactUs": "संपर्क करें",
  "pricing.institution.audience": "कॉलेजों और कोचिंग केंद्रों के लिए",
  "pricing.institution.priceNote": "कोई तय कीमत नहीं है। हमसे संपर्क करें।",
  "pricing.institution.subject": "हमारे संस्थान के लिए WhichAI",
  "pricing.table.title": "प्लान की तुलना",
  "pricing.table.feature": "सुविधा",
  "pricing.table.included": "शामिल",
  "pricing.table.notIncluded": "शामिल नहीं",
  "pricing.table.limits": "सीमाएँ",
  "pricing.faq.title": "सवाल",
  "pricing.faq.q1": "क्या मैं WhichAI मुफ़्त में इस्तेमाल कर सकता हूँ?",
  "pricing.faq.a1":
    "हाँ। फ्री प्लान में वह सब है जो आज काम करता है: तीन स्तरों पर योजनाएँ, टूल लाइब्रेरी और तुलना, लाइव AI समाचार, इस ब्राउज़र में सहेजी योजनाएँ, शेयर लिंक, PDF एक्सपोर्ट, और अंग्रेज़ी व हिन्दी। इसकी कोई समय-सीमा नहीं है।",
  "pricing.faq.q2": "अपग्रेड करने पर मेरी सहेजी योजनाओं का क्या होगा?",
  "pricing.faq.a2":
    "कुछ नहीं। आपकी सहेजी योजनाएँ इसी ब्राउज़र में वैसी ही रहेंगी और काम करती रहेंगी। उन्हें डिवाइसों के बीच सिंक करना प्लस की योजनाबद्ध सुविधाओं में से एक है।",
  "pricing.faq.q3": "क्या मैं कभी भी रद्द कर सकता हूँ?",
  "pricing.faq.a3":
    "योजना यही है: आप जब चाहें सेटिंग से रद्द कर सकेंगे। सशुल्क प्लान अभी शुरू नहीं हुए हैं, इसलिए आज रद्द करने को कुछ नहीं है। ब्योरा रिफंड नीति के मसौदे में है।",
  "pricing.faq.q4": "क्या छात्रों के लिए छूट है?",
  "pricing.faq.a4":
    "अभी नहीं। आज कोई छूट नहीं है। कॉलेज और कोचिंग केंद्र संस्थान प्लान के बारे में पूछ सकते हैं, जो छात्रों की पहुँच के लिए है।",
  "pricing.faq.q5": "मैं कब सब्सक्राइब कर सकूँगा?",
  "pricing.faq.a5":
    "सशुल्क प्लान आने वाले अपडेट में खुलेंगे। कोई तारीख तय नहीं है। तब तक सब फ्री प्लान पर हैं और कुछ भी नहीं लिया जाता।",

  // Checkout preview
  "checkout.title": "चेकआउट पूर्वावलोकन",
  "checkout.lede":
    "यह चेकआउट का पूर्वावलोकन है। भुगतान अभी शुरू नहीं हुए हैं, इसलिए कुछ खरीदा नहीं जा सकता।",
  "checkout.summary": "ऑर्डर का सार",
  "checkout.plan": "प्लान",
  "checkout.billing": "बिलिंग",
  "checkout.billing.label": "बिलिंग अवधि",
  "checkout.price": "कीमत",
  "checkout.account": "खाता",
  "checkout.included": "आपको क्या मिलेगा",
  "checkout.changePlan": "प्लान बदलें",
  "checkout.signedInAs": "{name} के रूप में साइन इन",
  "checkout.signInNeeded": "आपसे साइन इन करने को कहा जाएगा",
  "checkout.pay": "{amount} चुकाएँ",
  "checkout.noDetails":
    "इस पेज पर कार्ड, UPI या बैंक की जानकारी नहीं माँगी जाती।",

  // Subscription dialog and settings
  "subscription.dialog.title": "भुगतान अभी शुरू नहीं हुए",
  "subscription.dialog.text":
    "भुगतान आने वाले अपडेट में शुरू होंगे। कोई पैसा नहीं लिया गया है और भुगतान की कोई जानकारी नहीं ली गई।",
  "subscription.dialog.back": "प्लान पर वापस जाएँ",
  "subscription.dialog.close": "बंद करें",
  "settings.subscription": "सब्सक्रिप्शन",
  "settings.subscription.current": "मौजूदा प्लान",
  "settings.subscription.price": "{amount} प्रति माह",
  "settings.subscription.includes": "आपके प्लान में शामिल",
  "settings.subscription.note":
    "सशुल्क प्लान आने वाले अपडेट में खुलेंगे। आज कुछ भी नहीं लिया जाता।",
  "settings.subscription.viewPlans": "प्लान देखें",
  "settings.subscription.manage": "सब्सक्रिप्शन प्रबंधित करें",

  // Legal pages
  "legal.draft": "मसौदा: सशुल्क प्लान शुरू होने से पहले इसकी समीक्षा की जाएगी।",
  "legal.updated": "अंतिम अपडेट: {date}",
  "legal.nav.label": "कानूनी और संपर्क",
  "legal.terms": "शर्तें",
  "legal.refund": "रिफंड नीति",
  "legal.privacy": "गोपनीयता",
  "legal.contact": "संपर्क",
  "terms.title": "सेवा की शर्तें",
  "terms.lede": "WhichAI के उपयोग के नियम, सरल भाषा में।",
  "refund.title": "रिफंड और रद्दीकरण नीति",
  "refund.lede":
    "सशुल्क प्लान शुरू होने पर रद्द करना और रिफंड कैसे काम करने चाहिए।",
  "refund.today.title": "आज",
  "refund.today.text":
    "अभी कुछ खरीदा नहीं जा सकता और किसी से पैसा नहीं लिया गया है, इसलिए रद्द करने या लौटाने को कुछ नहीं है।",
  "refund.cancel.title": "रद्द करना",
  "refund.cancel.text":
    "आप किसी भी समय सेटिंग से रद्द कर सकेंगे। रद्द करने से अगला नवीनीकरण रुक जाता है। जिस अवधि का आप भुगतान कर चुके हैं, उसके अंत तक प्लान आपके पास रहता है।",
  "refund.refunds.title": "रिफंड",
  "refund.refunds.text":
    "रिफंड के नियम, समय-सीमा सहित, यहाँ लिखे जाएँगे और किसी के भुगतान करने से पहले चेकआउट पेज पर दिखाए जाएँगे। यह मसौदा अभी रिफंड की कोई अवधि नहीं देता।",
  "refund.how.title": "कैसे माँगें",
  "refund.how.text":
    "संपर्क पेज का उपयोग करें और बताएँ कि कौन-सा प्लान और कौन-सा भुगतान। कार्ड, UPI या बैंक की जानकारी ईमेल से न भेजें।",
  "contact.title": "संपर्क",
  "contact.lede":
    "WhichAI एक छोटा प्रोजेक्ट है जिसे एक व्यक्ति चलाता है। सब कुछ GitHub के ज़रिए होता है, और जवाब आने में कुछ दिन लग सकते हैं।",
  "contact.email.title": "ईमेल",
  "contact.email.text": "प्लान, कीमत या आपके डेटा के बारे में सवालों के लिए:",
  "contact.feedback.title": "सवाल और फ़ीडबैक",
  "contact.feedback.text":
    "सवाल, टूल के गलत रिकॉर्ड, बग या किसी विचार के लिए GitHub पर इश्यू खोलें। यह सार्वजनिक है, इसलिए निजी जानकारी न लिखें।",
  "contact.feedback.link": "फ़ीडबैक भेजें",
  "contact.security.title": "सुरक्षा की समस्याएँ",
  "contact.security.text":
    "इन्हें GitHub के ज़रिए निजी तौर पर बताएँ। सार्वजनिक इश्यू न खोलें।",
  "contact.security.link": "सुरक्षा समस्या की रिपोर्ट करें",
  "contact.institution.title": "कॉलेज और संस्थान",
  "contact.institution.text":
    "एक इश्यू खोलें और अपने संस्थान का नाम तथा लगभग कितने छात्र हैं, बताएँ।",
  "contact.institution.link": "संस्थान प्लान के बारे में पूछें",

  // Parts and missed goals
  "understanding.didYouMean": "क्या आपका मतलब इनमें से कोई था?",
  "understanding.partsOnly":
    "हमें कुछ हिस्से मिले, लेकिन कोई लक्ष्य उनसे ठीक से मेल नहीं खाता।",
  "understanding.buildFromParts": "जो हिस्से मैंने बताए, उनसे योजना बनाएँ",
  "understanding.addPart": "हिस्सा जोड़ें",
  "parts.title": "हिस्सा जोड़ें",
  "parts.help":
    "एक हिस्सा चुनिए, हम उसके लिए टूल चुन देंगे। आप उसे बाद में हटा भी सकते हैं।",
  "parts.search": "हिस्से खोजें",
  "parts.none": "इससे कोई हिस्सा मेल नहीं खाता। कोई और शब्द आज़माइए।",
  "parts.results.one": "{count} हिस्सा",
  "parts.results.other": "{count} हिस्से",
  "parts.inPlan": "आपकी योजना में है",
  "parts.add": "{label} जोड़ें",
  "plan.addPart": "हिस्सा जोड़ें",
  "plan.addPartHelp":
    "कुछ ऐसा चाहिए जो इस योजना में नहीं है? हिस्सा जोड़ें, हम उसके लिए टूल चुन देंगे।",
  "plan.partAdded": "{job} जोड़ दिया।",
  "plan.partRemoved": "{job} योजना से हटा दिया।",
  "plan.partCovered": "{job} इस योजना के किसी और टूल से पहले ही हो जाता है।",
  "job.removePart": "{job} को योजना से हटाएँ",
  "job.removePartShort": "यह हिस्सा हटाएँ",
  "settings.improve": "WhichAI को बेहतर बनाने में मदद करें",
  "settings.improve.help":
    "जो लक्ष्य WhichAI नहीं समझ पाया, वे केवल इस डिवाइस पर रहते हैं, जब तक खोज इतिहास चालू है। जब तक आप बटन दबाकर GitHub इश्यू खुद जमा नहीं करते, कुछ भी नहीं भेजा जाता। भेजने से पहले आप इश्यू बदल सकते हैं।",
  "settings.improve.count.one": "{count} लक्ष्य इस डिवाइस पर रखा है",
  "settings.improve.count.other": "{count} लक्ष्य इस डिवाइस पर रखे हैं",
  "settings.improve.none": "अब तक कोई लक्ष्य छूटा नहीं है।",
  "settings.improve.reason.no-match": "समझ नहीं आया",
  "settings.improve.reason.parts-only": "सिर्फ़ हिस्सों से बना",
  "settings.improve.reason.unsure": "पक्का नहीं था",
  "settings.improve.send": "GitHub इश्यू खोलें",
  "settings.improve.clear": "यह सूची मिटाएँ",
  "settings.improve.cleared": "छूटे हुए लक्ष्यों की सूची मिटा दी गई।",
  "privacy.device.item4":
    "जो लक्ष्य हम नहीं समझ पाए: अधिकतम 50, केवल तब तक जब तक खोज इतिहास चालू है। जब तक आप सेटिंग से GitHub इश्यू खोलकर जमा नहीं करते, ये कहीं नहीं भेजे जाते। आप इन्हें वहीं मिटा सकते हैं।",

  // No-match card
  "noMatch.search": "सभी लक्ष्यों में खोजें",
  "noMatch.searchResults": "मेल खाते लक्ष्य",
  "noMatch.results.one": "{count} लक्ष्य मेल खाता है",
  "noMatch.results.other": "{count} लक्ष्य मेल खाते हैं",
  "noMatch.noResults":
    "इससे कोई लक्ष्य मेल नहीं खाता। कोई और शब्द आज़माइए, या ऊपर अपने शब्दों में बताइए।",
  "noMatch.seeAll": "सभी लक्ष्य देखें",
  "noMatch.hideAll": "कम लक्ष्य दिखाएँ",
  "goalGroup.sites-and-apps": "वेबसाइट और ऐप",
  "goalGroup.create": "बनाना",
  "goalGroup.study": "पढ़ाई",
  "goalGroup.work": "काम और व्यापार",
  "goalGroup.ai": "AI टूल",
};
