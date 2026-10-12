import {createContext,useContext} from 'react';
export const languages={en:'English',bn:'বাংলা',es:'Español',hi:'हिन्दी',fr:'Français',ar:'العربية'};
export type Locale=keyof typeof languages;
// Every row contains all six interface translations; key parity is checked in CI.
const rows=`
home|Home|মূলপাতা|Inicio|मुखपृष्ठ|Accueil|الرئيسية
create|Create a Quiz|কুইজ তৈরি করুন|Crear un cuestionario|क्विज़ बनाएँ|Créer un quiz|إنشاء اختبار
join|Join a Quiz|কুইজে যোগ দিন|Unirse a un cuestionario|क्विज़ में शामिल हों|Rejoindre un quiz|الانضمام إلى اختبار
qrTool|QR Code|কিউআর কোড|Código QR|क्यूआर कोड|Code QR|رمز QR
qrHeading|Make a QR code in seconds.|কয়েক সেকেন্ডে কিউআর কোড তৈরি করুন।|Crea un código QR en segundos.|सेकंडों में क्यूआर कोड बनाएँ।|Créez un code QR en quelques secondes.|أنشئ رمز QR في ثوانٍ.
qrIntro|Turn a link or short text into a QR code. Customize it, then download a PNG. Everything happens in your browser.|লিংক বা ছোট লেখা থেকে কিউআর কোড তৈরি করুন। সাজিয়ে PNG ডাউনলোড করুন। সবকিছু ব্রাউজারেই হয়।|Convierte un enlace o texto breve en un código QR. Personalízalo y descarga un PNG. Todo ocurre en tu navegador.|लिंक या छोटे पाठ का क्यूआर कोड बनाएँ। इसे सजाएँ और PNG डाउनलोड करें। सब कुछ ब्राउज़र में होता है।|Transformez un lien ou un court texte en code QR. Personnalisez-le et téléchargez un PNG. Tout se passe dans votre navigateur.|حوّل رابطًا أو نصًا قصيرًا إلى رمز QR. خصصه ونزّل صورة PNG. تتم العملية في متصفحك.
qrTeaserTitle|One link. One scan. Everyone is in.|একটি লিংক। একবার স্ক্যান। সবাই যুক্ত।|Un enlace. Un escaneo. Todos dentro.|एक लिंक। एक स्कैन। सब शामिल।|Un lien. Un scan. Tout le monde participe.|رابط واحد. مسح واحد. الجميع يشارك.
qrTeaserText|Make a QR code for your class, event, or any useful link.|ক্লাস, অনুষ্ঠান বা যেকোনো দরকারি লিংকের জন্য কিউআর কোড তৈরি করুন।|Crea un QR para tu clase, evento o cualquier enlace útil.|कक्षा, कार्यक्रम या किसी भी उपयोगी लिंक के लिए क्यूआर कोड बनाएँ।|Créez un QR pour votre classe, votre événement ou tout lien utile.|أنشئ رمز QR لصفك أو فعاليتك أو أي رابط مفيد.
scanToJoin|Scan to join this quiz|এই কুইজে যোগ দিতে স্ক্যান করুন|Escanea para unirte al cuestionario|इस क्विज़ में शामिल होने के लिए स्कैन करें|Scannez pour rejoindre ce quiz|امسح للانضمام إلى هذا الاختبار
qrShareNote|This code contains only the participant link. Keep the management link private.|এই কোডে শুধু অংশগ্রহণকারীর লিংক আছে। পরিচালনার লিংক ব্যক্তিগত রাখুন।|Este código solo contiene el enlace para participantes. Mantén privado el enlace de gestión.|इस कोड में केवल प्रतिभागी लिंक है। प्रबंधन लिंक निजी रखें।|Ce code contient uniquement le lien participant. Gardez le lien de gestion privé.|يحتوي هذا الرمز على رابط المشاركين فقط. احتفظ برابط الإدارة خاصًا.
downloadQr|Download QR PNG|কিউআর PNG ডাউনলোড|Descargar PNG del QR|क्यूआर PNG डाउनलोड करें|Télécharger le QR en PNG|تنزيل رمز QR بصيغة PNG
qrDownloaded|QR image downloaded.|কিউআর ছবি ডাউনলোড হয়েছে।|Imagen QR descargada.|क्यूआर छवि डाउनलोड हुई।|Image QR téléchargée.|تم تنزيل صورة رمز QR.
qrDownloadError|Could not download the QR image. Try again.|কিউআর ছবি ডাউনলোড হয়নি। আবার চেষ্টা করুন।|No se pudo descargar el QR. Inténtalo de nuevo.|क्यूआर छवि डाउनलोड नहीं हुई। फिर कोशिश करें।|Impossible de télécharger le QR. Réessayez.|تعذر تنزيل صورة رمز QR. حاول مجددًا.
qrContent|Link or short text|লিংক বা ছোট লেখা|Enlace o texto breve|लिंक या छोटा पाठ|Lien ou court texte|رابط أو نص قصير
qrPresets|Quick examples|দ্রুত উদাহরণ|Ejemplos rápidos|त्वरित उदाहरण|Exemples rapides|أمثلة سريعة
qrWebsite|Website|ওয়েবসাইট|Sitio web|वेबसाइट|Site web|موقع ويب
qrWifi|Wi-Fi|ওয়াই-ফাই|Wi-Fi|वाई-फ़ाई|Wi-Fi|واي فاي
qrEmail|Email|ইমেইল|Correo|ईमेल|E-mail|بريد إلكتروني
qrPhone|Phone|ফোন|Teléfono|फ़ोन|Téléphone|هاتف
qrColors|Color palette|রঙের প্যালেট|Paleta de colores|रंग संयोजन|Palette de couleurs|لوحة الألوان
qrForeground|Code color|কোডের রঙ|Color del código|कोड का रंग|Couleur du code|لون الرمز
qrBackground|Background color|পটভূমির রঙ|Color de fondo|पृष्ठभूमि का रंग|Couleur de fond|لون الخلفية
qrSage|Sage|সেজ সবুজ|Salvia|सेज हरा|Sauge|أخضر مريمي
qrClassic|Classic|চিরায়ত|Clásico|क्लासिक|Classique|كلاسيكي
qrOcean|Ocean|সমুদ্র|Océano|समुद्र|Océan|محيط
qrClay|Clay|মাটির রঙ|Arcilla|मिट्टी|Argile|طيني
qrSize|Image size|ছবির আকার|Tamaño de imagen|छवि का आकार|Taille de l’image|حجم الصورة
qrCorrection|Error correction|ত্রুটি সংশোধন|Corrección de errores|त्रुटि सुधार|Correction d’erreurs|تصحيح الأخطاء
qrMargin|Add a white margin for easier scanning|সহজে স্ক্যানের জন্য সাদা মার্জিন যোগ করুন|Añadir margen blanco para facilitar el escaneo|आसानी से स्कैन करने के लिए सफेद किनारा जोड़ें|Ajouter une marge blanche pour faciliter le scan|أضف هامشًا أبيض لتسهيل المسح
qrLocal|Your text stays on this device. No QR data is sent to our server.|আপনার লেখা এই ডিভাইসেই থাকে। কিউআর তথ্য আমাদের সার্ভারে যায় না।|Tu texto queda en este dispositivo. No enviamos los datos QR al servidor.|आपका पाठ इस डिवाइस पर रहता है। क्यूआर डेटा हमारे सर्वर को नहीं भेजा जाता।|Votre texte reste sur cet appareil. Aucune donnée QR n’est envoyée au serveur.|يبقى نصك على هذا الجهاز. لا تُرسل بيانات QR إلى خادمنا.
qrPreview|QR preview|কিউআর প্রিভিউ|Vista previa del QR|क्यूआर पूर्वावलोकन|Aperçu du QR|معاينة رمز QR
qrEmpty|Enter a link or text to see your code.|কোড দেখতে লিংক বা লেখা লিখুন।|Escribe un enlace o texto para ver el código.|कोड देखने के लिए लिंक या पाठ लिखें।|Saisissez un lien ou du texte pour voir le code.|أدخل رابطًا أو نصًا لرؤية الرمز.
qrTooLong|This text is too long for a reliable QR code. Shorten it and try again.|নির্ভরযোগ্য কিউআর কোডের জন্য লেখাটি বেশি বড়। ছোট করে আবার চেষ্টা করুন।|El texto es demasiado largo para un QR fiable. Acórtalo y vuelve a intentarlo.|विश्वसनीय क्यूआर कोड के लिए यह पाठ बहुत लंबा है। इसे छोटा करके फिर कोशिश करें।|Ce texte est trop long pour un QR fiable. Raccourcissez-le et réessayez.|هذا النص طويل جدًا لإنشاء رمز QR موثوق. اختصره وحاول مجددًا.
qrCopy|Copy content|লেখা কপি করুন|Copiar contenido|सामग्री कॉपी करें|Copier le contenu|نسخ المحتوى
qrCopied|Content copied.|লেখা কপি হয়েছে।|Contenido copiado.|सामग्री कॉपी हुई।|Contenu copié.|تم نسخ المحتوى.
qrCopyError|Could not copy. Select the text and copy it manually.|কপি হয়নি। লেখাটি নির্বাচন করে নিজে কপি করুন।|No se pudo copiar. Selecciona el texto y cópialo manualmente.|कॉपी नहीं हुआ। पाठ चुनकर स्वयं कॉपी करें।|Copie impossible. Sélectionnez le texte et copiez-le manuellement.|تعذر النسخ. حدد النص وانسخه يدويًا.
hero|Make learning a little more exciting.|শেখাকে করুন আরও আনন্দময়।|Haz el aprendizaje un poco más emocionante.|सीखने को थोड़ा और रोमांचक बनाएँ।|Rendez l’apprentissage plus passionnant.|اجعل التعلم أكثر متعة.
subtitle|Build quizzes and exams from your lessons, ideas, and questions.|আপনার পাঠ, ধারণা ও প্রশ্ন থেকে কুইজ ও পরীক্ষা তৈরি করুন।|Crea cuestionarios y exámenes a partir de tus lecciones, ideas y preguntas.|अपने पाठों, विचारों और प्रश्नों से क्विज़ और परीक्षाएँ बनाएँ।|Créez des quiz et examens à partir de vos cours, idées et questions.|أنشئ اختبارات من دروسك وأفكارك وأسئلتك.
tagline|Create. Share. Learn.|তৈরি করুন। ভাগ করুন। শিখুন।|Crea. Comparte. Aprende.|बनाएँ। साझा करें। सीखें।|Créez. Partagez. Apprenez.|أنشئ. شارك. تعلّم.
add|Add|যোগ করুন|Añadir|जोड़ें|Ajouter|إضافة
review|Review|পর্যালোচনা|Revisar|समीक्षा|Vérifier|مراجعة
share|Share|শেয়ার করুন|Compartir|साझा करें|Partager|مشاركة
content|Content|বিষয়বস্তু|Contenido|सामग्री|Contenu|المحتوى
customize|Customize|সাজান|Personalizar|अनुकूलित करें|Personnaliser|تخصيص
stepsText|Bring an idea. Make it yours. Invite everyone.|ধারণা আনুন। নিজের মতো সাজান। সবাইকে ডাকুন।|Trae una idea. Hazla tuya. Invita a todos.|विचार लाएँ। अपना बनाएँ। सबको बुलाएँ।|Apportez une idée. Adaptez-la. Invitez tout le monde.|ابدأ بفكرة. خصصها. ادعُ الجميع.
samples|Sample quizzes — local previews, no participant records|নমুনা কুইজ — স্থানীয় প্রিভিউ, অংশগ্রহণকারীর তথ্য নেই|Ejemplos locales, sin registros de participantes|नमूना क्विज़ — स्थानीय पूर्वावलोकन, कोई प्रतिभागी रिकॉर्ड नहीं|Exemples locaux, sans données de participants|اختبارات نموذجية محلية دون سجلات مشاركين
science|Science|বিজ্ঞান|Ciencias|विज्ञान|Sciences|العلوم
math|Mathematics|গণিত|Matemáticas|गणित|Mathématiques|الرياضيات
spelling|Spelling|বানান|Ortografía|वर्तनी|Orthographe|الإملاء
trivia|Trivia|সাধারণ জ্ঞান|Cultura general|सामान्य ज्ञान|Culture générale|معلومات عامة
sampleNotice|English sample content. Review and publish your own copy.|ইংরেজি নমুনা। দেখে নিজের কপি প্রকাশ করুন।|Contenido de ejemplo en inglés. Revisa y publica tu copia.|अंग्रेज़ी नमूना। समीक्षा कर अपनी प्रति प्रकाशित करें।|Exemple en anglais. Vérifiez et publiez votre copie.|نموذج باللغة الإنجليزية. راجعه وانشر نسختك.
privacy|Privacy|গোপনীয়তা|Privacidad|गोपनीयता|Confidentialité|الخصوصية
language|Interface language|ইন্টারফেসের ভাষা|Idioma de interfaz|इंटरफ़ेस भाषा|Langue de l’interface|لغة الواجهة
theme|Theme|থিম|Tema|थीम|Thème|المظهر
system|System|সিস্টেম|Sistema|सिस्टम|Système|النظام
light|Light|হালকা|Claro|हल्का|Clair|فاتح
dark|Dark|গাঢ়|Oscuro|गहरा|Sombre|داكن
simple|Larger, simpler presentation|বড় ও সহজ উপস্থাপনা|Presentación más grande y sencilla|बड़ी और सरल प्रस्तुति|Présentation agrandie et simplifiée|عرض أكبر وأبسط
skip|Skip to content|বিষয়বস্তুতে যান|Ir al contenido|सामग्री पर जाएँ|Aller au contenu|انتقل إلى المحتوى
loading|Loading…|লোড হচ্ছে…|Cargando…|लोड हो रहा है…|Chargement…|جارٍ التحميل…
retry|Try again|আবার চেষ্টা করুন|Reintentar|फिर प्रयास करें|Réessayer|حاول مجددًا
back|Back|পেছনে|Atrás|पीछे|Retour|رجوع
next|Next|পরবর্তী|Siguiente|अगला|Suivant|التالي
save|Save|সংরক্ষণ|Guardar|सहेजें|Enregistrer|حفظ
saved|Saved on the server|সার্ভারে সংরক্ষিত|Guardado en el servidor|सर्वर पर सहेजा गया|Enregistré sur le serveur|تم الحفظ على الخادم
pending|Changes waiting to save|পরিবর্তন সংরক্ষণের অপেক্ষায়|Cambios pendientes de guardar|बदलाव सहेजना बाकी|Modifications en attente|تغييرات تنتظر الحفظ
offline|Connection lost. Keep this tab open; unsaved answers may be rejected after the deadline.|সংযোগ নেই। ট্যাব খোলা রাখুন; সময়ের পরে অসংরক্ষিত উত্তর গৃহীত নাও হতে পারে।|Sin conexión. Mantén esta pestaña abierta; tras el plazo pueden rechazarse respuestas sin guardar.|कनेक्शन नहीं है। टैब खुला रखें; समय के बाद असहेजे उत्तर अस्वीकार हो सकते हैं।|Connexion perdue. Gardez cet onglet ouvert ; les réponses non enregistrées après l’échéance peuvent être refusées.|انقطع الاتصال. أبقِ الصفحة مفتوحة؛ قد تُرفض الإجابات غير المحفوظة بعد الموعد.
localDraft|Draft saved on this device|খসড়া এই ডিভাইসে সংরক্ষিত|Borrador guardado en este dispositivo|प्रारूप इस डिवाइस पर सहेजा गया|Brouillon enregistré sur cet appareil|مسودة محفوظة على هذا الجهاز
localNotice|Drafts remain on shared devices. Delete them when finished.|শেয়ার করা ডিভাইসে খসড়া থাকে। শেষে মুছুন।|Los borradores permanecen en dispositivos compartidos. Elimínalos al terminar.|साझा डिवाइस पर प्रारूप रहते हैं। समाप्त होने पर मिटाएँ।|Les brouillons restent sur les appareils partagés. Supprimez-les ensuite.|تبقى المسودات على الأجهزة المشتركة. احذفها عند الانتهاء.
clearDevice|Clear Quizora data on this device|এই ডিভাইসের Quizora তথ্য মুছুন|Borrar datos de Quizora del dispositivo|इस डिवाइस का Quizora डेटा मिटाएँ|Effacer les données Quizora de cet appareil|مسح بيانات Quizora على هذا الجهاز
manual|Write questions manually|নিজে প্রশ্ন লিখুন|Escribir preguntas manualmente|खुद प्रश्न लिखें|Rédiger les questions|كتابة الأسئلة يدويًا
upload|Choose a document|নথি বাছুন|Elegir documento|दस्तावेज़ चुनें|Choisir un document|اختيار مستند
source|Selected source text|নির্বাচিত মূল লেখা|Texto fuente seleccionado|चयनित स्रोत पाठ|Texte source sélectionné|النص المصدر المحدد
sourceNotice|Files stay in your browser. Only selected text is sent for AI generation after you agree. Maximum 10 MB, 50 PDF pages, 40,000 characters.|ফাইল ব্রাউজারেই থাকে। সম্মতি দিলে শুধু নির্বাচিত লেখা AI-তে যায়। সর্বোচ্চ ১০ এমবি, ৫০ PDF পৃষ্ঠা, ৪০,০০০ অক্ষর।|Los archivos quedan en tu navegador. Solo se envía el texto seleccionado a la IA con tu permiso. Máximo 10 MB, 50 páginas PDF, 40.000 caracteres.|फ़ाइलें ब्राउज़र में रहती हैं। सहमति के बाद चयनित पाठ AI को जाता है। अधिकतम 10 MB, 50 PDF पृष्ठ, 40,000 अक्षर।|Les fichiers restent dans votre navigateur. Seul le texte choisi est envoyé à l’IA avec votre accord. Maximum 10 Mo, 50 pages PDF, 40 000 caractères.|تبقى الملفات في متصفحك. يُرسل النص المحدد فقط للذكاء الاصطناعي بعد موافقتك. الحد 10 ميغابايت و50 صفحة PDF و40 ألف حرف.
sourceNoticeManual|Files stay in your browser. Import quiz questions from CSV or JSON, or use the selected text while writing your own. Maximum 10 MB, 50 PDF pages, 40,000 characters.|ফাইল ব্রাউজারেই থাকে। CSV বা JSON থেকে প্রশ্ন আনুন, অথবা নিজের প্রশ্ন লেখার সময় নির্বাচিত লেখা দেখুন। সর্বোচ্চ ১০ এমবি, ৫০ PDF পৃষ্ঠা, ৪০,০০০ অক্ষর।|Los archivos quedan en tu navegador. Importa preguntas desde CSV o JSON, o usa el texto seleccionado para escribirlas. Máximo 10 MB, 50 páginas PDF y 40.000 caracteres.|फ़ाइलें ब्राउज़र में रहती हैं। CSV या JSON से प्रश्न आयात करें, या स्वयं लिखते समय चुना हुआ पाठ देखें। अधिकतम 10 MB, 50 PDF पृष्ठ और 40,000 अक्षर।|Les fichiers restent dans votre navigateur. Importez des questions depuis CSV ou JSON, ou utilisez le texte choisi pour écrire les vôtres. Maximum 10 Mo, 50 pages PDF et 40 000 caractères.|تبقى الملفات في متصفحك. استورد الأسئلة من CSV أو JSON، أو استخدم النص المحدد لكتابة أسئلتك. الحد 10 ميغابايت و50 صفحة PDF و40 ألف حرف.
topic|Topic or instructions|বিষয় বা নির্দেশনা|Tema o instrucciones|विषय या निर्देश|Sujet ou consignes|الموضوع أو التعليمات
ai|Optional AI assistance|ঐচ্ছিক AI সহায়তা|Ayuda opcional de IA|वैकल्पिक AI सहायता|Assistance IA facultative|مساعدة ذكاء اصطناعي اختيارية
aiOffline|AI is offline or unavailable. Manual creation still works.|AI অফলাইন বা অনুপলব্ধ। নিজে প্রশ্ন তৈরি করা যায়।|IA desconectada o no disponible. Puedes crear preguntas manualmente.|AI ऑफ़लाइन या अनुपलब्ध है। स्वयं प्रश्न बना सकते हैं।|IA hors ligne ou indisponible. La création manuelle reste possible.|الذكاء الاصطناعي غير متصل أو غير متاح. يمكنك إنشاء الأسئلة يدويًا.
aiOnline|Local AI agent connected|স্থানীয় AI এজেন্ট সংযুক্ত|Agente local de IA conectado|स्थानीय AI एजेंट जुड़ा है|Agent IA local connecté|وكيل الذكاء الاصطناعي المحلي متصل
aiKey|Provisioned AI access key|অনুমোদিত AI প্রবেশ কী|Clave de acceso a IA|प्रदत्त AI एक्सेस कुंजी|Clé d’accès IA fournie|مفتاح الوصول المخصص للذكاء الاصطناعي
consent|I agree to send the selected text to the Worker and owner's local AI for temporary processing.|নির্বাচিত লেখা সাময়িক প্রক্রিয়ার জন্য Worker ও মালিকের স্থানীয় AI-তে পাঠাতে সম্মত।|Acepto enviar el texto seleccionado al Worker y a la IA local del propietario para procesamiento temporal.|चयनित पाठ अस्थायी प्रक्रिया के लिए Worker और स्वामी के स्थानीय AI को भेजने की सहमति है।|J’accepte l’envoi temporaire du texte sélectionné au Worker et à l’IA locale du propriétaire.|أوافق على إرسال النص المحدد إلى Worker والذكاء الاصطناعي المحلي للمالك للمعالجة المؤقتة.
generate|Generate draft questions|খসড়া প্রশ্ন তৈরি|Generar borrador de preguntas|प्रश्नों का प्रारूप बनाएँ|Générer des questions provisoires|إنشاء مسودة أسئلة
regenerate|Regenerate this question|এই প্রশ্ন আবার তৈরি|Regenerar esta pregunta|यह प्रश्न फिर बनाएँ|Régénérer cette question|إعادة إنشاء هذا السؤال
aiReview|AI can be wrong. Review every question and source reference before publishing. Topic-only questions have no supplied source.|AI ভুল করতে পারে। প্রকাশের আগে প্রতিটি প্রশ্ন ও উৎস দেখুন। শুধু বিষয় দিলে সরবরাহ করা উৎস নেই।|La IA puede equivocarse. Revisa preguntas y fuentes antes de publicar. Los temas sin material no tienen fuente aportada.|AI गलत हो सकता है। प्रकाशन से पहले प्रश्न और स्रोत जाँचें। केवल विषय वाले प्रश्नों का दिया गया स्रोत नहीं है।|L’IA peut se tromper. Vérifiez chaque question et sa source. Un sujet seul n’a pas de source fournie.|قد يخطئ الذكاء الاصطناعي. راجع كل سؤال ومصدر قبل النشر. أسئلة الموضوع وحده بلا مصدر مقدم.
queued|Queued — a running local agent is required|সারিতে — স্থানীয় এজেন্ট চালু থাকা দরকার|En cola — requiere un agente local activo|कतार में — स्थानीय एजेंट चलना चाहिए|En attente — un agent local actif est nécessaire|في الانتظار — يلزم تشغيل الوكيل المحلي
leased|AI is preparing questions|AI প্রশ্ন তৈরি করছে|La IA prepara preguntas|AI प्रश्न बना रहा है|L’IA prépare les questions|الذكاء الاصطناعي يعد الأسئلة
cancel|Cancel|বাতিল|Cancelar|रद्द करें|Annuler|إلغاء
title|Title|শিরোনাম|Título|शीर्षक|Titre|العنوان
subject|Subject|বিষয়|Materia|विषय|Matière|المادة
audience|Audience / grade|শ্রোতা / শ্রেণি|Público / curso|दर्शक / कक्षा|Public / niveau|الجمهور / الصف
difficulty|Difficulty|কঠিনতার স্তর|Dificultad|कठिनाई|Difficulté|الصعوبة
examLanguage|Exam language (independent of interface)|পরীক্ষার ভাষা (ইন্টারফেস থেকে স্বতন্ত্র)|Idioma del examen (independiente de la interfaz)|परीक्षा की भाषा (इंटरफ़ेस से अलग)|Langue de l’examen (indépendante de l’interface)|لغة الاختبار (مستقلة عن الواجهة)
instructions|Instructions|নির্দেশনা|Instrucciones|निर्देश|Consignes|التعليمات
mode|Mode|ধরন|Modo|प्रकार|Mode|الوضع
practice|Practice|অনুশীলন|Práctica|अभ्यास|Entraînement|تدريب
exam|Exam|পরীক্ষা|Examen|परीक्षा|Examen|اختبار
competition|Competition|প্রতিযোগিতা|Competición|प्रतियोगिता|Compétition|مسابقة
duration|Duration in minutes (blank = untimed practice)|সময় মিনিটে (ফাঁকা = সময়হীন অনুশীলন)|Duración en minutos (vacío = práctica sin límite)|अवधि मिनटों में (खाली = असीमित अभ्यास)|Durée en minutes (vide = entraînement sans limite)|المدة بالدقائق (فارغ = تدريب دون وقت)
startTime|Local start date and time|স্থানীয় শুরুর তারিখ ও সময়|Fecha y hora local de inicio|स्थानीय आरंभ तिथि और समय|Date et heure locales de début|تاريخ ووقت البدء المحلي
endTime|Local closing date and time (optional)|স্থানীয় শেষ তারিখ ও সময় (ঐচ্ছিক)|Fecha y hora local de cierre (opcional)|स्थानीय समाप्ति तिथि और समय (वैकल्पिक)|Date et heure locales de fin (facultatif)|تاريخ ووقت الإغلاق المحلي (اختياري)
timezone|IANA timezone|IANA সময় অঞ্চল|Zona horaria IANA|IANA समय क्षेत्र|Fuseau horaire IANA|المنطقة الزمنية IANA
advanced|Advanced settings|উন্নত সেটিংস|Ajustes avanzados|उन्नत सेटिंग्स|Réglages avancés|إعدادات متقدمة
hostControlled|Host starts the session|আয়োজক সেশন শুরু করবেন|El anfitrión inicia la sesión|आयोजक सत्र शुरू करता है|L’animateur démarre la session|يبدأ المضيف الجلسة
lateJoin|Allow late joining|দেরিতে যোগ দেওয়ার অনুমতি|Permitir entradas tardías|देर से जुड़ने दें|Autoriser les arrivées tardives|السماح بالانضمام المتأخر
shuffle|Shuffle questions per attempt|প্রচেষ্টাভেদে প্রশ্ন এলোমেলো|Mezclar preguntas por intento|हर प्रयास में प्रश्न मिलाएँ|Mélanger les questions par tentative|خلط الأسئلة لكل محاولة
feedback|Release practice feedback after submission|জমার পর অনুশীলনের ফল দেখান|Mostrar comentarios de práctica tras enviar|जमा करने पर अभ्यास प्रतिक्रिया दिखाएँ|Afficher le corrigé après l’envoi en entraînement|عرض ملاحظات التدريب بعد التسليم
leaderboard|Enable pseudonymous leaderboard|ছদ্মনামে লিডারবোর্ড চালু|Activar clasificación con seudónimos|छद्मनाम वाली सूची सक्षम करें|Activer le classement sous pseudonymes|تفعيل لوحة الترتيب بأسماء مستعارة
youngAudience|Young learners (leaderboard disabled)|শিশু শিক্ষার্থী (লিডারবোর্ড বন্ধ)|Estudiantes pequeños (sin clasificación)|छोटे विद्यार्थी (सूची बंद)|Jeunes élèves (classement désactivé)|متعلمين صغار (الترتيب معطل)
nicknameMode|Nickname choice|ডাকনাম নির্বাচন|Elección de apodo|उपनाम विकल्प|Choix du pseudonyme|اختيار الاسم المستعار
generated|Generated nickname|স্বয়ংক্রিয় ডাকনাম|Apodo generado|स्वतः बना उपनाम|Pseudonyme généré|اسم مستعار مولد
custom|Participant chooses|অংশগ্রহণকারী বাছবেন|Lo elige el participante|प्रतिभागी चुने|Au choix du participant|يختاره المشارك
maxAttempts|Maximum attempts for this quiz|এই কুইজে সর্বোচ্চ প্রচেষ্টা|Máximo de intentos para este cuestionario|इस क्विज़ के अधिकतम प्रयास|Nombre maximal de tentatives pour ce quiz|الحد الأقصى لمحاولات هذا الاختبار
retentionDays|Response retention after closure (1–30 days)|বন্ধের পরে উত্তর রাখা (১–৩০ দিন)|Conservar respuestas tras el cierre (1–30 días)|बंद होने के बाद उत्तर रखें (1–30 दिन)|Conservation après clôture (1–30 jours)|الاحتفاظ بالإجابات بعد الإغلاق (1–30 يومًا)
lifetimeDays|Quiz lifetime (1–90 days)|কুইজের মেয়াদ (১–৯০ দিন)|Vigencia del cuestionario (1–90 días)|क्विज़ अवधि (1–90 दिन)|Durée de vie du quiz (1–90 jours)|مدة بقاء الاختبار (1–90 يومًا)
question|Question|প্রশ্ন|Pregunta|प्रश्न|Question|السؤال
count|Question count|প্রশ্ন সংখ্যা|Número de preguntas|प्रश्न संख्या|Nombre de questions|عدد الأسئلة
type|Question type|প্রশ্নের ধরন|Tipo de pregunta|प्रश्न प्रकार|Type de question|نوع السؤال
single|Single choice|একটি উত্তর|Respuesta única|एक विकल्प|Choix unique|اختيار واحد
multiple|Multiple choices|একাধিক উত্তর|Selección múltiple|अनेक विकल्प|Choix multiples|اختيارات متعددة
boolean|True / False|সত্য / মিথ্যা|Verdadero / Falso|सही / गलत|Vrai / Faux|صحيح / خطأ
blanks|Fill in the blanks|শূন্যস্থান পূরণ|Completar espacios|रिक्त स्थान भरें|Texte à trous|ملء الفراغات
matching|Match pairs|জোড়া মেলান|Emparejar|जोड़ियाँ मिलाएँ|Associer des paires|مطابقة الأزواج
short|Short answer|সংক্ষিপ্ত উত্তর|Respuesta corta|छोटा उत्तर|Réponse courte|إجابة قصيرة
long|Long answer|দীর্ঘ উত্তর|Respuesta larga|लंबा उत्तर|Réponse longue|إجابة مطولة
ordering|Put in order|ক্রমে সাজান|Ordenar|क्रम में रखें|Mettre en ordre|ترتيب العناصر
prompt|Question text|প্রশ্নের লেখা|Texto de la pregunta|प्रश्न का पाठ|Texte de la question|نص السؤال
points|Marks|নম্বর|Puntos|अंक|Points|الدرجات
explanation|Explanation|ব্যাখ্যা|Explicación|व्याख्या|Explication|الشرح
rubric|Private grading notes|ব্যক্তিগত মূল্যায়ন নোট|Notas privadas de evaluación|निजी मूल्यांकन नोट|Notes privées de correction|ملاحظات التصحيح الخاصة
choices|Choices|বিকল্প|Opciones|विकल्प|Choix|الخيارات
correct|Correct answer|সঠিক উত্তর|Respuesta correcta|सही उत्तर|Bonne réponse|الإجابة الصحيحة
true|True|সত্য|Verdadero|सही|Vrai|صحيح
false|False|মিথ্যা|Falso|गलत|Faux|خطأ
accepted|Accepted alternatives: one blank per line; alternatives separated by semicolons|গ্রহণযোগ্য উত্তর: প্রতি লাইনে একটি শূন্যস্থান; বিকল্প সেমিকোলনে আলাদা|Alternativas: un espacio por línea; separar alternativas con punto y coma|स्वीकृत उत्तर: प्रति पंक्ति एक रिक्त स्थान; विकल्प अर्धविराम से अलग|Réponses admises : un trou par ligne ; alternatives séparées par des points-virgules|البدائل المقبولة: فراغ لكل سطر؛ افصل البدائل بفاصلة منقوطة
caseSensitive|Case sensitive|বড়-ছোট অক্ষর আলাদা|Distinguir mayúsculas|अक्षर का आकार मायने रखे|Respecter la casse|مراعاة حالة الأحرف
normalizeWhitespace|Ignore extra whitespace|অতিরিক্ত ফাঁক উপেক্ষা|Ignorar espacios adicionales|अतिरिक्त रिक्त स्थान छोड़ें|Ignorer les espaces supplémentaires|تجاهل المسافات الزائدة
partial|Allow partial credit|আংশিক নম্বর দিন|Permitir puntuación parcial|आंशिक अंक दें|Autoriser les points partiels|السماح بدرجات جزئية
left|Left items|বামের আইটেম|Elementos izquierdos|बाएँ आइटम|Éléments de gauche|العناصر اليسرى
right|Right items|ডানের আইটেম|Elementos derechos|दाएँ आइटम|Éléments de droite|العناصر اليمنى
remove|Remove|সরান|Eliminar|हटाएँ|Supprimer|حذف
duplicate|Duplicate|অনুলিপি|Duplicar|प्रतिलिपि|Dupliquer|تكرار
up|Move up|উপরে নিন|Subir|ऊपर करें|Monter|تحريك لأعلى
down|Move down|নিচে নিন|Bajar|नीचे करें|Descendre|تحريك لأسفل
preview|Participant preview|অংশগ্রহণকারীর প্রিভিউ|Vista del participante|प्रतिभागी पूर्वावलोकन|Aperçu participant|معاينة المشارك
publish|Publish this version|এই সংস্করণ প্রকাশ করুন|Publicar esta versión|यह संस्करण प्रकाशित करें|Publier cette version|نشر هذا الإصدار
immutable|Published questions are fixed. To edit later, duplicate into a new quiz.|প্রকাশিত প্রশ্ন অপরিবর্তনীয়। পরে বদলাতে নতুন কুইজে অনুলিপি করুন।|Las preguntas publicadas quedan fijas. Para editarlas, duplica el cuestionario.|प्रकाशित प्रश्न स्थिर हैं। बदलने के लिए नया क्विज़ बनाएँ।|Les questions publiées sont figées. Dupliquez le quiz pour les modifier.|الأسئلة المنشورة ثابتة. انسخ الاختبار لتعديله لاحقًا.
published|Published|প্রকাশিত|Publicado|प्रकाशित|Publié|منشور
scheduled|Scheduled|নির্ধারিত|Programado|निर्धारित|Programmé|مجدول
open|Open|খোলা|Abierto|खुला|Ouvert|مفتوح
closed|Closed|বন্ধ|Cerrado|बंद|Fermé|مغلق
expired|Expired or deleted|মেয়াদ শেষ বা মুছে ফেলা|Caducado o eliminado|समाप्त या मिटाया गया|Expiré ou supprimé|منتهي أو محذوف
studentLink|Participant link|অংশগ্রহণকারীর লিংক|Enlace de participante|प्रतिभागी लिंक|Lien participant|رابط المشارك
managementLink|Private management link|ব্যক্তিগত পরিচালনা লিংক|Enlace privado de gestión|निजी प्रबंधन लिंक|Lien privé de gestion|رابط الإدارة الخاص
secretWarning|Anyone with this link can manage the quiz. Save your recovery record; lost anonymous access cannot be restored.|এই লিংকধারী যে কেউ কুইজ চালাতে পারেন। পুনরুদ্ধার নথি রাখুন; হারানো বেনামী প্রবেশ ফেরানো যায় না।|Quien tenga este enlace puede gestionar el cuestionario. Guarda tu registro; no se recupera el acceso anónimo perdido.|इस लिंक वाला कोई भी क्विज़ चला सकता है। पुनर्प्राप्ति रिकॉर्ड रखें; खोई अनाम पहुँच वापस नहीं मिलती।|Toute personne disposant du lien peut gérer le quiz. Conservez le fichier de récupération ; l’accès anonyme perdu ne peut être restauré.|يمكن لأي حامل للرابط إدارة الاختبار. احفظ سجل الاسترداد؛ لا يمكن استعادة الوصول المجهول المفقود.
copy|Copy|কপি|Copiar|कॉपी|Copier|نسخ
copied|Copied|কপি হয়েছে|Copiado|कॉपी हुआ|Copié|تم النسخ
recovery|Download recovery record|পুনরুদ্ধার নথি ডাউনলোড|Descargar registro de recuperación|पुनर्प्राप्ति रिकॉर्ड डाउनलोड|Télécharger le fichier de récupération|تنزيل سجل الاسترداد
manage|Manage quiz|কুইজ পরিচালনা|Gestionar cuestionario|क्विज़ प्रबंधन|Gérer le quiz|إدارة الاختبار
code|Join code|যোগদানের কোড|Código de acceso|जुड़ने का कोड|Code d’accès|رمز الانضمام
nickname|Nickname (no real name needed)|ডাকনাম (আসল নাম দরকার নেই)|Apodo (sin nombre real)|उपनाम (असली नाम आवश्यक नहीं)|Pseudonyme (pas de vrai nom nécessaire)|اسم مستعار (لا حاجة للاسم الحقيقي)
start|Start|শুরু|Comenzar|शुरू करें|Commencer|ابدأ
waiting|Waiting for the exam to open|পরীক্ষা খোলার অপেক্ষা|Esperando el inicio del examen|परीक्षा खुलने की प्रतीक्षा|En attente de l’ouverture|بانتظار فتح الاختبار
created|Joined|যোগদান হয়েছে|Unido|जुड़ गए|Inscrit|تم الانضمام
started|In progress|চলছে|En curso|जारी|En cours|جارٍ
submitted|Submitted|জমা হয়েছে|Enviado|जमा हुआ|Envoyé|تم التسليم
remaining|Time remaining|বাকি সময়|Tiempo restante|शेष समय|Temps restant|الوقت المتبقي
flag|Flag for review|পর্যালোচনার জন্য চিহ্নিত|Marcar para revisar|समीक्षा के लिए चिह्नित|Marquer pour révision|وضع علامة للمراجعة
submit|Submit answers|উত্তর জমা দিন|Enviar respuestas|उत्तर जमा करें|Envoyer les réponses|تسليم الإجابات
confirmSubmit|Submit now? Answers cannot be changed after submission.|এখন জমা দেবেন? জমার পরে উত্তর বদলানো যাবে না।|¿Enviar ahora? No podrás cambiar las respuestas.|अभी जमा करें? बाद में उत्तर नहीं बदल सकते।|Envoyer maintenant ? Les réponses seront définitives.|هل تريد التسليم الآن؟ لن يمكن تغيير الإجابات بعد التسليم.
results|Results|ফলাফল|Resultados|परिणाम|Résultats|النتائج
resultsHidden|Results have not been released yet.|ফলাফল এখনও প্রকাশিত হয়নি।|Los resultados aún no se han publicado.|परिणाम अभी जारी नहीं हुए।|Les résultats ne sont pas encore publiés.|لم تُنشر النتائج بعد.
manualPending|Written answers awaiting manual grading|লিখিত উত্তর মূল্যায়নের অপেক্ষায়|Respuestas escritas pendientes de corrección|लिखित उत्तर मूल्यांकन की प्रतीक्षा में|Réponses écrites en attente de correction|إجابات مكتوبة تنتظر التصحيح اليدوي
gradedPossible|Possible marks on graded questions|মূল্যায়িত প্রশ্নের মোট নম্বর|Puntos posibles en preguntas corregidas|मूल्यांकित प्रश्नों के संभव अंक|Points possibles des questions corrigées|الدرجات الممكنة للأسئلة المصححة
total|Total marks|মোট নম্বর|Puntos totales|कुल अंक|Total des points|إجمالي الدرجات
retake|Try a new attempt|নতুন প্রচেষ্টা|Nuevo intento|नया प्रयास करें|Nouvelle tentative|محاولة جديدة
leave|Leave and clear attempt recovery|বেরিয়ে পুনরুদ্ধার তথ্য মুছুন|Salir y borrar recuperación|छोड़ें और पुनर्प्राप्ति मिटाएँ|Quitter et effacer la récupération|مغادرة ومسح استرداد المحاولة
responses|Responses|উত্তরসমূহ|Respuestas|उत्तर|Réponses|الإجابات
joined|Joined|যোগ দিয়েছে|Inscritos|जुड़े|Inscrits|المنضمون
releaseScores|Release scores|নম্বর প্রকাশ|Publicar notas|अंक जारी करें|Publier les notes|نشر الدرجات
releaseKeys|Release answers and explanations|উত্তর ও ব্যাখ্যা প্রকাশ|Publicar respuestas y explicaciones|उत्तर और व्याख्या जारी करें|Publier les réponses et explications|نشر الإجابات والشروح
close|Close exam now|এখন পরীক্ষা বন্ধ|Cerrar examen ahora|परीक्षा अभी बंद करें|Fermer l’examen maintenant|إغلاق الاختبار الآن
export|Export current page|বর্তমান পৃষ্ঠা রপ্তানি|Exportar página actual|वर्तमान पृष्ठ निर्यात|Exporter cette page|تصدير الصفحة الحالية
delete|Delete quiz and responses|কুইজ ও উত্তর মুছুন|Eliminar cuestionario y respuestas|क्विज़ और उत्तर मिटाएँ|Supprimer le quiz et ses réponses|حذف الاختبار وإجاباته
confirmDelete|Permanently delete this quiz and its responses?|এই কুইজ ও উত্তর স্থায়ীভাবে মুছবেন?|¿Eliminar permanentemente este cuestionario y sus respuestas?|क्विज़ और उत्तर स्थायी रूप से मिटाएँ?|Supprimer définitivement ce quiz et ses réponses ?|حذف هذا الاختبار وإجاباته نهائيًا؟
rotate|Rotate management secret|পরিচালনার গোপন কী বদলান|Rotar clave de gestión|प्रबंधन कुंजी बदलें|Renouveler la clé de gestion|تغيير مفتاح الإدارة
noResponses|No responses yet. Share the participant link to get started.|এখনও উত্তর নেই। অংশগ্রহণের লিংক শেয়ার করুন।|Aún no hay respuestas. Comparte el enlace para empezar.|अभी उत्तर नहीं हैं। प्रतिभागी लिंक साझा करें।|Aucune réponse. Partagez le lien pour commencer.|لا توجد إجابات بعد. شارك رابط المشارك للبدء.
print|Print|প্রিন্ট|Imprimir|प्रिंट|Imprimer|طباعة
ties|Equal scores share a place. No speed bonus.|সমান নম্বরে সমান স্থান। গতির বোনাস নেই।|Las puntuaciones iguales comparten puesto. Sin bonificación por velocidad.|समान अंकों को समान स्थान। गति बोनस नहीं।|Les scores égaux partagent le rang. Aucun bonus de rapidité.|الدرجات المتساوية تشترك في المركز. لا مكافأة للسرعة.
select|Choose…|বাছুন…|Elegir…|चुनें…|Choisir…|اختر…
notFound|Not found. Check the link or code.|পাওয়া যায়নি। লিংক বা কোড দেখুন।|No encontrado. Comprueba el enlace o código.|नहीं मिला। लिंक या कोड जाँचें।|Introuvable. Vérifiez le lien ou le code.|غير موجود. تحقق من الرابط أو الرمز.
unauthorized|Access key missing or invalid. Open your saved private link.|প্রবেশ কী নেই বা ভুল। সংরক্ষিত ব্যক্তিগত লিংক খুলুন।|Clave ausente o inválida. Abre tu enlace privado guardado.|पहुँच कुंजी नहीं या अमान्य है। सहेजा निजी लिंक खोलें।|Clé absente ou invalide. Ouvrez votre lien privé enregistré.|مفتاح الوصول مفقود أو غير صالح. افتح رابطك الخاص المحفوظ.
invalidInput|Check the fields and answer keys. All questions must be complete and unique.|ঘর ও উত্তর দেখুন। সব প্রশ্ন সম্পূর্ণ ও অনন্য হতে হবে।|Revisa campos y respuestas. Las preguntas deben estar completas y ser únicas.|फ़ील्ड और उत्तर जाँचें। सभी प्रश्न पूर्ण और अलग हों।|Vérifiez les champs et corrigés. Les questions doivent être complètes et uniques.|تحقق من الحقول والإجابات. يجب أن تكون الأسئلة مكتملة وفريدة.
invalidTime|Invalid or ambiguous local time. Check timezone, daylight saving and duration.|স্থানীয় সময় ভুল বা দ্ব্যর্থক। সময় অঞ্চল, গ্রীষ্মকালীন সময় ও সময়সীমা দেখুন।|Hora local inválida o ambigua. Revisa zona, horario de verano y duración.|स्थानीय समय अमान्य या अस्पष्ट है। समय क्षेत्र, ग्रीष्मकाल और अवधि जाँचें।|Heure locale invalide ou ambiguë. Vérifiez le fuseau, le changement d’heure et la durée.|وقت محلي غير صالح أو ملتبس. تحقق من المنطقة والتوقيت الصيفي والمدة.
invalidAnswer|An answer is invalid. Review it before saving.|একটি উত্তর ভুল গঠনের। সংরক্ষণের আগে দেখুন।|Una respuesta no es válida. Revísala antes de guardar.|उत्तर अमान्य है। सहेजने से पहले जाँचें।|Une réponse est invalide. Vérifiez-la avant d’enregistrer.|إجابة غير صالحة. راجعها قبل الحفظ.
revisionConflict|Another save changed this attempt. Refresh to recover the latest answers.|অন্য সংরক্ষণ প্রচেষ্টাটি বদলেছে। সর্বশেষ উত্তর পেতে রিফ্রেশ করুন।|Otro guardado cambió el intento. Actualiza para recuperar respuestas.|दूसरे सहेजने से प्रयास बदला। नवीनतम उत्तर हेतु रीफ़्रेश करें।|Une autre sauvegarde a modifié cette tentative. Actualisez pour récupérer les réponses.|حفظ آخر غيّر المحاولة. حدّث لاستعادة الإجابات الأخيرة.
busy|Service is busy or a limit was reached. Please retry shortly.|সেবা ব্যস্ত বা সীমায় পৌঁছেছে। একটু পরে চেষ্টা করুন।|Servicio ocupado o límite alcanzado. Reintenta pronto.|सेवा व्यस्त या सीमा पूरी है। थोड़ी देर में प्रयास करें।|Service occupé ou limite atteinte. Réessayez bientôt.|الخدمة مشغولة أو تم بلوغ الحد. حاول قريبًا.
creationPaused|New quiz creation is temporarily paused.|নতুন কুইজ তৈরি সাময়িক বন্ধ।|La creación está pausada temporalmente.|नया क्विज़ बनाना अस्थायी रूप से बंद है।|La création est temporairement suspendue.|إنشاء الاختبارات الجديدة متوقف مؤقتًا.
verificationRequired|Complete the creator verification to publish.|প্রকাশের জন্য স্রষ্টার যাচাই শেষ করুন।|Completa la verificación para publicar.|प्रकाशन हेतु रचनाकार सत्यापन पूरा करें।|Terminez la vérification pour publier.|أكمل تحقق المنشئ للنشر.
notOpen|This exam is not open yet.|এই পরীক্ষা এখনও খোলেনি।|El examen aún no está abierto.|यह परीक्षा अभी खुली नहीं है।|Cet examen n’est pas encore ouvert.|هذا الاختبار لم يُفتح بعد.
notClosed|Close the exam before releasing results.|ফল প্রকাশের আগে পরীক্ষা বন্ধ করুন।|Cierra el examen antes de publicar resultados.|परिणाम जारी करने से पहले परीक्षा बंद करें।|Fermez l’examen avant de publier les résultats.|أغلق الاختبار قبل نشر النتائج.
notSubmitted|This attempt has not been submitted.|এই প্রচেষ্টা জমা হয়নি।|Este intento no se ha enviado.|यह प्रयास जमा नहीं हुआ।|Cette tentative n’a pas été envoyée.|لم تُسلَّم هذه المحاولة.
lateJoinDisabled|Late joining is disabled for this exam.|এই পরীক্ষায় দেরিতে যোগ দেওয়া বন্ধ।|No se permiten entradas tardías.|इस परीक्षा में देर से जुड़ना बंद है।|Les arrivées tardives sont désactivées.|الانضمام المتأخر معطل لهذا الاختبار.
tooLarge|This content exceeds the supported size limit.|এই বিষয়বস্তু অনুমোদিত আকারের বেশি।|El contenido supera el tamaño permitido.|सामग्री आकार सीमा से अधिक है।|Ce contenu dépasse la taille autorisée.|يتجاوز المحتوى الحجم المدعوم.
parseFailed|Unable to read this document. Try TXT or the CSV template; encrypted files are unsupported.|নথি পড়া যাচ্ছে না। TXT বা CSV নমুনা ব্যবহার করুন; এনক্রিপ্ট করা ফাইল চলে না।|No se puede leer. Prueba TXT o la plantilla CSV; no se admiten archivos cifrados.|दस्तावेज़ पढ़ नहीं सकते। TXT या CSV नमूना आज़माएँ; एन्क्रिप्टेड फ़ाइलें समर्थित नहीं।|Lecture impossible. Essayez TXT ou le modèle CSV ; les fichiers chiffrés ne sont pas pris en charge.|تعذرت قراءة المستند. جرّب TXT أو قالب CSV؛ الملفات المشفرة غير مدعومة.
ocrNeeded|No selectable text found. This PDF needs OCR, which is not included.|নির্বাচনযোগ্য লেখা নেই। এই PDF-এ OCR দরকার, যা অন্তর্ভুক্ত নয়।|No hay texto seleccionable. El PDF necesita OCR, no incluido.|चयन योग्य पाठ नहीं मिला। PDF को OCR चाहिए, जो शामिल नहीं है।|Aucun texte sélectionnable. Ce PDF nécessite un OCR, non inclus.|لا يوجد نص قابل للتحديد. يحتاج PDF إلى OCR غير مضمن.
truncated|Text was shortened to 40,000 characters. Select the sections you need.|লেখা ৪০,০০০ অক্ষরে সংক্ষিপ্ত হয়েছে। দরকারি অংশ বাছুন।|Texto reducido a 40.000 caracteres. Selecciona las secciones necesarias.|पाठ 40,000 अक्षरों तक घटाया गया। आवश्यक भाग चुनें।|Texte réduit à 40 000 caractères. Sélectionnez les passages utiles.|اختُصر النص إلى 40 ألف حرف. حدد الأقسام المطلوبة.
invalidGeneration|AI output was invalid. Adjust the source or create questions manually.|AI ফল ভুল গঠনের। উৎস বদলান বা নিজে প্রশ্ন লিখুন।|Salida de IA inválida. Ajusta la fuente o crea preguntas manualmente.|AI परिणाम अमान्य है। स्रोत बदलें या स्वयं प्रश्न बनाएँ।|Résultat IA invalide. Adaptez la source ou rédigez les questions.|مخرجات الذكاء الاصطناعي غير صالحة. عدّل المصدر أو أنشئ الأسئلة يدويًا.
modelUnavailable|The configured local model is unavailable.|নির্ধারিত স্থানীয় মডেল অনুপলব্ধ।|El modelo local configurado no está disponible.|निर्धारित स्थानीय मॉडल अनुपलब्ध है।|Le modèle local configuré est indisponible.|النموذج المحلي المحدد غير متاح.
generationFailed|Generation failed. Try a shorter source or manual creation.|তৈরি ব্যর্থ। ছোট উৎস বা নিজে লেখার চেষ্টা করুন।|Error al generar. Prueba una fuente más corta o creación manual.|निर्माण विफल। छोटा स्रोत या स्वयं निर्माण करें।|Échec de génération. Essayez une source plus courte ou la création manuelle.|فشل الإنشاء. جرّب مصدرًا أقصر أو الإنشاء اليدوي.
expiredLease|The AI lease expired. Retry the job.|AI কাজের সময়সীমা শেষ। আবার চেষ্টা করুন।|La concesión de IA caducó. Reintenta.|AI की समय सीमा समाप्त। फिर प्रयास करें।|Le bail IA a expiré. Relancez la tâche.|انتهت مهلة مهمة الذكاء الاصطناعي. أعد المحاولة.
storageFailed|Device storage is unavailable. Keep this tab open and download your draft.|ডিভাইসে সংরক্ষণ হচ্ছে না। ট্যাব খোলা রাখুন ও খসড়া ডাউনলোড করুন।|Almacenamiento no disponible. Mantén la pestaña abierta y descarga el borrador.|डिवाइस संग्रह अनुपलब्ध है। टैब खुला रखें और प्रारूप डाउनलोड करें।|Stockage indisponible. Gardez l’onglet ouvert et téléchargez le brouillon.|تخزين الجهاز غير متاح. أبقِ الصفحة مفتوحة ونزّل المسودة.
downloadDraft|Download draft|খসড়া ডাউনলোড|Descargar borrador|प्रारूप डाउनलोड|Télécharger le brouillon|تنزيل المسودة
csvTemplate|CSV import template|CSV আমদানির নমুনা|Plantilla de importación CSV|CSV आयात नमूना|Modèle d’import CSV|قالب استيراد CSV
privacyText|No accounts or real names required. Published quizzes and answers live in the cloud database. Device drafts stay locally. Responses expire up to 30 days after closure, and quizzes within 90 days. AI text expires within one hour or after acknowledged retrieval. Creators can export or delete sooner. Backups may retain deleted data for seven days; diagnostic logs have separate retention. No advertising, webcam, GPS or participant analytics. Schools and parents must review data handling before use with children. This is not a compliance certification.|অ্যাকাউন্ট বা আসল নাম লাগে না। প্রকাশিত কুইজ ও উত্তর ক্লাউড ডেটাবেসে থাকে। ডিভাইসের খসড়া স্থানীয় থাকে। বন্ধের ৩০ দিনের মধ্যে উত্তর, ৯০ দিনের মধ্যে কুইজের মেয়াদ শেষ হয়। AI লেখা এক ঘণ্টায় বা গ্রহণ নিশ্চিত হলে মুছে যায়। স্রষ্টা আগে রপ্তানি বা মুছতে পারেন। ব্যাকআপে মুছে ফেলা তথ্য সাত দিন থাকতে পারে; লগের মেয়াদ আলাদা। বিজ্ঞাপন, ওয়েবক্যাম, GPS বা অংশগ্রহণকারী বিশ্লেষণ নেই। শিশুদের ব্যবহারের আগে স্কুল ও অভিভাবককে তথ্য ব্যবস্থাপনা যাচাই করতে হবে। এটি সম্মতির সনদ নয়।|No requiere cuentas ni nombres reales. Los cuestionarios publicados y respuestas están en la base de datos en la nube; los borradores quedan en el dispositivo. Las respuestas caducan hasta 30 días tras el cierre y los cuestionarios en 90 días. El texto de IA caduca en una hora o al confirmar su recepción. Los creadores pueden exportar o eliminar antes. Las copias de seguridad pueden conservar datos eliminados siete días; los registros tienen otra retención. Sin publicidad, cámara, GPS ni analítica de participantes. Centros y familias deben revisar el tratamiento antes del uso con menores. No es una certificación de cumplimiento.|खाते या असली नाम आवश्यक नहीं। प्रकाशित क्विज़ और उत्तर क्लाउड डेटाबेस में हैं; प्रारूप डिवाइस पर रहते हैं। बंद होने के 30 दिनों तक उत्तर और 90 दिनों में क्विज़ समाप्त होते हैं। AI पाठ एक घंटे में या प्राप्ति की पुष्टि पर मिटता है। रचनाकार पहले निर्यात या मिटा सकते हैं। बैकअप सात दिन तक मिटाया डेटा रख सकते हैं; लॉग की अवधि अलग है। विज्ञापन, कैमरा, GPS या प्रतिभागी विश्लेषण नहीं। बच्चों के उपयोग से पहले विद्यालय और अभिभावक डेटा प्रक्रिया जाँचें। यह अनुपालन प्रमाणपत्र नहीं है।|Aucun compte ni vrai nom requis. Les quiz publiés et réponses sont dans la base cloud ; les brouillons restent sur l’appareil. Les réponses expirent au plus tard 30 jours après clôture, les quiz sous 90 jours. Le texte IA expire sous une heure ou après confirmation de réception. Les créateurs peuvent exporter ou supprimer avant. Les sauvegardes peuvent conserver les données supprimées sept jours ; les journaux ont une rétention distincte. Ni publicité, caméra, GPS, ni analyse des participants. Écoles et parents doivent examiner le traitement avant toute utilisation par des enfants. Ce n’est pas une certification de conformité.|لا حسابات ولا أسماء حقيقية مطلوبة. الاختبارات المنشورة والإجابات في قاعدة البيانات السحابية، والمسودات على الجهاز. تنتهي الإجابات خلال 30 يومًا بعد الإغلاق والاختبارات خلال 90 يومًا. تنتهي نصوص الذكاء الاصطناعي خلال ساعة أو بعد تأكيد الاستلام. يمكن للمنشئين التصدير أو الحذف قبل ذلك. قد تحتفظ النسخ الاحتياطية بالبيانات المحذوفة سبعة أيام؛ للسجلات مدة منفصلة. لا إعلانات ولا كاميرا ولا GPS ولا تحليلات للمشاركين. على المدارس والأهل مراجعة معالجة البيانات قبل استخدام الأطفال. هذه ليست شهادة امتثال.
`;
export const dictionaries=Object.fromEntries(Object.keys(languages).map((l,i)=>[l,Object.fromEntries(rows.trim().split('\n').map(row=>{const [key,...values]=row.split('|');if(values.length!==6)throw new Error(`Translation count: ${key}`);return [key,values[i]];}))])) as Record<Locale,Record<string,string>>;
export const LocaleContext=createContext<Locale>('en');
export function useI18n(){const locale=useContext(LocaleContext);return {locale,t:(key:string)=>dictionaries[locale][key]??dictionaries[locale].invalidInput,n:(v:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(v),date:(v:number)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(v)+' · '+Intl.DateTimeFormat().resolvedOptions().timeZone};}
export function detectLocale():Locale{try{const stored=localStorage.getItem('quizora.locale');if(stored&&stored in languages)return stored as Locale;}catch{}for(const s of navigator.languages){const l=s.split('-')[0];if(l in languages)return l as Locale;}return 'en';}
