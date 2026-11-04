(() => {
  const socket = io({
    reconnection:true,
    reconnectionAttempts:Infinity,
    reconnectionDelay:500,
    reconnectionDelayMax:8000,
    randomizationFactor:0.35,
    timeout:15000,
    transports:['websocket','polling'],
  });
  document.body.dataset.activeScope='world';
  UI.bindSystemSocket?.(socket);
  const THEMES = ['aurora','sunset','ocean','forest','lavender','midnight','rose'];
  const EFFECTS = ['none','neon','glass','aurora','fire','ice','galaxy','pulse','rainbow','shadow','sparkle'];
  const EMOJI_CATEGORIES = [
    {id:'recent',icon:'🕘',emojis:[]},
    {id:'smileys',icon:'😀',emojis:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','🫥','😐','🫤','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🫨','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕']},
    {id:'people',icon:'👋',emojis:['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','👃','🧠','🫀','🫁','🦷','👀','👁️','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','👷','💂','🕵️','👩‍⚕️','👨‍🎓','👩‍🏫','👨‍💻','👩‍🚀','🧙','🦸','🧚','🧜','🧞','🧟']},
    {id:'animals',icon:'🐾',emojis:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪲','🐛','🦋','🐌','🐞','🐜','🪰','🪱','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐈','🪶','🌵','🎄','🌲','🌳','🌴','🪴','🌱','🌿','☘️','🍀','🎍','🪻','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌚','⭐','🌟','✨','⚡','🔥','🌈','☀️','⛅','☁️','🌧️','⛈️','❄️','☃️','💧','🌊']},
    {id:'food',icon:'🍔',emojis:['🍏','🍎','🍐','🍊','🍋','🍋‍🟩','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🫛','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','☕','🫖','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🍸','🍹','🧉','🍾','🧊']},
    {id:'activities',icon:'⚽',emojis:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🎰','🧩']},
    {id:'travel',icon:'✈️',emojis:['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🛟','⛽','🚧','🚦','🚥','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏢','🏥','🏦','🏨','🏪','🏫','🏛️','⛪','🕌','🛕','🕍','⛩️','🕋','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉']},
    {id:'objects',icon:'💡',emojis:['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💳','🧾','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚿','🛁','🪥','🪒','🧼','🫧','🧽','🪣','🧴','🔑','🗝️','🚪','🪑','🛋️','🛏️','🪞','🪟','🧸','🪆','🖼️','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🪩','🎐','🏮','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓']},
    {id:'symbols',icon:'✨',emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','🩷','🩵','🩶','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','🔀','🔁','🔂','◀️','🔼','🔽','⏫','⏬','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','🔄','↪️','↩️','⤴️','⤵️','🔃','🔚','🔙','🔛','🔝','🔜','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🟥','🟧','🟨','🟩','🟦','🟪','🟫','⬛','⬜','◼️','◻️','◾','◽','▪️','▫️','🔸','🔹','🔶','🔷','🔺','🔻','💬','👁️‍🗨️','🗨️','🗯️','💭','♠️','♣️','♥️','♦️','🃏','🎴','🀄']},
    {id:'flags',icon:'🏳️',emojis:['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🇺🇳','🇻🇳','🇺🇸','🇬🇧','🇨🇳','🇯🇵','🇰🇷','🇹🇭','🇸🇬','🇲🇾','🇮🇩','🇵🇭','🇱🇦','🇰🇭','🇲🇲','🇧🇳','🇹🇱','🇮🇳','🇦🇺','🇳🇿','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇨🇺','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇵🇱','🇨🇿','🇭🇺','🇷🇴','🇬🇷','🇸🇪','🇳🇴','🇫🇮','🇩🇰','🇮🇸','🇮🇪','🇺🇦','🇷🇺','🇹🇷','🇸🇦','🇦🇪','🇶🇦','🇮🇱','🇪🇬','🇿🇦','🇳🇬','🇰🇪','🇲🇦','🇦🇱','🇩🇿','🇦🇫','🇦🇴','🇦🇿','🇧🇩','🇧🇭','🇧🇴','🇧🇦','🇧🇬','🇨🇷','🇨🇾','🇩🇴','🇪🇨','🇪🇪','🇪🇹','🇬🇪','🇬🇭','🇭🇰','🇭🇷','🇯🇲','🇯🇴','🇰🇿','🇰🇼','🇱🇧','🇱🇹','🇱🇻','🇱🇺','🇲🇴','🇲🇩','🇲🇳','🇳🇵','🇴🇲','🇵🇦','🇵🇰','🇵🇷','🇷🇸','🇸🇮','🇸🇰','🇹🇳','🇹🇼','🇺🇾','🇺🇿','🇻🇪']}
  ];
  const EMOJI_RECENT_KEY = 'nexchat:emoji-recent';
  const EMOJI_COPY = {
    vi:{title:'Biểu cảm',recent:'Gần đây',smileys:'Cảm xúc',people:'Con người',animals:'Động vật & thiên nhiên',food:'Đồ ăn & thức uống',activities:'Hoạt động',travel:'Du lịch & địa điểm',objects:'Đồ vật',symbols:'Biểu tượng',flags:'Quốc kỳ',hint:'Chọn nhiều biểu cảm mà không cần đóng bảng.',empty:'Chưa có biểu cảm gần đây.'},
    en:{title:'Emoji',recent:'Recent',smileys:'Smileys',people:'People',animals:'Animals & nature',food:'Food & drink',activities:'Activities',travel:'Travel & places',objects:'Objects',symbols:'Symbols',flags:'Flags',hint:'Choose multiple emoji without closing the panel.',empty:'No recent emoji yet.'},
    zh:{title:'表情符号',recent:'最近',smileys:'笑脸',people:'人物',animals:'动物与自然',food:'食物与饮品',activities:'活动',travel:'旅行与地点',objects:'物品',symbols:'符号',flags:'旗帜',hint:'无需关闭面板即可连续选择。',empty:'暂无最近使用的表情。'},
    ru:{title:'Эмодзи',recent:'Недавние',smileys:'Смайлы',people:'Люди',animals:'Животные и природа',food:'Еда и напитки',activities:'Активности',travel:'Путешествия',objects:'Предметы',symbols:'Символы',flags:'Флаги',hint:'Можно выбрать несколько эмодзи подряд.',empty:'Недавних эмодзи пока нет.'},
    de:{title:'Emoji',recent:'Zuletzt',smileys:'Smileys',people:'Menschen',animals:'Tiere & Natur',food:'Essen & Trinken',activities:'Aktivitäten',travel:'Reisen & Orte',objects:'Objekte',symbols:'Symbole',flags:'Flaggen',hint:'Mehrere Emoji auswählen, ohne das Fenster zu schließen.',empty:'Noch keine zuletzt verwendeten Emoji.'},
    th:{title:'อีโมจิ',recent:'ล่าสุด',smileys:'ใบหน้า',people:'ผู้คน',animals:'สัตว์และธรรมชาติ',food:'อาหารและเครื่องดื่ม',activities:'กิจกรรม',travel:'การเดินทาง',objects:'สิ่งของ',symbols:'สัญลักษณ์',flags:'ธง',hint:'เลือกอีโมจิหลายรายการโดยไม่ต้องปิดหน้าต่าง',empty:'ยังไม่มีอีโมจิล่าสุด'},
    es:{title:'Emoji',recent:'Recientes',smileys:'Caritas',people:'Personas',animals:'Animales y naturaleza',food:'Comida y bebida',activities:'Actividades',travel:'Viajes y lugares',objects:'Objetos',symbols:'Símbolos',flags:'Banderas',hint:'Elige varios emoji sin cerrar el panel.',empty:'Todavía no hay emoji recientes.'},
    fr:{title:'Emoji',recent:'Récents',smileys:'Émotions',people:'Personnes',animals:'Animaux et nature',food:'Nourriture et boissons',activities:'Activités',travel:'Voyages et lieux',objects:'Objets',symbols:'Symboles',flags:'Drapeaux',hint:'Choisissez plusieurs emoji sans fermer le panneau.',empty:'Aucun emoji récent.'},
    ja:{title:'絵文字',recent:'最近',smileys:'スマイル',people:'人',animals:'動物と自然',food:'食べ物と飲み物',activities:'アクティビティ',travel:'旅行と場所',objects:'物',symbols:'記号',flags:'旗',hint:'パネルを閉じずに複数選択できます。',empty:'最近使った絵文字はありません。'}
  };
  let activeEmojiCategory = 'smileys';
  const REACTIONS = ['👍','❤️','😂','😮','😢','😡'];
  const EXTRA = {
    vi:{messageRequests:'Tin nhắn chờ',strangerMessages:'Tin nhắn từ người lạ',suggestions:'Gợi ý kết bạn',discoverPeople:'Khám phá người mới',savedMessages:'Tin nhắn đã lưu',savedForLater:'Xem lại sau',newGroup:'Tạo nhóm',pinnedChats:'Đã ghim',groups:'Nhóm chat',noPinned:'Chưa ghim cuộc trò chuyện',noGroups:'Chưa có nhóm chat',camera:'Chụp ảnh',voiceMessage:'Tin nhắn thoại',shareLocation:'Chia sẻ vị trí'},
    en:{messageRequests:'Message requests',strangerMessages:'Messages from strangers',suggestions:'Friend suggestions',discoverPeople:'Discover people',savedMessages:'Saved messages',savedForLater:'View later',newGroup:'New group',pinnedChats:'Pinned',groups:'Groups',noPinned:'No pinned conversations',noGroups:'No groups yet',camera:'Camera',voiceMessage:'Voice message',shareLocation:'Share location'},
    zh:{messageRequests:'消息请求',strangerMessages:'陌生人消息',suggestions:'好友推荐',discoverPeople:'发现新朋友',savedMessages:'已保存消息',savedForLater:'稍后查看',newGroup:'新建群组',pinnedChats:'已置顶',groups:'群聊',noPinned:'暂无置顶会话',noGroups:'暂无群聊',camera:'拍照',voiceMessage:'语音消息',shareLocation:'共享位置'},
    ru:{messageRequests:'Запросы сообщений',strangerMessages:'Сообщения от незнакомцев',suggestions:'Рекомендации друзей',discoverPeople:'Новые люди',savedMessages:'Сохранённые сообщения',savedForLater:'Посмотреть позже',newGroup:'Новая группа',pinnedChats:'Закреплённые',groups:'Группы',noPinned:'Нет закреплённых бесед',noGroups:'Групп пока нет',camera:'Камера',voiceMessage:'Голосовое сообщение',shareLocation:'Поделиться геопозицией'},
    de:{messageRequests:'Nachrichtenanfragen',strangerMessages:'Nachrichten von Fremden',suggestions:'Freundesvorschläge',discoverPeople:'Neue Kontakte',savedMessages:'Gespeicherte Nachrichten',savedForLater:'Später ansehen',newGroup:'Neue Gruppe',pinnedChats:'Angeheftet',groups:'Gruppen',noPinned:'Keine angehefteten Unterhaltungen',noGroups:'Noch keine Gruppen',camera:'Kamera',voiceMessage:'Sprachnachricht',shareLocation:'Standort teilen'},
    th:{messageRequests:'คำขอข้อความ',strangerMessages:'ข้อความจากคนแปลกหน้า',suggestions:'คำแนะนำเพื่อน',discoverPeople:'ค้นพบผู้คน',savedMessages:'ข้อความที่บันทึก',savedForLater:'ดูภายหลัง',newGroup:'สร้างกลุ่ม',pinnedChats:'ปักหมุด',groups:'กลุ่มแชท',noPinned:'ยังไม่มีแชทที่ปักหมุด',noGroups:'ยังไม่มีกลุ่มแชท',camera:'กล้อง',voiceMessage:'ข้อความเสียง',shareLocation:'แชร์ตำแหน่ง'},
    es:{messageRequests:'Solicitudes de mensajes',strangerMessages:'Mensajes de desconocidos',suggestions:'Sugerencias de amistad',discoverPeople:'Descubrir personas',savedMessages:'Mensajes guardados',savedForLater:'Ver más tarde',newGroup:'Nuevo grupo',pinnedChats:'Fijados',groups:'Grupos',noPinned:'No hay conversaciones fijadas',noGroups:'Aún no hay grupos',camera:'Cámara',voiceMessage:'Mensaje de voz',shareLocation:'Compartir ubicación'},
    fr:{messageRequests:'Demandes de messages',strangerMessages:'Messages d’inconnus',suggestions:'Suggestions d’amis',discoverPeople:'Découvrir des personnes',savedMessages:'Messages enregistrés',savedForLater:'Voir plus tard',newGroup:'Nouveau groupe',pinnedChats:'Épinglés',groups:'Groupes',noPinned:'Aucune conversation épinglée',noGroups:'Aucun groupe pour le moment',camera:'Appareil photo',voiceMessage:'Message vocal',shareLocation:'Partager la position'},
    ja:{messageRequests:'メッセージリクエスト',strangerMessages:'知らない人からのメッセージ',suggestions:'友だち候補',discoverPeople:'新しい人を見つける',savedMessages:'保存済みメッセージ',savedForLater:'あとで見る',newGroup:'新しいグループ',pinnedChats:'固定済み',groups:'グループ',noPinned:'固定した会話はありません',noGroups:'グループはまだありません',camera:'カメラ',voiceMessage:'音声メッセージ',shareLocation:'位置情報を共有'},
  };
  const state = {
    me:null, friends:[], incoming:[], outgoing:[], blocked:[], suggestions:[], messageRequests:[], groups:[], pendingDeletes:[],
    active:{scope:'world',targetId:null}, activeAccess:{blocked:false,blockedByMe:false,blockedByOther:false,canSend:true}, messages:[], selectedFile:null, selectedFileUrl:null, selectedMessage:null, selectedProfile:null,
    typingTimer:null, remoteTypingTimer:null, typingActive:false, lastTypingSignalAt:0, draftTimer:null, pendingDraftKeys:new Set(), composerResizeFrame:0, composerComposing:false, deleteTimer:null, mediaRecorder:null, audioChunks:[], cameraStream:null, cameraFilter:'none',
    conversationLoadToken:0, conversationAbort:null, worldNextSendAt:0, worldCooldownTimer:null,
    system:{worldChatEnabled:true,worldChat:{mode:'open',lockedUntil:null,slowModeSeconds:0,antiSpamEnabled:true,enabled:true},activeAnnouncement:null}, supportUnread:0, supportMessaging:{blocked:false,permanent:false,blockedUntil:null,reason:'',strikes:0,resetAt:null}, profileMediaUploads:0,
  };
  const VOICE_TEXT={
    vi:{hold:'Nhấn giữ để ghi âm',recording:'Đang ghi âm',release:'Thả để gửi · Kéo sang trái để hủy · Kéo lên để khóa',cancelReady:'Thả tay để hủy',locked:'Đã khóa · Chạm gửi khi hoàn tất',starting:'Đang mở micro…',cancel:'Hủy ghi âm',send:'Gửi tin nhắn thoại',tooShort:'Giữ micro lâu hơn để ghi tin nhắn thoại.',canceled:'Đã hủy ghi âm.',denied:'Không thể truy cập micro. Hãy kiểm tra quyền trình duyệt.',unsupported:'Trình duyệt này chưa hỗ trợ ghi âm.',busy:'Hãy gửi hoặc xóa nội dung đang soạn trước khi ghi âm.',quickHint:'Nhấn giữ nút micro cạnh nút gửi, thả tay để gửi ngay.'},
    en:{hold:'Hold to record',recording:'Recording',release:'Release to send · Slide left to cancel · Slide up to lock',cancelReady:'Release to cancel',locked:'Locked · Tap send when finished',starting:'Opening microphone…',cancel:'Cancel recording',send:'Send voice message',tooShort:'Hold the microphone a little longer to record.',canceled:'Recording canceled.',denied:'Microphone access failed. Check your browser permission.',unsupported:'Voice recording is not supported by this browser.',busy:'Send or clear the current draft before recording.',quickHint:'Hold the microphone beside Send, then release to send instantly.'},
    zh:{hold:'按住录音',recording:'正在录音',release:'松开发送 · 左滑取消 · 上滑锁定',cancelReady:'松手取消',locked:'已锁定 · 完成后点击发送',starting:'正在打开麦克风…',cancel:'取消录音',send:'发送语音消息',tooShort:'请按住麦克风更久一些。',canceled:'已取消录音。',denied:'无法访问麦克风，请检查浏览器权限。',unsupported:'此浏览器暂不支持录音。',busy:'请先发送或清除当前草稿。',quickHint:'按住发送键旁的麦克风，松开即可发送。'},
    ru:{hold:'Удерживайте для записи',recording:'Идёт запись',release:'Отпустите для отправки · Влево — отмена · Вверх — блокировка',cancelReady:'Отпустите для отмены',locked:'Запись закреплена · Нажмите отправить',starting:'Включение микрофона…',cancel:'Отменить запись',send:'Отправить голосовое сообщение',tooShort:'Удерживайте микрофон немного дольше.',canceled:'Запись отменена.',denied:'Нет доступа к микрофону. Проверьте разрешения браузера.',unsupported:'Браузер не поддерживает запись голоса.',busy:'Сначала отправьте или очистите черновик.',quickHint:'Удерживайте микрофон рядом с кнопкой отправки и отпустите для отправки.'},
    de:{hold:'Zum Aufnehmen halten',recording:'Aufnahme läuft',release:'Loslassen zum Senden · Nach links zum Abbrechen · Nach oben zum Sperren',cancelReady:'Zum Abbrechen loslassen',locked:'Gesperrt · Zum Senden tippen',starting:'Mikrofon wird geöffnet…',cancel:'Aufnahme abbrechen',send:'Sprachnachricht senden',tooShort:'Mikrofon etwas länger gedrückt halten.',canceled:'Aufnahme abgebrochen.',denied:'Kein Mikrofonzugriff. Browserberechtigung prüfen.',unsupported:'Dieser Browser unterstützt keine Sprachaufnahme.',busy:'Entwurf zuerst senden oder löschen.',quickHint:'Mikrofon neben Senden gedrückt halten und zum Senden loslassen.'},
    th:{hold:'กดค้างเพื่อบันทึกเสียง',recording:'กำลังบันทึกเสียง',release:'ปล่อยเพื่อส่ง · เลื่อนไปซ้ายเพื่อยกเลิก · เลื่อนขึ้นเพื่อล็อก',cancelReady:'ปล่อยเพื่อยกเลิก',locked:'ล็อกแล้ว · แตะส่งเมื่อเสร็จ',starting:'กำลังเปิดไมโครโฟน…',cancel:'ยกเลิกการบันทึก',send:'ส่งข้อความเสียง',tooShort:'กดไมโครโฟนค้างให้นานกว่านี้',canceled:'ยกเลิกการบันทึกแล้ว',denied:'ไม่สามารถเข้าถึงไมโครโฟนได้ โปรดตรวจสอบสิทธิ์เบราว์เซอร์',unsupported:'เบราว์เซอร์นี้ยังไม่รองรับการบันทึกเสียง',busy:'ส่งหรือล้างข้อความที่กำลังพิมพ์ก่อน',quickHint:'กดปุ่มไมโครโฟนข้างปุ่มส่งค้างไว้ แล้วปล่อยเพื่อส่งทันที'},
    es:{hold:'Mantén pulsado para grabar',recording:'Grabando',release:'Suelta para enviar · Desliza a la izquierda para cancelar · Arriba para bloquear',cancelReady:'Suelta para cancelar',locked:'Bloqueado · Pulsa enviar al terminar',starting:'Abriendo el micrófono…',cancel:'Cancelar grabación',send:'Enviar mensaje de voz',tooShort:'Mantén el micrófono pulsado un poco más.',canceled:'Grabación cancelada.',denied:'No se pudo acceder al micrófono. Revisa los permisos.',unsupported:'Este navegador no admite grabación de voz.',busy:'Envía o borra el borrador antes de grabar.',quickHint:'Mantén pulsado el micrófono junto a Enviar y suelta para enviar.'},
    fr:{hold:'Maintenez pour enregistrer',recording:'Enregistrement',release:'Relâchez pour envoyer · Glissez à gauche pour annuler · Vers le haut pour verrouiller',cancelReady:'Relâchez pour annuler',locked:'Verrouillé · Touchez envoyer à la fin',starting:'Ouverture du micro…',cancel:'Annuler l’enregistrement',send:'Envoyer le message vocal',tooShort:'Maintenez le micro un peu plus longtemps.',canceled:'Enregistrement annulé.',denied:'Impossible d’accéder au micro. Vérifiez les autorisations.',unsupported:'Ce navigateur ne prend pas en charge l’enregistrement vocal.',busy:'Envoyez ou effacez le brouillon avant d’enregistrer.',quickHint:'Maintenez le micro près du bouton Envoyer puis relâchez pour envoyer.'},
    ja:{hold:'長押しして録音',recording:'録音中',release:'離して送信 · 左へスライドで取消 · 上へスライドでロック',cancelReady:'離して取消',locked:'ロック中 · 完了したら送信',starting:'マイクを開いています…',cancel:'録音を取消',send:'音声メッセージを送信',tooShort:'もう少し長くマイクを押してください。',canceled:'録音を取り消しました。',denied:'マイクにアクセスできません。ブラウザ権限を確認してください。',unsupported:'このブラウザは音声録音に対応していません。',busy:'録音前に下書きを送信または削除してください。',quickHint:'送信ボタン横のマイクを長押しし、離すとすぐ送信できます。'}
  };
  const voiceCapture={active:false,starting:false,locked:false,cancelArmed:false,pointerId:null,originX:0,originY:0,startedAt:0,timer:0,maxTimer:0,stream:null,recorder:null,chunks:[],stopAction:'',pendingAction:'',contextKey:'',audioContext:null,analyser:null,source:null,waveFrame:0,waveData:null,keyboardKey:''};
  let bootstrapRefreshTimer=null;
  let effectVisibilityObserver=null;
  let disconnectToastShown=false;
  let messageRenderFrame=0;
  let pendingRenderForceScroll=false;
  let messageViewportFrame=0;
  let pendingMessageScrollBottom=false;
  let pendingMessageScrollTop=null;
  let chatSendBurstTimer=null;
  let activeReadTimer=null;
  let effectExpiryTimer=null;
  let effectSelectionPending=false;
  const MESSAGE_GROUP_GAP=3*60*1000;
  const $ = (id) => document.getElementById(id);
  const storage = {
    get(key, fallback = '') { try { const value = localStorage.getItem(key); return value === null ? fallback : value; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); return true; } catch { return false; } },
    sessionGet(key, fallback = '') { try { const value = sessionStorage.getItem(key); return value === null ? fallback : value; } catch { return fallback; } },
  };
  const t = (key, vars={}) => window.I18N?.t(key,vars) || key;
  function voiceLanguage(){const raw=window.I18N?.language||window.I18N?.currentLanguage?.()||document.documentElement.lang||'vi';const code=String(raw).toLowerCase().replace('_','-').split('-')[0];return VOICE_TEXT[code]?code:'en';}
  function voiceText(key){return VOICE_TEXT[voiceLanguage()]?.[key]||VOICE_TEXT.en[key]||key;}
  const tx = (key) => EXTRA[window.I18N?.language || 'vi']?.[key] || EXTRA.vi[key] || key;
  const serverText = (msg) => window.I18N?.serverMessage(msg) || msg;
  const escape = UI.escapeHTML;
  const icon = (name, cls="") => UI.iconHTML(name, cls);
  const profileRank = (user) => UI.profileRank?.(user) || "standard";
  const rankClass = (user, prefix = "rank") => `${prefix}-${profileRank(user)}`;
  function rankPresentation(user, compact = false) {
    const rank = profileRank(user);
    const grant = activePrivilege(user, rank);
    const remaining = grant ? remainingPrivilegeText(grant, false) : '';
    const title = grant && remaining ? `${rank.toUpperCase()} · ${remaining}` : rank.toUpperCase();
    if (rank === "legend") return `<span class="elite-tier-chip tier-legend${compact ? " is-compact" : ""}" title="${escape(title)}"><i aria-hidden="true">L</i><span><b>LEGEND</b>${compact ? "" : "<small>Đẳng cấp tối thượng</small>"}</span></span>`;
    if (rank === "vip") return `<span class="elite-tier-chip tier-vip${compact ? " is-compact" : ""}" title="${escape(title)}"><i aria-hidden="true">V</i><span><b>VIP</b>${compact ? "" : "<small>Thành viên đặc quyền</small>"}</span></span>`;
    return "";
  }
  function meCardTierPill(user) {
    const rank = profileRank(user);
    if (rank === 'legend') return '<span class="me-card-tier-pill is-legend">LEGEND</span>';
    if (rank === 'vip') return '<span class="me-card-tier-pill is-vip">VIP</span>';
    return '';
  }
  function applyTierClass(element, user, base = "profile-tier") {
    if (!element) return;
    element.classList.remove(`${base}-vip`, `${base}-legend`, `${base}-standard`);
    element.classList.add(`${base}-${profileRank(user)}`);
    element.dataset.profileRank = profileRank(user);
  }
  function activePrivilege(user, type) {
    const grant = user?.profileBadges?.[type];
    return grant && (!grant.expiresAt || Date.now() < Number(grant.expiresAt)) ? grant : null;
  }
  function remainingPrivilegeText(grant, compact = false) {
    return UI.badgeRemainingText?.(grant, compact) || (grant?.expiresAt ? UI.formatDate(grant.expiresAt) : 'Vĩnh viễn');
  }
  function privilegeStatusHTML(user, compact = false) {
    const legend = activePrivilege(user, 'legend');
    const vip = activePrivilege(user, 'vip');
    const cards = [];
    if (legend) cards.push(`<article class="privilege-time-card privilege-legend is-primary" data-privilege-type="legend" data-privilege-expires="${legend.expiresAt || ''}"><span class="privilege-time-emblem">L</span><div><strong>LEGEND</strong><small>${legend.expiresAt ? 'Thời gian còn lại' : 'Đặc quyền cao nhất'}</small></div><b class="privilege-countdown">${escape(remainingPrivilegeText(legend, compact))}</b></article>`);
    if (vip) cards.push(`<article class="privilege-time-card privilege-vip ${legend ? 'is-secondary' : 'is-primary'}" data-privilege-type="vip" data-privilege-expires="${vip.expiresAt || ''}"><span class="privilege-time-emblem">V</span><div><strong>VIP</strong><small>${vip.expiresAt ? 'Thời gian còn lại' : 'Đặc quyền thành viên'}</small></div><b class="privilege-countdown">${escape(remainingPrivilegeText(vip, compact))}</b></article>`);
    return cards.length ? `<section class="privilege-status-shell ${legend ? 'priority-legend' : 'priority-vip'}">${cards.join('')}</section>` : '';
  }
  function refreshPrivilegeCountdowns(root = document) {
    root.querySelectorAll?.('[data-privilege-expires]').forEach((card) => {
      const expires = Number(card.dataset.privilegeExpires);
      const label = card.querySelector('.privilege-countdown');
      if (!label) return;
      if (!expires) { label.textContent = 'Vĩnh viễn'; return; }
      const grant = { expiresAt: expires };
      label.textContent = remainingPrivilegeText(grant, false);
      card.classList.toggle('is-expiring', expires - Date.now() < 86400000);
      card.classList.toggle('is-expired', expires <= Date.now());
    });
  }
  const EFFECT_COPY={
    vi:{title:'Hiệu ứng bong bóng đặc biệt',description:'Quyền sử dụng được mở khi admin cấp hoặc khi tài khoản đang sở hữu VIP/LEGEND. Hiệu ứng chỉ áp dụng cho tin nhắn mới và tự trở về bong bóng thường khi quyền kết thúc.',notice:'Tin nhắn vẫn được lưu nguyên vẹn; chỉ lớp hiệu ứng hiển thị bị tắt khi hết quyền.',close:'Đóng',off:'Tắt hiệu ứng đặc biệt',public:'Hiển thị với mọi người trong cuộc trò chuyện',selected:'Đã áp dụng. Các tin nhắn mới sẽ sử dụng hiệu ứng này.',using:'Đang dùng',choose:'Chạm để chọn hiệu ứng bóng chat',publicTitle:'Hiệu ứng bong bóng công khai',labels:{none:'Không dùng',neon:'Neon phát sáng',glass:'Kính pha lê',aurora:'Cực quang',fire:'Ngọn lửa',ice:'Băng xanh',galaxy:'Thiên hà',pulse:'Nhịp sáng',rainbow:'Cầu vồng',shadow:'Bóng nổi',sparkle:'Lấp lánh'}},
    en:{title:'Exclusive chat bubble effects',description:'Access is granted by an administrator or an active VIP/LEGEND privilege. Effects apply to new messages and return to the standard bubble when access ends.',notice:'Message content remains intact; only the visual effect layer is disabled when access expires.',close:'Close',off:'Turn off the special effect',public:'Visible to everyone in the conversation',selected:'Applied. New messages will use this effect.',using:'Using',choose:'Tap to choose a chat bubble effect',publicTitle:'Public chat bubble effect',labels:{none:'None',neon:'Neon glow',glass:'Crystal glass',aurora:'Aurora',fire:'Flame',ice:'Blue ice',galaxy:'Galaxy',pulse:'Light pulse',rainbow:'Rainbow',shadow:'Raised shadow',sparkle:'Sparkle'}},
    zh:{title:'专属聊天气泡效果',description:'管理员授权或有效的 VIP/LEGEND 特权可解锁。效果仅用于新消息，权限结束后自动恢复普通气泡。',notice:'消息内容不会丢失；权限到期时只会关闭视觉效果层。',close:'关闭',off:'关闭特殊效果',public:'对会话中的所有人可见',selected:'已应用，新消息将使用此效果。',using:'正在使用',choose:'点击选择聊天气泡效果',publicTitle:'公开聊天气泡效果',labels:{none:'不使用',neon:'霓虹发光',glass:'水晶玻璃',aurora:'极光',fire:'火焰',ice:'蓝冰',galaxy:'银河',pulse:'光脉冲',rainbow:'彩虹',shadow:'浮雕阴影',sparkle:'闪耀'}},
    ru:{title:'Эксклюзивные эффекты сообщений',description:'Доступ выдаёт администратор либо активный статус VIP/LEGEND. Эффекты применяются к новым сообщениям и отключаются после окончания доступа.',notice:'Содержимое сообщений сохраняется; отключается только визуальный слой.',close:'Закрыть',off:'Отключить эффект',public:'Видно всем участникам беседы',selected:'Применено. Новые сообщения будут использовать этот эффект.',using:'Используется',choose:'Выберите эффект пузыря чата',publicTitle:'Публичный эффект пузыря',labels:{none:'Без эффекта',neon:'Неоновое свечение',glass:'Хрустальное стекло',aurora:'Северное сияние',fire:'Пламя',ice:'Синий лёд',galaxy:'Галактика',pulse:'Световой импульс',rainbow:'Радуга',shadow:'Объёмная тень',sparkle:'Искры'}},
    de:{title:'Exklusive Chatblasen-Effekte',description:'Der Zugriff wird vom Admin oder durch aktives VIP/LEGEND freigeschaltet. Effekte gelten für neue Nachrichten und wechseln nach Ablauf zurück zur Standardblase.',notice:'Nachrichten bleiben vollständig erhalten; nur die visuelle Effektschicht wird deaktiviert.',close:'Schließen',off:'Spezialeffekt ausschalten',public:'Für alle in der Unterhaltung sichtbar',selected:'Angewendet. Neue Nachrichten verwenden diesen Effekt.',using:'Aktiv',choose:'Chatblasen-Effekt auswählen',publicTitle:'Öffentlicher Chatblasen-Effekt',labels:{none:'Kein Effekt',neon:'Neonleuchten',glass:'Kristallglas',aurora:'Polarlicht',fire:'Flamme',ice:'Blaues Eis',galaxy:'Galaxie',pulse:'Lichtimpuls',rainbow:'Regenbogen',shadow:'Erhabener Schatten',sparkle:'Funkeln'}},
    th:{title:'เอฟเฟกต์ฟองข้อความพิเศษ',description:'ปลดล็อกโดยผู้ดูแลหรือสิทธิ์ VIP/LEGEND ที่ยังใช้งานอยู่ เอฟเฟกต์ใช้กับข้อความใหม่และกลับเป็นแบบปกติเมื่อสิทธิ์สิ้นสุด',notice:'เนื้อหาข้อความยังคงอยู่ครบ ระบบจะปิดเฉพาะชั้นเอฟเฟกต์ภาพเมื่อสิทธิ์หมดอายุ',close:'ปิด',off:'ปิดเอฟเฟกต์พิเศษ',public:'ทุกคนในการสนทนามองเห็น',selected:'ใช้แล้ว ข้อความใหม่จะใช้เอฟเฟกต์นี้',using:'กำลังใช้',choose:'แตะเพื่อเลือกเอฟเฟกต์ฟองข้อความ',publicTitle:'เอฟเฟกต์ฟองข้อความสาธารณะ',labels:{none:'ไม่ใช้',neon:'แสงนีออน',glass:'แก้วคริสตัล',aurora:'แสงเหนือ',fire:'เปลวไฟ',ice:'น้ำแข็งสีฟ้า',galaxy:'กาแล็กซี',pulse:'ชีพจรแสง',rainbow:'สายรุ้ง',shadow:'เงานูน',sparkle:'ประกาย'}},
    es:{title:'Efectos exclusivos de burbuja',description:'El acceso se concede por el administrador o mediante un privilegio VIP/LEGEND activo. Los efectos se aplican a mensajes nuevos y vuelven al estilo normal al terminar el acceso.',notice:'El contenido del mensaje permanece intacto; solo se desactiva la capa visual.',close:'Cerrar',off:'Desactivar efecto especial',public:'Visible para todos en la conversación',selected:'Aplicado. Los mensajes nuevos usarán este efecto.',using:'En uso',choose:'Toca para elegir un efecto de burbuja',publicTitle:'Efecto público de burbuja',labels:{none:'Ninguno',neon:'Brillo neón',glass:'Cristal',aurora:'Aurora',fire:'Llama',ice:'Hielo azul',galaxy:'Galaxia',pulse:'Pulso de luz',rainbow:'Arcoíris',shadow:'Sombra elevada',sparkle:'Destellos'}},
    fr:{title:'Effets exclusifs de bulles',description:'L’accès est accordé par un administrateur ou un privilège VIP/LEGEND actif. Les effets s’appliquent aux nouveaux messages puis reviennent au style normal à l’expiration.',notice:'Le contenu des messages reste intact ; seule la couche visuelle est désactivée.',close:'Fermer',off:'Désactiver l’effet spécial',public:'Visible par tous dans la conversation',selected:'Appliqué. Les nouveaux messages utiliseront cet effet.',using:'Utilisé',choose:'Touchez pour choisir un effet de bulle',publicTitle:'Effet public de bulle',labels:{none:'Aucun',neon:'Lueur néon',glass:'Verre cristal',aurora:'Aurore',fire:'Flamme',ice:'Glace bleue',galaxy:'Galaxie',pulse:'Impulsion lumineuse',rainbow:'Arc-en-ciel',shadow:'Ombre en relief',sparkle:'Étincelles'}},
    ja:{title:'限定チャット吹き出し効果',description:'管理者の許可または有効な VIP/LEGEND 特典で利用できます。効果は新しいメッセージに適用され、権限終了後は通常表示に戻ります。',notice:'メッセージ内容は保持され、権限切れ時には視覚効果だけが無効になります。',close:'閉じる',off:'特殊効果をオフ',public:'会話内の全員に表示',selected:'適用しました。新しいメッセージにこの効果が使われます。',using:'使用中',choose:'チャット吹き出し効果を選択',publicTitle:'公開チャット吹き出し効果',labels:{none:'なし',neon:'ネオン発光',glass:'クリスタルガラス',aurora:'オーロラ',fire:'炎',ice:'ブルーアイス',galaxy:'銀河',pulse:'光のパルス',rainbow:'レインボー',shadow:'立体シャドウ',sparkle:'きらめき'}}
  };
  function effectCopy(){const lang=window.I18N?.currentLanguage?.()||window.I18N?.language||'vi';return EFFECT_COPY[lang]||EFFECT_COPY.en;}
  function effectLabel(effect){return effectCopy().labels[effect]||effect;}

  const EFFECT_PREVIEW_META={
    vi:{
      none:{sample:'Xin chào',detail:'Bong bóng mặc định gọn gàng, sạch và dễ đọc.'},
      neon:{sample:'Nè bạn',detail:'Viền sáng rõ, hiện đại và nổi bật như tin nhắn spotlight.'},
      glass:{sample:'Trong veo',detail:'Bề mặt kính mờ tinh tế, mềm mắt và cao cấp.'},
      aurora:{sample:'Mượt quá',detail:'Dải màu chuyển nhẹ, có chiều sâu và cảm giác chuyển động dịu.'},
      fire:{sample:'Quá cháy',detail:'Tông ấm nổi bật cùng điểm nhấn rực ở các góc bong bóng.'},
      ice:{sample:'Mát lạnh',detail:'Hiệu ứng băng trong, sáng và sắc nét nhưng vẫn dễ đọc.'},
      galaxy:{sample:'Cực đẹp',detail:'Không gian sao đêm với hạt sáng nhỏ chân thực hơn.'},
      pulse:{sample:'Có nhé',detail:'Nhịp sáng mềm, tạo cảm giác bong bóng đang sống động.'},
      rainbow:{sample:'Dễ thương',detail:'Cầu vồng pastel mượt, lên màu tươi nhưng không gắt.'},
      shadow:{sample:'Gọn ghê',detail:'Bóng nổi kiểu sticker, rõ khối và trông chân thực hơn.'},
      sparkle:{sample:'Bé ơi',detail:'Trang trí hoa và sparkle ở góc bong bóng theo kiểu mạng xã hội hiện đại.'}
    },
    en:{
      none:{sample:'Hello',detail:'Clean default bubble that stays tidy and easy to read.'},
      neon:{sample:'Hey there',detail:'Sharp glowing edge with a modern spotlight feel.'},
      glass:{sample:'Crystal',detail:'Soft frosted glass surface that feels premium and calm.'},
      aurora:{sample:'So smooth',detail:'Gentle flowing color bands with subtle movement depth.'},
      fire:{sample:'On fire',detail:'Warm vivid tones with bright accents around the bubble.'},
      ice:{sample:'Cool now',detail:'Clear icy finish that stays crisp and readable.'},
      galaxy:{sample:'So pretty',detail:'Night-sky sparkles with a more believable cosmic feel.'},
      pulse:{sample:'Got it',detail:'Soft light pulse that makes the bubble feel alive.'},
      rainbow:{sample:'So cute',detail:'Pastel rainbow blend that is bright without being harsh.'},
      shadow:{sample:'Clean look',detail:'Sticker-like raised shadow with stronger depth.'},
      sparkle:{sample:'Hi cutie',detail:'Corner flowers and sparkles inspired by modern social chat styles.'}
    }
  };
  function effectPreviewMeta(effect){
    const lang=window.I18N?.currentLanguage?.()||window.I18N?.language||'vi';
    const pack=EFFECT_PREVIEW_META[lang]||EFFECT_PREVIEW_META.en;
    return pack[effect]||pack.none;
  }
  function publicEffectChip(effect) {
    if (!effect || effect === 'none') return '';
    return `<span class="world-effect-chip effect-chip-${escape(effect)}" title="${escape(effectCopy().publicTitle)}">${icon('sparkles')}<span>${escape(effectLabel(effect))}</span></span>`;
  }
  function legendBubbleDecor(rank) {
    return rank === 'legend'
      ? '<span class="legend-cosmic-shell" aria-hidden="true"><i class="legend-nebula"></i><b class="legend-orbit"></b><span class="legend-cosmic-core"></span><span class="legend-cosmic-comet"></span></span>'
      : '';
  }

  function applyExtraLanguage(){ document.querySelectorAll('[data-extra-i18n]').forEach((el)=>{el.textContent=tx(el.dataset.extraI18n);}); }

  function emojiCopy(){
    const lang=window.I18N?.currentLanguage?.()||window.I18N?.language||'vi';
    return EMOJI_COPY[lang]||EMOJI_COPY.en;
  }
  function recentEmojiList(){
    try{
      const parsed=JSON.parse(storage.get(EMOJI_RECENT_KEY,'[]'));
      return Array.isArray(parsed)?parsed.filter(Boolean).slice(0,36):[];
    }catch{return [];}
  }
  function rememberEmoji(emoji){
    const list=[emoji,...recentEmojiList().filter((item)=>item!==emoji)].slice(0,36);
    storage.set(EMOJI_RECENT_KEY,JSON.stringify(list));
  }
  function emojiCategoryData(id){
    const category=EMOJI_CATEGORIES.find((item)=>item.id===id)||EMOJI_CATEGORIES[1];
    return category.id==='recent'?{...category,emojis:recentEmojiList()}:category;
  }
  function renderEmojiPicker(){
    const picker=$('emojiPicker');if(!picker)return;
    const copy=emojiCopy();
    const current=emojiCategoryData(activeEmojiCategory);
    const tabs=EMOJI_CATEGORIES.map((category)=>{
      const label=copy[category.id]||category.id;
      const active=category.id===current.id;
      return `<button class="emoji-category-tab${active?' active':''}" type="button" role="tab" data-emoji-category="${category.id}" aria-selected="${active}" title="${escape(label)}"><span aria-hidden="true">${category.icon}</span><b>${escape(label)}</b></button>`;
    }).join('');
    const emojis=current.emojis.length
      ?current.emojis.map((emoji)=>`<button class="emoji-item" type="button" role="gridcell" data-emoji="${escape(emoji)}" aria-label="${escape(emoji)}">${emoji}</button>`).join('')
      :`<div class="emoji-empty-state"><span aria-hidden="true">🕘</span><p>${escape(copy.empty)}</p></div>`;
    picker.innerHTML=`<div class="emoji-picker-shell"><header class="emoji-picker-head"><div><small>${escape(copy.title)}</small><strong>${escape(copy[current.id]||current.id)}</strong></div><button class="emoji-picker-close" type="button" data-emoji-close aria-label="Đóng">${icon('close')}</button></header><div class="emoji-category-tabs" role="tablist" aria-label="${escape(copy.title)}">${tabs}</div><div class="emoji-grid" role="grid" aria-label="${escape(copy[current.id]||current.id)}">${emojis}</div><footer class="emoji-picker-hint">${escape(copy.hint)}</footer></div>`;
  }
  function setEmojiPickerOpen(open){
    const picker=$('emojiPicker'),button=$('emojiButton');if(!picker||!button)return;
    if(open)renderEmojiPicker();
    picker.classList.toggle('hidden',!open);
    button.setAttribute('aria-expanded',String(open));
    button.classList.toggle('active',open);
  }
  function insertEmojiAtCursor(emoji){
    const input=$('messageInput');if(!input)return;
    const start=Number.isInteger(input.selectionStart)?input.selectionStart:input.value.length;
    const end=Number.isInteger(input.selectionEnd)?input.selectionEnd:start;
    input.setRangeText(emoji,start,end,'end');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus({preventScroll:true});
  }

  function displayName(user){ return user ? (state.me?.aliases?.[user.id] || user.alias || user.nickname || user.username) : 'NexChat'; }
  function avatarHTML(user, cls='avatar'){
    if(!user) return UI.avatarHTML({id:'nexchat',nickname:'N'},cls,{presence:false});
    const resolved={...user,nickname:displayName(user)};
    return UI.avatarHTML(resolved,cls,{online:user.online,blocked:user.blocked,presence:cls.includes('message-avatar')?false:true});
  }
  function isMuted(key){ const value=state.me?.mutes?.[key]; return value===null || (Number(value)>Date.now()); }
  function conversationKey(scope,targetId){ return `${scope}:${targetId||''}`; }
  function friendById(id){ return state.friends.find((u)=>u.id===id) || state.blocked.find((u)=>u.id===id) || state.suggestions.find((u)=>u.id===id) || state.messageRequests.find((r)=>r.user.id===id)?.user || null; }
  function draftKey(scope=state.active.scope,targetId=state.active.targetId){return `nexchat-draft:${state.me?.id||'guest'}:${scope}:${targetId||''}`;}
  function syncComposerClearButton(){const button=$('composerClearButton');if(!button)return;const hasText=Boolean($('messageInput')?.value);const hasAttachment=Boolean(state.selectedFile);button.classList.toggle('hidden',!hasText&&!hasAttachment);button.setAttribute('aria-hidden',String(!hasText&&!hasAttachment));}
  function saveDraft(){
    clearTimeout(state.draftTimer);state.draftTimer=null;
    if(!state.me||!$('messageInput'))return;
    const value=$('messageInput').value,key=draftKey();
    try{
      if(value.length)sessionStorage.setItem(key,value);
      else if(!state.pendingDraftKeys.has(key))sessionStorage.removeItem(key);
    }catch(_){/* localStorage có thể bị chặn; không làm gián đoạn nhập liệu. */}
    syncComposerClearButton();
  }
  function queueDraftSave(){clearTimeout(state.draftTimer);state.draftTimer=setTimeout(saveDraft,260);}
  function resizeComposer(){if(state.composerResizeFrame)return;state.composerResizeFrame=requestAnimationFrame(()=>{state.composerResizeFrame=0;UI.autoResize($('messageInput'));syncComposerClearButton();});}
  function restoreDraft(){if(!$('messageInput'))return;let value='';try{value=sessionStorage.getItem(draftKey())||'';}catch(_){}$('messageInput').value=value;resizeComposer();$('messageCounter').textContent=`${value.length}/4000`;syncComposerClearButton();}
  const INTERFACE_SCALES=['auto','0.85','0.95','1','1.1','1.2'];
  // V1.0.0 uses one deterministic transform engine. Native CSS zoom behaved
  // inconsistently after cached styles and browser zoom, so the selector could
  // change while the chat workspace appeared unchanged.
  document.documentElement.classList.remove('native-ui-zoom');
  document.documentElement.classList.add('transform-ui-scale','interface-scale-transform-engine');
  function selectedInterfaceScale(){const stored=storage.get('nexchat-interface-scale','');const account=state.me?.settings?.interfaceScale;return INTERFACE_SCALES.includes(stored)?stored:(INTERFACE_SCALES.includes(account)?account:'auto');}
  function automaticInterfaceScale(){const width=window.visualViewport?.width||window.innerWidth;if(width<=1024)return 1;if(width>=2200)return 1.08;if(width>=1800)return 1.04;return 1;}
  function isMobileScaleViewport(){
    const viewportWidth=Math.round(window.visualViewport?.width||window.innerWidth||document.documentElement.clientWidth||0);
    return viewportWidth<=1024||window.matchMedia?.('(pointer: coarse) and (max-width: 1366px)')?.matches===true;
  }
  function lastRenderedMessageEntry(box=$('messages')){
    if(!box)return null;
    const entries=box.querySelectorAll('[data-message-entry]');
    return entries.length?entries[entries.length-1]:null;
  }
  function messageContentBottom(box=$('messages')){
    if(!box)return 0;
    const tail=lastRenderedMessageEntry(box);
    if(!tail)return box.scrollHeight;
    const paddingBottom=parseFloat(getComputedStyle(box).paddingBottom)||0;
    return Math.max(box.clientHeight,tail.offsetTop+tail.offsetHeight+paddingBottom);
  }
  function messageContentMaxScroll(box=$('messages')){
    return box?Math.max(0,messageContentBottom(box)-box.clientHeight):0;
  }
  function distanceToMessageTail(box=$('messages')){
    if(!box)return 0;
    return Math.max(0,messageContentMaxScroll(box)-box.scrollTop);
  }
  function scrollLatestMessageIntoView(box=$('messages')){
    if(!box)return;
    const tail=lastRenderedMessageEntry(box);
    if(!tail){box.scrollTop=0;return;}
    box.scrollTop=messageContentMaxScroll(box);
  }
  function captureMessageViewport(){
    const box=$('messages');
    if(!box||box.classList.contains('hidden'))return null;
    const max=messageContentMaxScroll(box);
    return {top:Math.min(box.scrollTop,max),max,atBottom:max-box.scrollTop<=180};
  }
  function restoreMessageViewport(snapshot){
    const box=$('messages');
    if(!box||!snapshot)return;
    const max=messageContentMaxScroll(box);
    box.scrollTop=snapshot.atBottom?max:(snapshot.max?max*(snapshot.top/snapshot.max):Math.min(snapshot.top,max));
  }
  function settleInterfaceScale(snapshot){
    let settled=false;
    const finish=()=>{
      if(settled)return;settled=true;
      syncMobileViewport();
      restoreMessageViewport(snapshot);
      resizeComposer();
      document.body.classList.remove('interface-scale-changing');
      window.dispatchEvent(new CustomEvent('nexchat:interface-scale',{detail:{value:selectedInterfaceScale()}}));
    };
    requestAnimationFrame(()=>requestAnimationFrame(finish));
    setTimeout(finish,420);
  }
  function applyInterfaceScale(value=selectedInterfaceScale(),{persist=true,notify=false}={}){
    const selected=INTERFACE_SCALES.includes(String(value))?String(value):'auto';
    const requestedResolved=Math.min(1.2,Math.max(.85,selected==='auto'?automaticInterfaceScale():Number(selected)));
    const mobileSafe=isMobileScaleViewport();
    const resolved=mobileSafe?1:requestedResolved;
    const snapshot=captureMessageViewport();
    const root=document.documentElement;
    const shell=document.querySelector('.app-shell.smart-shell');
    document.body.classList.add('interface-scale-changing');
    root.classList.remove('native-ui-zoom');
    root.classList.add('transform-ui-scale','interface-scale-transform-engine');
    root.style.setProperty('--ui-scale',String(resolved));
    root.style.setProperty('--ui-scale-inverse',String(1/resolved));
    root.dataset.interfaceScaleResolved=String(resolved);
    root.dataset.interfaceScaleRequested=String(requestedResolved);
    root.dataset.interfaceScaleEngine=mobileSafe?'mobile-safe':'transform';
    root.dataset.mobileScaleSafe=mobileSafe?'true':'false';
    document.body.dataset.interfaceScale=selected;
    document.body.dataset.interfaceScaleResolved=String(resolved);
    document.body.dataset.mobileScaleSafe=mobileSafe?'true':'false';
    if(shell){
      if(mobileSafe){
        shell.style.setProperty('position','fixed','important');
        shell.style.setProperty('inset','0','important');
        shell.style.setProperty('width','100vw','important');
        shell.style.setProperty('height','var(--mobile-app-height, 100dvh)','important');
        shell.style.setProperty('min-height','0','important');
        shell.style.setProperty('max-width','100vw','important');
        shell.style.setProperty('max-height','var(--mobile-app-height, 100dvh)','important');
        shell.style.setProperty('zoom','1','important');
        shell.style.setProperty('transform','none','important');
        shell.style.setProperty('transform-origin','0 0','important');
        shell.style.setProperty('will-change','auto','important');
      }else{
        const inverse=1/resolved;
        shell.style.setProperty('position','absolute','important');
        shell.style.setProperty('inset','0 auto auto 0','important');
        shell.style.setProperty('width',`${inverse*100}vw`,'important');
        shell.style.setProperty('height',`calc(var(--app-available-height, 100dvh) * ${inverse})`,'important');
        shell.style.setProperty('min-height',`calc(var(--app-available-height, 100dvh) * ${inverse})`,'important');
        shell.style.setProperty('max-width','none','important');
        shell.style.setProperty('max-height','none','important');
        shell.style.setProperty('zoom','1','important');
        shell.style.setProperty('transform',`scale(${resolved})`,'important');
        shell.style.setProperty('transform-origin','0 0','important');
        shell.style.setProperty('will-change',resolved===1?'auto':'transform','important');
      }
      shell.dataset.interfaceScaleApplied=selected;
      shell.dataset.mobileScaleSafe=mobileSafe?'true':'false';
      void shell.offsetWidth;
      requestAnimationFrame(()=>{
        const probe=shell.querySelector('.smart-sidebar,.smart-chat-panel,.chat-panel')||shell;
        const offset=Math.max(1,probe.offsetWidth||shell.offsetWidth||1);
        const visual=probe.getBoundingClientRect().width;
        const actual=mobileSafe?1:Math.round((visual/offset)*1000)/1000;
        shell.dataset.interfaceScaleRatio=String(actual);
        const applied=mobileSafe||Math.abs(actual-resolved)<=0.04||probe===shell;
        shell.dataset.interfaceScaleVerified=applied?'true':'false';
        if(!applied&&!mobileSafe){
          shell.style.setProperty('zoom','1','important');
          shell.style.setProperty('transform',`scale(${resolved})`,'important');
          shell.style.setProperty('transform-origin','0 0','important');
        }
      });
    }
    if(persist){try{localStorage.setItem('nexchat-interface-scale',selected);}catch(_){}}
    if($('interfaceScale'))$('interfaceScale').value=selected;
    $('interfaceScaleChoices')?.querySelectorAll('[data-interface-scale]').forEach((button)=>button.classList.toggle('active',button.dataset.interfaceScale===selected));
    const scaleButton=$('interfaceScaleButton');
    const label=selected==='auto'?'Tự động':Math.round(Number(selected)*100)+'%';
    if(scaleButton){scaleButton.title=`Quy mô giao diện: ${label}`;scaleButton.setAttribute('aria-label',`Điều chỉnh quy mô giao diện, hiện tại ${label}`);}
    const detail={value:selected,resolved,requestedResolved,mobileSafe,source:'interface-scale-control'};
    document.dispatchEvent(new CustomEvent('nexchat:interface-scale-applied',{detail}));
    window.dispatchEvent(new CustomEvent('nexchat:interface-scale-applied',{detail}));
    if(notify)UI.toast(`Đã áp dụng quy mô giao diện: ${label}.`,'success');
    settleInterfaceScale(snapshot);
    return detail;
  }
  async function saveInterfaceScale(value,{notify=true}={}){
    const selected=INTERFACE_SCALES.includes(String(value))?String(value):'auto';
    const applied=applyInterfaceScale(selected,{persist:true,notify});
    if(state.me){state.me.settings=state.me.settings||{};state.me.settings.interfaceScale=selected;}
    try{await UI.fetchJSON('/api/settings/interface-scale',{method:'POST',body:{interfaceScale:selected}});}catch(error){UI.toast(`Quy mô đã áp dụng trên thiết bị này nhưng chưa đồng bộ tài khoản: ${error.message}`,'warning');}
    return applied;
  }
  window.NexInterfaceScale={
    get:()=>selectedInterfaceScale(),
    apply:(value,options={})=>applyInterfaceScale(value,options),
    save:(value,options={})=>saveInterfaceScale(value,options),
    resolved:()=>Number(document.documentElement.dataset.interfaceScaleResolved||1),
  };
  function groupById(id){ return state.groups.find((g)=>g.id===id)||null; }
  function updateContactState(userId,access={}){for(const list of [state.friends,state.blocked,state.suggestions]){const user=list.find((u)=>u.id===userId);if(user)Object.assign(user,{blocked:Boolean(access.blocked),blockedByMe:Boolean(access.blockedByMe),blockedByOther:Boolean(access.blockedByOther),canSend:access.canSend!==false&&!access.blocked});}renderSidebar();}
  function activeTarget(){ return state.active.scope==='group'?groupById(state.active.targetId):friendById(state.active.targetId); }
  function worldChatSettings(){
    const world=state.system?.worldChat||{};
    const mode=['open','admin_only','read_only'].includes(world.mode)?world.mode:(state.system?.worldChatEnabled===false?'read_only':'open');
    return {mode,lockedUntil:Number(world.lockedUntil)||null,slowModeSeconds:Number(world.slowModeSeconds)||0,antiSpamEnabled:world.antiSpamEnabled!==false,enabled:mode==='open'};
  }
  function applyUserPerformancePreferences(){
    const lowPower=Boolean(navigator.connection?.saveData)||Number(navigator.deviceMemory||8)<=4||Number(navigator.hardwareConcurrency||8)<=4||matchMedia('(max-width:760px),(pointer:coarse)').matches;
    const adaptiveLite=storage.sessionGet('nexchat-performance-lite','0')==='1';
    const quality=['auto','full','balanced','lite'].includes(state.me?.settings?.visualQuality)?state.me.settings.visualQuality:'auto';
    const useLite=quality==='lite'||(quality==='balanced'&&lowPower)||(quality==='auto'&&(lowPower||adaptiveLite));
    document.body.classList.add('performance-optimized');
    document.body.classList.toggle('performance-lite',useLite);
    document.body.classList.toggle('visual-quality-full',quality==='full');
    document.body.classList.toggle('visual-quality-balanced',quality==='balanced');
    document.body.classList.toggle('motion-minimal',state.me?.settings?.compactMessageMotion===false);
    applyInterfaceScale(selectedInterfaceScale(),{persist:false});
  }
  function stopOwnTyping(){
    clearTimeout(state.typingTimer);
    if(state.typingActive&&['private','group','support'].includes(state.active.scope))socket.emit('chat:typing',{scope:state.active.scope,targetId:state.active.targetId,isTyping:false});
    state.typingActive=false;
  }
  function scheduleActiveRead(){
    if(!['private','group','support'].includes(state.active.scope)||state.activeAccess.blocked)return;
    clearTimeout(activeReadTimer);
    activeReadTimer=setTimeout(()=>socket.emit('chat:read',{scope:state.active.scope,targetId:state.active.targetId}),180);
  }
  function syncSendButton(){
    const sendButton=$('sendButton'),voiceButton=$('voiceRecordButton'),input=$('messageInput');
    if(!sendButton||!input)return;
    const blocked=['private','request'].includes(state.active.scope)&&Boolean(state.activeAccess?.blocked);
    const incomingRequest=state.active.scope==='request'&&state.messageRequests.some((request)=>request.user.id===state.active.targetId);
    const worldLocked=state.active.scope==='world'&&!worldChatSettings().enabled;
    const supportLocked=state.active.scope==='support'&&Boolean(state.supportMessaging?.blocked);
    const cooldown=state.active.scope==='world'&&Date.now()<Number(state.worldNextSendAt||0);
    const hasContent=Boolean(input.value.trim()||state.selectedFile);
    const baseLocked=Boolean(input.disabled||blocked||incomingRequest||worldLocked||supportLocked||cooldown);
    const disabled=Boolean(baseLocked||!hasContent);
    sendButton.disabled=disabled;
    sendButton.classList.toggle('is-ready',!disabled);
    sendButton.classList.toggle('is-cooldown',cooldown);
    sendButton.classList.toggle('hidden',!hasContent);
    if(!cooldown)sendButton.title=hasContent?'Gửi tin nhắn':'Nhập nội dung để gửi';
    if(voiceButton){
      const voiceUnsupported=!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined';
      voiceButton.disabled=Boolean(baseLocked||voiceUnsupported);
      voiceButton.classList.toggle('hidden',hasContent);
      voiceButton.setAttribute('aria-label',voiceUnsupported?voiceText('unsupported'):voiceText('hold'));
      voiceButton.title=voiceUnsupported?voiceText('unsupported'):voiceText('hold');
    }
  }
  function refreshWorldCooldown(){
    const remaining=Math.max(0,Math.ceil(((Number(state.worldNextSendAt)||0)-Date.now())/1000));
    const active=state.active.scope==='world'&&remaining>0&&worldChatSettings().enabled;
    const sendButton=$('sendButton');
    if(sendButton)sendButton.title=active?`Gửi tiếp sau ${remaining} giây`:'';
    syncSendButton();
    if(!active&&state.worldCooldownTimer){clearInterval(state.worldCooldownTimer);state.worldCooldownTimer=null;}
  }
  function setWorldCooldown(nextSendAt){
    state.worldNextSendAt=Math.max(Date.now(),Number(nextSendAt)||0);
    if(!state.worldCooldownTimer&&state.worldNextSendAt>Date.now())state.worldCooldownTimer=setInterval(refreshWorldCooldown,1000);
    refreshWorldCooldown();
  }
  let sidebarCloseTimer=0,sidebarReturnFocus=null;
  function openSidebar(){
    const sidebar=$('sidebar'),overlay=$('sidebarOverlay');if(!sidebar||!overlay)return;
    clearTimeout(sidebarCloseTimer);
    sidebarReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:$('openSidebar');
    overlay.classList.remove('hidden','is-closing');
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden','false');
    $('openSidebar')?.setAttribute('aria-expanded','true');
    document.body.classList.add('chat-sidebar-open');
    void overlay.offsetWidth;
    requestAnimationFrame(()=>{overlay.classList.add('is-visible');$('closeSidebar')?.focus?.({preventScroll:true});});
    window.NexRuntime?.refreshLayers?.();
  }
  function closeSidebar({restoreFocus=false}={}){
    const sidebar=$('sidebar'),overlay=$('sidebarOverlay');if(!sidebar||!overlay||(!sidebar.classList.contains('open')&&overlay.classList.contains('hidden')))return;
    clearTimeout(sidebarCloseTimer);
    setSidebarThemePanel?.(false);
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden',isMobileChat()?'true':'false');
    $('openSidebar')?.setAttribute('aria-expanded','false');
    overlay.classList.remove('is-visible');
    overlay.classList.add('is-closing');
    document.body.classList.remove('chat-sidebar-open');
    let finished=false;
    const finish=()=>{if(finished||sidebar.classList.contains('open'))return;finished=true;sidebar.removeEventListener('transitionend',onEnd);clearTimeout(sidebarCloseTimer);overlay.classList.add('hidden');overlay.classList.remove('is-closing');window.NexRuntime?.refreshLayers?.();if(restoreFocus)requestAnimationFrame(()=>sidebarReturnFocus?.focus?.({preventScroll:true}));};
    const onEnd=(event)=>{if(event.target===sidebar&&event.propertyName==='transform')finish();};
    sidebar.addEventListener('transitionend',onEnd);
    sidebarCloseTimer=setTimeout(finish,320);
  }

  async function loadBootstrap(preserve=true){
    try{
      const data=await UI.fetchJSON('/api/bootstrap');
      Object.assign(state,{me:data.me,friends:data.friends||[],incoming:data.incoming||[],outgoing:data.outgoing||[],blocked:data.blocked||[],suggestions:data.suggestions||[],messageRequests:data.messageRequests||[],groups:data.groups||[],pendingDeletes:data.pendingDeletes||[],system:data.system||state.system,supportUnread:data.supportUnread||0,supportMessaging:{...state.supportMessaging,...(data.me?.supportMessaging||{})}});
      if(state.system?.activeAnnouncement)UI.showServerAnnouncement?.(state.system.activeAnnouncement);
      state.me.aliases=state.me.aliases||{}; state.me.mutes=state.me.mutes||{};
      if(['private','request'].includes(state.active.scope)){
        const target=friendById(state.active.targetId);
        if(target) state.activeAccess={blocked:Boolean(target.blocked),blockedByMe:Boolean(target.blockedByMe),blockedByOther:Boolean(target.blockedByOther),canSend:target.canSend!==false&&!target.blocked};
      }
      applyUserPerformancePreferences();renderMe();renderSidebar();updateHeader();updateEffectButton();applyConversationAccess();refreshNotificationSettingsUI();UI.syncServerAnnouncementVisibility?.();
      if(!preserve) await openConversation('world');
    }catch(error){handleAuthError(error);}
  }
  function queueBootstrapRefresh(delay=90){
    clearTimeout(bootstrapRefreshTimer);
    bootstrapRefreshTimer=setTimeout(()=>loadBootstrap(),delay);
  }
  function renderMe(){
    const me=state.me;if(!me)return;
    const card=$('meCard');
    card.classList.remove('skeleton-card','rank-standard','rank-vip','rank-legend');
    card.classList.add(rankClass(me));
    card.dataset.profileRank=profileRank(me);
    const meRankBadge=UI.profileBadgeHTML(me);
    const mePresence=`<i class="avatar-presence ${me.online?'online':''}" aria-hidden="true"></i>`;
    card.innerHTML=`<span class="me-card-avatar-shell">${avatarHTML(me,'me-card-avatar',{badges:false,presence:false})}${meRankBadge}${mePresence}</span><span class="me-card-copy"><span class="me-card-kicker">Hồ sơ của bạn</span><strong>${escape(me.nickname)}</strong><span class="me-card-meta-row"><small>@${escape(me.username)}</small>${meCardTierPill(me)}</span></span><span class="me-card-side"><span class="me-card-online"><i></i>${me.online?'Online':'NexChat'}</span>${icon('chevron-right','me-card-chevron')}</span>`;
  }
  function itemHTML(user,{pinned=false,archived=false,unread=0,request=false}={}){
    const name=displayName(user), blocked=Boolean(user.blocked), online=blocked?'<i class="presence-dot blocked"></i>':(user.online?'<i class="presence-dot online"></i>':'<i class="presence-dot"></i>');
    const status=blocked?'Không thể liên lạc':(user.online?t('activeNow'):t('offline'));
    return `<button class="conversation-item ${rankClass(user)} ${pinned?'is-pinned':''} ${archived?'is-archived':''} ${blocked?'is-blocked':''}" type="button" data-user-id="${escape(user.id)}" data-request="${request?'1':'0'}"><span class="conversation-profile-trigger" data-mobile-profile-id="${escape(user.id)}" role="button" aria-label="Xem hồ sơ ${escape(name)}">${avatarHTML(user,'avatar')}</span><span class="conversation-copy"><strong>${escape(name)}${rankPresentation(user,true)}</strong><small>${online}${status}</small></span>${blocked?`<em class="conversation-state-icon" title="Đã chặn">${icon('ban')}</em>`:(pinned?`<em class="conversation-state-icon">${icon('pin')}</em>`:'')}${unread?`<b class="badge">${unread}</b>`:''}<span class="mobile-profile-chevron" data-mobile-profile-id="${escape(user.id)}" aria-hidden="true">${icon('chevron-right')}</span></button>`;
  }
  function groupHTML(group){
    return `<button class="conversation-item ${group.pinned?'is-pinned':''}" type="button" data-group-id="${escape(group.id)}"><span class="avatar group-avatar">${group.avatarUrl?`<img src="${escape(group.avatarUrl)}">`:icon('users')}</span><span class="conversation-copy"><strong>${escape(group.name)}</strong><small>${group.memberIds.length} thành viên</small></span>${group.pinned?`<em class="conversation-state-icon">${icon('pin')}</em>`:''}${group.unread?`<b class="badge">${group.unread}</b>`:''}</button>`;
  }
  function sidebarEmptyHTML(kind,label){
    const icons={pinned:'pin',friends:'users',requests:'user-plus',groups:'users',archived:'archive'};
    return `<div class="sidebar-empty-state sidebar-empty-${escape(kind)}" role="status" aria-live="polite"><span class="sidebar-empty-icon" aria-hidden="true">${icon(icons[kind]||'info')}</span><span class="sidebar-empty-label">${escape(label)}</span></div>`;
  }
  function renderSidebar(){
    const pinnedFriends=state.friends.filter((f)=>f.pinned&&!f.archived), pinnedGroups=state.groups.filter((g)=>g.pinned);
    $('pinnedList').innerHTML=[...pinnedFriends.map((f)=>itemHTML(f,{pinned:true,unread:f.unread})),...pinnedGroups.map(groupHTML)].join('')||sidebarEmptyHTML('pinned',tx('noPinned'));
    $('pinnedCount').textContent=pinnedFriends.length+pinnedGroups.length;
    $('friendList').innerHTML=state.friends.filter((f)=>!f.archived).map((f)=>itemHTML(f,{pinned:f.pinned,unread:f.unread})).join('')||sidebarEmptyHTML('friends',t('noFriends'));
    $('archivedList').innerHTML=state.friends.filter((f)=>f.archived).map((f)=>itemHTML(f,{archived:true,unread:f.unread})).join('')||sidebarEmptyHTML('archived',t('noArchived'));
    $('friendCount').textContent=state.friends.length;
    $('requestList').innerHTML=state.incoming.map((r)=>`<div class="request-item" data-request-id="${escape(r.id)}"><span class="request-profile-avatar" data-mobile-profile-id="${escape(r.user.id)}" role="button">${avatarHTML(r.user,'avatar')}</span><div><strong class="request-profile-name" data-mobile-profile-id="${escape(r.user.id)}" role="button">${escape(displayName(r.user))}</strong><small>${t('wantsFriend')}</small><span><button data-request-action="accept">${t('accept')}</button><button data-request-action="decline">${t('decline')}</button></span></div></div>`).join('')||sidebarEmptyHTML('requests',t('noRequests'));
    $('requestCount').textContent=state.incoming.length;
    $('groupList').innerHTML=state.groups.map(groupHTML).join('')||sidebarEmptyHTML('groups',tx('noGroups'));
    $('groupCount').textContent=state.groups.length;
    const reqUnread=state.messageRequests.reduce((n,r)=>n+(r.unread||0),0);$('requestMessageBadge').textContent=reqUnread;$('requestMessageBadge').classList.toggle('hidden',!reqUnread);
    $('supportBadge').textContent=state.supportUnread||0;$('supportBadge').classList.toggle('hidden',!state.supportUnread);
  }

  async function openConversation(scope,targetId=null){
    cancelVoiceRecording({silent:true});
    saveDraft();stopOwnTyping();closeSidebar();hideSpecialPanel();resetMessageViewportSchedule();
    state.conversationAbort?.abort();
    const loadToken=++state.conversationLoadToken;
    const controller=new AbortController();
    state.conversationAbort=controller;
    state.active={scope,targetId};document.body.dataset.activeScope=scope;document.body.dataset.activeTarget=targetId||'';document.dispatchEvent(new CustomEvent('nexchat:conversationchange',{detail:{scope,targetId}}));state.messages=[];clearAttachment();hideTyping();
    document.body.dataset.activeScope=scope;UI.syncServerAnnouncementVisibility?.();
    const target=['private','request'].includes(scope)?friendById(targetId):null;
    state.activeAccess=target?{blocked:Boolean(target.blocked),blockedByMe:Boolean(target.blockedByMe),blockedByOther:Boolean(target.blockedByOther),canSend:target.canSend!==false&&!target.blocked}:{blocked:false,blockedByMe:false,blockedByOther:false,canSend:true};
    document.querySelectorAll('.nav-item,.conversation-item').forEach((el)=>el.classList.remove('active'));
    document.querySelector(`[data-open-scope="${CSS.escape(scope)}"]`)?.classList.add('active');
    if(['requests','suggestions','saved'].includes(scope)){showSpecialPanel(scope);return;}
    if(scope==='world')document.querySelector('[data-open-scope="world"]')?.classList.add('active');
    if(scope==='private'||scope==='request')document.querySelector(`[data-user-id="${CSS.escape(targetId)}"]`)?.classList.add('active');
    if(scope==='group')document.querySelector(`[data-group-id="${CSS.escape(targetId)}"]`)?.classList.add('active');
    updateHeader();applyTheme();renderPendingDelete();applyConversationAccess();restoreDraft();
    $('messages').innerHTML='<div class="conversation-loading"><span class="spinner"></span><p>Đang tải tin nhắn...</p></div>';
    try{
      let url='/api/messages/world';
      if(scope==='private')url=`/api/messages/private/${encodeURIComponent(targetId)}`;
      if(scope==='request')url=`/api/messages/request/${encodeURIComponent(targetId)}`;
      if(scope==='group')url=`/api/messages/group/${encodeURIComponent(targetId)}`;
      if(scope==='support')url='/api/messages/support';
      const data=await UI.fetchJSON(url,{signal:controller.signal});
      if(loadToken!==state.conversationLoadToken||state.active.scope!==scope||state.active.targetId!==targetId)return;
      state.messages=data.messages||[];
      if(scope==='support'){state.supportUnread=0;state.supportMessaging={...state.supportMessaging,...(data.supportMessaging||{})};renderSidebar();}
      if(data.conversationState)state.activeAccess={...state.activeAccess,...data.conversationState};
      if(data.pendingDelete&&!state.pendingDeletes.some((d)=>d.id===data.pendingDelete.id))state.pendingDeletes.push(data.pendingDelete);
      renderMessages({forceScroll:true});renderPinnedBar();renderPendingDelete();applyConversationAccess();
      if(['private','group','support'].includes(scope)&&!state.activeAccess.blocked)scheduleActiveRead();
    }catch(error){
      if(error.name==='AbortError'||loadToken!==state.conversationLoadToken)return;
      $('messages').innerHTML=`<div class="empty-state"><b class="empty-state-icon">${icon('shield-alert')}</b><p>${escape(serverText(error.message))}</p></div>`;applyConversationAccess();
    }finally{
      if(loadToken===state.conversationLoadToken)state.conversationAbort=null;
    }
  }
  function updateHeader(){
    const scope=state.active.scope,target=activeTarget();
    const hasConversationActions=['private','group'].includes(scope);
    $('conversationMenuButton').classList.toggle('hidden',!hasConversationActions);
    $('conversationQuickActions').classList.toggle('hidden',!hasConversationActions);
    $('quickAliasAction').classList.toggle('hidden',scope!=='private');
    $('quickProfileAction').querySelector('b').textContent=scope==='group'?'Thông tin nhóm':'Hồ sơ';
    const key=conversationKey(scope,state.active.targetId);
    $('quickPinAction').querySelector('b').textContent=state.me?.pinnedConversations?.includes(key)?'Bỏ ghim':'Ghim';
    const muteKey=scope==='group'?`group:${state.active.targetId}`:state.active.targetId;
    $('quickMuteAction').querySelector('b').textContent=isMuted(muteKey)?'Bật báo':'Thông báo';
    $('themeButton').classList.toggle('hidden',!['private','request'].includes(scope));
    if(!['private','request'].includes(scope)&&!$('themeModal').classList.contains('hidden'))UI.closeModal('themeModal');
    $('mediaVaultButton').classList.toggle('hidden',!['world','private','group'].includes(scope));
    if(scope==='world'){
      const world=worldChatSettings(),enabled=world.enabled;
      $('conversationAvatar').innerHTML=icon('globe');$('conversationAvatar').className='avatar avatar-lg world-avatar clickable-avatar';$('conversationTitle').textContent=t('worldChat');
      $('conversationStatus').textContent=enabled?t('worldStatus'):(world.mode==='admin_only'?'Chỉ quản trị viên được gửi · mọi người vẫn xem được':'Đang ở chế độ chỉ đọc · vẫn xem được lịch sử');
      $('messageInput').placeholder=enabled?t('messageWorld'):(world.mode==='admin_only'?'Hiện chỉ quản trị viên được gửi tin':'Chat thế giới đang ở chế độ chỉ đọc');
    }
    else if(scope==='private'||scope==='request'){
      const user=target;if(!user)return;
      $('conversationAvatar').innerHTML=UI.avatarHTML({...user,nickname:displayName(user)},'avatar avatar-lg header-smart-avatar',{online:user.online,blocked:state.activeAccess.blocked,presence:true});
      $('conversationAvatar').className='avatar avatar-lg clickable-avatar header-avatar-shell';
      $('conversationTitle').textContent=displayName(user);$('conversationStatus').textContent=state.activeAccess.blocked?'Không thể liên lạc':(scope==='request'?'Tin nhắn chờ':(user.online?t('activeNow'):t('offline')));$('messageInput').placeholder=t('messageUser',{name:displayName(user)});
    }else if(scope==='group'){
      const g=target;if(!g)return;$('conversationAvatar').innerHTML=g.avatarUrl?`<img src="${escape(g.avatarUrl)}">`:icon('users');$('conversationAvatar').className='avatar avatar-lg group-avatar clickable-avatar';$('conversationTitle').textContent=g.name;$('conversationStatus').textContent=`${g.memberIds.length} thành viên`;$('messageInput').placeholder=`Nhắn vào ${g.name}...`;
    }else if(scope==='support'){
      const access=state.supportMessaging||{};
      $('conversationAvatar').innerHTML=icon('headset');$('conversationAvatar').className='avatar avatar-lg support-avatar';$('conversationTitle').textContent='Hỗ trợ Admin';$('conversationStatus').textContent=access.blocked?'Kênh liên hệ đang bị Admin tạm chặn':'Trao đổi trực tiếp trong NexChat';$('messageInput').placeholder=access.blocked?'Bạn đang bị chặn gửi tin hỗ trợ':'Nhắn cho bộ phận hỗ trợ...';
    }
  }
  function renderSupportAccess(){
    const bar=$('supportAccessBar');if(!bar)return;
    const access=state.supportMessaging||{};
    const visible=state.active.scope==='support'&&Boolean(access.blocked);
    bar.classList.toggle('hidden',!visible);if(!visible)return;
    bar.classList.add('is-blocked');bar.classList.remove('has-warning');
    $('supportStrikeChip')?.classList.add('hidden');
    $('supportAccessTitle').textContent='Admin đã tạm khóa kênh hỗ trợ của tài khoản này';
    const until=access.permanent?'vĩnh viễn':(access.blockedUntil?`đến ${UI.formatDate(access.blockedUntil)}`:'tạm thời');
    $('supportAccessDescription').textContent=`${access.reason||'Bạn chưa thể gửi thêm tin nhắn.'} · Thời hạn ${until}.`;
  }
  function applyConversationAccess(){
    const isPrivate=['private','request'].includes(state.active.scope), blocked=isPrivate&&Boolean(state.activeAccess?.blocked);
    const incomingRequest=state.active.scope==='request'&&state.messageRequests.some((request)=>request.user.id===state.active.targetId);
    $('contactUnavailableBar').classList.toggle('hidden',!blocked);
    $('requestGateBar').classList.toggle('hidden',!incomingRequest||blocked);
    const world=worldChatSettings();const worldLocked=state.active.scope==='world'&&!world.enabled;
    $('worldChatStateBar').classList.toggle('hidden',!worldLocked);if(worldLocked){const text=$('worldChatStateBar').querySelector('small');if(text)text.textContent=world.mode==='admin_only'?'Bạn vẫn xem được lịch sử; hiện chỉ quản trị viên có thể gửi tin.':'Bạn vẫn xem được toàn bộ lịch sử nhưng chưa thể gửi tin mới.';}
    const supportLocked=state.active.scope==='support'&&Boolean(state.supportMessaging?.blocked);renderSupportAccess();
    const composerWrap=document.querySelector('.composer-wrap');
    const composerLocked=blocked||incomingRequest||supportLocked||['requests','suggestions','saved'].includes(state.active.scope);
    if(composerWrap)composerWrap.classList.toggle('hidden',composerLocked);
    composerWrap?.classList.toggle('is-world-locked',worldLocked);
    $('messageForm').classList.toggle('hidden',composerLocked);
    const worldCooldown=state.active.scope==='world'&&Date.now()<Number(state.worldNextSendAt||0);
    $('messageInput').disabled=blocked||incomingRequest||worldLocked||supportLocked;
    $('toolsButton').disabled=blocked||incomingRequest||worldLocked||supportLocked;$('emojiButton').disabled=blocked||incomingRequest||worldLocked||supportLocked;$('sendButton').disabled=blocked||incomingRequest||worldLocked||supportLocked||worldCooldown;
    if(worldCooldown&&!state.worldCooldownTimer)state.worldCooldownTimer=setInterval(refreshWorldCooldown,1000);
    if(blocked){clearAttachment();$('quickTools').classList.add('hidden');$('emojiPicker').classList.add('hidden');hideTyping();}
    $('unblockContactButton').classList.toggle('hidden',!blocked||!state.activeAccess.blockedByMe);
    $('contactUnavailableText').textContent=state.activeAccess.blockedByMe?'Bạn đã chặn tài khoản này. Vẫn có thể xem lại lịch sử trò chuyện.':'Bạn vẫn có thể xem lại lịch sử trò chuyện nhưng không thể gửi tin nhắn.';
    const blockStrong=$('blockAction')?.querySelector('strong'), blockSmall=$('blockAction')?.querySelector('small');
    if(blockStrong)blockStrong.textContent=state.activeAccess.blockedByMe?'Bỏ chặn':'Chặn';
    if(blockSmall)blockSmall.textContent=state.activeAccess.blockedByMe?'Cho phép liên lạc lại':'Ngừng liên hệ';
    $('blockAction')?.classList.toggle('danger-action',!state.activeAccess.blockedByMe);
    updateHeader();syncSendButton();
  }
  function hideSpecialPanel(){$('specialPanel').classList.add('hidden');$('messages').classList.remove('hidden');$('messageForm').classList.remove('hidden');document.querySelector('.composer-wrap')?.classList.remove('hidden');$('contactUnavailableBar').classList.add('hidden');$('requestGateBar').classList.add('hidden');}
  async function showSpecialPanel(scope){
    state.active={scope,targetId:null};document.body.dataset.activeScope=scope;document.body.dataset.activeTarget='';document.dispatchEvent(new CustomEvent('nexchat:conversationchange',{detail:{scope,targetId:null}}));UI.syncServerAnnouncementVisibility?.();document.querySelectorAll('.nav-item,.conversation-item').forEach((el)=>el.classList.remove('active'));document.querySelector(`[data-open-scope="${CSS.escape(scope)}"]`)?.classList.add('active');state.activeAccess={blocked:false,blockedByMe:false,blockedByOther:false,canSend:true};$('messages').classList.add('hidden');$('messageForm').classList.add('hidden');document.querySelector('.composer-wrap')?.classList.add('hidden');$('contactUnavailableBar').classList.add('hidden');$('requestGateBar').classList.add('hidden');$('specialPanel').classList.remove('hidden');$('conversationAvatar').className='avatar avatar-lg world-avatar';$('conversationMenuButton').classList.add('hidden');$('conversationQuickActions').classList.add('hidden');$('themeButton').classList.add('hidden');$('mediaVaultButton').classList.add('hidden');
    if(scope==='suggestions'){
      $('conversationTitle').textContent=tx('suggestions');$('conversationStatus').textContent=tx('discoverPeople');$('conversationAvatar').innerHTML=icon('sparkles');
      $('specialPanel').innerHTML=`<div class="people-grid">${state.suggestions.map((u)=>`<article class="person-card ${rankClass(u)}"><div class="person-profile-tap" data-mobile-profile-id="${escape(u.id)}" role="button" aria-label="Xem hồ sơ ${escape(u.nickname)}">${avatarHTML(u,'profile-avatar-medium')}<h3>${escape(u.nickname)}</h3>${rankPresentation(u,true)}<p>@${escape(u.username)}</p><span class="mobile-profile-hint mobile-only">Chạm để xem đầy đủ thông tin</span></div><div><button class="secondary-button" data-profile-id="${u.id}">Xem hồ sơ</button><button class="primary-button" data-add-username="${escape(u.username)}">Kết bạn</button></div></article>`).join('')||'<div class="empty-state">Không có gợi ý mới.</div>'}</div>`;
    }else if(scope==='requests'){
      $('conversationTitle').textContent=tx('messageRequests');$('conversationStatus').textContent=tx('strangerMessages');$('conversationAvatar').innerHTML=icon('inbox');
      $('specialPanel').innerHTML=`<div class="request-message-list">${state.messageRequests.map((r)=>`<article class="request-message-card"><span class="request-profile-avatar" data-mobile-profile-id="${escape(r.user.id)}" role="button" aria-label="Xem hồ sơ ${escape(displayName(r.user))}">${avatarHTML(r.user,'avatar avatar-lg')}</span><div class="request-profile-copy" data-mobile-profile-id="${escape(r.user.id)}" role="button"><h3>${escape(displayName(r.user))}</h3><p>${escape(r.lastMessage?.text||'Đã gửi một tệp')}</p><small>${UI.formatDate(r.lastMessage?.createdAt)}</small></div><div><button data-open-request="${r.user.id}" class="secondary-button">Xem</button><button data-request-message-action="accept" data-user="${r.user.id}" class="primary-button">Chấp nhận</button><button data-request-message-action="decline" data-user="${r.user.id}" class="danger-button">Xóa</button></div></article>`).join('')||'<div class="empty-state">Không có tin nhắn chờ.</div>'}</div>`;
    }else{
      $('conversationTitle').textContent=tx('savedMessages');$('conversationStatus').textContent=tx('savedForLater');$('conversationAvatar').innerHTML=icon('bookmark');
      try{
        const data=await UI.fetchJSON('/api/messages/saved/all');
        $('specialPanel').innerHTML=`<div class="saved-message-list">${(data.messages||[]).map((m)=>`<button type="button" class="saved-message-card" data-saved-message="${escape(m.id)}" data-saved-scope="${escape(m.scope)}" data-saved-target="${escape(m.scope==='group'?m.groupId:(m.scope==='world'?'world':(m.fromId===state.me.id?m.toId:m.fromId))||'')}"><strong>${escape(m.senderName||'Tin nhắn')}</strong><p>${escape(m.text||m.attachment?.name||'[Tệp đính kèm]')}</p><small>${UI.formatDate(m.createdAt)} · Mở tin nhắn</small></button>`).join('')||'<div class="empty-state">Chưa lưu tin nhắn nào.</div>'}</div>`;
      }catch(error){UI.toast(error.message,'error');}
    }
  }

  function messageBelongs(m){const a=state.active;if(a.scope==='world')return m.scope==='world';if(a.scope==='private')return ['private','request'].includes(m.scope)&&[m.fromId,m.toId].includes(state.me.id)&&[m.fromId,m.toId].includes(a.targetId);if(a.scope==='request')return m.scope==='request'&&[m.fromId,m.toId].includes(state.me.id)&&[m.fromId,m.toId].includes(a.targetId);if(a.scope==='group')return m.scope==='group'&&m.groupId===a.targetId;if(a.scope==='support')return m.scope==='support'&&m.supportUserId===state.me.id;return false;}
  function isNearMessageBottom(tolerance=160){
    const box=$('messages');
    return !box||distanceToMessageTail(box)<=tolerance;
  }
  function markChatSendBurst(duration=360){
    document.body.classList.add('chat-send-burst');
    clearTimeout(chatSendBurstTimer);
    chatSendBurstTimer=setTimeout(()=>document.body.classList.remove('chat-send-burst'),duration);
  }
  function scheduleMessageViewport({stickToBottom=false,top=null}={}){
    pendingMessageScrollBottom=pendingMessageScrollBottom||stickToBottom;
    if(!pendingMessageScrollBottom&&Number.isFinite(top))pendingMessageScrollTop=top;
    if(messageViewportFrame)return;
    messageViewportFrame=requestAnimationFrame(()=>{
      messageViewportFrame=0;
      const box=$('messages');
      const shouldBottom=pendingMessageScrollBottom;
      const targetTop=pendingMessageScrollTop;
      pendingMessageScrollBottom=false;pendingMessageScrollTop=null;
      if(!box)return;
      const max=messageContentMaxScroll(box);
      if(shouldBottom)scrollLatestMessageIntoView(box);
      else if(Number.isFinite(targetTop))box.scrollTop=Math.min(Math.max(0,targetTop),max);
    });
  }
  function resetMessageViewportSchedule(){
    if(messageViewportFrame)cancelAnimationFrame(messageViewportFrame);
    messageViewportFrame=0;pendingMessageScrollBottom=false;pendingMessageScrollTop=null;
    clearTimeout(chatSendBurstTimer);chatSendBurstTimer=null;
    document.body.classList.remove('chat-send-burst');
  }
  function ensureEffectVisibilityObserver(){
    if(!('IntersectionObserver' in window))return null;
    if(!effectVisibilityObserver){
      effectVisibilityObserver=new IntersectionObserver((entries)=>{
        for(const entry of entries)entry.target.classList.toggle('effects-suspended',!entry.isIntersecting);
      },{root:$('messages'),rootMargin:'160px 0px'});
    }
    return effectVisibilityObserver;
  }
  function observeMessageRowEffect(row,{suspended=true}={}){
    const observer=ensureEffectVisibilityObserver();
    if(!observer||!row)return;
    row.classList.toggle('effects-suspended',suspended);
    row.dataset.effectObserved='1';
    observer.observe(row);
  }
  function observeMessageEffects(){
    if(!ensureEffectVisibilityObserver())return;
    $('messages').querySelectorAll('.message-row:not([data-effect-observed])').forEach((row)=>{
      /* Tạm dừng trước khi trình duyệt xác định vùng nhìn để tránh hàng trăm
         hiệu ứng cùng khởi chạy trong khung hình đầu tiên. */
      observeMessageRowEffect(row,{suspended:true});
    });
  }
  function scheduleNextEffectExpiry(){
    clearTimeout(effectExpiryTimer);effectExpiryTimer=null;
    const now=Date.now();
    const next=state.messages.reduce((soonest,message)=>{
      const expires=Number(message.effectExpiresAt||0);
      if(message.effectDisabledAt||!expires||expires<=now)return soonest;
      return !soonest||expires<soonest?expires:soonest;
    },0);
    if(!next)return;
    effectExpiryTimer=setTimeout(()=>{
      const endedAt=new Date().toISOString();let changed=false;const current=Date.now();
      for(const message of state.messages){
        if(!message.effectDisabledAt&&message.effectExpiresAt&&current>=Number(message.effectExpiresAt)){
          message.effectDisabledAt=endedAt;changed=true;
        }
      }
      if(changed)queueMessageRender();
      scheduleNextEffectExpiry();
    },Math.max(40,Math.min(next-now+30,2147483647)));
  }
  function localDayKey(value){
    const date=new Date(value);if(Number.isNaN(date.getTime()))return '';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function sameMessageGroup(previous,current){
    if(!previous||!current||previous.fromId!==current.fromId)return false;
    const before=new Date(previous.createdAt).getTime(),after=new Date(current.createdAt).getTime();
    return Number.isFinite(before)&&Number.isFinite(after)&&after>=before&&after-before<MESSAGE_GROUP_GAP&&localDayKey(previous.createdAt)===localDayKey(current.createdAt);
  }
  function messageDateLabel(value){
    const date=new Date(value);if(Number.isNaN(date.getTime()))return '';
    const today=new Date(),yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
    const key=localDayKey(value);
    if(key===localDayKey(today))return 'Hôm nay';
    if(key===localDayKey(yesterday))return 'Hôm qua';
    return new Intl.DateTimeFormat(window.I18N?.language==='vi'?'vi-VN':undefined,{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  }
  function visibleMessages(){
    const query=$('messageSearchInput').value.trim().toLowerCase();
    return state.messages.filter((m)=>!query||(m.text||'').toLowerCase().includes(query));
  }
  function messageTextClass(value=''){
    const text=String(value||'').trim();
    if(!text)return '';
    const emojiOnly=/^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\u200d|\ufe0f|\s)+$/u.test(text);
    const longToken=text.split(/\s+/).some((token)=>token.length>28);
    const compact=!text.includes('\n')&&text.length<=22;
    return [emojiOnly?'emoji-only':'',longToken?'has-long-token':'',compact?'compact-text':''].filter(Boolean).join(' ');
  }
  function queueMessageRender({forceScroll=false}={}){
    pendingRenderForceScroll=pendingRenderForceScroll||forceScroll;
    if(messageRenderFrame)return;
    messageRenderFrame=requestAnimationFrame(()=>{
      messageRenderFrame=0;
      const shouldForce=pendingRenderForceScroll;pendingRenderForceScroll=false;
      renderMessages({forceScroll:shouldForce});
    });
  }
  function conversationEmptyStateHTML(){
    const scope=state.active.scope;
    const scopeIcon=scope==='support'?'headset':scope==='world'?'globe':scope==='group'?'users':'message-circle';
    const scopeLabel=scope==='support'?t('adminSupport'):scope==='world'?t('worldChat'):scope==='group'?tx('groups'):t('privateConversation');
    const contextText=scope==='support'?t('supportStatus'):scope==='world'?t('worldStatus'):scope==='group'?tx('groups'):t('privateConversation');
    return `<div class="conversation-empty-state scope-${escape(scope)}" role="status">
      <div class="empty-state-visual" aria-hidden="true"><i></i><i></i><span>${icon(scopeIcon)}</span></div>
      <small class="empty-state-kicker">${escape(scopeLabel)}</small>
      <h3>${escape(t('noMessages'))}</h3>
      <p>${escape(t('startConversation'))}</p>
      <div class="empty-state-context"><span>${icon(scope==='world'?'globe':'shield')}<b>${escape(contextText)}</b></span><span class="empty-state-attach-chip icon-only" aria-label="${escape(t('attachFile'))}" title="${escape(t('attachFile'))}">${icon('paperclip')}</span></div>
    </div>`;
  }
  function renderMessages({forceScroll=false}={}){
    const box=$('messages');
    const stickToBottom=forceScroll||isNearMessageBottom();
    const previousTop=box.scrollTop;
    const list=visibleMessages();
    effectVisibilityObserver?.disconnect();
    if(!list.length){box.innerHTML=conversationEmptyStateHTML();scheduleNextEffectExpiry();return;}
    const renderContext={lastOwnIndex:findLastOwnMessageIndex(list)};
    box.innerHTML=list.map((_,index)=>messageEntryHTML(list,index,renderContext)).join('');
    observeMessageEffects();scheduleNextEffectExpiry();
    scheduleMessageViewport({stickToBottom,top:previousTop});
  }
  function findLastOwnMessageIndex(list){
    for(let index=list.length-1;index>=0;index--)if(list[index]?.fromId===state.me?.id)return index;
    return -1;
  }
  function messageEntryHTML(list,index,context={}){
    const m=list[index],previous=list[index-1]||null,next=list[index+1]||null;
    const groupStart=!sameMessageGroup(previous,m),groupEnd=!sameMessageGroup(m,next);
    const showDate=state.me?.settings?.showMessageDate!==false&&(index===0||localDayKey(previous?.createdAt)!==localDayKey(m.createdAt));
    const separator=showDate?`<div class="message-date-separator" role="separator"><span>${escape(messageDateLabel(m.createdAt))}</span></div>`:'';
    const lastOwnIndex=Number.isInteger(context.lastOwnIndex)?context.lastOwnIndex:findLastOwnMessageIndex(list);
    return `<div class="message-entry" data-message-entry="${escape(m.id)}">${separator}${messageHTML(m,{groupStart,groupEnd,isLatestOwn:index===lastOwnIndex})}</div>`;
  }
  function messageHTML(m,{groupStart=true,groupEnd=true,isLatestOwn=false}={}){
    const mine=m.fromId===state.me.id,showName=state.active.scope==='world'||state.active.scope==='group';
    const showTime=state.me?.settings?.showMessageTime!==false&&groupEnd;
    const showDelivery=state.me?.settings?.showDeliveryStatus!==false&&groupEnd&&isLatestOwn&&['private','support'].includes(state.active.scope);
    const effectExpired=Boolean(m.effectExpiresAt&&Date.now()>=Number(m.effectExpiresAt));const effect=!m.effectDisabledAt&&!effectExpired&&EFFECTS.includes(m.effect)?m.effect:'none';
    const sender=getUserFromState(m.fromId);const name=m.senderName||sender?.nickname||'';const messageSender={...(sender||{}),profile:{...(sender?.profile||{}),...(m.senderAvatarUrl?{avatarUrl:m.senderAvatarUrl}:{})},profileBadges:m.senderProfileBadges||sender?.profileBadges||{}};const messageRank=profileRank(messageSender);const avatar=(showName&&!mine)?(groupEnd?(sender?.profile?.showAvatarInWorld===false?'<span class="message-avatar-spacer" aria-hidden="true"></span>':`<span class="message-avatar-profile" data-mobile-profile-id="${escape(m.fromId)}" role="button" aria-label="Xem hồ sơ ${escape(name)}">${avatarHTML(messageSender,'message-avatar')}</span>`):'<span class="message-avatar-spacer" aria-hidden="true"></span>'):'';
    const reactions=Object.entries(m.reactions||{}).map(([emoji,ids])=>`<button data-react="${escape(emoji)}" class="reaction-pill ${ids.includes(state.me.id)?'mine':''}">${emoji}<span>${ids.length}</span></button>`).join('');
    const special=m.special?.type==='location'?locationHTML(m.special):'';
    const localFile=m.localAttachmentName?`<div class="local-file-preview"><span>${icon('paperclip')}</span><strong>${escape(m.localAttachmentName)}</strong></div>`:'';
    let status='';
    if(mine&&m.deliveryState==='sending'&&groupEnd)status='<span class="message-status sending"><i></i> Đang gửi</span>';
    else if(mine&&m.deliveryState==='failed'&&groupEnd)status=`<button class="message-status failed" type="button" data-retry-message="${escape(m.id)}" title="${escape(m.clientError||'Không gửi được')}"><b>!</b> Không gửi được</button>`;
    else if(mine&&showDelivery){const seen=m.receiptBy?.some((id)=>id!==state.me.id);status=`<span class="message-status ${seen?'seen':''}">${seen?`<span class="receipt-icons">${icon('check')}${icon('check')}</span> Đã xem`:`${icon('check','receipt-single')} Đã gửi`}</span>`;}
    const menu=m.localOnly?'':`<button class="message-more" type="button" data-message-menu="${escape(m.id)}" aria-label="Tùy chọn tin nhắn: sao chép, thu hồi hoặc xóa" title="Tùy chọn tin nhắn">${icon('more')}</button>`;
    const publicEffect=state.active.scope==='world'&&effect!=='none'?publicEffectChip(effect):'';
    const rankMark=messageRank==='legend'?'<span class="message-rank-mark mark-legend" title="Bong bóng LEGEND">L</span>':messageRank==='vip'?'<span class="message-rank-mark mark-vip" title="Bong bóng VIP">V</span>':'';
    const attachmentOnly=!m.recalledAt&&!m.text&&m.attachment?.kind==='image'&&!localFile&&!special;
    const compact=!groupStart;
    const textClass=messageTextClass(m.text);
    return `<article class="message-row ${mine?'mine':'other'} ${compact?'compact':''} ${groupStart?'group-start':''} ${groupEnd?'group-end':'group-middle'} ${m.deliveryState==='failed'?'send-failed':''} message-rank-${messageRank}" data-message-id="${escape(m.id)}">${avatar}<div class="message-stack">${showName&&!mine&&groupStart?(m.senderProfilePublic!==false?`<button class="sender-name" data-profile-id="${escape(m.fromId)}"><span>${escape(name)}</span>${publicEffect}</button>`:`<span class="sender-name"><span>${escape(name)}</span>${publicEffect}</span>`):''}<div class="message-bubble effect-${escape(effect)} bubble-rank-${messageRank} ${textClass} ${m.recalledAt?'recalled':''} ${attachmentOnly?'attachment-only':''}" data-public-effect="${escape(effect)}" tabindex="0">${legendBubbleDecor(messageRank)}${rankMark}${m.recalledAt?'<em>Tin nhắn đã được thu hồi</em>':`${m.text?`<p>${escape(m.text).replace(/\n/g,'<br>')}</p>`:''}${UI.attachmentHTML(m.attachment)}${localFile}${special}`}${menu}</div>${reactions?`<div class="message-reactions">${reactions}</div>`:''}<div class="message-meta">${showTime?`<time title="${escape(UI.formatDate(m.createdAt))}">${UI.formatTime(m.createdAt)}</time>`:''}${m.editedAt?'<span>Đã chỉnh sửa</span>':''}${m.pinnedBy?.includes(state.me.id)?`<span class="message-pin-icon">${icon('pin')}</span>`:''}${status}</div></div></article>`;
  }
  function replaceMessageEntryStable(current,html,messageId){
    const previousRow=current.querySelector('.message-row');
    const wasSuspended=previousRow?.classList.contains('effects-suspended')??false;
    const template=document.createElement('template');
    template.innerHTML=html.trim();
    const next=template.content.firstElementChild;
    if(!next)return;
    current.dataset.messageEntry=messageId;
    current.innerHTML=next.innerHTML;
    const row=current.querySelector('.message-row');
    if(!row)return;
    row.classList.add('message-stable');
    observeMessageRowEffect(row,{suspended:wasSuspended});
  }
  function messageVisualSignature(message={}){
    const attachment=message.attachment||{};
    return JSON.stringify([
      message.id,message.text,message.editedAt,message.recalledAt,message.effect,message.effectDisabledAt,message.effectExpiresAt,
      message.deliveryState,attachment.id,attachment.url,attachment.kind,attachment.name,message.localAttachmentName,
      message.special?.type,message.special?.expiresAt,message.senderName,message.senderAvatarUrl,
      message.senderProfilePublic,JSON.stringify(message.reactions||{}),JSON.stringify(message.pinnedBy||[]),JSON.stringify(message.receiptBy||[])
    ]);
  }
  function changedMessageNeighbourIndexes(index,before,after){
    const indexes=[];
    const previous=state.messages[index-1]||null,next=state.messages[index+1]||null;
    if(Boolean(sameMessageGroup(previous,before))!==Boolean(sameMessageGroup(previous,after)))indexes.push(index-1);
    if(Boolean(sameMessageGroup(before,next))!==Boolean(sameMessageGroup(after,next)))indexes.push(index+1);
    return indexes;
  }
  function adoptPendingMessageEntry(current,message,index,renderContext){
    const currentRow=current?.querySelector('.message-row');
    const currentBubble=currentRow?.querySelector('.message-bubble');
    if(!currentRow||!currentBubble||message.attachment||message.special||message.recalledAt||currentBubble.querySelector('.local-file-preview'))return false;
    const template=document.createElement('template');
    template.innerHTML=messageEntryHTML(state.messages,index,renderContext).trim();
    const nextEntry=template.content.firstElementChild;
    const nextRow=nextEntry?.querySelector('.message-row');
    const nextBubble=nextRow?.querySelector('.message-bubble');
    if(!nextEntry||!nextRow||!nextBubble)return false;
    const currentText=currentBubble.querySelector('p')?.innerHTML||'';
    const nextText=nextBubble.querySelector('p')?.innerHTML||'';
    if(currentText!==nextText)return false;
    const wasSuspended=currentRow.classList.contains('effects-suspended');
    current.dataset.messageEntry=message.id;
    currentRow.className=`${nextRow.className} message-stable`;
    currentRow.classList.toggle('effects-suspended',wasSuspended);
    currentRow.dataset.messageId=message.id;
    currentBubble.className=nextBubble.className;
    currentBubble.dataset.publicEffect=nextBubble.dataset.publicEffect||'none';
    currentBubble.tabIndex=0;
    currentBubble.querySelector('.message-more')?.remove();
    const nextMenu=nextBubble.querySelector('.message-more');
    if(nextMenu)currentBubble.append(nextMenu.cloneNode(true));
    const currentMeta=currentRow.querySelector('.message-meta');
    const nextMeta=nextRow.querySelector('.message-meta');
    if(currentMeta&&nextMeta)currentMeta.replaceWith(nextMeta.cloneNode(true));
    const currentReactions=currentRow.querySelector('.message-reactions');
    const nextReactions=nextRow.querySelector('.message-reactions');
    if(currentReactions&&!nextReactions)currentReactions.remove();
    else if(currentReactions&&nextReactions)currentReactions.replaceWith(nextReactions.cloneNode(true));
    else if(!currentReactions&&nextReactions)currentBubble.insertAdjacentElement('afterend',nextReactions.cloneNode(true));
    return true;
  }
  function patchMessageWindow(indexes=[],staleIds=[],{forceScroll=false,preserveIds=[]}={}){
    const box=$('messages');
    if($('messageSearchInput').value.trim()||!box.querySelector('[data-message-entry]'))return queueMessageRender({forceScroll});
    const stickToBottom=forceScroll||isNearMessageBottom();
    const preserved=new Set(preserveIds);
    staleIds.forEach((id)=>{const entry=box.querySelector(`[data-message-entry="${CSS.escape(id)}"]`);const row=entry?.querySelector('.message-row');if(row)effectVisibilityObserver?.unobserve(row);entry?.remove();});
    const list=state.messages;
    const renderContext={lastOwnIndex:findLastOwnMessageIndex(list)};
    const currentStatusId=box.querySelector('.message-status')?.closest('[data-message-entry]')?.dataset.messageEntry;
    if(currentStatusId&&!preserved.has(currentStatusId)){const currentStatusIndex=list.findIndex((item)=>item.id===currentStatusId);if(currentStatusIndex>=0)indexes.push(currentStatusIndex);}
    if(renderContext.lastOwnIndex>=0&&!preserved.has(list[renderContext.lastOwnIndex]?.id))indexes.push(renderContext.lastOwnIndex);
    const unique=[...new Set(indexes.filter((index)=>index>=0&&index<list.length&&!preserved.has(list[index]?.id)))].sort((a,b)=>a-b);
    for(const index of unique){
      const message=list[index],html=messageEntryHTML(list,index,renderContext);
      const current=box.querySelector(`[data-message-entry="${CSS.escape(message.id)}"]`);
      if(current){const row=current.querySelector('.message-row');if(row)effectVisibilityObserver?.unobserve(row);replaceMessageEntryStable(current,html,message.id);continue;}
      let next=null;
      for(let i=index+1;i<list.length&&!next;i++)next=box.querySelector(`[data-message-entry="${CSS.escape(list[i].id)}"]`);
      if(next)next.insertAdjacentHTML('beforebegin',html);else box.insertAdjacentHTML('beforeend',html);
    }
    observeMessageEffects();
    scheduleMessageViewport({stickToBottom});
  }
  function upsertRealtimeMessage(message,{forceScroll=false}={}){
    const localIndex=message.clientMessageId?state.messages.findIndex((item)=>item.localOnly&&item.clientMessageId===message.clientMessageId):-1;
    if(localIndex>=0){
      const staleMessage=state.messages[localIndex];
      const staleId=staleMessage.id;
      const box=$('messages');
      const current=box.querySelector(`[data-message-entry="${CSS.escape(staleId)}"]`);
      const neighbourIndexes=changedMessageNeighbourIndexes(localIndex,staleMessage,message);
      state.messages[localIndex]=message;
      markChatSendBurst(220);
      if(current&&!$('messageSearchInput').value.trim()){
        const renderContext={lastOwnIndex:findLastOwnMessageIndex(state.messages)};
        const adopted=adoptPendingMessageEntry(current,message,localIndex,renderContext);
        if(adopted)patchMessageWindow(neighbourIndexes,[],{forceScroll,preserveIds:[message.id]});
        else{
          const row=current.querySelector('.message-row');if(row)effectVisibilityObserver?.unobserve(row);
          replaceMessageEntryStable(current,messageEntryHTML(state.messages,localIndex,renderContext),message.id);
          patchMessageWindow(neighbourIndexes,[],{forceScroll,preserveIds:[message.id]});
        }
      }else{
        patchMessageWindow([localIndex-1,localIndex,localIndex+1],[staleId],{forceScroll});
      }
      scheduleNextEffectExpiry();
      return;
    }
    const existingIndex=state.messages.findIndex((item)=>item.id===message.id);
    if(existingIndex>=0){
      const previous=state.messages[existingIndex];
      state.messages[existingIndex]=message;
      if(messageVisualSignature(previous)!==messageVisualSignature(message))patchMessageWindow([existingIndex-1,existingIndex,existingIndex+1],[],{forceScroll});
      else scheduleMessageViewport({stickToBottom:forceScroll});
      scheduleNextEffectExpiry();return;
    }
    state.messages.push(message);const index=state.messages.length-1;patchMessageWindow([index-1,index],[],{forceScroll});scheduleNextEffectExpiry();
  }
  function patchMessagesByIds(ids,{forceScroll=false}={}){
    const wanted=new Set(ids);const indexes=[];
    state.messages.forEach((item,index)=>{if(wanted.has(item.id))indexes.push(index-1,index,index+1);});
    patchMessageWindow(indexes,[],{forceScroll});
  }
  function getUserFromState(id){if(id===state.me?.id)return state.me;return friendById(id)||state.suggestions.find((u)=>u.id===id)||state.messageRequests.find((r)=>r.user.id===id)?.user||null;}
  function locationHTML(s){const expired=s.expiresAt&&Date.now()>new Date(s.expiresAt).getTime();return `<a class="location-card ${expired?'expired':''}" href="${expired?'#':`https://www.google.com/maps?q=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}`}" target="_blank" rel="noopener"><span>${icon('map-pin')}</span><div><strong>${expired?'Vị trí đã hết hạn':'Vị trí được chia sẻ'}</strong><small>${expired?'Không thể mở':`Có hiệu lực đến ${UI.formatDate(s.expiresAt)}`}</small></div></a>`;}
  function renderPinnedBar(){const pins=state.messages.filter((m)=>m.pinnedBy?.includes(state.me.id));$('pinnedMessageBar').classList.toggle('hidden',!pins.length);if(pins.length){$('pinnedMessageText').textContent=pins[0].text||pins[0].attachment?.name||'Tin nhắn';$('pinnedMessageBar').dataset.ids=pins.map((m)=>m.id).join(',');$('pinnedMessageBar').dataset.index='0';}}
  function scrollToBottom(){scheduleMessageViewport({stickToBottom:true});}

  async function uploadFile(file){if(!file)return null;if(file.size>30*1024*1024)throw new Error('Tệp vượt quá giới hạn 30 MB.');const fd=new FormData();fd.append('file',file);return (await UI.fetchJSON('/api/upload',{method:'POST',body:fd})).attachment;}
  function emitMessage(payload){
    return new Promise((resolve,reject)=>{
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled)return;
        settled=true;
        const error=new Error(socket.connected?'Máy chủ phản hồi chậm. Hãy thử gửi lại.':'Mất kết nối. Tin nhắn chưa được gửi.');
        error.code=socket.connected?'ACK_TIMEOUT':'OFFLINE';
        reject(error);
      },12000);
      socket.emit('chat:send',payload,(r)=>{
        if(settled)return;
        settled=true;clearTimeout(timer);
        if(r?.ok)return resolve(r);
        const error=new Error(r?.message||'Không thể gửi tin nhắn.');
        error.code=r?.code;error.data=r||{};reject(error);
      });
    });
  }
  async function sendMessage(text,special=null,file=null,clientMessageId=null){
    if(state.pendingDeletes.some((d)=>d.scope===(state.active.scope==='group'?'group':'private')&&d.targetId===state.active.targetId))throw new Error('Đoạn chat đang chờ xóa.');
    if(['private','request'].includes(state.active.scope)&&state.activeAccess.blocked){const error=new Error('Hiện không thể liên lạc với người này.');error.code='CONTACT_BLOCKED';throw error;}
    const attachment=await uploadFile(file);
    const selectedEffect=state.me?.effectAccess&&(state.me?.selectedEffect==='none'||EFFECTS.includes(state.me?.selectedEffect))?state.me.selectedEffect:'none';
    return emitMessage({scope:state.active.scope,targetId:state.active.targetId,text,attachmentId:attachment?.id||null,special,clientMessageId,effect:selectedEffect});
  }
  function makePendingMessage(text,file){const clientMessageId=`client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;return{id:`local_${clientMessageId}`,clientMessageId,localOnly:true,deliveryState:'sending',clientError:'',_autoRetries:0,fromId:state.me.id,toId:state.active.targetId,groupId:state.active.scope==='group'?state.active.targetId:null,scope:state.active.scope,senderName:state.me.nickname,text,createdAt:new Date().toISOString(),readBy:[state.me.id],receiptBy:[state.me.id],reactions:{},pinnedBy:[],deletedFor:[],effect:state.me.effectAccess?(state.me.selectedEffect||'none'):'none',effectSource:state.me.effectAccessSource||'none',effectExpiresAt:state.me.effectAccessExpiresAt||null,effectDisabledAt:null,localAttachmentName:file?.name||'',_file:file||null};}
  async function attemptPendingMessage(local){
    const needsStatusRefresh=local.deliveryState!=='sending'||Boolean(local.clientError);
    local.deliveryState='sending';local.clientError='';
    markChatSendBurst();
    if(needsStatusRefresh)patchMessagesByIds([local.id],{forceScroll:true});
    try{
      const response=await sendMessage(local.text,null,local._file,local.clientMessageId);
      if(local._draftKey){try{if(sessionStorage.getItem(local._draftKey)===local._draftValue)sessionStorage.removeItem(local._draftKey);}catch(_){}state.pendingDraftKeys.delete(local._draftKey);}
      if(response.nextSendAt)setWorldCooldown(response.nextSendAt);upsertRealtimeMessage(response.message,{forceScroll:true});renderPinnedBar();
    }catch(error){
      const delivered=state.messages.find((message)=>!message.localOnly&&message.clientMessageId===local.clientMessageId);
      if(delivered){
        if(local._draftKey){try{if(sessionStorage.getItem(local._draftKey)===local._draftValue)sessionStorage.removeItem(local._draftKey);}catch(_){}state.pendingDraftKeys.delete(local._draftKey);}
        return;
      }
      local.deliveryState='failed';local.clientError=error.message;local.clientErrorCode=error.code||'SEND_FAILED';
      if(error.code==='CONTACT_BLOCKED'||error.data?.blocked){state.activeAccess={...state.activeAccess,...(error.data?.conversationState||{}),blocked:true,canSend:false};applyConversationAccess();updateContactState(state.active.targetId,state.activeAccess);}
      if(['WORLD_CHAT_DISABLED','WORLD_CHAT_READ_ONLY','WORLD_CHAT_ADMIN_ONLY'].includes(error.code)){state.system={...state.system,worldChat:error.data?.worldChat||state.system.worldChat,worldChatEnabled:false};applyConversationAccess();updateHeader();}
      if(error.code==='WORLD_SLOW_MODE'&&error.data?.retryAfter)setWorldCooldown(Date.now()+Number(error.data.retryAfter)*1000);
      if(error.code==='SUPPORT_BLOCKED'||error.code==='SUPPORT_SPAM'){state.supportMessaging={...state.supportMessaging,...(error.data?.supportMessaging||error.data?.moderation?.supportMessaging||{}),strikes:error.data?.moderation?.strike??state.supportMessaging.strikes,resetAt:error.data?.moderation?.resetAt??state.supportMessaging.resetAt};if(state.active.scope==='support'){updateHeader();applyConversationAccess();}}
      patchMessagesByIds([local.id]);const isGentleWarning=['SUPPORT_SPAM','WORLD_SPAM_BLOCKED'].includes(error.code);UI.toast(error.message,isGentleWarning?'warning':'error',error.code==='WORLD_SPAM_BLOCKED'?'Cảnh báo':undefined);
    }
  }
  $('messageForm').addEventListener('submit',(e)=>{e.preventDefault();if(state.composerComposing)return;const raw=$('messageInput').value,text=raw.trim(),file=state.selectedFile;if(!text&&!file)return;if(state.active.scope==='world'&&!worldChatSettings().enabled)return UI.toast('Chat thế giới hiện chưa cho phép thành viên gửi tin.','error');if(state.active.scope==='world'&&Date.now()<Number(state.worldNextSendAt||0))return UI.toast(`Hãy chờ ${Math.ceil((state.worldNextSendAt-Date.now())/1000)} giây trước khi gửi tiếp.`,'info');if(['private','request'].includes(state.active.scope)&&state.activeAccess.blocked)return UI.toast('Hiện không thể liên lạc với người này.','error');const local=makePendingMessage(text,file),key=draftKey();local._draftKey=key;local._draftValue=raw;state.pendingDraftKeys.add(key);try{sessionStorage.setItem(key,raw);}catch(_){}state.messages.push(local);markChatSendBurst();$('messageInput').value='';clearTimeout(state.draftTimer);state.draftTimer=null;resizeComposer();$('messageCounter').textContent='0/4000';clearAttachment();syncComposerClearButton();syncSendButton();stopOwnTyping();patchMessageWindow([state.messages.length-2,state.messages.length-1],[],{forceScroll:true});attemptPendingMessage(local);});
  $('messageInput').addEventListener('compositionstart',()=>{state.composerComposing=true;});
  $('messageInput').addEventListener('compositionend',()=>{state.composerComposing=false;$('messageInput').dispatchEvent(new Event('input',{bubbles:true}));});
  $('messageInput').addEventListener('input',()=>{resizeComposer();const input=$('messageInput');$('messageCounter').textContent=`${input.value.length}/4000`;syncSendButton();queueDraftSave();if(state.composerComposing||!['private','group','support'].includes(state.active.scope)||state.activeAccess.blocked)return;const typingScope=state.active.scope,typingTarget=state.active.targetId,now=Date.now();if(!state.typingActive||now-state.lastTypingSignalAt>2500){state.typingActive=true;state.lastTypingSignalAt=now;socket.emit('chat:typing',{scope:typingScope,targetId:typingTarget,isTyping:true});}clearTimeout(state.typingTimer);state.typingTimer=setTimeout(()=>{state.typingActive=false;socket.emit('chat:typing',{scope:typingScope,targetId:typingTarget,isTyping:false});},1600);});
  $('messageInput').addEventListener('blur',()=>{saveDraft();});
  $('messageInput').addEventListener('keydown',(e)=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!state.composerComposing){e.preventDefault();$('messageForm').requestSubmit();}});
  function setFile(file){if(!file)return false;if(state.active.scope==='world'&&!worldChatSettings().enabled){UI.toast('Chat thế giới hiện chưa cho phép thành viên gửi tệp.','error');return false;}if(['private','request'].includes(state.active.scope)&&state.activeAccess.blocked){UI.toast('Hiện không thể liên lạc với người này.','error');return false;}if(file.size>30*1024*1024){UI.toast('Tệp vượt quá giới hạn 30 MB.','error');return false;}if(state.selectedFileUrl)URL.revokeObjectURL(state.selectedFileUrl);state.selectedFile=file;state.selectedFileUrl=file.type.startsWith('image/')?URL.createObjectURL(file):null;const fileIcon=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'mic':'file';$('attachmentPreview').classList.remove('hidden');$('attachmentPreview').innerHTML=`${state.selectedFileUrl?`<img class="attachment-preview-image" src="${state.selectedFileUrl}" alt="">`:`<span class="file-icon">${icon(fileIcon)}</span>`}<div class="preview-copy"><strong>${escape(file.name)}</strong><small>${UI.formatBytes(file.size)} · Giữ nguyên chất lượng gốc</small></div><button type="button" data-remove-file aria-label="Gỡ tệp">${icon('close')}</button>`;syncComposerClearButton();syncSendButton();return true;}
  function clearAttachment(){if(state.selectedFileUrl)URL.revokeObjectURL(state.selectedFileUrl);state.selectedFileUrl=null;state.selectedFile=null;$('fileInput').value='';$('attachmentPreview').classList.add('hidden');$('attachmentPreview').innerHTML='';syncComposerClearButton();syncSendButton();}
  $('fileInput').addEventListener('change',()=>setFile($('fileInput').files[0]));$('attachmentPreview').addEventListener('click',(e)=>{if(e.target.closest('[data-remove-file]'))clearAttachment();});
  let dragDepth=0;document.addEventListener('dragenter',(e)=>{if(!e.dataTransfer?.types.includes('Files'))return;dragDepth++;$('dropZone').classList.remove('hidden');});document.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('dropZone').classList.add('hidden');});document.addEventListener('dragover',(e)=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault();});document.addEventListener('drop',(e)=>{if(e.dataTransfer?.files?.length){e.preventDefault();dragDepth=0;$('dropZone').classList.add('hidden');setFile(e.dataTransfer.files[0]);}});

  $('toolsButton').addEventListener('click',()=>{ $('quickTools').classList.toggle('hidden');setEmojiPickerOpen(false); });
  $('emojiButton').addEventListener('click',()=>{const opening=$('emojiPicker').classList.contains('hidden');setEmojiPickerOpen(opening);$('quickTools').classList.add('hidden');});
  $('emojiPicker').addEventListener('click',(event)=>{
    if(event.target.closest('[data-emoji-close]')){setEmojiPickerOpen(false);return;}
    const categoryButton=event.target.closest('[data-emoji-category]');
    if(categoryButton){activeEmojiCategory=categoryButton.dataset.emojiCategory||'smileys';renderEmojiPicker();return;}
    const emojiButton=event.target.closest('[data-emoji]');
    if(!emojiButton)return;
    const emoji=emojiButton.dataset.emoji||emojiButton.textContent;
    insertEmojiAtCursor(emoji);rememberEmoji(emoji);
    if(activeEmojiCategory==='recent')renderEmojiPicker();
  });
  $('quickTools').addEventListener('click',(e)=>{const b=e.target.closest('[data-quick]');if(!b)return;$('quickTools').classList.add('hidden');if(b.dataset.quick==='camera')openCamera();if(b.dataset.quick==='voice')focusVoiceRecorder();if(b.dataset.quick==='location')shareLocation();});
  function voiceContextKey(){return `${state.active.scope}:${state.active.targetId||''}`;}
  function voiceMimeType(){
    if(typeof MediaRecorder==='undefined')return '';
    const options=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4','audio/webm'];
    return options.find((type)=>MediaRecorder.isTypeSupported?.(type))||'';
  }
  function voiceExtension(mime=''){const value=String(mime).toLowerCase();if(value.includes('mp4'))return 'm4a';if(value.includes('ogg'))return 'ogg';return 'webm';}
  function formatVoiceDuration(ms){const total=Math.max(0,Math.floor(Number(ms||0)/1000));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
  function voiceBlockedReason(){
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')return voiceText('unsupported');
    if($('messageInput')?.value.trim()||state.selectedFile)return voiceText('busy');
    if(['private','request'].includes(state.active.scope)&&state.activeAccess.blocked)return 'Hiện không thể liên lạc với người này.';
    if(state.active.scope==='request'&&state.messageRequests.some((request)=>request.user.id===state.active.targetId))return 'Hãy chấp nhận tin nhắn chờ trước khi trả lời.';
    if(state.active.scope==='world'&&!worldChatSettings().enabled)return 'Chat thế giới hiện chưa cho phép thành viên gửi tin.';
    if(state.active.scope==='world'&&Date.now()<Number(state.worldNextSendAt||0))return `Hãy chờ ${Math.ceil((state.worldNextSendAt-Date.now())/1000)} giây trước khi gửi tiếp.`;
    if(state.active.scope==='support'&&state.supportMessaging?.blocked)return 'Kênh hỗ trợ hiện đang bị tạm khóa.';
    if($('messageInput')?.disabled)return 'Hiện chưa thể gửi tin nhắn trong cuộc trò chuyện này.';
    return '';
  }
  function ensureVoiceWaveform(){const box=$('voiceRecordWaveform');if(box&&!box.childElementCount)box.innerHTML=Array.from({length:24},()=>'<i></i>').join('');}
  function resetVoiceBars(){document.querySelectorAll('#voiceRecordWaveform i').forEach((bar,index)=>{bar.style.height=`${20+((index*13)%38)}%`;});}
  function stopVoiceVisualization(){
    if(voiceCapture.waveFrame)cancelAnimationFrame(voiceCapture.waveFrame);voiceCapture.waveFrame=0;
    try{voiceCapture.source?.disconnect?.();}catch(_){ }
    try{voiceCapture.analyser?.disconnect?.();}catch(_){ }
    try{voiceCapture.audioContext?.close?.();}catch(_){ }
    voiceCapture.source=null;voiceCapture.analyser=null;voiceCapture.audioContext=null;voiceCapture.waveData=null;resetVoiceBars();
  }
  function startVoiceVisualization(stream){
    ensureVoiceWaveform();
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass){resetVoiceBars();return;}
    try{
      const context=new AudioContextClass();const analyser=context.createAnalyser();analyser.fftSize=64;analyser.smoothingTimeConstant=.72;
      const source=context.createMediaStreamSource(stream);source.connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount);
      voiceCapture.audioContext=context;voiceCapture.analyser=analyser;voiceCapture.source=source;voiceCapture.waveData=data;
      const bars=[...document.querySelectorAll('#voiceRecordWaveform i')];
      const draw=()=>{if(!voiceCapture.active||!voiceCapture.analyser)return;voiceCapture.analyser.getByteFrequencyData(data);bars.forEach((bar,index)=>{const sample=data[Math.min(data.length-1,Math.floor(index*data.length/bars.length))]||0;bar.style.height=`${Math.max(18,Math.min(100,18+sample*.32))}%`;});voiceCapture.waveFrame=requestAnimationFrame(draw);};draw();
    }catch(_){resetVoiceBars();}
  }
  function updateVoiceRecorderUI(){
    const bar=$('voiceRecorderBar'),wrap=document.querySelector('.composer-wrap'),timer=$('voiceRecordTimer'),hint=$('voiceRecordHint'),stateLabel=$('voiceRecordState'),cancel=$('voiceRecordCancelButton'),send=$('voiceRecordSendButton'),lock=$('voiceRecordLock');
    const visible=voiceCapture.active||voiceCapture.starting;
    bar?.classList.toggle('hidden',!visible);wrap?.classList.toggle('voice-recording-active',visible);bar?.classList.toggle('is-starting',voiceCapture.starting);bar?.classList.toggle('is-locked',voiceCapture.locked);bar?.classList.toggle('is-cancel-armed',voiceCapture.cancelArmed);
    if(timer)timer.textContent=formatVoiceDuration(voiceCapture.active?Date.now()-voiceCapture.startedAt:0);
    if(stateLabel)stateLabel.textContent=voiceCapture.starting?voiceText('starting'):voiceText('recording');
    if(hint)hint.textContent=voiceCapture.cancelArmed?voiceText('cancelReady'):(voiceCapture.locked?voiceText('locked'):voiceText('release'));
    if(cancel){cancel.setAttribute('aria-label',voiceText('cancel'));cancel.title=voiceText('cancel');}
    if(send){send.setAttribute('aria-label',voiceText('send'));send.title=voiceText('send');}
    if(lock)lock.setAttribute('aria-hidden',String(voiceCapture.locked));
    syncSendButton();
  }
  function clearVoiceTimers(){clearInterval(voiceCapture.timer);clearTimeout(voiceCapture.maxTimer);voiceCapture.timer=0;voiceCapture.maxTimer=0;}
  function releaseVoiceStream(){voiceCapture.stream?.getTracks?.().forEach((track)=>track.stop());voiceCapture.stream=null;}
  function resetVoiceCapture(){
    clearVoiceTimers();stopVoiceVisualization();releaseVoiceStream();
    voiceCapture.active=false;voiceCapture.starting=false;voiceCapture.locked=false;voiceCapture.cancelArmed=false;voiceCapture.pointerId=null;voiceCapture.startedAt=0;voiceCapture.recorder=null;voiceCapture.chunks=[];voiceCapture.stopAction='';voiceCapture.pendingAction='';voiceCapture.contextKey='';voiceCapture.keyboardKey='';state.mediaRecorder=null;state.audioChunks=[];updateVoiceRecorderUI();
  }
  async function finalizeVoiceRecording(action,chunks,mime,duration,contextKey){
    const contextStillActive=voiceContextKey()===contextKey;
    const shouldSend=action==='send'&&duration>=450&&chunks.length&&contextStillActive;
    resetVoiceCapture();
    if(action==='discard')return;
    if(action==='send'&&duration<450){UI.toast(voiceText('tooShort'),'info');return;}
    if(action==='cancel'){UI.toast(voiceText('canceled'),'info');return;}
    if(!shouldSend){if(action==='send'&&!contextStillActive)UI.toast(voiceText('canceled'),'info');return;}
    const blob=new Blob(chunks,{type:mime||'audio/webm'});if(!blob.size){UI.toast(voiceText('tooShort'),'info');return;}
    const file=new File([blob],`voice-${Date.now()}.${voiceExtension(blob.type||mime)}`,{type:blob.type||mime||'audio/webm',lastModified:Date.now()});
    if(setFile(file))requestAnimationFrame(()=>$('messageForm')?.requestSubmit());
  }
  function finishVoiceRecording(action='send'){
    if(voiceCapture.starting&&!voiceCapture.active){voiceCapture.pendingAction=action;if(action==='cancel'||action==='discard'){voiceCapture.starting=false;releaseVoiceStream();updateVoiceRecorderUI();}return;}
    const recorder=voiceCapture.recorder;
    if(!recorder||recorder.state==='inactive')return;
    voiceCapture.stopAction=action;
    try{recorder.stop();}catch(_){resetVoiceCapture();}
  }
  function cancelVoiceRecording({silent=false}={}){
    if(!voiceCapture.active&&!voiceCapture.starting)return;
    const action=silent?'discard':'cancel';
    if(voiceCapture.starting&&!voiceCapture.active){voiceCapture.pendingAction=action;voiceCapture.starting=false;releaseVoiceStream();updateVoiceRecorderUI();return;}
    finishVoiceRecording(action);
  }
  async function startVoiceRecording({pointerId=null,x=0,y=0,keyboardKey=''}={}){
    if(voiceCapture.active||voiceCapture.starting)return;
    const blocked=voiceBlockedReason();if(blocked){UI.toast(blocked,'warning');return;}
    voiceCapture.starting=true;voiceCapture.pointerId=pointerId;voiceCapture.originX=x;voiceCapture.originY=y;voiceCapture.contextKey=voiceContextKey();voiceCapture.pendingAction='';voiceCapture.stopAction='';voiceCapture.keyboardKey=keyboardKey;updateVoiceRecorderUI();
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});}
    catch(_){const canceled=!voiceCapture.starting||['cancel','discard'].includes(voiceCapture.pendingAction);voiceCapture.starting=false;voiceCapture.pointerId=null;updateVoiceRecorderUI();if(!canceled)UI.toast(voiceText('denied'),'error');return;}
    if(!voiceCapture.starting&&['cancel','discard'].includes(voiceCapture.pendingAction)){stream.getTracks().forEach((track)=>track.stop());resetVoiceCapture();return;}
    const mime=voiceMimeType();let recorder;
    try{recorder=mime?new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000}):new MediaRecorder(stream);}
    catch(_){stream.getTracks().forEach((track)=>track.stop());resetVoiceCapture();UI.toast(voiceText('unsupported'),'error');return;}
    const chunks=[];const contextKey=voiceCapture.contextKey;
    voiceCapture.stream=stream;voiceCapture.recorder=recorder;voiceCapture.chunks=chunks;state.mediaRecorder=recorder;state.audioChunks=chunks;
    recorder.addEventListener('dataavailable',(event)=>{if(event.data?.size)chunks.push(event.data);});
    recorder.addEventListener('stop',()=>{const duration=Math.max(0,Date.now()-voiceCapture.startedAt);const action=voiceCapture.stopAction||voiceCapture.pendingAction||'discard';finalizeVoiceRecording(action,chunks,recorder.mimeType||mime,duration,contextKey);},{once:true});
    recorder.addEventListener('error',()=>{UI.toast(voiceText('denied'),'error');cancelVoiceRecording({silent:true});},{once:true});
    try{recorder.start(180);}catch(_){stream.getTracks().forEach((track)=>track.stop());resetVoiceCapture();UI.toast(voiceText('unsupported'),'error');return;}
    voiceCapture.starting=false;voiceCapture.active=true;voiceCapture.startedAt=Date.now();startVoiceVisualization(stream);updateVoiceRecorderUI();
    voiceCapture.timer=setInterval(updateVoiceRecorderUI,100);voiceCapture.maxTimer=setTimeout(()=>finishVoiceRecording('send'),120000);
    if(voiceCapture.pendingAction)finishVoiceRecording(voiceCapture.pendingAction);
  }
  function focusVoiceRecorder(){
    const blocked=voiceBlockedReason();if(blocked){UI.toast(blocked,'warning');return;}
    const button=$('voiceRecordButton');if(!button)return;button.focus({preventScroll:true});button.classList.remove('voice-record-attention');void button.offsetWidth;button.classList.add('voice-record-attention');setTimeout(()=>button.classList.remove('voice-record-attention'),900);UI.toast(voiceText('quickHint'),'info');
  }
  function lockVoiceRecording(){
    if(!voiceCapture.active||voiceCapture.locked)return;voiceCapture.locked=true;voiceCapture.cancelArmed=false;try{$('voiceRecordButton')?.releasePointerCapture?.(voiceCapture.pointerId);}catch(_){ }voiceCapture.pointerId=null;navigator.vibrate?.(18);updateVoiceRecorderUI();
  }
  ensureVoiceWaveform();resetVoiceBars();
  const voiceButton=$('voiceRecordButton');
  voiceButton?.addEventListener('pointerdown',(event)=>{if(event.button!==undefined&&event.button!==0)return;if(voiceButton.disabled)return;event.preventDefault();event.stopPropagation();voiceCapture.pointerId=event.pointerId;voiceCapture.originX=event.clientX;voiceCapture.originY=event.clientY;try{voiceButton.setPointerCapture(event.pointerId);}catch(_){ }startVoiceRecording({pointerId:event.pointerId,x:event.clientX,y:event.clientY});});
  document.addEventListener('pointermove',(event)=>{if(voiceCapture.pointerId!==event.pointerId||voiceCapture.locked||(!voiceCapture.active&&!voiceCapture.starting))return;const dx=event.clientX-voiceCapture.originX,dy=event.clientY-voiceCapture.originY;voiceCapture.cancelArmed=dx<-82;if(dy<-72){lockVoiceRecording();return;}updateVoiceRecorderUI();},{passive:true});
  document.addEventListener('pointerup',(event)=>{if(voiceCapture.pointerId!==event.pointerId||voiceCapture.locked)return;event.preventDefault();try{voiceButton?.releasePointerCapture?.(event.pointerId);}catch(_){ }voiceCapture.pointerId=null;finishVoiceRecording(voiceCapture.cancelArmed?'cancel':'send');},{passive:false});
  document.addEventListener('pointercancel',(event)=>{if(voiceCapture.pointerId!==event.pointerId)return;voiceCapture.pointerId=null;finishVoiceRecording('cancel');});
  voiceButton?.addEventListener('contextmenu',(event)=>event.preventDefault());
  voiceButton?.addEventListener('click',(event)=>event.preventDefault());
  voiceButton?.addEventListener('keydown',(event)=>{if(![' ','Enter'].includes(event.key)||event.repeat||voiceCapture.active||voiceCapture.starting)return;event.preventDefault();voiceCapture.keyboardKey=event.key;startVoiceRecording({keyboardKey:event.key});});
  voiceButton?.addEventListener('keyup',(event)=>{if(event.key!==voiceCapture.keyboardKey||voiceCapture.locked)return;event.preventDefault();finishVoiceRecording('send');});
  $('voiceRecordCancelButton')?.addEventListener('click',()=>finishVoiceRecording('cancel'));
  $('voiceRecordSendButton')?.addEventListener('click',()=>finishVoiceRecording('send'));
  addEventListener('beforeunload',()=>cancelVoiceRecording({silent:true}));
  addEventListener('languagechange',()=>{updateVoiceRecorderUI();syncSendButton();});
  async function shareLocation(){if(!navigator.geolocation)return UI.toast('Thiết bị không hỗ trợ vị trí.','error');const minutes=Number(await promptValue('Thời gian chia sẻ vị trí (phút)','60'))||60;navigator.geolocation.getCurrentPosition(async(pos)=>{try{await sendMessage('',{type:'location',lat:pos.coords.latitude,lng:pos.coords.longitude,expiresAt:new Date(Date.now()+Math.min(minutes,1440)*60000).toISOString()});}catch(e){UI.toast(e.message,'error');}},()=>UI.toast('Không thể lấy vị trí.','error'),{enableHighAccuracy:true,timeout:12000});}
  async function openCamera(){try{state.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('cameraVideo').srcObject=state.cameraStream;$('cameraVideo').classList.remove('hidden');$('cameraCanvas').classList.add('hidden');$('usePhotoButton').classList.add('hidden');$('captureButton').classList.remove('hidden');UI.openModal('cameraModal');}catch{UI.toast('Không thể truy cập camera.','error');}}
  $('captureButton').addEventListener('click',()=>{const v=$('cameraVideo'),c=$('cameraCanvas');c.width=v.videoWidth;c.height=v.videoHeight;const ctx=c.getContext('2d');ctx.filter=state.cameraFilter;ctx.drawImage(v,0,0);c.classList.remove('hidden');v.classList.add('hidden');$('captureButton').classList.add('hidden');$('usePhotoButton').classList.remove('hidden');});
  document.querySelectorAll('[data-filter]').forEach((b)=>{b.setAttribute('aria-pressed',String(b.dataset.filter==='none'));b.addEventListener('click',()=>{state.cameraFilter=b.dataset.filter;$('cameraVideo').style.filter=state.cameraFilter;document.querySelectorAll('[data-filter]').forEach((item)=>{const active=item===b;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});});});
  $('usePhotoButton').addEventListener('click',()=>$('cameraCanvas').toBlob((blob)=>{if(blob)setFile(new File([blob],`camera-${Date.now()}.jpg`,{type:'image/jpeg'}));closeCamera();},'image/jpeg',.96));$('closeCameraButton').addEventListener('click',closeCamera);
  function closeCamera(){state.cameraStream?.getTracks().forEach((t)=>t.stop());state.cameraStream=null;UI.closeModal('cameraModal');}

  function setProfileCoverPhoto(container,url){
    if(!container)return;
    const value=String(url||'').trim();
    const photo=container.querySelector('.profile-cover-photo');
    container.style.backgroundImage='';
    container.dataset.coverUrl=value;
    if(!photo){container.classList.toggle('has-profile-photo',Boolean(value));return;}
    photo.onload=()=>{
      if(container.dataset.coverUrl!==value)return;
      photo.hidden=false;
      container.classList.add('has-profile-photo');
      container.classList.remove('profile-media-load-failed');
    };
    photo.onerror=()=>{
      if(container.dataset.coverUrl!==value)return;
      photo.hidden=true;
      photo.removeAttribute('src');
      container.classList.remove('has-profile-photo');
      container.classList.add('profile-media-load-failed');
    };
    if(value){
      container.classList.remove('profile-media-load-failed');
      photo.hidden=false;
      if(photo.getAttribute('src')!==value)photo.setAttribute('src',value);
      else if(photo.complete)photo.naturalWidth?photo.onload():photo.onerror();
    }else{
      container.classList.remove('has-profile-photo','profile-media-load-failed');
      photo.hidden=true;
      photo.removeAttribute('src');
    }
  }
  function setProfileMediaBusy(kind,busy){
    const button=$(kind==='avatarUrl'?'editAvatarButton':'editCoverButton');
    if(button){button.disabled=busy;button.classList.toggle('is-uploading',busy);button.setAttribute('aria-busy',String(busy));}
    const submit=$('profileForm')?.querySelector('[type="submit"]');
    if(submit)submit.disabled=state.profileMediaUploads>0;
  }
  async function showProfile(userId){
    if(userId===state.me.id){fillOwnProfile();UI.openModal('profileModal');return;}
    try{
      const data=await UI.fetchJSON(`/api/profile/${encodeURIComponent(userId)}`),u=data.user,r=data.relationship||{};state.selectedProfile=u;
      const publicCard=$('publicProfileModal').querySelector('.public-profile-card');
      applyTierClass(publicCard,u);
      applyTierClass($('publicCover'),u,'cover-tier');
      setProfileCoverPhoto($('publicCover'),u.profile?.coverUrl||'');
      const eliteBanner=profileRank(u)==='standard'?'':`<div class="elite-profile-banner ${rankClass(u,'tier')}"><span class="elite-profile-emblem">${profileRank(u)==='legend'?'L':'V'}</span><div><b>${profileRank(u)==='legend'?'LEGEND PROFILE':'VIP PROFILE'}</b><small>${profileRank(u)==='legend'?'Biểu tượng danh dự cao nhất của NexChat':'Hồ sơ thành viên đặc quyền NexChat'}</small></div><i aria-hidden="true"></i></div>`;
      const publicState=u.status?.type&&u.status.type!=='active'?'Tài khoản đang bị hạn chế':(u.online?'Đang hoạt động':'Ngoại tuyến');
      const publicConnection=r.friend?'Bạn bè':(r.canMessage?'Đã kết nối':'Chưa kết bạn');
      const mobileOverview=`<div class="mobile-profile-overview mobile-only"><div class="mobile-profile-status ${u.online?'online':'offline'}">${icon('activity')}<span><small>Trạng thái</small><b>${escape(publicState)}</b></span></div><div>${icon('user-check')}<span><small>Kết nối</small><b>${escape(publicConnection)}</b></span></div><div>${icon('info')}<span><small>Tham gia</small><b>${escape(UI.formatDate(u.createdAt))}</b></span></div></div>`;
      const extendedDetails=`${u.profile?.relationship?`<span class="mobile-profile-extra mobile-only">${icon('user-check')}<span><small>Mối quan hệ</small><b>${escape(u.profile.relationship)}</b></span></span>`:''}${u.profile?.birthday?`<span class="mobile-profile-extra mobile-only">${icon('info')}<span><small>Sinh nhật</small><b>${escape(u.profile.birthday)}</b></span></span>`:''}`;
      const publicAvatarUrl=String(u.profile?.avatarUrl||'');
      const publicAvatarPerson=String(u.nickname||u.username||'');
      const publicAvatarAttrs=publicAvatarUrl?` data-avatar-preview="${escape(publicAvatarUrl)}" data-avatar-person="${escape(publicAvatarPerson)}" data-avatar-name="${escape(UI.avatarViewerText(publicAvatarPerson,'title'))}" data-avatar-hint="${escape(UI.avatarViewerText(publicAvatarPerson,'hint'))}" role="button" tabindex="0" aria-label="${escape(UI.avatarViewerText(publicAvatarPerson,'view'))}"`:'';
      $('publicProfileContent').innerHTML=`${eliteBanner}<div class="public-profile-identity"><div class="public-profile-avatar${publicAvatarUrl?' is-viewable':''}"${publicAvatarAttrs}>${UI.avatarHTML(u,'profile-avatar-big',{badges:false})}${UI.profileBadgeHTML(u)}</div><div><span class="public-profile-kicker">${profileRank(u)==='legend'?'HỒ SƠ HUYỀN THOẠI':profileRank(u)==='vip'?'HỒ SƠ ĐẶC QUYỀN':'Hồ sơ công khai'}</span><h2>${escape(u.nickname)}</h2><p>@${escape(u.username)}</p>${rankPresentation(u)}</div></div>${mobileOverview}<div class="public-profile-details">${u.profile?.bio?`<p class="public-profile-bio">${escape(u.profile.bio)}</p>`:''}${u.profile?.location?`<span>${icon('map-pin')}<b>${escape(u.profile.location)}</b></span>`:''}${u.profile?.work?`<span>${icon('briefcase')}<b>${escape(u.profile.work)}</b></span>`:''}${u.profile?.school?`<span>${icon('graduation')}<b>${escape(u.profile.school)}</b></span>`:''}${extendedDetails}</div>${r.blocked?`<div class="profile-restriction-note">${icon('ban')}<span>Hiện không thể liên lạc với tài khoản này.</span></div>`:''}`;
      const messageButton=r.blocked&&r.canViewConversation?`<button class="primary-button" data-profile-message="${u.id}">Xem đoạn chat</button>`:(r.canMessage?`<button class="primary-button" data-profile-message="${u.id}">Nhắn tin</button>`:(r.canRequest?`<button class="primary-button" data-profile-request-message="${u.id}">Nhắn tin</button>`:''));
      const friendButton=!r.friend&&!r.blocked?`<button class="secondary-button" data-add-username="${escape(u.username)}">Kết bạn</button>`:'';
      const blockButton=r.blockedByMe?`<button class="secondary-button" data-profile-unblock="${u.id}">Bỏ chặn</button>`:`<button class="secondary-button" data-profile-block="${u.id}">Chặn</button>`;
      const reportButton=`<button class="secondary-button report-outline-button" data-profile-report="${u.id}">${icon('shield-alert')} Tố cáo</button>`;
      $('publicProfileActions').innerHTML=`${messageButton}${friendButton}${reportButton}${blockButton}`;UI.openModal('publicProfileModal');
    }catch(error){UI.toast(error.message,'error');}
  }
  function fillOwnProfile(){
    const u=state.me,p=u.profile||{},s=u.settings||{};
    const ownCard=$('profileModal').querySelector('.profile-modal-card');
    applyTierClass(ownCard,u);
    applyTierClass($('myCover'),u,'cover-tier');
    setProfileCoverPhoto($('myCover'),p.coverUrl||'');
    $('myAvatar').innerHTML=`${UI.avatarHTML(u,'profile-avatar-render',{presence:false,badges:false})}${UI.profileBadgeHTML(u)}`;
    const ownAvatarUrl=String(p.avatarUrl||'');
    const ownAvatarPerson=String(u.nickname||u.username||'');
    $('myAvatar').dataset.avatarPreview=ownAvatarUrl;
    $('myAvatar').dataset.avatarPerson=ownAvatarPerson;
    $('myAvatar').dataset.avatarName=UI.avatarViewerText(ownAvatarPerson,'title');
    $('myAvatar').dataset.avatarHint=UI.avatarViewerText(ownAvatarPerson,'hint');
    $('myAvatar').classList.toggle('is-viewable',Boolean(ownAvatarUrl));
    $('myAvatar').setAttribute('aria-label',ownAvatarUrl?UI.avatarViewerText(ownAvatarPerson,'view'):UI.avatarViewerText(ownAvatarPerson,'choose'));
    $('profileDisplayName').textContent=u.nickname;$('profileUsername').textContent=`@${u.username}`;$('profileNickname').value=u.nickname;
    const ownRank=$('ownRankPresentation');
    if(ownRank){ownRank.innerHTML=rankPresentation(u);ownRank.classList.toggle('hidden',profileRank(u)==='standard');}
    const ownPrivilege=$('ownPrivilegeStatus');if(ownPrivilege){ownPrivilege.innerHTML=privilegeStatusHTML(u);ownPrivilege.classList.toggle('hidden',profileRank(u)==='standard');refreshPrivilegeCountdowns(ownPrivilege);}
    const kicker=$('ownProfileKicker');if(kicker)kicker.textContent=profileRank(u)==='legend'?'HỒ SƠ HUYỀN THOẠI':profileRank(u)==='vip'?'HỒ SƠ ĐẶC QUYỀN':'Hồ sơ cá nhân';
    $('profileBio').value=p.bio||'';$('profileLocation').value=p.location||'';$('profileWork').value=p.work||'';$('profileSchool').value=p.school||'';$('profileBirthday').value=p.birthday||'';$('profileRelationship').value=p.relationship||'';
    $('profilePublic').checked=!!p.isPublic;$('suggestionPublic').checked=!!p.showInSuggestions;$('avatarWorld').checked=!!p.showAvatarInWorld;
    $('whoCanMessage').value=s.whoCanMessage||'friends';$('interfaceScale').value=INTERFACE_SCALES.includes(s.interfaceScale)?s.interfaceScale:selectedInterfaceScale();$('visualQuality').value=['auto','full','balanced','lite'].includes(s.visualQuality)?s.visualQuality:'auto';$('notifyRequests').checked=s.notifyRequests!==false;$('showTyping').checked=s.showTyping!==false;$('showReadReceipts').checked=s.showReadReceipts!==false;$('showMessageTime').checked=s.showMessageTime!==false;$('showMessageDate').checked=s.showMessageDate!==false;$('showDeliveryStatus').checked=s.showDeliveryStatus!==false;$('compactMessageMotion').checked=s.compactMessageMotion!==false;
    const completionFields=[u.nickname,p.bio,p.location,p.work,p.school,p.birthday,p.relationship,p.avatarUrl,p.coverUrl];const completion=Math.round(completionFields.filter(Boolean).length/completionFields.length*100);if($('profileCompletionText'))$('profileCompletionText').textContent=`${completion}%`;if($('profileCompletionBar'))$('profileCompletionBar').style.width=`${completion}%`;
  }
  $('profileForm').addEventListener('submit',async(e)=>{e.preventDefault();if(state.profileMediaUploads>0)return UI.toast('Ảnh hồ sơ đang được xử lý. Vui lòng chờ trong giây lát.','info');try{const data=await UI.fetchJSON('/api/profile/me',{method:'PUT',body:{nickname:$('profileNickname').value,profile:{bio:$('profileBio').value,location:$('profileLocation').value,work:$('profileWork').value,school:$('profileSchool').value,birthday:$('profileBirthday').value,relationship:$('profileRelationship').value,isPublic:$('profilePublic').checked,showInSuggestions:$('suggestionPublic').checked,showAvatarInWorld:$('avatarWorld').checked,avatarUrl:state.me.profile.avatarUrl,coverUrl:state.me.profile.coverUrl},settings:{whoCanMessage:$('whoCanMessage').value,notifyRequests:$('notifyRequests').checked,showTyping:$('showTyping').checked,showReadReceipts:$('showReadReceipts').checked,showMessageTime:$('showMessageTime').checked,showMessageDate:$('showMessageDate').checked,showDeliveryStatus:$('showDeliveryStatus').checked,compactMessageMotion:$('compactMessageMotion').checked,visualQuality:$('visualQuality').value,interfaceScale:$('interfaceScale').value}}});state.me=data.user;applyUserPerformancePreferences();renderMe();queueMessageRender();UI.toast(data.message,'success');UI.closeModal('profileModal');await loadBootstrap();}catch(error){UI.toast(error.message,'error');}});
  function openProfileMediaPicker(kind){
    const input=$(kind==='avatarUrl'?'avatarFileInput':'coverFileInput');
    if(!input||state.profileMediaUploads>0)return;
    input.value='';
    input.click();
  }
  async function uploadProfileImage(file,kind){
    if(!file||!state.me)return;
    const input=$(kind==='avatarUrl'?'avatarFileInput':'coverFileInput');
    if(!String(file.type||'').startsWith('image/')){if(input)input.value='';return UI.toast('Vui lòng chọn đúng tệp ảnh.','error');}
    if(file.size>30*1024*1024){if(input)input.value='';return UI.toast('Ảnh vượt quá giới hạn 30 MB.','error');}
    state.me.profile=state.me.profile||{};
    const previous=state.me.profile[kind]||'';
    const previewUrl=URL.createObjectURL(file);
    const formData=new FormData();
    formData.append('kind',kind==='avatarUrl'?'avatar':'cover');
    formData.append('file',file,file.name||`profile-${Date.now()}.jpg`);
    state.profileMediaUploads+=1;
    state.me.profile[kind]=previewUrl;
    setProfileMediaBusy(kind,true);
    fillOwnProfile();
    try{
      const data=await UI.fetchJSON('/api/profile/me/media-upload',{method:'POST',body:formData,timeoutMs:120000});
      if(!data?.user?.profile)throw new Error('Máy chủ chưa trả lại dữ liệu ảnh hồ sơ hợp lệ.');
      state.me=data.user;
      renderMe();
      fillOwnProfile();
      queueMessageRender();
      UI.toast(data.message||'Đã cập nhật ảnh hồ sơ.','success');
    }catch(error){
      state.me.profile[kind]=previous;
      fillOwnProfile();
      UI.toast(error.message||'Không thể cập nhật ảnh hồ sơ.','error');
    }finally{
      state.profileMediaUploads=Math.max(0,state.profileMediaUploads-1);
      setProfileMediaBusy(kind,false);
      if(input)input.value='';
      URL.revokeObjectURL(previewUrl);
    }
  }
  $('editAvatarButton')?.addEventListener('click',(event)=>{event.preventDefault();openProfileMediaPicker('avatarUrl');});
  $('myAvatar')?.addEventListener('click',(event)=>{if(state.profileMediaUploads>0)return;const src=String(state.me?.profile?.avatarUrl||'');if(src){event.preventDefault();event.stopPropagation();UI.openMediaViewer({src,name:UI.avatarViewerText(state.me.nickname||state.me.username,'title'),kind:'avatar',trigger:event.currentTarget});}else{event.preventDefault();openProfileMediaPicker('avatarUrl');}});
  $('editCoverButton')?.addEventListener('click',(event)=>{event.preventDefault();openProfileMediaPicker('coverUrl');});
  $('avatarFileInput')?.addEventListener('change',(event)=>uploadProfileImage(event.currentTarget.files?.[0],'avatarUrl'));
  $('coverFileInput')?.addEventListener('change',(event)=>uploadProfileImage(event.currentTarget.files?.[0],'coverUrl'));
  $('manageSessionsButton').addEventListener('click',async()=>{try{const data=await UI.fetchJSON('/api/sessions');$('sessionList').innerHTML=data.sessions.map((s)=>`<article><span class="session-device-icon">${icon('monitor')}</span><div><strong>${s.current?'Thiết bị hiện tại':'Thiết bị đã đăng nhập'}</strong><small>${escape(s.device)}<br>${UI.formatDate(s.lastSeenAt)}</small></div>${s.current?'<b>Hiện tại</b>':`<button class="danger-button" data-session-remove="${escape(s.id)}">Đăng xuất</button>`}</article>`).join('');UI.openModal('sessionModal');}catch(e){UI.toast(e.message,'error');}});

  function setAccountSettingsMessage(id,text='',success=false){const node=$(id);if(!node)return;node.textContent=text;node.className=`form-message${text?(success?' success':' error'):''}`;}
  function digitsOnly(input){if(!input)return;input.value=input.value.replace(/\D/g,'').slice(0,6);}
  function refreshSecurityForms({syncToggles=true}={}){
    const security=state.me?.security||{};
    const l2Enabled=Boolean(security.level2Enabled),l3Enabled=Boolean(security.level3Enabled);
    if(syncToggles&&$('level2Enabled'))$('level2Enabled').checked=l2Enabled;
    if(syncToggles&&$('level3Enabled'))$('level3Enabled').checked=l3Enabled;
    $('settingsLevel2State').textContent=l2Enabled?'Đang bật':'Chưa bật';
    $('settingsLevel3State').textContent=l3Enabled?'Đang bật':'Chưa bật';
    $('settingsLevel2State').classList.toggle('is-enabled',l2Enabled);
    $('settingsLevel3State').classList.toggle('is-enabled',l3Enabled);
    ['contactLevel3Field','passwordLevel3Field','level2Level3Field'].forEach((id)=>$(id)?.classList.toggle('hidden',!l3Enabled));
    const level2WantsEnabled=Boolean($('level2Enabled')?.checked);
    $('level2NewSecretField')?.classList.toggle('hidden',!level2WantsEnabled);
    $('level2CurrentSecretField')?.classList.toggle('hidden',!l2Enabled||level2WantsEnabled);
    const level3WantsEnabled=Boolean($('level3Enabled')?.checked);
    $('level3NewPinField')?.classList.toggle('hidden',!level3WantsEnabled);
    $('level3CurrentPinField')?.classList.toggle('hidden',!l3Enabled);
  }
  function refreshAccountSettingsUI(){
    if(!state.me)return;
    $('settingsUsername').textContent=`@${state.me.username||''}`;
    $('accountPhone').value=state.me.phone||'';
    $('accountEmail').value=state.me.email||'';
    refreshSecurityForms();
    ['accountContactMessage','accountPasswordMessage','level2SecurityMessage','level3SecurityMessage','notificationSettingsMessage'].forEach((id)=>setAccountSettingsMessage(id));
  }
  function setAccountSettingsTab(tab='contact'){
    const selected=['contact','password','security','notifications','smart'].includes(tab)?tab:'contact';
    document.querySelectorAll('[data-account-settings-tab]').forEach((button)=>button.classList.toggle('active',button.dataset.accountSettingsTab===selected));
    document.querySelectorAll('[data-account-settings-panel]').forEach((panel)=>panel.classList.toggle('active',panel.dataset.accountSettingsPanel===selected));
  }
  function openAccountSettings(){refreshAccountSettingsUI();setAccountSettingsTab('contact');UI.openModal('accountSettingsModal');}
  $('accountSettingsButton')?.addEventListener('click',openAccountSettings);
  document.querySelectorAll('[data-account-settings-tab]').forEach((button)=>button.addEventListener('click',()=>setAccountSettingsTab(button.dataset.accountSettingsTab)));
  $('settingsSessionsButton')?.addEventListener('click',()=>{UI.closeModal('accountSettingsModal');setTimeout(()=>$('manageSessionsButton')?.click(),120);});
  $('level2Enabled')?.addEventListener('change',()=>refreshSecurityForms({syncToggles:false}));
  $('level3Enabled')?.addEventListener('change',()=>refreshSecurityForms({syncToggles:false}));
  ['contactLevel3Pin','passwordLevel3Pin','level2Level3Pin','level3CurrentPin','level3NewPin'].forEach((id)=>$(id)?.addEventListener('input',(event)=>digitsOnly(event.currentTarget)));

  $('accountContactForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');setAccountSettingsMessage('accountContactMessage');UI.setLoading(button,true);
    try{
      const data=await UI.fetchJSON('/api/account/contact',{method:'PUT',body:{phone:$('accountPhone').value,email:$('accountEmail').value,currentPassword:$('contactCurrentPassword').value,level3Pin:$('contactLevel3Pin').value}});
      state.me={...state.me,...data.user};$('contactCurrentPassword').value='';$('contactLevel3Pin').value='';refreshAccountSettingsUI();renderMe();setAccountSettingsMessage('accountContactMessage',data.message,true);UI.toast(data.message,'success');
    }catch(error){setAccountSettingsMessage('accountContactMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });
  $('accountPasswordForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');setAccountSettingsMessage('accountPasswordMessage');UI.setLoading(button,true);
    try{
      const data=await UI.fetchJSON('/api/account/password',{method:'POST',body:{currentPassword:$('passwordCurrentPassword').value,level3Pin:$('passwordLevel3Pin').value,newPassword:$('passwordNewPassword').value,confirmPassword:$('passwordConfirmPassword').value}});
      form.reset();refreshSecurityForms();setAccountSettingsMessage('accountPasswordMessage',data.message,true);UI.toast(data.message,'success');
    }catch(error){setAccountSettingsMessage('accountPasswordMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });
  $('level2SecurityForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),enabled=$('level2Enabled').checked;setAccountSettingsMessage('level2SecurityMessage');UI.setLoading(button,true);
    try{
      const data=await UI.fetchJSON('/api/account/security/level2',{method:'POST',body:{enabled,currentPassword:$('level2CurrentPassword').value,level3Pin:$('level2Level3Pin').value,currentLevel2Password:$('level2CurrentSecret').value,newLevel2Password:$('level2NewSecret').value}});
      state.me.security=data.security||state.me.security;form.reset();refreshSecurityForms();setAccountSettingsMessage('level2SecurityMessage',data.message,true);UI.toast(data.message,'success');
    }catch(error){setAccountSettingsMessage('level2SecurityMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });
  $('level3SecurityForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),enabled=$('level3Enabled').checked;setAccountSettingsMessage('level3SecurityMessage');UI.setLoading(button,true);
    try{
      const data=await UI.fetchJSON('/api/account/security/level3',{method:'POST',body:{enabled,currentPassword:$('level3CurrentPassword').value,currentPin:$('level3CurrentPin').value,newPin:$('level3NewPin').value}});
      state.me.security=data.security||state.me.security;form.reset();refreshSecurityForms();setAccountSettingsMessage('level3SecurityMessage',data.message,true);UI.toast(data.message,'success');
    }catch(error){setAccountSettingsMessage('level3SecurityMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });


  function conversationThemeKey(){
    const scope=state.active.scope||'world';
    const target=state.active.targetId||scope;
    return `nexchat-theme-${scope}-${target}`;
  }
  function getTheme(){
    const current=storage.get(conversationThemeKey(),'');
    if(current)return current;
    if(state.active.scope==='private'&&state.active.targetId){
      const legacy=storage.get(`nexchat-theme-${state.active.targetId}`,'');
      if(legacy){storage.set(conversationThemeKey(),legacy);return legacy;}
    }
    return 'aurora';
  }
  function themeTranslationKey(theme,suffix=''){const name=theme[0].toUpperCase()+theme.slice(1);return `theme${name}${suffix}`;}
  function syncThemeGridSelection(selectedTheme=getTheme()){
    $('themeGrid')?.querySelectorAll('[data-theme]').forEach((button)=>{
      const active=button.dataset.theme===selectedTheme;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
      button.setAttribute('aria-pressed',String(active));
      const stateLabel=button.querySelector('.theme-card-state');
      if(stateLabel){stateLabel.textContent=active?t('themeSelected'):'';stateLabel.hidden=!active;}
    });
  }
  async function renderThemeGrid(){
    const grid=$('themeGrid');if(!grid)return;const selectedTheme=getTheme();
    grid.innerHTML=THEMES.map((theme)=>{
      const label=t(themeTranslationKey(theme));
      const description=t(themeTranslationKey(theme,'Desc'));
      const active=selectedTheme===theme;
      return `<button class="theme-card ${active?'active':''}" type="button" role="option" data-theme="${theme}" aria-label="${label}. ${description}" aria-selected="${active}" aria-pressed="${active}"><span class="theme-card-preview theme-preview-${theme}" aria-hidden="true"><img src="/chat-bg-${theme}.svg?v=1.0.0" alt="" width="360" height="220" decoding="async"><span class="theme-card-glow"></span></span><span class="theme-card-copy"><strong>${label}</strong><small>${description}</small></span><span class="theme-card-state" ${active?'':'hidden'}>${active?t('themeSelected'):''}</span><span class="theme-card-check" aria-hidden="true"><span class="classic-icon-host" data-classic-icon="check"></span></span></button>`;
    }).join('');
    window.ClassicIcons?.hydrate?.(grid);
  }
  function applyTheme(){
    const messages=$('messages');if(!messages)return;
    messages.classList.remove('private-theme',...THEMES.map((x)=>`theme-${x}`));
    if(['private','request'].includes(state.active.scope))messages.classList.add('private-theme',`theme-${getTheme()}`);
  }
  $('themeButton').addEventListener('click',()=>{if(!['private','request'].includes(state.active.scope))return;renderThemeGrid();UI.openModal('themeModal');});
  $('themeGrid').addEventListener('click',(e)=>{const b=e.target.closest('[data-theme]');if(!b)return;storage.set(conversationThemeKey(),b.dataset.theme);applyTheme();syncThemeGridSelection(b.dataset.theme);});
  window.addEventListener('languagechange',()=>{if(!$('themeModal')?.classList.contains('hidden'))renderThemeGrid();});
  function updateEffectButton(){
    const allowed=Boolean(state.me?.effectAccess);
    const selected=allowed?(state.me.selectedEffect||'none'):'none';
    $('effectButton').classList.toggle('hidden',!allowed);
    $('effectButton').classList.toggle('effect-access-active',allowed);
    $('effectButton').setAttribute('aria-hidden',String(!allowed));
    $('effectButton').dataset.effect=selected;
    const selectedEffectLabel=selected==='none'?'':effectLabel(selected);
    $('effectButton').dataset.effectLabel=selectedEffectLabel;
    $('effectActivationDock')?.classList.toggle('hidden',!allowed);
    $('effectActivationButton')?.classList.toggle('is-active',allowed&&selected!=='none');
    if($('effectActivationState')){
      const label=selectedEffectLabel;
      $('effectActivationState').dataset.runtimeText=label?'1':'';
      $('effectActivationState').textContent=label?`${effectCopy().using}: ${label}`:effectCopy().choose;
      document.dispatchEvent(new CustomEvent('nexchat:effect-selected',{detail:{effect:selected,label}}));
    }
  }
  function syncEffectStudioPreview(effect=state.me?.selectedEffect||'none'){
    const copy=effectCopy();
    const selected=EFFECTS.includes(effect)?effect:'none';
    const rank=profileRank(state.me);
    const mark=rank==='legend'?'<i class="message-rank-mark mark-legend">L</i>':rank==='vip'?'<i class="message-rank-mark mark-vip">V</i>':'';
    const bubble=$('effectLiveBubble');
    const label=$('effectLiveLabel');
    if(label)label.textContent=`${copy.using}: ${effectLabel(selected)}`;
    if(bubble){
      if(bubble.dataset.effect===selected&&bubble.dataset.rank===rank)return;
      bubble.dataset.effect=selected;
      bubble.dataset.rank=rank;
      bubble.className=`message-bubble effect-${selected} bubble-rank-${rank} effect-live-bubble`;
      bubble.innerHTML=`${legendBubbleDecor(rank)}${mark}<em>${escape(effectPreviewMeta(selected).sample)}</em>`;
    }
  }
  function updateEffectModalCopy(){
    const copy=effectCopy();
    if($('effectModalTitle'))$('effectModalTitle').textContent=copy.title;
    if($('effectModalDescription'))$('effectModalDescription').textContent=copy.description;
    if($('effectModalNotice'))$('effectModalNotice').textContent=copy.notice;
    if($('effectModalClose'))$('effectModalClose').textContent=copy.close;
    syncEffectStudioPreview();
  }
  function renderEffectGrid(){
    const copy=effectCopy();const rank=profileRank(state.me);const mark=rank==='legend'?'<i class="message-rank-mark mark-legend">L</i>':rank==='vip'?'<i class="message-rank-mark mark-vip">V</i>':'';const decor=legendBubbleDecor(rank);
    updateEffectModalCopy();
    $('effectGrid').innerHTML=EFFECTS.map((effect)=>{const active=state.me.selectedEffect===effect;const meta=effectPreviewMeta(effect);return `<button class="effect-choice ${active?'active':''}" data-effect="${effect}" type="button" role="option" aria-selected="${active}" aria-pressed="${active}"><span class="message-bubble effect-${effect} bubble-rank-${rank} effect-preview-bubble">${decor}${mark}<em>${escape(meta.sample)}</em></span><span><strong>${escape(effectLabel(effect))}</strong><small>${escape(meta.detail)}</small></span>${active?`<i class="effect-selected-icon">${icon('check')}</i>`:''}</button>`;}).join('');
    syncEffectStudioPreview();
  }
  const openEffectSelector=()=>{if(!state.me?.effectAccess)return;renderEffectGrid();UI.openModal('effectModal');};
  $('effectButton').addEventListener('click',openEffectSelector);
  $('effectActivationButton')?.addEventListener('click',openEffectSelector);
  $('effectGrid').addEventListener('pointerover',(event)=>{const button=event.target.closest('[data-effect]');if(button)syncEffectStudioPreview(button.dataset.effect);});
  $('effectGrid').addEventListener('focusin',(event)=>{const button=event.target.closest('[data-effect]');if(button)syncEffectStudioPreview(button.dataset.effect);});
  $('effectGrid').addEventListener('pointerleave',()=>syncEffectStudioPreview());
  $('effectGrid').addEventListener('click',async(event)=>{
    const button=event.target.closest('[data-effect]');if(!button||button.disabled||effectSelectionPending)return;
    effectSelectionPending=true;
    const nextEffect=button.dataset.effect;
    const previousEffect=state.me.selectedEffect||'none';
    $('effectGrid').querySelectorAll('[data-effect]').forEach((item)=>{item.disabled=true;item.classList.toggle('is-applying',item===button);});
    state.me.selectedEffect=nextEffect;
    renderEffectGrid();updateEffectButton();syncEffectStudioPreview(nextEffect);
    try{
      const data=await UI.fetchJSON('/api/effects/select',{method:'POST',body:{effect:nextEffect}});
      state.me.selectedEffect=data.effect;
      state.me.effectAccessSource=data.source||state.me.effectAccessSource;
      state.me.effectAccessExpiresAt=data.expiresAt??state.me.effectAccessExpiresAt;
      renderEffectGrid();updateEffectButton();syncEffectStudioPreview(data.effect);
      UI.toast(effectCopy().selected,'success');
      setTimeout(()=>UI.closeModal('effectModal'),260);
    }catch(error){
      state.me.selectedEffect=previousEffect;
      renderEffectGrid();updateEffectButton();syncEffectStudioPreview(previousEffect);
      UI.toast(error.message,'error');
    }finally{
      effectSelectionPending=false;
    }
  });

  function renderPendingDelete(){clearInterval(state.deleteTimer);const d=state.pendingDeletes.find((x)=>x.scope===(state.active.scope==='group'?'group':'private')&&x.targetId===state.active.targetId);$('pendingDeleteBar').classList.toggle('hidden',!d);$('messageForm').classList.toggle('composer-disabled',!!d);if(!d)return;const update=()=>{const left=Math.max(0,d.deleteAfter-Date.now());$('deleteCountdown').textContent=`${Math.floor(left/60000).toString().padStart(2,'0')}:${Math.floor((left%60000)/1000).toString().padStart(2,'0')}`;if(!left){clearInterval(state.deleteTimer);loadBootstrap();openConversation('world');}};update();state.deleteTimer=setInterval(update,1000);}
  $('undoDeleteButton').addEventListener('click',async()=>{try{await UI.fetchJSON('/api/conversations/delete/undo',{method:'POST',body:{scope:state.active.scope==='group'?'group':'private',targetId:state.active.targetId}});state.pendingDeletes=state.pendingDeletes.filter((d)=>d.targetId!==state.active.targetId);renderPendingDelete();UI.toast('Đã khôi phục đoạn chat.','success');}catch(e){UI.toast(e.message,'error');}});
  $('deleteNowButton').addEventListener('click',async()=>{const ok=await confirmAction('Xóa vĩnh viễn','Tin nhắn ở phía bạn sẽ bị xóa ngay và không thể khôi phục.');if(!ok)return;await deleteConversation(true);});
  async function deleteConversation(immediate=false){try{const data=await UI.fetchJSON('/api/conversations/delete',{method:'POST',body:{scope:state.active.scope==='group'?'group':'private',targetId:state.active.targetId,immediate}});if(data.pending)state.pendingDeletes.push(data.pending);if(data.permanent)state.pendingDeletes=state.pendingDeletes.filter((d)=>d.targetId!==state.active.targetId);UI.toast(data.message,'success');renderPendingDelete();if(data.permanent)openConversation('world');}catch(e){UI.toast(e.message,'error');}}


  function showGroupInfo(){
    const g=groupById(state.active.targetId);if(!g)return;
    const isAdmin=g.adminIds.includes(state.me.id),isCreator=g.creatorId===state.me.id;
    $('groupInfoName').value=g.name;$('groupInfoName').disabled=!isAdmin;
    $('groupInfoMembers').innerHTML=(g.members||[]).map((u)=>`<article>${avatarHTML(u,'avatar')}<div><strong>${escape(u.nickname)}</strong><small>@${escape(u.username)} ${g.creatorId===u.id?'· Người tạo':g.adminIds.includes(u.id)?'· Quản trị viên':''}</small></div>${isCreator&&u.id!==g.creatorId?`<button type="button" data-group-promote="${u.id}" data-promote="${g.adminIds.includes(u.id)?'0':'1'}">${g.adminIds.includes(u.id)?'Gỡ QTV':'Bổ nhiệm QTV'}</button>`:''}${isAdmin&&u.id!==g.creatorId&&u.id!==state.me.id?`<button class="danger-action" type="button" data-group-remove="${u.id}">Xóa</button>`:''}</article>`).join('');
    const candidates=state.friends.filter((f)=>f.friend&&!f.blocked&&!g.memberIds.includes(f.id));$('groupAddMember').innerHTML=candidates.map((f)=>`<option value="${f.id}">${escape(displayName(f))}</option>`).join('');$('groupAddArea').classList.toggle('hidden',!isAdmin||!candidates.length);$('leaveGroupButton').classList.toggle('hidden',isCreator);UI.openModal('groupInfoModal');
  }
  $('groupInfoForm').addEventListener('submit',async(e)=>{e.preventDefault();const g=groupById(state.active.targetId);if(!g)return;try{await UI.fetchJSON(`/api/groups/${g.id}`,{method:'PATCH',body:{name:$('groupInfoName').value}});UI.toast('Đã cập nhật nhóm.','success');UI.closeModal('groupInfoModal');await loadBootstrap();updateHeader();}catch(err){UI.toast(err.message,'error');}});
  $('groupAddButton').addEventListener('click',async()=>{const g=groupById(state.active.targetId),uid=$('groupAddMember').value;if(!g||!uid)return;try{await UI.fetchJSON(`/api/groups/${g.id}/members`,{method:'POST',body:{userId:uid}});await loadBootstrap();showGroupInfo();}catch(err){UI.toast(err.message,'error');}});
  $('leaveGroupButton').addEventListener('click',async()=>{const g=groupById(state.active.targetId);if(!g)return;const ok=await confirmAction('Rời nhóm',`Bạn có chắc muốn rời nhóm ${g.name}?`);if(!ok)return;try{await UI.fetchJSON(`/api/groups/${g.id}/members/${state.me.id}`,{method:'DELETE'});UI.closeModal('groupInfoModal');await loadBootstrap();openConversation('world');}catch(err){UI.toast(err.message,'error');}});
  $('groupInfoMembers').addEventListener('click',async(e)=>{const g=groupById(state.active.targetId);if(!g)return;const promote=e.target.closest('[data-group-promote]'),remove=e.target.closest('[data-group-remove]');try{if(promote)await UI.fetchJSON(`/api/groups/${g.id}/admins`,{method:'POST',body:{userId:promote.dataset.groupPromote,promote:promote.dataset.promote==='1'}});if(remove){const ok=await confirmAction('Xóa thành viên','Xóa người này khỏi nhóm?');if(!ok)return;await UI.fetchJSON(`/api/groups/${g.id}/members/${remove.dataset.groupRemove}`,{method:'DELETE'});}await loadBootstrap();showGroupInfo();}catch(err){UI.toast(err.message,'error');}});

  async function openConversationMenu(){if(!['private','group'].includes(state.active.scope))return;const reportButton=$('reportUserAction');if(reportButton)reportButton.classList.toggle('hidden',state.active.scope!=='private');UI.openModal('conversationMenu');const key=conversationKey(state.active.scope,state.active.targetId);$('pinConversationAction').querySelector('strong').textContent=state.me.pinnedConversations?.includes(key)?'Bỏ ghim đoạn chat':'Ghim đoạn chat';}
  $('conversationMenuButton').addEventListener('click',openConversationMenu);
  $('quickMoreAction').addEventListener('click',openConversationMenu);
  $('quickProfileAction').addEventListener('click',()=>{if(state.active.scope==='private')showProfile(state.active.targetId);else if(state.active.scope==='group')showGroupInfo();});
  $('quickAliasAction').addEventListener('click',()=>$('aliasAction').click());
  $('quickPinAction').addEventListener('click',()=>$('pinConversationAction').click());
  $('quickMuteAction').addEventListener('click',()=>$('muteAction').click());
  $('viewProfileAction').addEventListener('click',()=>{UI.closeModal('conversationMenu');if(state.active.scope==='private')showProfile(state.active.targetId);else if(state.active.scope==='group')showGroupInfo();});
  $('aliasAction').addEventListener('click',async()=>{if(state.active.scope!=='private')return;UI.closeModal('conversationMenu');const alias=await promptValue('Đặt biệt danh riêng',state.me.aliases?.[state.active.targetId]||'');try{await UI.fetchJSON('/api/conversations/alias',{method:'POST',body:{userId:state.active.targetId,alias}});state.me.aliases[state.active.targetId]=alias;await loadBootstrap();updateHeader();}catch(e){UI.toast(e.message,'error');}});
  $('pinConversationAction').addEventListener('click',async()=>{UI.closeModal('conversationMenu');const key=conversationKey(state.active.scope,state.active.targetId),pin=!state.me.pinnedConversations?.includes(key);try{await UI.fetchJSON('/api/conversations/pin',{method:'POST',body:{key,pin}});if(pin)state.me.pinnedConversations.push(key);else state.me.pinnedConversations=state.me.pinnedConversations.filter((x)=>x!==key);await loadBootstrap();}catch(e){UI.toast(e.message,'error');}});
  $('muteAction').addEventListener('click',()=>{UI.closeModal('conversationMenu');UI.openModal('muteModal');});
  $('archiveAction').addEventListener('click',async()=>{if(state.active.scope!=='private')return;UI.closeModal('conversationMenu');const f=friendById(state.active.targetId);try{await UI.fetchJSON('/api/friends/archive',{method:'POST',body:{userId:f.id,archive:!f.archived}});await loadBootstrap();openConversation('world');}catch(e){UI.toast(e.message,'error');}});
  $('markUnreadAction').addEventListener('click',async()=>{UI.closeModal('conversationMenu');try{await UI.fetchJSON('/api/conversations/mark-unread',{method:'POST',body:{scope:state.active.scope,targetId:state.active.targetId}});UI.toast('Đã đánh dấu chưa đọc.','success');await loadBootstrap();}catch(e){UI.toast(e.message,'error');}});
  $('deleteConversationAction').addEventListener('click',async()=>{UI.closeModal('conversationMenu');const ok=await confirmAction('Xóa đoạn chat','Đoạn chat sẽ chuyển sang trạng thái chờ xóa 15 phút. Bạn có thể khôi phục trong thời gian này.');if(ok)deleteConversation(false);});
  async function toggleActiveBlock(){if(state.active.scope!=='private')return;const unblocking=Boolean(state.activeAccess.blockedByMe);UI.closeModal('conversationMenu');const ok=await confirmAction(unblocking?'Bỏ chặn người dùng':'Chặn người dùng',unblocking?'Bạn có muốn cho phép liên lạc lại với người này?':'Sau khi chặn, hai bên vẫn xem được lịch sử nhưng không thể gửi tin nhắn.');if(!ok)return;try{const data=await UI.fetchJSON(unblocking?'/api/friends/unblock':'/api/friends/block',{method:'POST',body:{userId:state.active.targetId}});state.activeAccess={...state.activeAccess,...(data.conversationState||{}),canSend:data.conversationState?.canSend!==false&&!data.conversationState?.blocked};updateContactState(state.active.targetId,state.activeAccess);applyConversationAccess();await loadBootstrap();UI.toast(data.message,'success');}catch(e){UI.toast(e.message,'error');}}
  $('blockAction').addEventListener('click',toggleActiveBlock);
  $('reportUserAction')?.addEventListener('click',()=>{if(state.active.scope!=='private'||!state.active.targetId)return;UI.closeModal('conversationMenu');openReportModal({user:friendById(state.active.targetId)||{id:state.active.targetId,nickname:'Người dùng'}});});
  $('unblockContactButton').addEventListener('click',toggleActiveBlock);
  $('muteModal').addEventListener('click',async(e)=>{const b=e.target.closest('[data-mute-minutes]');if(!b)return;const raw=b.dataset.muteMinutes,key=state.active.scope==='group'?`group:${state.active.targetId}`:state.active.targetId;try{await UI.fetchJSON('/api/conversations/mute',{method:'POST',body:{key,unmute:raw==='unmute',minutes:raw==='permanent'?null:Number(raw)}});UI.closeModal('muteModal');UI.toast(raw==='unmute'?'Đã bật lại thông báo.':'Đã tắt thông báo.','success');await loadBootstrap();}catch(err){UI.toast(err.message,'error');}});

  function openMessageMenu(messageId){
    state.selectedMessage=state.messages.find((m)=>m.id===messageId);
    if(!state.selectedMessage)return;
    const mine=state.selectedMessage.fromId===state.me.id;
    const canReport=state.selectedMessage.scope==='world'&&!mine&&state.selectedMessage.fromId&&state.selectedMessage.fromId!=='admin';
    const pinned=state.selectedMessage.pinnedBy?.includes(state.me.id);
    const saved=state.me.savedMessageIds?.includes(state.selectedMessage.id);
    const action=(name,iconName,title,description,extra='')=>`<button type="button" ${extra} data-msg-action="${name}">${icon(iconName)}<span class="message-action-copy"><strong>${title}</strong><small>${description}</small></span><span class="message-action-arrow" aria-hidden="true">›</span></button>`;
    $('messageMenuActions').innerHTML=[
      action('copy','copy','Sao chép','Chép nội dung tin nhắn vào bộ nhớ tạm'),
      action('pin','pin',pinned?'Bỏ ghim':'Ghim tin nhắn',pinned?'Gỡ khỏi khu vực tin nhắn đã ghim':'Giữ tin nhắn quan trọng ở đầu cuộc trò chuyện'),
      action('save','bookmark',saved?'Bỏ lưu':'Lưu tin nhắn',saved?'Gỡ khỏi danh sách đã lưu':'Lưu lại để xem nhanh vào lần sau'),
      ...(mine&&!state.selectedMessage.recalledAt?[action('edit','edit','Chỉnh sửa','Thay đổi nội dung tin nhắn đã gửi'),action('recall','undo','Thu hồi','Gỡ tin nhắn với mọi người trong cuộc trò chuyện')]:[]),
      ...(canReport?[action('report','shield-alert','Tố cáo tin nhắn','Gửi nội dung này tới quản trị viên','class="report-action"')]:[]),
      action('delete','trash','Xóa ở phía tôi','Chỉ xóa tin nhắn khỏi tài khoản của bạn','class="danger-action"')
    ].join('');
    UI.openModal('messageMenuModal');
  }

  const mobileViewportQuery=window.matchMedia('(max-width: 980px)');
  function isMobileChat(){return mobileViewportQuery.matches;}
  function mobileActionLabel(target,fallback){
    const node=$(target);return node?.querySelector?.('b,strong,[data-i18n]')?.textContent?.trim()||node?.getAttribute?.('title')||fallback;
  }
  function openMobileHeaderActions(){
    const conversational=['private','group','request'].includes(state.active.scope);
    const privateChat=['private','request'].includes(state.active.scope);
    const installAvailable=Boolean($('smartInstallButton')&&!$('smartInstallButton').disabled&&$('smartInstallState')?.dataset.smartKey!=='unavailable');
    const actions=[
      {target:'notificationCenterButton',icon:'bell',title:t('notification'),detail:t('mobileOptionsDesc'),always:true},
      {target:'searchToggleButton',icon:'search',title:t('mobileSearch'),detail:t('mobileSearchDesc'),always:true},
      {target:'mediaVaultButton',icon:'folder',title:t('mobileMedia'),detail:t('mobileMediaDesc'),always:true},
      {target:'themeButton',icon:'palette',title:t('mobileBackground'),detail:t('mobileBackgroundDesc')},
      {target:'effectActivationButton',icon:'sparkles',title:t('mobileEffects'),detail:t('mobileEffectsDesc')},
      {target:'motionModeButton',icon:'activity',title:window.NexV10?.text?.('motion')||'Chuyển động',detail:window.NexV10?.text?.('autoDesc')||'Tự cân bằng theo thiết bị và môi trường.',always:true},
      {target:'interfaceScaleButton',icon:'monitor',title:t('mobileScale'),detail:t('mobileScaleDesc'),always:true},
      {special:'global-theme',icon:'sun',title:t('mobileTheme'),detail:t('mobileThemeDesc'),always:true},
      ...(conversational?[
        {target:'quickProfileAction',icon:'user',title:mobileActionLabel('quickProfileAction','Hồ sơ'),detail:t('mobileOptionsDesc'),always:true},
        ...(privateChat?[{target:'quickAliasAction',icon:'edit',title:mobileActionLabel('quickAliasAction','Biệt danh'),detail:t('mobileOptionsDesc'),always:true}]:[]),
        {target:'quickPinAction',icon:'pin',title:mobileActionLabel('quickPinAction','Ghim'),detail:t('mobileOptionsDesc'),always:true},
        {target:'quickMuteAction',icon:'bell-off',title:mobileActionLabel('quickMuteAction','Thông báo'),detail:t('mobileOptionsDesc'),always:true},
        {target:'conversationNoteAction',icon:'edit',title:mobileActionLabel('conversationNoteAction','Ghi chú cuộc trò chuyện'),detail:'Lưu riêng trên thiết bị này',always:true},
        {target:'conversationMenuButton',icon:'more',title:t('mobileOptions'),detail:t('mobileOptionsDesc'),always:true}
      ]:[]),
      {target:'addFriendButton',icon:'user-plus',title:t('addFriend'),detail:'Gửi lời mời bằng tên đăng nhập',always:true},
      {target:'createGroupButton',icon:'users',title:'Tạo nhóm',detail:'Tạo cuộc trò chuyện nhóm mới',always:true},
      {target:'smartOpenPaletteButton',icon:'sparkles',title:'Thao tác nhanh',detail:'Mở bảng lệnh và tiện ích thông minh',always:true},
      ...(installAvailable?[{target:'smartInstallButton',icon:'download',title:'Cài NexChat',detail:'Cài ứng dụng lên màn hình chính',always:true}]:[]),
      {target:'accountSettingsButton',icon:'shield',title:t('settings'),detail:t('mobileOptionsDesc'),always:true}
    ].filter((item)=>{
      if(item.special)return true;
      const el=$(item.target);
      if(!el||el.disabled)return false;
      return item.always||!el.classList.contains('hidden');
    });
    $('mobileHeaderActionsList').innerHTML=actions.map((item)=>`<button type="button" ${item.special?`data-mobile-header-special="${item.special}"`:`data-mobile-header-target="${item.target}"`}>${icon(item.icon)}<span><strong>${escape(item.title)}</strong><small>${escape(item.detail)}</small></span>${icon('chevron-right')}</button>`).join('')||`<p class="empty-compact">${escape(t('mobileNoActions'))}</p>`;
    UI.openModal('mobileHeaderActionsModal');
  }

  function openIntegratedMotionScaleHub(trigger){
    applyInterfaceScale(selectedInterfaceScale(),{persist:false});
    if(window.NexV10?.openMotionPanel){window.NexV10.openMotionPanel(trigger||$('motionModeButton')||$('interfaceScaleButton'));return;}
    UI.openModal('interfaceScaleModal');
  }
  $('interfaceScaleButton')?.addEventListener('click',(event)=>{event.preventDefault();openIntegratedMotionScaleHub(event.currentTarget);});
  $('profileMotionHubButton')?.addEventListener('click',(event)=>{event.preventDefault();openIntegratedMotionScaleHub(event.currentTarget);});
  $('interfaceScaleChoices')?.addEventListener('click',(event)=>{const button=event.target.closest('[data-interface-scale]');if(!button)return;event.preventDefault();saveInterfaceScale(button.dataset.interfaceScale);setTimeout(()=>UI.closeModal('interfaceScaleModal'),180);});
  $('interfaceScale')?.addEventListener('change',(event)=>saveInterfaceScale(event.target.value));
  $('composerClearButton')?.addEventListener('click',async()=>{const text=$('messageInput').value;const needsConfirm=Boolean(state.selectedFile)||text.length>120;if(needsConfirm&&!await confirmAction('Xóa nội dung đang soạn','Nội dung nháp và tệp đang chọn sẽ được xóa hoàn toàn.'))return;$('messageInput').value='';clearAttachment();clearTimeout(state.draftTimer);state.draftTimer=null;try{sessionStorage.removeItem(draftKey());}catch(_){}$('messageCounter').textContent='0/4000';resizeComposer();stopOwnTyping();syncComposerClearButton();syncSendButton();$('messageInput').focus();});

  $('mobileHeaderActionsButton')?.addEventListener('click',openMobileHeaderActions);
  function runAfterMobileSheetClosed(callback){
    const modal=$('mobileHeaderActionsModal');
    UI.closeModal('mobileHeaderActionsModal');
    const started=performance.now();
    const wait=()=>{
      if(!modal||modal.classList.contains('hidden')||performance.now()-started>520){requestAnimationFrame(callback);return;}
      requestAnimationFrame(wait);
    };
    wait();
  }
  $('mobileHeaderActionsList')?.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-mobile-header-target],[data-mobile-header-special]');if(!button)return;
    event.preventDefault();
    const special=button.dataset.mobileHeaderSpecial;
    const target=special==='global-theme'?document.querySelector('[data-global-theme-current]'):$(button.dataset.mobileHeaderTarget);
    runAfterMobileSheetClosed(()=>{
      if(special==='global-theme')target?.click();
      else if(button.dataset.mobileHeaderTarget==='motionModeButton'&&window.NexV10?.openMotionPanel)window.NexV10.openMotionPanel(target);
      else if(target instanceof HTMLElement){
        target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
      }else UI.toast(t('mobileNoActions'),'warning');
    });
  });

  function syncMobileViewport(){
    if(!isMobileChat()){
      document.documentElement.style.removeProperty('--mobile-app-height');
      document.body.classList.remove('mobile-keyboard-open','mobile-layer-open');
      closeSidebar();
      UI.closeModal?.('mobileHeaderActionsModal');
      setSidebarThemePanel(false);
      return;
    }
    const viewport=window.visualViewport;
    const height=Math.max(320,Math.round(viewport?.height||window.innerHeight));
    document.documentElement.style.setProperty('--mobile-app-height',`${height}px`);
    const keyboardOpen=Boolean(viewport&&window.innerHeight-viewport.height>140);
    document.body.classList.toggle('mobile-keyboard-open',keyboardOpen);
  }
  let viewportSyncFrame=0;
  function queueMobileViewportSync(){if(viewportSyncFrame)return;viewportSyncFrame=requestAnimationFrame(()=>{viewportSyncFrame=0;syncMobileViewport();applyInterfaceScale(selectedInterfaceScale(),{persist:false});});}
  syncMobileViewport();
  window.addEventListener('resize',queueMobileViewportSync,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncMobileViewport,120),{passive:true});
  window.visualViewport?.addEventListener('resize',queueMobileViewportSync,{passive:true});
  window.visualViewport?.addEventListener('scroll',queueMobileViewportSync,{passive:true});
  mobileViewportQuery.addEventListener?.('change',()=>{if(!isMobileChat()){closeSidebar();UI.closeModal?.('mobileHeaderActionsModal');setSidebarThemePanel(false);}syncMobileViewport();window.NexRuntime?.refresh?.();});

  function installMobileMessageLongPress(){
    const surface=$('messages');if(!surface)return;
    let timer=0,startX=0,startY=0,activeRow=null,suppressUntil=0;
    const cancel=()=>{if(timer){clearTimeout(timer);timer=0;}activeRow?.classList.remove('long-press-pending');activeRow=null;};
    surface.addEventListener('pointerdown',(event)=>{
      if(!isMobileChat()||event.pointerType==='mouse'||event.button!==0)return;
      if(event.target.closest('a,button,audio,video,input,textarea,select'))return;
      const bubble=event.target.closest('.message-bubble');const row=bubble?.closest('[data-message-id]');if(!row)return;
      cancel();startX=event.clientX;startY=event.clientY;activeRow=row;row.classList.add('long-press-pending');
      timer=setTimeout(()=>{
        timer=0;suppressUntil=Date.now()+850;row.classList.remove('long-press-pending');row.classList.add('long-press-confirmed');
        setTimeout(()=>row.classList.remove('long-press-confirmed'),240);
        navigator.vibrate?.(12);openMessageMenu(row.dataset.messageId);activeRow=null;
      },480);
    },{passive:true});
    surface.addEventListener('pointermove',(event)=>{if(!timer)return;if(Math.abs(event.clientX-startX)>10||Math.abs(event.clientY-startY)>10)cancel();},{passive:true});
    surface.addEventListener('pointerup',cancel,{passive:true});
    surface.addEventListener('pointercancel',cancel,{passive:true});
    surface.addEventListener('contextmenu',(event)=>{
      if(!isMobileChat())return;const bubble=event.target.closest('.message-bubble');const row=bubble?.closest('[data-message-id]');if(!row)return;
      event.preventDefault();cancel();suppressUntil=Date.now()+850;openMessageMenu(row.dataset.messageId);
    });
    document.addEventListener('click',(event)=>{if(Date.now()>suppressUntil)return;if(event.target.closest('.message-bubble')){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  }
  installMobileMessageLongPress();
  $('messageMenuActions').addEventListener('click',async(e)=>{const b=e.target.closest('[data-msg-action]');if(!b||!state.selectedMessage)return;const m=state.selectedMessage,action=b.dataset.msgAction;if(action==='report'){UI.closeModal('messageMenuModal');openReportModal({message:m});return;}try{if(action==='copy'){await navigator.clipboard.writeText(m.text||'');UI.toast('Đã sao chép.','success');}if(action==='pin'){await UI.fetchJSON(`/api/messages/${m.id}/pin`,{method:'POST',body:{pin:!m.pinnedBy?.includes(state.me.id)}});}if(action==='save'){await UI.fetchJSON(`/api/messages/${m.id}/save`,{method:'POST',body:{save:!state.me.savedMessageIds?.includes(m.id)}});if(state.me.savedMessageIds.includes(m.id))state.me.savedMessageIds=state.me.savedMessageIds.filter((id)=>id!==m.id);else state.me.savedMessageIds.push(m.id);}if(action==='edit'){const text=await promptValue('Chỉnh sửa tin nhắn',m.text);if(text)await UI.fetchJSON(`/api/messages/${m.id}`,{method:'PATCH',body:{text}});}if(action==='recall'){const ok=await confirmAction('Thu hồi tin nhắn','Tin nhắn sẽ được thay bằng thông báo đã thu hồi.');if(ok)await UI.fetchJSON(`/api/messages/${m.id}/recall`,{method:'POST'});}if(action==='delete'){const ok=await confirmAction('Xóa tin nhắn','Tin nhắn chỉ bị xóa ở phía bạn.');if(ok){await UI.fetchJSON(`/api/messages/${m.id}`,{method:'DELETE'});state.messages=state.messages.filter((x)=>x.id!==m.id);queueMessageRender();}}UI.closeModal('messageMenuModal');}catch(err){UI.toast(err.message,'error');}});
  $('messageMenuModal').querySelector('.reaction-row').addEventListener('click',async(e)=>{const b=e.target.closest('button');if(!b||!state.selectedMessage)return;try{await UI.fetchJSON(`/api/messages/${state.selectedMessage.id}/react`,{method:'POST',body:{emoji:b.textContent}});UI.closeModal('messageMenuModal');}catch(err){UI.toast(err.message,'error');}});

  $('mediaVaultButton').addEventListener('click',async()=>{try{const data=await UI.fetchJSON(`/api/media/${state.active.scope}/${encodeURIComponent(state.active.targetId||'world')}`);$('mediaVaultGrid').innerHTML=data.items.map((x)=>x.attachment.kind==='image'?`<button type="button" data-media-src="${escape(x.attachment.url)}" data-media-name="${escape(x.attachment.name)}" class="vault-item vault-image-item"><img src="${escape(x.attachment.url)}" alt="${escape(x.attachment.name)}" loading="lazy" decoding="async"><strong>${escape(x.attachment.name)}</strong><small>${UI.formatDate(x.createdAt)}</small></button>`:`<a href="${escape(x.attachment.url)}" target="_blank" rel="noopener" class="vault-item">${x.attachment.kind==='video'?`<span>${icon('video')}</span>`:x.attachment.kind==='audio'?`<span>${icon('mic')}</span>`:`<span>${icon('file')}</span>`}<strong>${escape(x.attachment.name)}</strong><small>${UI.formatDate(x.createdAt)}</small></a>`).join('')||'<div class="empty-state">Chưa có tệp nào.</div>';UI.openModal('mediaVaultModal');}catch(e){UI.toast(e.message,'error');}});
  $('nextPinnedButton').addEventListener('click',()=>{const ids=($('pinnedMessageBar').dataset.ids||'').split(',').filter(Boolean);if(!ids.length)return;let i=(Number($('pinnedMessageBar').dataset.index)+1)%ids.length;$('pinnedMessageBar').dataset.index=String(i);const m=state.messages.find((x)=>x.id===ids[i]);$('pinnedMessageText').textContent=m?.text||m?.attachment?.name||'Tin nhắn';document.querySelector(`[data-message-id="${CSS.escape(ids[i])}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});});

  $('addFriendButton').addEventListener('click',()=>{ $('addFriendForm').reset();$('addFriendMessage').textContent='';UI.openModal('addFriendModal');});
  $('addFriendForm').addEventListener('submit',async(e)=>{e.preventDefault();const msg=$('addFriendMessage');msg.textContent='';try{const data=await UI.fetchJSON('/api/friends/request',{method:'POST',body:{username:$('friendUsername').value.trim()}});UI.closeModal('addFriendModal');UI.toast(serverText(data.message),'success');await loadBootstrap();}catch(err){msg.textContent=serverText(err.message);}});
  $('createGroupButton').addEventListener('click',()=>{const available=state.friends.filter((f)=>f.friend&&!f.blocked);$('groupMemberPicker').innerHTML=available.map((f)=>`<label><input type="checkbox" value="${f.id}">${avatarHTML(f,'avatar')}<span>${escape(displayName(f))}</span></label>`).join('')||'<p>Hãy kết bạn và bỏ chặn trước khi tạo nhóm.</p>';$('groupForm').reset();$('groupNameCounter').textContent='0/50';$('groupFormMessage').textContent='';UI.openModal('groupModal');});
  $('groupName').addEventListener('input',()=>{$('groupNameCounter').textContent=`${$('groupName').value.length}/50`;$('groupFormMessage').textContent='';});
  $('groupForm').addEventListener('submit',async(e)=>{e.preventDefault();const name=$('groupName').value.trim(),ids=[...$('groupMemberPicker').querySelectorAll('input:checked')].map((x)=>x.value),button=e.currentTarget.querySelector('button[type="submit"]');if(name.length<2){$('groupFormMessage').textContent='Tên nhóm cần ít nhất 2 ký tự.';$('groupName').focus();return;}UI.setLoading(button,true);$('groupFormMessage').textContent='';try{const data=await UI.fetchJSON('/api/groups',{method:'POST',body:{name,memberIds:ids}});UI.closeModal('groupModal');UI.toast(data.message,'success');await loadBootstrap();openConversation('group',data.group.id);}catch(err){$('groupFormMessage').textContent=err.message;}finally{UI.setLoading(button,false);}});

  async function openLocatedMessage(scope,targetId,messageId){
    UI.closeModal('searchModal');
    if(scope==='world') await openConversation('world');
    else if(scope==='group') await openConversation('group',targetId);
    else if(scope==='request') await openConversation('request',targetId);
    else await openConversation('private',targetId);
    requestAnimationFrame(()=>{
      const row=document.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
      if(!row){UI.toast('Tin nhắn nằm ngoài phạm vi lịch sử đang tải.','info');return;}
      row.scrollIntoView({behavior:'smooth',block:'center'});
      row.classList.add('message-highlight');
      setTimeout(()=>row.classList.remove('message-highlight'),2200);
    });
  }
  let searchTimer;$('chatSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>globalSearch($('chatSearch').value),350);});$('searchHistoryButton').addEventListener('click',()=>globalSearch(''));
  async function globalSearch(q){try{const data=await UI.fetchJSON(`/api/search?q=${encodeURIComponent(q)}`);$('globalSearchResults').innerHTML=`${data.history?.length?`<section><h4>Lịch sử</h4><div class="search-chips">${data.history.map((x)=>`<button data-history-q="${escape(x)}">${escape(x)}</button>`).join('')}</div></section>`:''}${data.users?.length?`<section><h4>Người dùng</h4>${data.users.map((u)=>`<button class="search-result" data-profile-id="${u.id}">${avatarHTML(u,'avatar')}<span><strong>${escape(u.nickname)}</strong><small>@${escape(u.username)}</small></span></button>`).join('')}</section>`:''}${data.groups?.length?`<section><h4>Nhóm</h4>${data.groups.map((g)=>`<button class="search-result" data-group-id="${g.id}"><span class="avatar group-avatar">${icon('users')}</span><strong>${escape(g.name)}</strong></button>`).join('')}</section>`:''}${data.messages?.length?`<section><h4>Tin nhắn</h4>${data.messages.map((m)=>`<button class="search-message-result" data-search-message="${m.id}" data-search-scope="${escape(m.scope)}" data-search-target="${escape(m.scope==='group'?m.groupId:(m.scope==='world'?'world':(m.fromId===state.me.id?m.toId:m.fromId))||'')}"><strong>${escape(m.senderName)}</strong><p>${escape(m.text)}</p><small>${UI.formatDate(m.createdAt)} · Mở trong đoạn chat</small></button>`).join('')}</section>`:''}`||'<div class="empty-state">Chưa có dữ liệu tìm kiếm.</div>';UI.openModal('searchModal');}catch(e){UI.toast(e.message,'error');}}
  $('clearSearchHistory').addEventListener('click',async()=>{await UI.fetchJSON('/api/search/history',{method:'DELETE'});globalSearch('');});
  $('searchToggleButton').addEventListener('click',()=>$('messageSearchBar').classList.toggle('hidden'));$('messageSearchInput').addEventListener('input',()=>queueMessageRender());$('clearSearchButton').addEventListener('click',()=>{$('messageSearchInput').value='';queueMessageRender();});
  async function respondToActiveRequest(action){
    if(state.active.scope!=='request'||!state.active.targetId)return;
    const accepted=action!=='accept'||await confirmAction('Chấp nhận tin nhắn chờ','Sau khi chấp nhận, hai người có thể tiếp tục trò chuyện.');
    if(!accepted)return;
    try{
      const data=await UI.fetchJSON(`/api/message-requests/${state.active.targetId}/respond`,{method:'POST',body:{action}});
      UI.toast(data.message,'success');await loadBootstrap();
      if(action==='accept')await openConversation('private',state.active.targetId);else await openConversation('world');
    }catch(error){UI.toast(error.message,'error');}
  }
  $('acceptRequestInline').addEventListener('click',()=>respondToActiveRequest('accept'));
  $('deleteRequestInline').addEventListener('click',async()=>{if(await confirmAction('Xóa tin nhắn chờ','Tin nhắn chờ này sẽ bị xóa ở phía bạn.'))respondToActiveRequest('decline');});

  document.addEventListener('click',async(e)=>{
    const nav=e.target.closest('[data-open-scope]');if(nav)openConversation(nav.dataset.openScope);
    const mobileProfile=e.target.closest('[data-mobile-profile-id]');if(mobileProfile&&isMobileChat()){e.preventDefault();e.stopPropagation();closeSidebar();showProfile(mobileProfile.dataset.mobileProfileId);return;}
    const user=e.target.closest('[data-user-id]');if(user)openConversation(user.dataset.request==='1'?'request':'private',user.dataset.userId);
    const group=e.target.closest('[data-group-id]');if(group)openConversation('group',group.dataset.groupId);
    const profile=e.target.closest('[data-profile-id]');if(profile)showProfile(profile.dataset.profileId);
    const add=e.target.closest('[data-add-username]');if(add){$('friendUsername').value=add.dataset.addUsername;UI.closeModal('publicProfileModal');UI.openModal('addFriendModal');}
    const msg=e.target.closest('[data-message-menu]');if(msg){e.stopPropagation();openMessageMenu(msg.dataset.messageMenu);}
    const retry=e.target.closest('[data-retry-message]');if(retry){e.stopPropagation();const local=state.messages.find((m)=>m.id===retry.dataset.retryMessage&&m.localOnly);if(local){if(state.activeAccess.blocked)UI.toast('Hiện không thể liên lạc với người này.','error');else{local._autoRetries=0;attemptPendingMessage(local);}}}
    const reaction=e.target.closest('[data-react]');if(reaction){const row=reaction.closest('[data-message-id]');await UI.fetchJSON(`/api/messages/${row.dataset.messageId}/react`,{method:'POST',body:{emoji:reaction.dataset.react,remove:reaction.classList.contains('mine')}}).catch((err)=>UI.toast(err.message,'error'));}
    const fr=e.target.closest('[data-request-action]');if(fr){const rid=fr.closest('[data-request-id]').dataset.requestId;try{await UI.fetchJSON('/api/friends/respond',{method:'POST',body:{requestId:rid,action:fr.dataset.requestAction}});await loadBootstrap();}catch(err){UI.toast(err.message,'error');}}
    const openReq=e.target.closest('[data-open-request]');if(openReq)openConversation('request',openReq.dataset.openRequest);
    const reqAction=e.target.closest('[data-request-message-action]');if(reqAction){try{await UI.fetchJSON(`/api/message-requests/${reqAction.dataset.user}/respond`,{method:'POST',body:{action:reqAction.dataset.requestMessageAction}});await loadBootstrap();showSpecialPanel('requests');}catch(err){UI.toast(err.message,'error');}}
    const session=e.target.closest('[data-session-remove]');if(session){const ok=await confirmAction('Đăng xuất thiết bị','Phiên đăng nhập trên thiết bị đó sẽ bị kết thúc.');if(ok){await UI.fetchJSON(`/api/sessions/${encodeURIComponent(session.dataset.sessionRemove)}`,{method:'DELETE'});$('manageSessionsButton').click();}}
    const pm=e.target.closest('[data-profile-message]');if(pm){UI.closeModal('publicProfileModal');openConversation('private',pm.dataset.profileMessage);}const prm=e.target.closest('[data-profile-request-message]');if(prm){UI.closeModal('publicProfileModal');openConversation('request',prm.dataset.profileRequestMessage);}
    const pb=e.target.closest('[data-profile-block]');if(pb){const ok=await confirmAction('Chặn người dùng','Sau khi chặn, hai bên vẫn xem được lịch sử nhưng không thể nhắn tin.');if(ok){const data=await UI.fetchJSON('/api/friends/block',{method:'POST',body:{userId:pb.dataset.profileBlock}});UI.closeModal('publicProfileModal');await loadBootstrap();UI.toast(data.message,'success');}}
    const pu=e.target.closest('[data-profile-unblock]');if(pu){const ok=await confirmAction('Bỏ chặn người dùng','Bạn có muốn cho phép liên lạc lại với người này?');if(ok){const data=await UI.fetchJSON('/api/friends/unblock',{method:'POST',body:{userId:pu.dataset.profileUnblock}});UI.closeModal('publicProfileModal');await loadBootstrap();UI.toast(data.message,'success');}}
    const pr=e.target.closest('[data-profile-report]');if(pr){UI.closeModal('publicProfileModal');openReportModal({user:state.selectedProfile?.id===pr.dataset.profileReport?state.selectedProfile:friendById(pr.dataset.profileReport)||{id:pr.dataset.profileReport,nickname:'Người dùng'}});}
    const hist=e.target.closest('[data-history-q]');if(hist){$('chatSearch').value=hist.dataset.historyQ;globalSearch(hist.dataset.historyQ);}
    const found=e.target.closest('[data-search-message]');if(found)openLocatedMessage(found.dataset.searchScope,found.dataset.searchTarget,found.dataset.searchMessage);
    const saved=e.target.closest('[data-saved-message]');if(saved)openLocatedMessage(saved.dataset.savedScope,saved.dataset.savedTarget,saved.dataset.savedMessage);
    const toggle=e.target.closest('[data-toggle-section]');if(toggle)$(toggle.dataset.toggleSection)?.classList.toggle('hidden');
    if(!e.target.closest('#emojiPicker,#emojiButton'))setEmojiPickerOpen(false);if(!e.target.closest('#quickTools,#toolsButton'))$('quickTools').classList.add('hidden');
  });
  $('meCard').addEventListener('click',()=>showProfile(state.me.id));$('conversationAvatar').addEventListener('click',()=>{if(['private','request'].includes(state.active.scope))showProfile(state.active.targetId);else if(state.active.scope==='group')showGroupInfo();});
  $('openSidebar').addEventListener('click',openSidebar);$('closeSidebar').addEventListener('click',()=>closeSidebar({restoreFocus:true}));$('sidebarOverlay').addEventListener('click',()=>closeSidebar({restoreFocus:true}));
  let messageScrollFrame=0;$('messages').addEventListener('scroll',()=>{if(messageScrollFrame)return;messageScrollFrame=requestAnimationFrame(()=>{messageScrollFrame=0;const box=$('messages'),max=messageContentMaxScroll(box);if(box.scrollTop>max+2)box.scrollTop=max;const d=Math.max(0,max-box.scrollTop);$('scrollBottomButton').classList.toggle('hidden',d<180);});},{passive:true});$('scrollBottomButton').addEventListener('click',scrollToBottom);

  function confirmAction(title,message){$('confirmTitle').textContent=title;$('confirmMessage').textContent=message;UI.openModal('confirmModal');return new Promise((resolve)=>{const yes=()=>finish(true),no=()=>finish(false),finish=(v)=>{$('confirmAccept').removeEventListener('click',yes);$('confirmCancel').removeEventListener('click',no);UI.closeModal('confirmModal');resolve(v);};$('confirmAccept').addEventListener('click',yes);$('confirmCancel').addEventListener('click',no);});}
  function promptValue(title,value=''){$('promptTitle').textContent=title;$('promptInput').value=value;UI.openModal('promptModal');return new Promise((resolve)=>{const yes=()=>finish($('promptInput').value.trim()),no=()=>finish(null),finish=(v)=>{$('promptAccept').removeEventListener('click',yes);$('promptCancel').removeEventListener('click',no);UI.closeModal('promptModal');resolve(v);};$('promptAccept').addEventListener('click',yes);$('promptCancel').addEventListener('click',no);});}



  const SIDEBAR_THEME_KEY='nexchat-chat-sidebar-theme';
  function applySidebarTheme(theme,{persist=true}={}){
    const selected=theme==='heaven'?'heaven':'cosmic';
    document.documentElement.dataset.sidebarTheme=selected;
    if(persist){try{localStorage.setItem(SIDEBAR_THEME_KEY,selected);}catch(_){}}
    document.querySelectorAll('[data-sidebar-theme-choice]').forEach((button)=>{
      const active=button.dataset.sidebarThemeChoice===selected;
      button.setAttribute('aria-checked',String(active));button.classList.toggle('active',active);
    });
    document.querySelectorAll('[data-sidebar-theme-current-label]').forEach((node)=>node.textContent=selected==='cosmic'?t('sidebarSpaceCosmicShort'):t('sidebarSpaceHeavenShort'));
    const iconNode=document.querySelector('[data-sidebar-theme-current-icon]');if(iconNode){iconNode.dataset.classicIcon=selected==='cosmic'?'sparkles':'sun';UI.hydrateClassicIcons?.(iconNode.parentElement);}
  }
  function setSidebarThemePanel(open){
    const panel=$('sidebarThemePanel'),button=$('sidebarThemeButton');if(!panel||!button)return;
    const next=Boolean(open),current=!panel.classList.contains('hidden');
    if(next===current)return;
    panel.classList.toggle('hidden',!next);panel.setAttribute('aria-hidden',String(!next));button.setAttribute('aria-expanded',String(next));document.body.classList.toggle('sidebar-theme-panel-open',next);
  }
  $('sidebarThemeButton')?.addEventListener('click',(event)=>{event.stopPropagation();setSidebarThemePanel($('sidebarThemePanel')?.classList.contains('hidden'));});
  $('closeSidebarThemePanel')?.addEventListener('click',()=>setSidebarThemePanel(false));
  $('sidebarThemePanel')?.addEventListener('click',(event)=>{const button=event.target.closest('[data-sidebar-theme-choice]');if(!button)return;applySidebarTheme(button.dataset.sidebarThemeChoice);setSidebarThemePanel(false);});
  document.addEventListener('click',(event)=>{if(!event.target.closest('#sidebarThemePanel,#sidebarThemeButton'))setSidebarThemePanel(false);});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')setSidebarThemePanel(false);});
  applySidebarTheme(document.documentElement.dataset.sidebarTheme||storage.get(SIDEBAR_THEME_KEY,'cosmic'),{persist:false});
  window.addEventListener('languagechange',()=>{applyExtraLanguage();applySidebarTheme(document.documentElement.dataset.sidebarTheme||'cosmic',{persist:false});updateEffectModalCopy();updateEffectButton();});

  function openReportModal({user=null,message=null}={}){
    const targetId=message?.fromId||user?.id||'';if(!targetId||targetId===state.me?.id)return UI.toast('Không thể tố cáo chính mình.','error');
    state.reportContext={user,message};
    $('reportForm')?.reset();$('reportTargetUserId').value=targetId;$('reportMessageId').value=message?.id||'';
    $('reportDetailsCounter').textContent='0/500';setAccountSettingsMessage('reportFormMessage');
    const name=message?.senderName||user?.nickname||user?.username||'người dùng này';
    $('reportModalTitle').textContent=message?'Tố cáo tin nhắn trên kênh thế giới':'Tố cáo người dùng';
    $('reportModalDescription').textContent=`Admin sẽ nhận hồ sơ riêng về ${name}, kiểm tra bằng chứng và quyết định hành động.`;
    const preview=$('reportEvidencePreview');
    if(message){preview.classList.remove('hidden');preview.innerHTML=`<span>${icon('message-circle')}</span><div><small>BẰNG CHỨNG ĐƯỢC GIỮ NGUYÊN</small><strong>${escape(name)}</strong><p>${escape(message.text||message.attachment?.name||'Tin nhắn đính kèm')}</p><time>${escape(UI.formatDate(message.createdAt))}</time></div>`;}
    else{preview.classList.remove('hidden');preview.innerHTML=`<span>${icon('user')}</span><div><small>TÀI KHOẢN BỊ TỐ CÁO</small><strong>${escape(name)}</strong><p>Admin có thể xem lịch sử liên quan và trạng thái tài khoản khi điều tra.</p></div>`;}
    UI.openModal('reportModal');
  }
  $('reportDetails')?.addEventListener('input',(event)=>{$('reportDetailsCounter').textContent=`${event.target.value.length}/500`;});
  $('reportForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const button=$('submitReportButton');setAccountSettingsMessage('reportFormMessage');
    if(!$('reportGoodFaith').checked)return setAccountSettingsMessage('reportFormMessage','Hãy xác nhận tố cáo được gửi trung thực.');
    UI.setLoading(button,true);
    try{
      const data=await UI.fetchJSON('/api/reports',{method:'POST',body:{scope:$('reportMessageId').value?'message':'user',userId:$('reportTargetUserId').value,messageId:$('reportMessageId').value||null,reason:$('reportReason').value,details:$('reportDetails').value}});
      UI.closeModal('reportModal');UI.toast(data.message||'Đã gửi tố cáo riêng tới Admin.','success');
    }catch(error){setAccountSettingsMessage('reportFormMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });

  function notificationSettings(){return state.me?.notificationSettings||{};}
  function notificationMuteActive(settings=notificationSettings()){
    return settings.enabled===false||settings.globalMutePermanent===true||Number(settings.globalMutedUntil)>Date.now();
  }
  function refreshNotificationSettingsUI(){
    if(!state.me)return;const settings=notificationSettings(),quiet=settings.quietHours||{};
    if($('notificationsEnabled'))$('notificationsEnabled').checked=settings.enabled!==false;
    if($('pushNotificationsEnabled'))$('pushNotificationsEnabled').checked=Boolean(settings.pushEnabled);
    if($('notificationPreviewEnabled'))$('notificationPreviewEnabled').checked=settings.showPreview!==false;
    if($('notificationSoundEnabled'))$('notificationSoundEnabled').checked=settings.soundEnabled!==false;
    if($('quietHoursEnabled'))$('quietHoursEnabled').checked=Boolean(quiet.enabled);
    if($('quietHoursStart'))$('quietHoursStart').value=quiet.start||'22:00';if($('quietHoursEnd'))$('quietHoursEnd').value=quiet.end||'07:00';
    if($('notificationMuteDuration'))$('notificationMuteDuration').value=settings.globalMutePermanent||Number(settings.globalMutedUntil)>Date.now()?'0':'0';
    const muted=notificationMuteActive(settings);$('notificationMutedDot')?.classList.toggle('hidden',!muted);
    const muteStatus=$('notificationMuteStatus');if(muteStatus){muteStatus.textContent=settings.enabled===false?'Toàn bộ thông báo đang tắt':settings.globalMutePermanent?'Đã tắt cho tới khi bật lại':Number(settings.globalMutedUntil)>Date.now()?`Đã tắt đến ${UI.formatDate(settings.globalMutedUntil)}`:'Đang bật bình thường';muteStatus.classList.toggle('is-muted',muted);}
    const permission=typeof Notification==='undefined'?'unsupported':Notification.permission;
    const stateNode=$('pushPermissionState');if(stateNode){stateNode.textContent=permission==='granted'?(settings.pushEnabled?'Đang hoạt động':'Đã cấp quyền'):permission==='denied'?'Bị trình duyệt chặn':permission==='unsupported'?'Không hỗ trợ':'Chưa cấp quyền';stateNode.dataset.state=permission;}
    const description=$('pushDeviceDescription');if(description)description.textContent=permission==='granted'?'Thiết bị đã sẵn sàng nhận thông báo ngay cả khi NexChat đã đóng.':permission==='denied'?'Hãy mở cài đặt trình duyệt và cho phép thông báo cho trang này.':'Bật quyền trình duyệt để nhận tin khi thoát web.';
    const enable=$('enablePushButton');if(enable){enable.querySelector('span:last-child').textContent=permission==='granted'&&settings.pushEnabled?'Đã bật trên thiết bị':'Bật thông báo nền';enable.classList.toggle('is-enabled',permission==='granted'&&settings.pushEnabled);}
  }
  function base64UrlToUint8Array(value){const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64);return Uint8Array.from([...raw].map((char)=>char.charCodeAt(0)));}
  async function ensurePushSubscription(){
    if(!('serviceWorker' in navigator)||typeof PushManager==='undefined'||typeof Notification==='undefined')throw new Error('Trình duyệt này chưa hỗ trợ thông báo nền.');
    const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Bạn chưa cho phép trình duyệt gửi thông báo.');
    const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;
    const keyData=await UI.fetchJSON('/api/notifications/vapid-public-key');if(!keyData.publicKey)throw new Error('Máy chủ chưa cấu hình khóa thông báo nền.');
    let subscription=await registration.pushManager.getSubscription();
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToUint8Array(keyData.publicKey)});
    const data=await UI.fetchJSON('/api/notifications/subscribe',{method:'POST',body:{subscription:subscription.toJSON()}});state.me.notificationSettings=data.settings||state.me.notificationSettings;refreshNotificationSettingsUI();return data;
  }
  $('enablePushButton')?.addEventListener('click',async(event)=>{const button=event.currentTarget;UI.setLoading(button,true);setAccountSettingsMessage('notificationSettingsMessage');try{const data=await ensurePushSubscription();UI.toast(data.message||'Đã bật thông báo nền.','success');}catch(error){setAccountSettingsMessage('notificationSettingsMessage',error.message,false);}finally{UI.setLoading(button,false);}});
  $('notificationSettingsForm')?.addEventListener('submit',async(event)=>{
    event.preventDefault();const button=event.currentTarget.querySelector('button[type="submit"]'),rawMute=$('notificationMuteDuration').value;UI.setLoading(button,true);setAccountSettingsMessage('notificationSettingsMessage');
    try{
      const body={enabled:$('notificationsEnabled').checked,pushEnabled:$('pushNotificationsEnabled').checked,showPreview:$('notificationPreviewEnabled').checked,soundEnabled:$('notificationSoundEnabled').checked,globalMute:rawMute==='permanent'?'permanent':'timed',globalMuteMinutes:rawMute==='permanent'?0:Number(rawMute||0),timezoneOffset:new Date().getTimezoneOffset(),quietHours:{enabled:$('quietHoursEnabled').checked,start:$('quietHoursStart').value,end:$('quietHoursEnd').value}};
      if(body.pushEnabled&&(typeof Notification==='undefined'||Notification.permission!=='granted'))await ensurePushSubscription();
      const data=await UI.fetchJSON('/api/notifications/settings',{method:'PUT',body});state.me.notificationSettings=data.settings;refreshNotificationSettingsUI();setAccountSettingsMessage('notificationSettingsMessage',data.message,true);UI.toast(data.message,'success');
    }catch(error){setAccountSettingsMessage('notificationSettingsMessage',error.message,false);}finally{UI.setLoading(button,false);}
  });
  $('notificationCenterButton')?.addEventListener('click',()=>{refreshAccountSettingsUI();setAccountSettingsTab('notifications');UI.openModal('accountSettingsModal');});
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}),{once:true});

  function emitVisibility(){if(socket.connected)socket.emit('user:visibility',{visible:document.visibilityState==='visible'&&document.hasFocus()});}
  window.addEventListener('focus',emitVisibility);window.addEventListener('blur',emitVisibility);document.addEventListener('visibilitychange',emitVisibility);
  socket.on('moderation:notice',(payload={})=>{const message=payload.message||payload.body;if(message)UI.toast(message,payload.level==='error'?'error':'info');});
  socket.on('report:updated',(report={})=>{const labels={investigating:'Admin đang điều tra tố cáo của bạn.',actioned:'Admin đã hoàn tất xử lý tố cáo.',dismissed:'Admin đã kết thúc tố cáo sau khi kiểm tra.'};UI.toast(labels[report.status]||'Trạng thái tố cáo đã được cập nhật.','info');});
  socket.on('world:moderation',(payload={})=>{if(payload.muted)UI.toast(payload.reason||'Quyền gửi chat thế giới đang bị hạn chế.','error');if(state.active.scope==='world')applyConversationAccess();});

  socket.on('connect',()=>{
    emitVisibility();
    $('conversationStatus').classList.remove('offline-status');
    UI.setConnectionState(true,'Đã kết nối');
    disconnectToastShown=false;
    const retryable=state.messages.filter((m)=>m.localOnly&&m.deliveryState==='failed'&&['OFFLINE','ACK_TIMEOUT'].includes(m.clientErrorCode)&&Number(m._autoRetries||0)<2);
    retryable.slice(0,3).forEach((m,index)=>setTimeout(()=>{m._autoRetries=Number(m._autoRetries||0)+1;attemptPendingMessage(m);},300+index*450));
  });
  socket.on('disconnect',()=>{
    $('conversationStatus').classList.add('offline-status');
    UI.setConnectionState(false,'Đang kết nối lại');
    for(const m of state.messages.filter((x)=>x.localOnly&&x.deliveryState==='sending')){m.deliveryState='failed';m.clientError='Mất kết nối. Nhấn để gửi lại.';m.clientErrorCode='OFFLINE';}
    queueMessageRender();
    if(!disconnectToastShown){disconnectToastShown=true;UI.toast('Mất kết nối. Hệ thống đang tự kết nối lại.','error');}
  });
  socket.on('chat:message',(m)=>{
    if(messageBelongs(m)){
      const shouldFollow=isNearMessageBottom()||m.fromId===state.me.id;
      upsertRealtimeMessage(m,{forceScroll:shouldFollow});renderPinnedBar();
      if(m.fromId!==state.me.id&&['private','group','support'].includes(state.active.scope)&&!state.activeAccess.blocked)scheduleActiveRead();
    }else if(m.scope==='support'&&m.supportUserId===state.me.id){state.supportUnread=(state.supportUnread||0)+1;renderSidebar();UI.toast('Bạn có phản hồi mới từ Hỗ trợ Admin.','info');}else if(m.toId===state.me.id||m.scope==='group'){const key=m.scope==='group'?`group:${m.groupId}`:m.fromId;if(!isMuted(key)&&(m.scope!=='request'||state.me.settings.notifyRequests!==false))UI.toast(m.scope==='request'?'Bạn có tin nhắn chờ mới.':`Tin nhắn mới từ ${m.senderName}.`,'info');queueBootstrapRefresh();}
  });
  socket.on('chat:message:update',(m)=>{const i=state.messages.findIndex((x)=>x.id===m.id);if(i>=0){state.messages[i]=m;patchMessagesByIds([m.id]);renderPinnedBar();}});
  socket.on('chat:reaction',(m)=>{const i=state.messages.findIndex((x)=>x.id===m.id);if(i>=0){state.messages[i]=m;patchMessagesByIds([m.id]);}});
  socket.on('chat:message:deleted',({messageId})=>{const index=state.messages.findIndex((m)=>m.id===messageId);if(index<0)return;state.messages.splice(index,1);patchMessageWindow([index-1,index],[messageId]);});
  socket.on('chat:read',({messageIds,readerId})=>{if(!Array.isArray(messageIds))return;const wanted=new Set(messageIds),changed=[];const receiptId=readerId||'other';for(const m of state.messages){if(wanted.has(m.id)){m.receiptBy=Array.isArray(m.receiptBy)?m.receiptBy:[];if(!m.receiptBy.includes(receiptId))m.receiptBy.push(receiptId);changed.push(m.id);}}if(changed.length)patchMessagesByIds(changed);});
  socket.on('chat:typing',(p)=>{const relevant=(state.active.scope==='private'&&p.scope==='private'&&p.userId===state.active.targetId)||(state.active.scope==='group'&&p.scope==='group'&&p.groupId===state.active.targetId)||(state.active.scope==='support'&&p.scope==='support');if(!relevant)return;p.isTyping?showTyping(p.username):hideTyping();});
  function showTyping(name){clearTimeout(state.remoteTypingTimer);$('typingText').textContent=`${name||'Đối phương'} đang nhập`;$('typingIndicator').classList.remove('hidden');state.remoteTypingTimer=setTimeout(hideTyping,3200);}
  function hideTyping(){clearTimeout(state.remoteTypingTimer);state.remoteTypingTimer=null;$('typingText').textContent='';$('typingIndicator').classList.add('hidden');}
  socket.on('presence:update',({userId,online})=>{for(const list of [state.friends,state.blocked,state.suggestions]){const u=list.find((x)=>x.id===userId);if(u)u.online=online;}renderSidebar();updateHeader();});
  socket.on('conversation:access',(payload={})=>{
    if(!payload.userId)return;updateContactState(payload.userId,payload);
    if(['private','request'].includes(state.active.scope)&&state.active.targetId===payload.userId){
      state.activeAccess={...state.activeAccess,...payload,canSend:payload.canSend!==false&&!payload.blocked};
      if(state.activeAccess.blocked){for(const m of state.messages.filter((x)=>x.localOnly&&x.deliveryState==='sending')){m.deliveryState='failed';m.clientError='Hiện không thể liên lạc với người này.';}hideTyping();queueMessageRender();}
      applyConversationAccess();
    }
    if(payload.message)UI.toast(payload.message,payload.blocked?'error':'success');
  });
  socket.on('support:access',(payload={})=>{
    state.supportMessaging={...state.supportMessaging,...payload};
    if(state.active.scope==='support'){updateHeader();applyConversationAccess();}
  });
  socket.on('support:moderation',(payload={})=>{
    state.supportMessaging={...state.supportMessaging,...(payload.supportMessaging||{}),strikes:payload.strike??payload.supportMessaging?.strikes??state.supportMessaging.strikes,resetAt:payload.resetAt??payload.supportMessaging?.resetAt??state.supportMessaging.resetAt};
    if(state.active.scope==='support'){updateHeader();applyConversationAccess();}
    if(payload.message)UI.toast(payload.message,Number(payload.strike)>=3?'error':'warning');
  });
  socket.on('world:state',(payload={})=>{
    state.system=state.system||{};state.system.worldChat=payload;state.system.worldChatEnabled=payload.enabled!==false;if(!payload.slowModeSeconds||payload.enabled===false)setWorldCooldown(0);
    if(state.active.scope==='world'){
      applyConversationAccess();if(!worldChatSettings().enabled)clearAttachment();
      const labels={open:'Chat thế giới đã mở cho mọi thành viên.',admin_only:'Chat thế giới hiện chỉ cho quản trị viên gửi.',read_only:'Chat thế giới đã chuyển sang chế độ chỉ đọc.'};
      UI.toast(labels[worldChatSettings().mode]||'Trạng thái chat thế giới đã thay đổi.',worldChatSettings().enabled?'success':'info');
    }
  });
  socket.on('friend:updated',(p)=>{if(p?.message&&!p.silent)UI.toast(p.message,'info');queueBootstrapRefresh();});socket.on('group:updated',()=>queueBootstrapRefresh());socket.on('profile:updated',(p)=>{if(p?.user){for(const m of state.messages.filter((item)=>item.fromId===p.user.id)){m.senderName=p.user.nickname||m.senderName;m.senderProfilePublic=p.user.profile?.isPublic!==false;m.senderProfileBadges=p.user.profileBadges||{};if(m.scope==='world')m.senderAvatarUrl=p.user.profile?.showAvatarInWorld===false?'':(p.user.profile?.avatarUrl||'');else if(m.scope==='group')m.senderAvatarUrl=p.user.profile?.avatarUrl||'';}queueMessageRender();}queueBootstrapRefresh();});socket.on('message-request:accepted',()=>queueBootstrapRefresh());
  socket.on('effects:selected',(payload={})=>{
    if(!state.me||!payload.allowed)return;
    const effect=payload.effect==='none'||EFFECTS.includes(payload.effect)?payload.effect:'none';
    state.me.effectAccess=true;
    state.me.selectedEffect=effect;
    state.me.effectAccessSource=payload.source||state.me.effectAccessSource||'none';
    state.me.effectAccessExpiresAt=payload.expiresAt??state.me.effectAccessExpiresAt??null;
    updateEffectButton();
    if(!$('effectModal').classList.contains('hidden')){renderEffectGrid();syncEffectStudioPreview(effect);}
  });
  socket.on('effects:permission',async(payload)=>{
    state.me.specialEffectsAllowed=Boolean(payload.granted);
    state.me.effectAccess=Boolean(payload.allowed);
    state.me.effectAccessSource=payload.source||'none';
    state.me.effectAccessExpiresAt=payload.expiresAt||null;
    state.me.selectedEffect=payload.allowed?(payload.effect||state.me.selectedEffect||'none'):'none';
    if(!payload.allowed){
      const endedAt=new Date().toISOString();
      state.messages.forEach((message)=>{if(message.fromId===state.me.id&&message.effect&&message.effect!=='none'&&!message.effectDisabledAt)message.effectDisabledAt=endedAt;});
      UI.closeModal('effectModal');
    }
    updateEffectButton();queueMessageRender();
    if(payload.message)UI.toast(payload.message,payload.allowed?'success':'error');
    if(payload.allowed){$('effectButton').classList.add('effect-unlocked');setTimeout(()=>$('effectButton').classList.remove('effect-unlocked'),1800);}
  });
  socket.on('effects:style-changed',({userId,allowed,effect})=>{
    let changed=false;
    const endedAt=new Date().toISOString();
    state.messages.forEach((message)=>{
      if(message.fromId!==userId)return;
      if(!allowed&&message.effect&&message.effect!=='none'&&!message.effectDisabledAt){message.effectDisabledAt=endedAt;changed=true;}
    });
    for(const list of [state.friends,state.blocked,state.suggestions]){
      const user=list.find((item)=>item.id===userId);
      if(user){user.effectAccess=Boolean(allowed);user.selectedEffect=allowed?(effect||user.selectedEffect||'none'):'none';}
    }
    if(changed)queueMessageRender();
    renderSidebar();
  });
  socket.on('profile-badges:updated',(payload)=>{
    if(payload?.badges){state.me.profileBadges=payload.badges;renderMe();fillOwnProfile();queueMessageRender();}
    if(payload?.message)UI.toast(payload.message,'info');
    queueBootstrapRefresh();
  });
  socket.on('account:notice',(p)=>UI.toast(p.message,'info'));socket.on('account:restricted',(r)=>{ $('restrictionMessage').textContent=r.message;$('restrictionDetails').innerHTML=UI.restrictionHTML(r);UI.openModal('restrictionModal');setTimeout(()=>location.href='/login',4500);});$('restrictionLogout').addEventListener('click',()=>location.href='/login');
  function handleAuthError(error){if(error.data?.restriction){socket.disconnect();location.href='/login';return;}if([401,403,428].includes(error.status))location.href='/login';else UI.toast(error.message,'error');}
  const hintKey='nexchat-message-actions-hint-v1';
  if(!storage.get(hintKey,''))$('featureHint').classList.remove('hidden');
  $('closeFeatureHint').addEventListener('click',()=>{$('featureHint').classList.add('hidden');storage.set(hintKey,'1');});
  window.addEventListener('languagechange',()=>{applyExtraLanguage();renderSidebar();updateHeader();updateEffectModalCopy();updateEffectButton();if(!$('emojiPicker')?.classList.contains('hidden'))renderEmojiPicker();queueMessageRender();});window.addEventListener('load',()=>setTimeout(()=>$('pageLoader')?.classList.add('loaded'),250));
  const syncEffectMotionState=()=>document.body.classList.toggle('effects-paused',document.hidden);
  document.addEventListener('visibilitychange',()=>{syncEffectMotionState();if(document.hidden)saveDraft();});syncEffectMotionState();
  window.addEventListener('pagehide',saveDraft,{capture:true});
  const privilegeCountdownTimer=setInterval(()=>{
    if(!document.hidden)refreshPrivilegeCountdowns(document);
  },1000);
  window.addEventListener('beforeunload',()=>{saveDraft();clearInterval(privilegeCountdownTimer);clearTimeout(activeReadTimer);clearTimeout(effectExpiryTimer);clearTimeout(state.remoteTypingTimer);if(state.composerResizeFrame)cancelAnimationFrame(state.composerResizeFrame);stopOwnTyping();clearInterval(state.worldCooldownTimer);effectVisibilityObserver?.disconnect();},{once:true});
  applyExtraLanguage();applyInterfaceScale(selectedInterfaceScale(),{persist:false});syncComposerClearButton();loadBootstrap(false);
})();
