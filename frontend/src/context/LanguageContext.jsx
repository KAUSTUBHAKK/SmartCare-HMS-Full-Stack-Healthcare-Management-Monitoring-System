import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'mc_language';
const LANGUAGES = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'hi', short: 'हि', label: 'हिंदी' },
  { code: 'mr', short: 'म', label: 'मराठी' },
];

const protectedWords = new Set([
  'MediCare', 'Medicare', 'AI', 'API', 'JWT', 'PDF', 'OCR', 'BMI', 'ICU', 'MongoDB', 'Atlas', 'React',
  'Node.js', 'Express', 'Socket.IO', 'CORS', 'GitHub', 'JavaScript', 'Python', 'Render', 'Overleaf'
]);

const phrases = {
  hi: [
    ['Your Health Home', 'मेरा स्वास्थ्य केंद्र'], ['Welcome back', 'वापस स्वागत है'],
    ['Here is a calm, clear view of your health today.', 'आज आपके स्वास्थ्य की साफ और शांत जानकारी यहां है।'],
    ['Today’s Wellness', 'आज का स्वास्थ्य'], ['Daily Activity', 'दैनिक गतिविधि'], ['All-time records', 'सभी पुराने रिकॉर्ड'],
    ['Scheduled visits', 'तय की गई मुलाकातें'], ['Confirmed or scheduled', 'पुष्टि हुई या तय की गई'], ['Marked as taken', 'ली हुई के रूप में दर्ज'],
    ['Next-Gen Healthcare', 'नई पीढ़ी की स्वास्थ्य सेवा'], ['Next-Gen', 'नई पीढ़ी'], ['Full Stack', 'फुल स्टैक'], ['Healthcare', 'स्वास्थ्य सेवा'], ['Health Care', 'स्वास्थ्य सेवा'],
    ['Sign In', 'लॉग इन'], ['SIGN IN', 'लॉग इन'], ['Register', 'पंजीकरण'], ['CREATE ACCOUNT', 'खाता बनाएं'], ['Please wait', 'कृपया प्रतीक्षा करें'], ['Welcome to', 'स्वागत है'], ['Loading', 'लोड हो रहा है'],
    ['Patient Demo', 'रोगी डेमो'], ['Doctor Demo', 'डॉक्टर डेमो'], ['Admin Demo', 'प्रशासन डेमो'], ['DEMO CREDENTIALS', 'डेमो लॉगिन जानकारी'],
    ['Or just click a demo button above to auto-fill credentials, then Sign In.', 'ऊपर दिए गए डेमो बटन पर क्लिक करें, जानकारी अपने आप भर जाएगी, फिर लॉग इन करें।'],
    ['Patient registration', 'रोगी पंजीकरण'], ['Doctor and administrator accounts are created securely by hospital administration.', 'डॉक्टर और प्रशासन खाते अस्पताल प्रशासन द्वारा सुरक्षित रूप से बनाए जाते हैं।'],
    ['Name is required', 'नाम जरूरी है'], ['Something went wrong', 'कुछ गलत हुआ'], ['Logged out successfully', 'सफलतापूर्वक लॉग आउट हुआ'],
    ['Dashboard', 'डैशबोर्ड'], ['Admin Console', 'प्रशासन कंसोल'], ['Hospital Administration', 'अस्पताल प्रशासन'], ['Command Center', 'कमांड सेंटर'], ['Operations Command Center', 'संचालन कमांड सेंटर'], ['Operations Dashboard', 'संचालन डैशबोर्ड'],
    ['AI Health Chat', 'AI स्वास्थ्य चैट'], ['Book Appointment', 'अपॉइंटमेंट बुक करें'], ['My Appointments', 'मेरे अपॉइंटमेंट'], ['Appointment Ledger', 'अपॉइंटमेंट रजिस्टर'], ['Appointments', 'अपॉइंटमेंट'], ['Appointment', 'अपॉइंटमेंट'],
    ['My Records', 'मेरे रिकॉर्ड'], ['Health Records', 'स्वास्थ्य रिकॉर्ड'], ['All Records', 'सभी रिकॉर्ड'], ['Patient Records', 'रोगी रिकॉर्ड'], ['Reports Vault', 'रिपोर्ट भंडार'],
    ['Symptom Checker', 'लक्षण जांच'], ['Image Disease AI', 'फोटो से रोग पहचान AI'], ['Medicine OCR', 'दवा OCR'], ['AI Report PDF', 'AI रिपोर्ट PDF'], ['Medical Timeline', 'चिकित्सा समयरेखा'], ['Patient Timeline', 'रोगी समयरेखा'], ['Patient Timelines', 'रोगी समयरेखाएं'],
    ['Med Reminders', 'दवा रिमाइंडर'], ['Body Age AI', 'शरीर उम्र AI'], ['BMI Calculator', 'BMI कैलकुलेटर'], ['Privacy & Access', 'गोपनीयता और एक्सेस'],
    ['ICU Live Monitor', 'ICU लाइव मॉनिटर'], ['War Room', 'वार रूम'], ['Epidemic Radar', 'महामारी रडार'], ['Consultation Desk', 'परामर्श डेस्क'], ['AI Assistant', 'AI सहायक'], ['Risk Scanner', 'जोखिम स्कैनर'], ['Scan Review', 'स्कैन समीक्षा'], ['Admin Command', 'प्रशासन कमांड'],
    ['Emergency Services Active', 'आपातकालीन सेवाएं सक्रिय'], ['CALL 108', '108 पर कॉल करें'], ['Call 108', '108 पर कॉल करें'], ['All Emergencies', 'सभी आपात स्थितियां'], ['Install Medicare.AI', 'Medicare.AI इंस्टॉल करें'], ['INSTALL', 'इंस्टॉल'], ['EXIT', 'बाहर जाएं'],
    ['Systems Online', 'सिस्टम चालू हैं'], ['Review Queue', 'समीक्षा कतार'], ['Registered Patients', 'पंजीकृत रोगी'], ['Clinical Staff', 'चिकित्सा कर्मचारी'], ['Active patient profiles', 'सक्रिय रोगी प्रोफाइल'], ['Verified doctor accounts', 'सत्यापित डॉक्टर खाते'], ['AI scans needing attention', 'ध्यान देने वाले AI स्कैन'], ['Stored patient summaries', 'सहेजे गए रोगी सारांश'], ['Patient reminder plans', 'रोगी रिमाइंडर योजना'],
    ['Full Name', 'पूरा नाम'], ['Email address', 'ईमेल पता'], ['Password', 'पासवर्ड'], ['Age', 'उम्र'], ['Phone', 'फोन'], ['Specialization', 'विशेषज्ञता'],
    ['Quick Questions', 'त्वरित प्रश्न'], ['Common Questions', 'सामान्य प्रश्न'], ['Question', 'प्रश्न'], ['Questions', 'प्रश्न'], ['Answer', 'उत्तर'], ['Search', 'खोजें'],
  ],
  mr: [
    ['Your Health Home', 'माझे आरोग्य केंद्र'], ['Welcome back', 'परत स्वागत आहे'],
    ['Here is a calm, clear view of your health today.', 'आज तुमच्या आरोग्याची शांत आणि स्पष्ट माहिती येथे आहे.'],
    ['Today’s Wellness', 'आजचे आरोग्य'], ['Daily Activity', 'दैनंदिन हालचाल'], ['All-time records', 'सर्व जुने रेकॉर्ड'],
    ['Scheduled visits', 'ठरलेल्या भेटी'], ['Confirmed or scheduled', 'निश्चित किंवा ठरलेले'], ['Marked as taken', 'घेतले म्हणून नोंदले'],
    ['Next-Gen Healthcare', 'नव्या पिढीची आरोग्य सेवा'], ['Next-Gen', 'नवी पिढी'], ['Full Stack', 'फुल स्टॅक'], ['Healthcare', 'आरोग्य सेवा'], ['Health Care', 'आरोग्य सेवा'],
    ['Sign In', 'लॉग इन'], ['SIGN IN', 'लॉग इन'], ['Register', 'नोंदणी'], ['CREATE ACCOUNT', 'खाते तयार करा'], ['Please wait', 'कृपया थांबा'], ['Welcome to', 'स्वागत आहे'], ['Loading', 'लोड होत आहे'],
    ['Patient Demo', 'रुग्ण डेमो'], ['Doctor Demo', 'डॉक्टर डेमो'], ['Admin Demo', 'प्रशासन डेमो'], ['DEMO CREDENTIALS', 'डेमो लॉगिन माहिती'],
    ['Or just click a demo button above to auto-fill credentials, then Sign In.', 'वरचा डेमो बटन क्लिक करा, माहिती आपोआप भरेल, मग लॉग इन करा.'],
    ['Patient registration', 'रुग्ण नोंदणी'], ['Doctor and administrator accounts are created securely by hospital administration.', 'डॉक्टर आणि प्रशासन खाती हॉस्पिटल प्रशासन सुरक्षितपणे तयार करते.'],
    ['Name is required', 'नाव आवश्यक आहे'], ['Something went wrong', 'काहीतरी चुकले'], ['Logged out successfully', 'यशस्वीपणे लॉग आउट झाले'],
    ['Dashboard', 'डॅशबोर्ड'], ['Admin Console', 'प्रशासन कन्सोल'], ['Hospital Administration', 'हॉस्पिटल प्रशासन'], ['Command Center', 'कमांड सेंटर'], ['Operations Command Center', 'ऑपरेशन्स कमांड सेंटर'], ['Operations Dashboard', 'ऑपरेशन्स डॅशबोर्ड'],
    ['AI Health Chat', 'AI आरोग्य चॅट'], ['Book Appointment', 'अपॉइंटमेंट बुक करा'], ['My Appointments', 'माझ्या अपॉइंटमेंट'], ['Appointment Ledger', 'अपॉइंटमेंट रजिस्टर'], ['Appointments', 'अपॉइंटमेंट'], ['Appointment', 'अपॉइंटमेंट'],
    ['My Records', 'माझे रेकॉर्ड'], ['Health Records', 'आरोग्य रेकॉर्ड'], ['All Records', 'सर्व रेकॉर्ड'], ['Patient Records', 'रुग्ण रेकॉर्ड'], ['Reports Vault', 'रिपोर्ट संग्रह'],
    ['Symptom Checker', 'लक्षण तपासणी'], ['Image Disease AI', 'फोटोवरून आजार ओळख AI'], ['Medicine OCR', 'औषध OCR'], ['AI Report PDF', 'AI रिपोर्ट PDF'], ['Medical Timeline', 'वैद्यकीय वेळापत्रक'], ['Patient Timeline', 'रुग्ण वेळापत्रक'], ['Patient Timelines', 'रुग्ण वेळापत्रके'],
    ['Med Reminders', 'औषध रिमाइंडर'], ['Body Age AI', 'शरीर वय AI'], ['BMI Calculator', 'BMI कॅल्क्युलेटर'], ['Privacy & Access', 'गोपनीयता आणि एक्सेस'],
    ['ICU Live Monitor', 'ICU लाईव्ह मॉनिटर'], ['War Room', 'वार रूम'], ['Epidemic Radar', 'साथरोग रडार'], ['Consultation Desk', 'सल्ला डेस्क'], ['AI Assistant', 'AI सहाय्यक'], ['Risk Scanner', 'जोखीम स्कॅनर'], ['Scan Review', 'स्कॅन समीक्षा'], ['Admin Command', 'प्रशासन कमांड'],
    ['Emergency Services Active', 'आपत्कालीन सेवा सुरू आहेत'], ['CALL 108', '108 वर कॉल करा'], ['Call 108', '108 वर कॉल करा'], ['All Emergencies', 'सर्व आपत्कालीन प्रसंग'], ['Install Medicare.AI', 'Medicare.AI इंस्टॉल करा'], ['INSTALL', 'इंस्टॉल'], ['EXIT', 'बाहेर जा'],
    ['Systems Online', 'सिस्टम सुरू आहेत'], ['Review Queue', 'समीक्षा रांग'], ['Registered Patients', 'नोंदणीकृत रुग्ण'], ['Clinical Staff', 'वैद्यकीय कर्मचारी'], ['Active patient profiles', 'सक्रिय रुग्ण प्रोफाइल'], ['Verified doctor accounts', 'तपासलेली डॉक्टर खाती'], ['AI scans needing attention', 'लक्ष देण्याचे AI स्कॅन'], ['Stored patient summaries', 'जतन केलेले रुग्ण सारांश'], ['Patient reminder plans', 'रुग्ण रिमाइंडर योजना'],
    ['Full Name', 'पूर्ण नाव'], ['Email address', 'ईमेल पत्ता'], ['Password', 'पासवर्ड'], ['Age', 'वय'], ['Phone', 'फोन'], ['Specialization', 'विशेषता'],
    ['Quick Questions', 'झटपट प्रश्न'], ['Common Questions', 'सामान्य प्रश्न'], ['Question', 'प्रश्न'], ['Questions', 'प्रश्न'], ['Answer', 'उत्तर'], ['Search', 'शोधा'],
  ],
};

