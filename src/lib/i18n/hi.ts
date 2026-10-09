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
  "nav.comparePlans": "योजनाओं की तुलना",
  "nav.signIn": "साइन इन करें",
  "nav.signOut": "साइन आउट करें",
  "theme.label": "थीम",
  "theme.system": "सिस्टम",
  "theme.light": "हल्की",
  "theme.dark": "गहरी",

  // News panel
  "news.title": "AI समाचार",
  "news.sample": "नमूना सामग्री",
  "news.collapse": "AI समाचार छोटा करें",
  "news.expand": "AI समाचार बड़ा करें",
  "news.visit": "{source} देखें (नए टैब में खुलेगा)",

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
  "home.englishOnly": "अभी लक्ष्य अंग्रेज़ी में लिखने पर ही समझे जाते हैं।",

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
  "plan.sampleNotice.strong": "नमूना डेटा, जाँचा हुआ नहीं:",
  "plan.sampleNotice.rest":
    "टूल के सुझाव संपादकीय अनुमान हैं, और कीमतें, सीमाएँ और तारीखें तब तक अस्थायी हैं जब तक हर रिकॉर्ड की जाँच नहीं हो जाती।",
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
  "source.tested": "परखा हुआ",
  "source.official-docs": "आधिकारिक दस्तावेज़",
  "source.user-reported": "उपयोगकर्ताओं की जानकारी",
  "source.sample": "नमूना डेटा",
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
  "job.source": "स्रोत: {source}",
  "job.lastVerified": "आख़िरी जाँच: {date}",
  "job.notVerified": "जाँचा नहीं गया",
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
  "signin.title": "WhichAI में साइन इन करें",
  "signin.lede":
    "अपनी योजनाएँ सँभालने के लिए साइन इन करें। अभी आपकी योजनाएँ इसी ब्राउज़र में रहती हैं।",
  "signin.continueWith": "{method} से जारी रखें",
  "signin.method.email": "ईमेल",
  "signin.method.phone": "फ़ोन नंबर",
  "signin.or": "या",
  "signin.comingSoon": "{name} से साइन इन अगले अपडेट में आ रहा है।",
  "signin.opening": "{name} साइन इन खुल रहा है",
  "signin.dismiss": "बिना साइन इन किए जारी रखें",
  "signin.fine":
    "हमें Google या GitHub से सिर्फ़ आपका नाम मिलता है। आपका पासवर्ड हम कभी नहीं देखते।",
  "signin.privacy": "गोपनीयता",
  "signin.close": "साइन इन बंद करें",
  "auth.error.not-configured": "इस सर्वर पर साइन इन चालू नहीं किया गया है।",
  "auth.error.failed": "हम आपको साइन इन नहीं कर सके। कृपया फिर कोशिश कीजिए।",
  "auth.error.denied":
    "साइन इन रद्द कर दिया गया। आप जब चाहें फिर कोशिश कर सकते हैं।",
  "auth.error.rate-limited":
    "बहुत ज़्यादा कोशिशें हो गईं। कृपया एक मिनट रुककर फिर कोशिश कीजिए।",

  // Coming soon pages
  "comingSoon.status": "जल्द आ रहा है",
  "comingSoon.back": "होम पर वापस जाएँ",
  "comingSoon.toolLibrary":
    "जाँची हुई जानकारी के साथ AI टूल की एक लाइब्रेरी आगे के किसी संस्करण में आएगी।",
  "comingSoon.whatChanged":
    "AI टूल और प्लान में हुए जाँचे हुए बदलावों की सूची आगे के किसी संस्करण में आएगी।",
  "comingSoon.comparePlans":
    "अलग-अलग टूल के प्लान की आमने-सामने तुलना आगे के किसी संस्करण में आएगी।",

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
};