const words = {
  hi: {
    patient:'रोगी', patients:'रोगी', doctor:'डॉक्टर', doctors:'डॉक्टर', admin:'प्रशासन', administrator:'प्रशासक', hospital:'अस्पताल', health:'स्वास्थ्य', healthcare:'स्वास्थ्य सेवा', care:'देखभाल', medical:'चिकित्सा', clinical:'चिकित्सा', disease:'रोग', diseases:'रोग', symptom:'लक्षण', symptoms:'लक्षण', medicine:'दवा', medicines:'दवाएं', report:'रिपोर्ट', reports:'रिपोर्ट', record:'रिकॉर्ड', records:'रिकॉर्ड', timeline:'समयरेखा', reminder:'रिमाइंडर', reminders:'रिमाइंडर', appointment:'अपॉइंटमेंट', appointments:'अपॉइंटमेंट', dashboard:'डैशबोर्ड', profile:'प्रोफाइल', profiles:'प्रोफाइल', privacy:'गोपनीयता', access:'एक्सेस', risk:'जोखिम', emergency:'आपातकालीन', services:'सेवाएं', active:'सक्रिय', ambulance:'एम्बुलेंस', call:'कॉल', today:'आज', tomorrow:'कल', upcoming:'आने वाले', completed:'पूरा', pending:'बाकी', confirmed:'पुष्टि हुई', cancelled:'रद्द', save:'सहेजें', cancel:'रद्द करें', submit:'जमा करें', create:'बनाएं', update:'अपडेट', delete:'हटाएं', edit:'संपादित करें', view:'देखें', upload:'अपलोड', download:'डाउनलोड', search:'खोजें', quick:'त्वरित', common:'सामान्य', question:'प्रश्न', questions:'प्रश्न', answer:'उत्तर', name:'नाम', age:'उम्र', gender:'लिंग', male:'पुरुष', female:'महिला', phone:'फोन', password:'पासवर्ड', email:'ईमेल', welcome:'स्वागत', loading:'लोड हो रहा है', please:'कृपया', wait:'प्रतीक्षा करें', and:'और', or:'या', for:'के लिए', with:'साथ', by:'द्वारा', from:'से', to:'तक', in:'में', out:'बाहर', successfully:'सफलतापूर्वक', overview:'सारांश', users:'उपयोगकर्ता', staff:'कर्मचारी', account:'खाता', accounts:'खाते', registered:'पंजीकृत', verified:'सत्यापित', stored:'सहेजे गए', summaries:'सारांश', attention:'ध्यान', activity:'गतिविधि', sleep:'नींद', hydration:'पानी', steps:'कदम', glasses:'गिलास', personal:'व्यक्तिगत'
  },
  mr: {
    patient:'रुग्ण', patients:'रुग्ण', doctor:'डॉक्टर', doctors:'डॉक्टर', admin:'प्रशासन', administrator:'प्रशासक', hospital:'हॉस्पिटल', health:'आरोग्य', healthcare:'आरोग्य सेवा', care:'काळजी', medical:'वैद्यकीय', clinical:'वैद्यकीय', disease:'आजार', diseases:'आजार', symptom:'लक्षण', symptoms:'लक्षणे', medicine:'औषध', medicines:'औषधे', report:'रिपोर्ट', reports:'रिपोर्ट', record:'रेकॉर्ड', records:'रेकॉर्ड', timeline:'वेळापत्रक', reminder:'रिमाइंडर', reminders:'रिमाइंडर', appointment:'अपॉइंटमेंट', appointments:'अपॉइंटमेंट', dashboard:'डॅशबोर्ड', profile:'प्रोफाइल', profiles:'प्रोफाइल', privacy:'गोपनीयता', access:'एक्सेस', risk:'जोखीम', emergency:'आपत्कालीन', services:'सेवा', active:'सक्रिय', ambulance:'अॅम्ब्युलन्स', call:'कॉल', today:'आज', tomorrow:'उद्या', upcoming:'येणारे', completed:'पूर्ण', pending:'बाकी', confirmed:'निश्चित', cancelled:'रद्द', save:'जतन करा', cancel:'रद्द करा', submit:'सबमिट करा', create:'तयार करा', update:'अपडेट करा', delete:'हटवा', edit:'संपादित करा', view:'पहा', upload:'अपलोड', download:'डाउनलोड', search:'शोधा', quick:'झटपट', common:'सामान्य', question:'प्रश्न', questions:'प्रश्न', answer:'उत्तर', name:'नाव', age:'वय', gender:'लिंग', male:'पुरुष', female:'महिला', phone:'फोन', password:'पासवर्ड', email:'ईमेल', welcome:'स्वागत', loading:'लोड होत आहे', please:'कृपया', wait:'थांबा', and:'आणि', or:'किंवा', for:'साठी', with:'सोबत', by:'द्वारे', from:'पासून', to:'पर्यंत', in:'मध्ये', out:'बाहेर', successfully:'यशस्वीपणे', overview:'सारांश', users:'वापरकर्ते', staff:'कर्मचारी', account:'खाते', accounts:'खाती', registered:'नोंदणीकृत', verified:'तपासलेले', stored:'जतन केलेले', summaries:'सारांश', attention:'लक्ष', activity:'हालचाल', sleep:'झोप', hydration:'पाणी', steps:'पावले', glasses:'ग्लास', personal:'वैयक्तिक'
  }
};

function escapeRegExp(value) { return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); }

function replacePhrases(text, lang) {
  let next = text;
  const entries = [...(phrases[lang] || [])].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) next = next.replace(new RegExp(escapeRegExp(from), 'gi'), to);
  return next;
}

function preserveProtectedText(text) {
  const parts = [];
  const value = text.replace(/(https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\/?[\w.-]+\.(?:js|jsx|json|css|py|md|pdf|png|jpg|jpeg))/gi, match => {
    const key = '§' + parts.length + '§';
    parts.push(match);
    return key;
  });
  return { value, parts };
}

function restoreProtectedText(text, parts) {
  return text.replace(/§(\d+)§/g, (_, index) => parts[Number(index)] || '');
}

function localizeWord(token, lang) {
  if (!token || /[\u0900-\u097F]/.test(token) || protectedWords.has(token) || /^[A-Z0-9]{2,}$/.test(token)) return token;
  const lower = token.toLowerCase();
  return words[lang]?.[lower] || token;
}

export function localizeText(value, lang = 'en') {
  if (lang === 'en' || value == null) return value;
  const text = String(value);
  if (!/[A-Za-z]/.test(text)) return text;
  const { value: protectedText, parts } = preserveProtectedText(text);
  const phraseText = replacePhrases(protectedText, lang);
  const localized = phraseText.replace(/[A-Za-z][A-Za-z'.-]*/g, token => localizeWord(token, lang));
  return restoreProtectedText(localized, parts);
}

const LanguageContext = createContext(null);
const textOriginals = new WeakMap();
const attrOriginals = new WeakMap();
const SKIP_SELECTOR = 'script, style, code, pre, textarea, input, select, option, [contenteditable="true"], [data-no-localize]';
const ATTR_SKIP_SELECTOR = 'script, style, code, pre, [contenteditable="true"], [data-no-localize]';
const ATTRS = ['placeholder', 'title', 'aria-label'];

function shouldSkipNode(node) {
  const parent = node.parentElement;
  return !parent || parent.closest(SKIP_SELECTOR);
}

function localizeAttributes(element, lang) {
  if (!(element instanceof HTMLElement) || element.closest(ATTR_SKIP_SELECTOR)) return;
  let store = attrOriginals.get(element);
  for (const attr of ATTRS) {
    if (!element.hasAttribute(attr)) continue;
    if (!store) { store = {}; attrOriginals.set(element, store); }
    const current = element.getAttribute(attr);
    if (!store[attr]) store[attr] = current;
    const localized = localizeText(store[attr], lang);
    if (lang !== 'en' && current !== store[attr] && current !== localized && /[A-Za-z]/.test(current) && !/[\u0900-\u097F]/.test(current)) store[attr] = current;
    element.setAttribute(attr, lang === 'en' ? store[attr] : localized);
  }
}

function applyDocumentLanguage(lang) {
  if (typeof document === 'undefined') return;
  const root = document.body;
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (!textOriginals.has(node) && !/[A-Za-z]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
    let original = textOriginals.get(node);
    const localized = localizeText(original, lang);
    if (lang !== 'en' && node.nodeValue !== original && node.nodeValue !== localized && /[A-Za-z]/.test(node.nodeValue) && !/[\u0900-\u097F]/.test(node.nodeValue)) {
      original = node.nodeValue;
      textOriginals.set(node, original);
    }
    node.nodeValue = lang === 'en' ? original : localizeText(original, lang);
  }
  root.querySelectorAll('[placeholder], [title], [aria-label]').forEach(el => localizeAttributes(el, lang));
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const setLanguage = (next) => {
    const safe = LANGUAGES.some(lang => lang.code === next) ? next : 'en';
    localStorage.setItem(STORAGE_KEY, safe);
    setLanguageState(safe);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language);
    document.documentElement.lang = language === 'en' ? 'en' : language === 'hi' ? 'hi' : 'mr';
    let applying = false;
    let raf = null;
    const run = () => {
      if (applying) return;
      applying = true;
      applyDocumentLanguage(language);
      applying = false;
    };
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };
    schedule();
    const observer = new MutationObserver(() => {
      if (!applying) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [language]);

  const value = useMemo(() => ({ language, languages: LANGUAGES, setLanguage, t: (text) => localizeText(text, language) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export function LanguageSwitcher({ variant = 'inline' }) {
  const { language, languages, setLanguage } = useLanguage();
  return (
    <div className={'language-switcher language-switcher--' + variant} data-no-localize aria-label="Language selector">
      {languages.map(item => (
        <button
          key={item.code}
          type="button"
          className={'lang-choice ' + (language === item.code ? 'active' : '')}
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
          title={item.label}
        >
          <span>{item.short}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </div>
  );
}
