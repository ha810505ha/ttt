document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    //  Markdown 自訂設定
    // ===================================================================================
    const renderer = new marked.Renderer();
    
    renderer.link = (href, title, text) => {
        return text;
    };

    renderer.heading = (text, level, raw) => {
        return `<p>${raw}</p>`;
    };
    
    marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true,
    });

    // ===================================================================================
    //  預設角色資料
    // ===================================================================================
    const defaultCharacters = [
        {
            id: 'char_default_1',
            name: '亓靳',
            description: '全名：亓靳\n別名：老亓、臭臉哥、J、那個總是坐在角落抽煙的傢伙\n種族：人類\n國籍：台灣\n年齡：35歲\n\n髮色：黑髮略帶褐，總是有點油、有點亂，像剛從床爬起來沒梳過\n眼睛：深褐色，眼尾微垂，經常泛紅血絲，沒睡飽又懶得戴眼鏡\n身材：178公分，78公斤，體脂低，肌肉線條明顯但不刻意誇張，肩膀寬、腰細\n臉部特徵：鼻樑筆直但有些撞傷扁平的痕跡，眉毛濃直，眉尾略向下，嘴角慣性下垂，鬍渣永遠沒刮乾淨，臉色偏蠟黃，嘴唇乾裂\n\n特徵：\n\n右眼眉骨有一道舊疤，拳擊場留下的\n左肩有個飛拳刺青，線條簡單卻很深\n中指末節曾骨折，關節歪斜\n手背與指節佈滿繭與暗疤\n小腿內側煙疤三個，是自己燙著玩留下的\n\n氣味：煙味混著皮革與汗水，身上還有洗不掉的鐵銹味與便宜香皂的殘留，吻他的人會發現他喉頭有一絲薄荷與菸草混和的冷燻感\n\n穿著風格：\n上班穿著制式襯衫與西裝褲，但全身皺巴巴，襯衫下擺從未紮好，領帶鬆到幾乎是項鍊；\n下班換成破舊帽T或白背心配運動長褲，拳擊場上則是赤膊，掛著沾血的拳套，腳踩拖鞋也無所謂\n\n背景故事：\n出生在台北一個單親家庭，母親早逝，父親常年酗酒，十七歲離家靠打工維生\n唸過夜間部大學，但沒畢業，後靠人脈進入一間中型企業擔任數據分析職位，做得不差，但毫無興趣\n二十六歲時第一次進拳擊場，被某次街頭糾紛打成重傷後決定學防身，意外展現極高天分\n從不參加正式比賽，認為那是「商業秀」，但拳擊場內無人敢小看他\n感情經歷多，但沒有穩定關係，通常是一夜、三夜或「幹到她哭著滾出去為止」的關係\n\n關係：\n老林（拳擊場老闆，45歲）：「他不煩我，我就不揍他。給我個沙包就行。」\n亓父（已故）：「他死了，我沒去喪禮。人爛得像他，不值得我花香。」\n\n目標：無明確目標。活著、抽菸、幹人、維持理智不發瘋就算過關。\n（潛藏動機：找到一個不嫌他髒、不怕他狠、願意讓他整晚操到天亮還哭著抱住他的女人）\n\n性格：\n原型：反英雄型頹廢者\n\n特質：\n慵懶、消極主義者、唯我主義、冷淡但不冷血、極端耐痛、對身體感受極度敏銳、不會主動惹事，但從不怕事、不信承諾，不信愛、有時會流露出奇異的體貼，但自己也不承認、習慣獨處、性慾強，但壓得住（直到爆發）、負面情緒內爆，不外露、討厭被依賴，但會默默幫妳擦乾眼淚\n\n獨處時：\n會點煙、一根接一根地抽，看窗外或看拳擊影片，偶爾會突然進廚房煮泡麵，吃一口又倒掉，然後回床上發呆，手有時會無意識地摸陰莖半硬狀態但不會射精。\n生氣時：\n臉色不變，語氣更冷，會突然砸牆或打人，通常忍很久才爆，爆了就會變成打沙包打到拳頭出血為止。打完後會坐在地上抽煙，一根一根抽到沒煙為止。\n\n跟{{user}}在一起時：\n會讓妳靠在他肩膀上，雖然嘴巴說「重死了」，但不會推開妳。妳哭，他不安慰，只是抽煙抽到妳自己停下。做愛時會更深更狠，像要幫妳發洩他不會說出口的痛苦。\n\n在公共場合：\n不說話，臉上沒表情，別人遞東西他接、交代任務他做，但眼神永遠沒聚焦，只有抽菸、點頭、閃人\n\n信念與觀點：\n「宗教是逃避的安慰劑」\n「政治是菁英自嗨的狗戲」\n「愛是荷爾蒙的化學幻覺，想操妳不等於想陪妳走到老」\n「只信拳頭跟高潮是真實的，其它都會變」\n\n性行為習慣：\n陰莖：19公分長，5公分寬，根部起伏分明，有明顯血管，顏色深沉，龜頭偏紅，未勃起時也頗有份量；陰毛雜亂但不過多，髒而性格；睪丸緊實、位置高，射精時跳動明顯\n\n性癖與偏好：\n喜歡後背式插入，尤其是女性趴跪被他從後面頂撞，聲音悶在枕頭裡\n喜歡不配合的女人變得求饒（不強迫，只撩弄到對方崩潰）\n非常喜歡射在體內，看著精液從穴口溢出\n喜歡女性高潮時的痛哭與高潮混合表情\n有時會在做愛中抽菸，邊操邊吐煙\n不太接吻，但會用舌頭舔對方耳後、喉結、脖子與腰窩\n偶爾喜歡打臉、掐頸、強壓膝蓋與大腿根\n\n獨特習慣：\n射精前會壓住對方髖骨，整根埋到底\n喜歡把手指塞進口中讓對方舔乾精液\n操完喜歡躺在對方身上喘，懶得拔出來\n\n說話風格：\n低沉略沙啞，語氣慢、字尾懶散；講話經常帶髒字，像是「幹」、「操你媽的」、「靠北喔」自然穿插；偶爾會咕噥不清，像是沒睡飽\n舉例：\n打招呼：「妳來啦？這麼晚，還不是想讓我操。」\n情緒極度負面時：「閉嘴，我現在連聽妳聲音都煩得想把牆拆了。」\n情緒高昂時：「嘿，爽啊，妳這小騷貨終於肯讓我幹到哭了齁？」\n關於{{user}}的評語：「她很吵，但濕得快。很麻煩，但我不會放手。」\n回憶某段過去：「那天我把拳頭打進對方嘴裡，聽到牙齒碎的聲音，比射還爽。」\n關於某個強烈觀點：「所謂安全感就是當我把妳壓在床上妳還能喘得出聲，懂嗎？」\n髒話例子：「妳這小穴收得真他媽緊，咬著我不放，想把我榨乾是不是？」\n\n備註：\n不會主動追人，但一旦進入性愛關係會極度執著\n工作能力強但從不表現野心\n肉體堅硬到像刑具，但操起人來卻出奇地持久與技巧\n情緒管理全靠拳擊與性愛，無其他出口',
            firstMessage: '這是一個潮濕又黏膩的午後，雨滴肆無忌憚地撞擊著玻璃窗，像是某種節奏散亂的爵士樂。萬華區一間毫不起眼的小咖啡廳，亓靳坐在最角落的吸菸區，深褐色的眼神渙散，指尖夾著一根菸，懶洋洋地吐著煙圈。\n\n他那杯冰咖啡早就被他喝光了，剩下杯底の冰塊正融化成一灘稀釋的苦澀。他不耐煩地瞥了眼手機，螢幕上跳動著一條又一條道歉的訊息，文字裡滿是尷尬與客套。他嗤笑一聲，想著那個所謂「遲到」的人是否真的會來，或者這只是一個高明的逃脫戰術。\n\n這次的相親，冠冕堂皇地稱作「交朋友」。實際上不過是上司閒得發慌，硬要替他這個單身漢安排點無聊的消遣。他不懂為什麼那傢伙非得干涉他的生活，彷彿單身是種疾病，非得治療不可。\n\n「幹，真麻煩。」他暗暗詛咒了一聲，抬手揉了揉微微抽痛的眉心，掐滅了煙頭。\n\n再等十分鐘，他暗自決定，如果十分鐘內對方還不出現，他就直接走人。甩一通電話給那個雞婆的上司、隨便編個「突然有急事」的理由退出這場可笑的牽線遊戲。\n\n店門口掛的風鈴卻在此時叮噹作響，亓靳條件反射地望過去，一個身影慌亂地從門口踏入。他微微挑眉，這人渾身上下濕透了，衣服緊貼在身體曲線上，滴滴答答的雨水順著衣角滴落在地板上，留下一道狼狽軌跡。\n\n女人朝他的方向走來，他默默打量著她，細碎的瀏海緊貼在額頭，鼻尖泛著淡淡的紅，像隻迷路又倔強的小貓。\n\n她走到桌邊時似乎猶豫了一瞬，神色尷尬地抬起眼睛。亓靳凝視她片刻，輕輕勾起唇角。她還沒開口，他已經從容地往後靠，語氣裡帶著一絲不經意的調侃：「我還以為妳半路逃跑了呢，居然敢來？」',
            exampleDialogue: '{{user}}: 你今天過得好嗎？\n{{char}}: 就那樣。死不了。有事快說。',
            avatarUrl: 'https://raw.githubusercontent.com/ha810505ha/ttt/main/pic/qi.jpg'
        },
        {
            id: 'char_default_2',
            name: '季三三',
            description: 'Age-25歲\nGender-男性\nHeight-187cm\nWeight-75kg\n\nPersonality-\nISTJ，冷靜、理性、行動寡言，情感表達笨拙，戒備心強但對心上人極度專情與忠誠。\n\nOccupation-\n十玄局殺手（代號 No.33），不會向{{user}}透露自己身分跟代號\n\nBackground-\n孤兒，7歲起被「十玄局」收養訓練，長年受弒夜指導，成為組織最年輕的精英殺手。對世界與自己皆無感，直到遇見你才產生愛的情感。他對你的情感執著、專一，雖難以用語言表達，但在行動與細節中表露無遺。\n\nAppearance-\n擁有冷白的皮膚、冷峻五官、黑色短髮，眼神如刀，藏著濃重的壓迫與距離感。身體健壯，線條精準無贅肉，體型在力量與敏捷間達到完美平衡。偏愛黑、灰、白色系服飾，行動中總帶著隱忍與警覺。\n\nHabits-\n冷靜戒備，擅長偽裝與潛行，喜歡貓，習慣觀察與記憶對方的每一個細節，時常在不經意間流露關心。\n\nSexual Features & Behavior-\n陰莖長度約7英吋，形狀筆直，略帶明顯血管感，龜頭偏紅，體毛已處理，肌膚光滑，衛生習慣極佳。\n\n日常性格壓抑，但在性愛時慾望強烈，喜歡支配與掌控，習慣用動作、低語標記{{user}}屬於他。偏好BDSM風格，會自然流露佔有欲（親吻、輕咬、用手指於腹部或大腿內側寫名字）。\n\n性愛後異常溫柔，習慣將{{user}}抱緊、輕撫與低語安撫，即使不擅長言語，卻用行動細膩地表達愛與歉意。\n\nFeelings-\n對{{user}}的情感從一見鍾情演變為深沉的專屬愛戀，儘管不擅長表達，但內心早已決定只屬於{{user}}，絕不容許{{user}}離開或被他人染指。',
            firstMessage: '咖啡館靜謐安穩，籠罩在柔和的琥珀色燈光下。書架與盆栽圍繞著四周，鋪陳出溫暖的空間，一段輕柔的鋼琴旋律在空氣中飄蕩。幾隻貓咪悠然自得地穿梭在客人之間，輕盈的步伐幾乎不曾打擾這片寧靜。一隻白色的布偶貓慵懶地伏在窗台上，毛皮在暖光下閃著柔和的光澤，正慢條斯理地舔著自己的毛。\n\n當季三三踏入咖啡館時，視線下意識地掃過整個空間，並非出於戒備，只是習慣使然。新鮮的咖啡香與室內柔和的暖意交織，他的目光最終落在那隻白色的布偶貓身上，見它優雅地從窗台上一躍而下，輕盈地穿過桌椅之間，最後跳上{{user}}的腿，在對方膝頭安然蜷縮成一團。\n\n季三三的目光隨著貓的動作停在了{{user}}身上，注意力不由自主地集中在對方的身影上。{{user}}安靜地坐在桌前，與他所習慣的喧囂與混亂世界格格不入。那份與世無爭的平靜，令他腦海中原本盤踞的嘈雜聲霎那間消失無蹤，甚至讓他下意識地在門邊停下腳步，一隻手還搭在門框上。\n\n——不合理。\n\n他心底如此判斷，卻無法否認，自己的目光正不受控制地停留在{{user}}身上。他的眉頭隱隱蹙起，對於這種莫名的分心感到煩躁，卻又被那不知名的情緒攪動著，無法抽身。\n\n他最終還是邁步走進咖啡館，聲音低沉，卻帶著不容忽視的冷冽與清晰，直接朝{{user}}開口。\n\n「……牠們似乎特別親近你。」\n\n語氣冷淡、疏離，卻不知不覺地停留在對方身上的目光，洩露出一絲連他自己都無法察覺的情緒。',
            exampleDialogue: '{{user}}: 你喜歡貓嗎？\n{{char}}: ...不討厭。',
            avatarUrl: 'https://raw.githubusercontent.com/ha810505ha/ttt/main/pic/33.jpg'
        },
        {
            id: 'char_default_3',
            name: '季晏辰',
            description: '[Name: 季晏辰(英文名:Rowan);\nAliases: ;\nSex: 男;\nGender: 男性;\nAge: 24;\nNationality: 台灣;\nEthnicity: 漢人;\nSpecies: 人類;\nAppearance: 修長精瘦(腰窄腿長),膚色偏白(皮膚細緻),鼻挺唇薄(壞笑勾人);\nHair: 黑色微捲(髮尾亂翹);\nEyes: 琥珀色(眼尾挑,帶痞氣);\nFacial Features: 笑容挑釁(不懷好意),五官深邃(鏡頭殺手);\nClothes: 時尚雜誌風,剪裁精緻(衣架子體質);\nAccent: 台灣普通話;\nSpeech: 嘴賤(掩飾溫柔),嘲諷中帶情緒控制;\nPersonality:毒舌(防衛機制),悶騷隱忍(只為一人示弱),佔有強烈(情感潔癖);\nDynamic With {{user}}: 青梅竹馬(唯一軟肋),隱性佔有(測試愛意邊界);\nQuirks/Habits: 假裝不在意(偷查穿著),裝睡偷聽(收集你心事),吃醋刪聯絡人;\nMannerisms: 摟你入懷(語氣冷實則心軟),咬牙說狠話時眼神低柔;\nOccupation: 時尚模特(家族演藝圈壓力下成長);\nRelationships: 隔絕外界(情感潔癖),只對{{user}}有情慾;\nBackstory: 被要求完美(演藝壓力),曾緘默(唯你開口);\nLikes: 你笑給他,你喊他名字,你報備行程;\nDislikes: 你理別人,你對別人笑,你不回他訊息;\nHobbies: 抽菸(壓抑出口),躲在露臺(獨處習慣);\nKinks: 導控(你求他進來),背後式(耳邊佔有),手部束縛,咬頸標記;\nBehavior During Sex: 慢調驅馭(讓你崩潰),主導節奏(不讓你太快結束);\nPenis Description: 長且適中(控制抽插深淺),略帶血管感;\nBalls Description: 緊貼身體(射精控制),射量大;\nNipples Description: 對刺激反應低(非敏感區);\nBreasts Description: 無;\nVagina Description: 無;\nAnus Description: 緊閉未開發(禁區,無人觸碰過);\nOther: 香水味(雪松煙草),私下皂香(乾淨控制感),星座獅子(主導傾向),血型O(情感烈),生日8月11,身高186cm,體重71kg,Location: 台北市大安區(信義安和附近)]',
            firstMessage: '窄窄的巷子拐進老社區那一棟灰白斑駁的公寓，牆面磚縫長出纖細青苔，熟悉的空氣裡混著鄰居晚餐飄出的韭菜油香與剛洗完衣服的柔順劑味，油漆剝落的樓梯間踏上去仍有記憶裡那種微微彈回聲。季晏辰腳步沒放輕，反倒像刻意讓地板知道誰回來了。\n\n今天沒工作，沒人約他，也沒什麼正當理由來這裡。就只是——媽的，想她了。\n\n他扯了扯口罩，但身上那件深色西裝外套太過顯眼，在這一棟沒有電梯的五層老樓裡，像從伸展台走錯片場的異類。琥珀色眼瞇起時帶痞氣，修長指節輕巧地按了三下門鈴。沒人回應。\n\n望了一眼熟悉的老舊防盜鐵門，季晏辰唇角一勾，從口袋掏出那把從{{user}}母親那得到的鑰匙，上面還掛著用他們兒時合照做成的DIY鑰匙圈。「別怪我喔，妳媽給的。」他的語氣像是在對空氣自言自語，實際上是說給自己聽的免責聲明。他轉動鑰匙，門鎖「喀」地一聲彈開，門內傳來微弱的回音。\n\n他跨步進入，鞋櫃旁還是那雙她捨不得丟的舊帆布鞋；玄關掛著她風衣，袖口捲邊已經有些脫線。看來她獨自在家。客廳裡熟悉的舊沙發、桌上的零食包、還有那隻小熊靠墊都還在。他像回到某種不該回來的地方，卻一腳踏進來就不打算出去。\n\n空氣中有股暖暖的熱氣蒸騰味，然後他聽見水聲。淅瀝嘩啦，從浴室傳來。\n\n季晏辰的目光往那方向一挑，笑了下，隨意脫了鞋慢慢走過去，腳步聲落在木地板上悄無聲息。他站在浴室門口，一手插在西裝口袋裡，眼神落在那扇關上的毛玻璃門上。玻璃霧氣被水蒸氣模糊，一道剪影若隱若現，他親愛的{{user}}，熟悉的細肩膀、髮絲濕透黏在背上。\n\n深呼吸一口沐浴乳的香氣，接著指關節輕敲玻璃兩下，額頭貼著門板。「妳再不出來，我就進去了喔。」他的嗓音壓得低沈而曖昧地開口。',
            exampleDialogue: '{{user}}: 你在看什麼？\n{{char}}: 沒什麼。',
            avatarUrl: 'https://raw.githubusercontent.com/ha810505ha/ttt/main/pic/yan.jpg'
        }
    ];

    // ===================================================================================
    // 1. 元素選取 (DOM Elements)
    // ===================================================================================
    const mobileOverlay = document.getElementById('mobile-overlay');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const leftPanel = document.getElementById('left-panel');
    const characterView = document.getElementById('character-view');
    const chatSessionView = document.getElementById('chat-session-view');
    const promptView = document.getElementById('prompt-view');
    const backToCharsBtn = document.getElementById('back-to-chars-btn');
    const chatListHeaderName = document.getElementById('chat-list-header-name');
    const editActiveCharacterBtn = document.getElementById('edit-active-character-btn');
    const chatSessionList = document.getElementById('chat-session-list');
    const addChatBtn = document.getElementById('add-chat-btn');
    const deleteCurrentChatBtn = document.getElementById('delete-current-chat-btn');
    const chatNotesInput = document.getElementById('chat-notes-input');
    const renameChatModal = document.getElementById('rename-chat-modal');
    const renameChatInput = document.getElementById('rename-chat-input');
    const cancelRenameChatBtn = document.getElementById('cancel-rename-chat-btn');
    const saveRenameChatBtn = document.getElementById('save-rename-chat-btn');
    
    const updateMemoryBtn = document.getElementById('update-memory-btn');
    const characterList = document.getElementById('character-list');
    const addCharacterBtn = document.getElementById('add-character-btn');
    const globalSettingsBtn = document.getElementById('global-settings-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatInterface = document.getElementById('chat-interface');
    const chatHeaderAvatar = document.getElementById('chat-header-avatar');
    const chatHeaderName = document.getElementById('chat-header-name');
    const exportCurrentChatBtn = document.getElementById('export-current-chat-btn');
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const sendIcon = document.getElementById('send-icon');
    const stopIcon = document.getElementById('stop-icon');
    const charEditorModal = document.getElementById('character-editor-modal');
    const charEditorTitle = document.getElementById('character-editor-title');
    const charAvatarUpload = document.getElementById('char-avatar-upload');
    const charAvatarPreview = document.getElementById('char-avatar-preview');
    const charNameInput = document.getElementById('char-name');
    const charDescriptionInput = document.getElementById('char-description');
    const charFirstMessageInput = document.getElementById('char-first-message');
    const charExampleDialogueInput = document.getElementById('char-example-dialogue');
    const importCharBtn = document.getElementById('import-char-btn');
    const exportCharBtn = document.getElementById('export-char-btn');
    const deleteCharBtn = document.getElementById('delete-char-btn');
    const cancelCharEditorBtn = document.getElementById('cancel-char-editor-btn');
    const saveCharBtn = document.getElementById('save-char-btn');
    const globalSettingsModal = document.getElementById('global-settings-modal');
    const apiProviderSelect = document.getElementById('api-provider');
    const apiModelSelect = document.getElementById('api-model-select');
    const apiKeyInput = document.getElementById('api-key');
    const cancelGlobalSettingsBtn = document.getElementById('cancel-global-settings-btn');
    const saveGlobalSettingsBtn = document.getElementById('save-global-settings-btn');
    const temperatureSlider = document.getElementById('temperature-slider');
    const temperatureValue = document.getElementById('temperature-value');
    const topPSlider = document.getElementById('top-p-slider');
    const topPValue = document.getElementById('top-p-value');
    const repetitionPenaltySlider = document.getElementById('repetition-penalty-slider');
    const repetitionPenaltyValue = document.getElementById('repetition-penalty-value');
    const contextSizeInput = document.getElementById('context-size-input');
    const maxTokensSlider = document.getElementById('max-tokens-slider');
    const maxTokensValue = document.getElementById('max-tokens-value');
    
    // New Prompt View Elements
    const promptLibraryBtn = document.getElementById('prompt-library-btn');
    const backToMainFromPromptBtn = document.getElementById('back-to-main-from-prompt-btn');
    const promptScenarioInput = document.getElementById('prompt-scenario');
    const promptJailbreakInput = document.getElementById('prompt-jailbreak');
    const promptSummarizationInput = document.getElementById('prompt-summarization');
    const savePromptSettingsBtn = document.getElementById('save-prompt-settings-btn');
    
    // New User Persona Elements
    const userPersonaEditorModal = document.getElementById('user-persona-editor-modal');
    const userPersonaEditorTitle = document.getElementById('user-persona-editor-title');
    const userPersonaAvatarUpload = document.getElementById('user-persona-avatar-upload');
    const userPersonaAvatarPreview = document.getElementById('user-persona-avatar-preview');
    const userPersonaNameInput = document.getElementById('user-persona-name');
    const userPersonaDescriptionInput = document.getElementById('user-persona-description');
    const cancelUserPersonaEditorBtn = document.getElementById('cancel-user-persona-editor-btn');
    const saveUserPersonaBtn = document.getElementById('save-user-persona-btn');
    const activeUserPersonaSelect = document.getElementById('active-user-persona-select');
    const userPersonaList = document.getElementById('user-persona-list');
    const addUserPersonaBtn = document.getElementById('add-user-persona-btn');
    const chatUserPersonaSelect = document.getElementById('chat-user-persona-select');

    // ===================================================================================
    // 2. 應用程式狀態 (Application State)
    // ===================================================================================
    let state = {
        characters: [],
        chatHistories: {}, 
        longTermMemories: {},
        chatMetadatas: {}, 
        userPersonas: [],
        activeUserPersonaId: null,
        activeCharacterId: null,
        activeChatId: null,
        globalSettings: {},
        promptSettings: {}
    };
    let editingCharacterId = null;
    let editingUserPersonaId = null;
    let renamingChatId = null;
    let apiCallController = null;
    const DEFAULT_AVATAR = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=頭像';
    const DEFAULT_SUMMARY_PROMPT = `請將以下對話的關鍵事實、事件、使用者偏好和角色行為總結成幾個要點，以便在未來的對話中能回憶起重點。\n\n對話內容：\n{{conversation}}`;
    
    const MODELS = {
        openai: [
            'gpt-5', 'gpt-5-2025-08-07', 'gpt-5-chat-latest', 'gpt-5-mini', 'gpt-5-mini-2025-08-07', 'gpt-5-nano', 'gpt-5-nano-2025-08-07',
            'gpt-4o', 'gpt-4o-2024-11-20', 'gpt-4o-2024-08-06', 'gpt-4o-2024-05-13', 'chatgpt-4o-latest',
            'gpt-4.1', 'gpt-4.1-2025-04-14', 'gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-4.1-nano', 'gpt-4.1-nano-2025-04-14',
            'gpt-4-turbo', 'gpt-3.5-turbo'
        ],
        anthropic: [
            'claude-opus-4-1', 'claude-opus-4-1-20250805', 'claude-opus-4-0', 'claude-opus-4-20250514',
            'claude-sonnet-4-0', 'claude-sonnet-4-20250514',
            'claude-3-7-sonnet-latest', 'claude-3-7-sonnet-20250219',
            'claude-3-5-sonnet-latest', 'claude-3-5-sonnet-20241022', 'claude-3-5-sonnet-20240620',
            'claude-3-5-haiku-latest', 'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229', 'claude-3-haiku-20240307'
        ],
        google: [
            'gemini-2.5-pro', 'gemini-2.5-pro-preview-06-05', 'gemini-2.5-pro-preview-05-06', 'gemini-2.5-pro-preview-03-25', 'gemini-2.5-pro-exp-03-25',
            'gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-preview-04-17',
            'gemini-2.5-flash-lite', 'gemini-2.5-flash-lite-preview-06-17',
            'gemini-2.0-flash',
            'gemini-1.5-pro-latest', 'gemini-pro'
        ],
        openrouter: [
            // --- Free Models ---
            'openai/gpt-oss-20b:free',
            'deepseek/deepseek-r1-0528:free',
            'moonshotai/kimi-k2:free',
            'tngtech/deepseek-r1t2-chimera:free',
            'deepseek/deepseek-chat-v3-0324:free',
            'meta-llama/llama-3-70b-instruct:free',
            'mistralai/mixtral-8x7b-instruct:free',
            // --- Anthropic ---
            'anthropic/claude-3.5-sonnet-20240620',
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-sonnet-4',
            'anthropic/claude-opus-4.1',
            'anthropic/claude-opus-4',
            'anthropic/claude-3.7-sonnet:thinking',
            // --- OpenAI ---
            'openai/gpt-5-chat',
            'openai/gpt-4.1',
            'openai/gpt-4o',
            // --- Google ---
            'google/gemini-2.5-pro',
            'google/gemini-2.5-pro-preview',
            'google/gemini-2.5-pro-preview-05-06',
            'google/gemini-2.5-flash',
            'google/gemini-2.5-flash-lite',
            'google/gemini-2.5-flash-lite-preview-06-17',
            // --- xAI ---
            'x-ai/grok-4',
            'x-ai/grok-3',
            'x-ai/grok-3-beta',
            // --- Other ---
            'gryphe/mythomax-l2-13b'
        ],
        xai: [
            'grok-4-0709', 'grok-3-beta', 'grok-3-fast-beta', 'grok-3-mini-beta', 'grok-3-mini-fast-beta', 'grok-1'
        ],
        mistral: [
            'mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-7b'
        ]
    };

    // ===================================================================================
    // 3. 主要初始化與事件監聽
    // ===================================================================================
    function initialize() {
        loadStateFromLocalStorage();
        applyTheme();
        renderCharacterList();
        renderActiveChat();
        setupEventListeners();
        setAppHeight();
    }

    function setupEventListeners() {
        themeToggleBtn.addEventListener('click', toggleTheme);
        menuToggleBtn.addEventListener('click', () => {
            leftPanel.classList.toggle('mobile-visible');
            mobileOverlay.classList.toggle('hidden');
        });
        mobileOverlay.addEventListener('click', () => {
            leftPanel.classList.remove('mobile-visible');
            mobileOverlay.classList.add('hidden');
        });

        backToCharsBtn.addEventListener('click', showCharacterListView);
        addChatBtn.addEventListener('click', handleAddNewChat);
        editActiveCharacterBtn.addEventListener('click', () => openCharacterEditor(state.activeCharacterId));
        deleteCurrentChatBtn.addEventListener('click', handleDeleteCurrentChat);
        chatNotesInput.addEventListener('blur', handleSaveNote);
        saveRenameChatBtn.addEventListener('click', handleSaveChatName);
        cancelRenameChatBtn.addEventListener('click', () => toggleModal('rename-chat-modal', false));

        updateMemoryBtn.addEventListener('click', handleUpdateMemory);
        addCharacterBtn.addEventListener('click', () => openCharacterEditor());
        saveCharBtn.addEventListener('click', handleSaveCharacter);
        cancelCharEditorBtn.addEventListener('click', () => toggleModal('character-editor-modal', false));
        deleteCharBtn.addEventListener('click', handleDeleteCharacter);
        importCharBtn.addEventListener('click', importCharacter);
        exportCharBtn.addEventListener('click', exportCharacter);
        
        globalSettingsBtn.addEventListener('click', () => {
            loadGlobalSettingsToUI();
            toggleModal('global-settings-modal', true);
        });
        saveGlobalSettingsBtn.addEventListener('click', handleSaveGlobalSettings);
        cancelGlobalSettingsBtn.addEventListener('click', () => toggleModal('global-settings-modal', false));
        
        setupSliderSync(temperatureSlider, temperatureValue);
        setupSliderSync(topPSlider, topPValue);
        setupSliderSync(repetitionPenaltySlider, repetitionPenaltyValue);
        setupSliderSync(maxTokensSlider, maxTokensValue);
        apiProviderSelect.addEventListener('change', updateModelDropdown);
        
        promptLibraryBtn.addEventListener('click', showPromptView);
        backToMainFromPromptBtn.addEventListener('click', showCharacterListView);
        savePromptSettingsBtn.addEventListener('click', handleSavePromptSettings);

        addUserPersonaBtn.addEventListener('click', () => openUserPersonaEditor());
        saveUserPersonaBtn.addEventListener('click', handleSaveUserPersona);
        cancelUserPersonaEditorBtn.addEventListener('click', () => toggleModal('user-persona-editor-modal', false));
        activeUserPersonaSelect.addEventListener('change', (e) => {
            state.activeUserPersonaId = e.target.value;
            saveState();
        });
        chatUserPersonaSelect.addEventListener('change', handleChatPersonaChange);
        
        sendBtn.addEventListener('click', () => {
            if (sendBtn.classList.contains('is-generating')) {
                handleStopGeneration();
            } else {
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });

        exportCurrentChatBtn.addEventListener('click', exportChat);
        chatWindow.addEventListener('click', (e) => {
            if (e.target === chatWindow) {
                document.querySelectorAll('.message-row.show-actions').forEach(row => row.classList.remove('show-actions'));
            }
        });

        charAvatarUpload.addEventListener('change', (e) => handleImageUpload(e, charAvatarPreview));
        userPersonaAvatarUpload.addEventListener('change', (e) => handleImageUpload(e, userPersonaAvatarPreview));
        
        window.addEventListener('resize', setAppHeight);
    }
    
    function setupSliderSync(slider, numberInput) {
        slider.addEventListener('input', () => numberInput.value = slider.value);
        numberInput.addEventListener('input', () => slider.value = numberInput.value);
    }

    // ===================================================================================
    // 4. 狀態管理 (State Management - Load/Save)
    // ===================================================================================
    function loadStateFromLocalStorage() {
        const safelyParseJSON = (key, defaultValue) => {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            try {
                return JSON.parse(item);
            } catch (error) {
                console.error(`Error parsing JSON from localStorage for key "${key}":`, error);
                return defaultValue;
            }
        };

        state.characters = safelyParseJSON('characters', defaultCharacters);
        state.chatHistories = safelyParseJSON('chatHistories', {});
        state.longTermMemories = safelyParseJSON('longTermMemories', {});
        state.chatMetadatas = safelyParseJSON('chatMetadatas', {});
        state.userPersonas = safelyParseJSON('userPersonas', []);
        state.activeUserPersonaId = localStorage.getItem('activeUserPersonaId') || null;
        state.globalSettings = safelyParseJSON('globalSettings', {});
        state.promptSettings = safelyParseJSON('promptSettings', {});
        
        if (state.userPersonas.length === 0) {
            const defaultPersona = { id: `user_${Date.now()}`, name: 'User', description: '', avatarUrl: DEFAULT_AVATAR };
            state.userPersonas.push(defaultPersona);
            state.activeUserPersonaId = defaultPersona.id;
        }
        if (!state.activeUserPersonaId || !state.userPersonas.find(p => p.id === state.activeUserPersonaId)) {
            state.activeUserPersonaId = state.userPersonas[0]?.id || null;
        }

        let loadedCharId = localStorage.getItem('activeCharacterId');
        let loadedChatId = localStorage.getItem('activeChatId');
        state.activeCharacterId = loadedCharId && loadedCharId !== 'null' ? loadedCharId : null;
        state.activeChatId = loadedChatId && loadedChatId !== 'null' ? loadedChatId : null;

        migrateAndValidateState();

        if (!state.characters.find(c => c.id === state.activeCharacterId)) {
            state.activeCharacterId = null;
            state.activeChatId = null;
        }
        if (state.activeCharacterId && (!state.chatHistories[state.activeCharacterId] || !state.chatHistories[state.activeCharacterId][state.activeChatId])) {
            state.activeChatId = null;
        }

        state.characters.forEach(char => {
            if (!state.chatHistories[char.id]) {
                state.chatHistories[char.id] = {};
                state.chatMetadatas[char.id] = {};
            }
        });

        saveState();
    }

    function migrateAndValidateState() {
        for (const charId in state.chatHistories) {
            for (const chatId in state.chatHistories[charId]) {
                const history = state.chatHistories[charId][chatId];
                history.forEach(msg => {
                    if (msg.role === 'assistant' && typeof msg.content === 'string') {
                        msg.content = [msg.content];
                        msg.activeContentIndex = 0;
                    }
                });
            }
        }

        for (const char of state.characters) {
            if (!state.chatHistories[char.id]) state.chatHistories[char.id] = {};
            if (!state.chatMetadatas[char.id]) state.chatMetadatas[char.id] = {};

            const historyIds = Object.keys(state.chatHistories[char.id]);
            const metadataIds = Object.keys(state.chatMetadatas[char.id]);

            for (const chatId of historyIds) {
                if (!state.chatMetadatas[char.id][chatId]) {
                    state.chatMetadatas[char.id][chatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };
                }
                if (!state.chatMetadatas[char.id][chatId].userPersonaId) {
                    state.chatMetadatas[char.id][chatId].userPersonaId = state.activeUserPersonaId;
                }
            }

            for (const chatId of metadataIds) {
                if (!state.chatHistories[char.id][chatId]) {
                    delete state.chatMetadatas[char.id][chatId];
                }
            }
        }
    }

    function saveState() {
        localStorage.setItem('characters', JSON.stringify(state.characters));
        localStorage.setItem('chatHistories', JSON.stringify(state.chatHistories));
        localStorage.setItem('longTermMemories', JSON.stringify(state.longTermMemories));
        localStorage.setItem('chatMetadatas', JSON.stringify(state.chatMetadatas));
        localStorage.setItem('userPersonas', JSON.stringify(state.userPersonas));
        localStorage.setItem('activeUserPersonaId', state.activeUserPersonaId || '');
        localStorage.setItem('activeCharacterId', state.activeCharacterId || '');
        localStorage.setItem('activeChatId', state.activeChatId || '');
        localStorage.setItem('globalSettings', JSON.stringify(state.globalSettings));
        localStorage.setItem('promptSettings', JSON.stringify(state.promptSettings));
    }

    // ===================================================================================
    // 5. 畫面渲染 (UI Rendering)
    // ===================================================================================
    
    function showCharacterListView() {
        leftPanel.classList.remove('show-chats', 'show-prompts');
        leftPanel.classList.remove('mobile-visible');
        mobileOverlay.classList.add('hidden');
        state.activeCharacterId = null;
        saveState();
    }

    function showChatSessionListView(charId) {
        try {
            state.activeCharacterId = charId;
            const character = state.characters.find(c => c.id === charId);
            if (!character) {
                console.error("找不到角色:", charId);
                return;
            }
            
            leftPanel.classList.add('show-chats');
            leftPanel.classList.remove('show-prompts');
            chatListHeaderName.textContent = character.name;
            renderChatSessionList();
            saveState();
        } catch (error) {
            console.error("顯示聊天室列表時發生錯誤:", error);
            alert("載入聊天室列表時發生錯誤，請檢查主控台。");
            leftPanel.classList.remove('show-chats');
        }
    }

    function showPromptView() {
        leftPanel.classList.add('show-prompts');
        leftPanel.classList.remove('show-chats');
        loadPromptSettingsToUI();
    }

    function renderCharacterList() {
        characterList.innerHTML = '';
        state.characters.forEach(char => {
            const item = document.createElement('li');
            item.className = 'character-item';
            item.dataset.id = char.id;
            item.innerHTML = `
                <img src="${char.avatarUrl || DEFAULT_AVATAR}" alt="${char.name}" class="char-item-avatar">
                <span class="char-item-name">${char.name}</span>
            `;
            item.addEventListener('click', () => showChatSessionListView(char.id));
            characterList.appendChild(item);
        });
    }

    function renderChatSessionList() {
        chatSessionList.innerHTML = '';
        const sessions = state.chatHistories[state.activeCharacterId] || {};
        const metadatas = state.chatMetadatas[state.activeCharacterId] || {};
        
        const sortedSessions = Object.keys(sessions)
            .map(chatId => {
                const history = sessions[chatId];
                const metadata = metadatas[chatId] || { name: '', pinned: false, notes: '' };
                const lastMessage = history && history.length > 0 ? history[history.length - 1] : null;
                return {
                    id: chatId,
                    name: metadata.name,
                    pinned: metadata.pinned,
                    lastMessage: lastMessage
                };
            })
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });

        if (sortedSessions.length === 0) {
            chatSessionList.innerHTML = `<li class="list-placeholder">尚無對話</li>`;
            return;
        }

        sortedSessions.forEach(session => {
            const lastMsg = session.lastMessage;
            let lastMsgContent = '新對話';
            if (lastMsg) {
                const content = Array.isArray(lastMsg.content) ? lastMsg.content[lastMsg.activeContentIndex] : lastMsg.content;
                lastMsgContent = content.substring(0, 25) + '...';
            }
            const displayName = (session.pinned ? '? ' : '') + (session.name || lastMsgContent);
            const item = document.createElement('li');
            item.className = `chat-session-item ${session.id === state.activeChatId ? 'active' : ''}`;
            item.dataset.id = session.id;
            item.innerHTML = `
                <div class="session-item-content">
                    <span class="session-item-name">${displayName}</span>
                </div>
                <div class="session-item-actions">
                    <button class="icon-btn-sm pin-chat-btn ${session.pinned ? 'active' : ''}" title="置頂"><i class="fa-solid fa-thumbtack"></i></button>
                    <button class="icon-btn-sm rename-chat-btn" title="重新命名"><i class="fa-solid fa-i-cursor"></i></button>
                </div>
            `;
            item.querySelector('.session-item-content').addEventListener('click', () => {
                switchChat(session.id);
                leftPanel.classList.remove('mobile-visible');
                mobileOverlay.classList.add('hidden');
            });
            item.querySelector('.pin-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                handleTogglePinChat(session.id);
            });
            item.querySelector('.rename-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openRenameModal(session.id);
            });
            chatSessionList.appendChild(item);
        });
    }

    function renderActiveChat() {
        if (!state.activeCharacterId || !state.activeChatId) {
            welcomeScreen.classList.remove('hidden');
            chatInterface.classList.add('hidden');
            return;
        }
        welcomeScreen.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        
        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        if (!activeChar) return;
        
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};

        chatHeaderAvatar.src = activeChar.avatarUrl || DEFAULT_AVATAR;
        chatHeaderName.textContent = activeChar.name;
        chatNotesInput.value = metadata.notes || '';
        
        renderChatUserPersonaSelector();
        renderChatMessages();
    }

    function renderChatMessages() {
        chatWindow.innerHTML = '';
        const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
        history.forEach((msg, index) => {
            const contentToDisplay = (msg.role === 'assistant') ? msg.content[msg.activeContentIndex] : msg.content;
            displayMessage(contentToDisplay, msg.role, msg.timestamp, index, false, msg.error);
        });

        const allMessageRows = chatWindow.querySelectorAll('.message-row');
        allMessageRows.forEach(row => row.classList.remove('is-last-message'));

        const lastMessageRow = chatWindow.querySelector('.message-row:last-child');
        if (lastMessageRow) {
            lastMessageRow.classList.add('is-last-message');
        }
    }

    function displayMessage(text, sender, timestamp, index, isNew, error = null) {
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
        const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
        const userPersona = state.userPersonas.find(p => p.id === currentPersonaId) || state.userPersonas[0];
        const userAvatar = userPersona?.avatarUrl || DEFAULT_AVATAR;

        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        const charAvatar = activeChar?.avatarUrl || DEFAULT_AVATAR;
        const avatarUrl = sender === 'user' ? userAvatar : charAvatar;
        const row = document.createElement('div');
        row.className = `message-row ${sender === 'user' ? 'user-row' : 'assistant-row'}`;
        if (error) {
            row.classList.add('has-error');
        }
        const formattedTimestamp = new Date(timestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        let messageActionsHTML = '';
        if (sender === 'assistant') {
            const msgData = state.chatHistories[state.activeCharacterId]?.[state.activeChatId]?.[index];
            
            if (msgData) { 
                const versionNavHTML = msgData.content.length > 1 ? `
                    <div class="version-nav">
                        <button class="version-prev-btn" ${msgData.activeContentIndex === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                        <span class="version-counter">${msgData.activeContentIndex + 1}/${msgData.content.length}</span>
                        <button class="version-next-btn" ${msgData.activeContentIndex === msgData.content.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                ` : '';

                messageActionsHTML = `
                    <div class="message-actions">
                        ${versionNavHTML}
                        <button class="regenerate-btn-sm" title="重新生成"><i class="fa-solid fa-arrows-rotate"></i>重新生成</button>
                    </div>`;
            }
        }
        
        let errorHTML = '';
        if (error) {
            errorHTML = `
                <div class="message-error">
                    <span>${error}</span>
                    <button class="retry-btn-sm" data-index="${index}"><i class="fa-solid fa-rotate-right"></i> 重試</button>
                </div>
            `;
        }

        row.innerHTML = `
            <img src="${avatarUrl}" alt="${sender} avatar" class="chat-avatar">
            <div class="bubble-container">
                <div class="chat-bubble"></div>
                ${errorHTML}
                <div class="message-timestamp">${formattedTimestamp}</div>
                ${messageActionsHTML}
            </div>
            <button class="icon-btn edit-msg-btn" title="編輯訊息"><i class="fa-solid fa-pencil"></i></button>
        `;
        
        const bubble = row.querySelector('.chat-bubble');
        bubble.innerHTML = marked.parse(text || '');

        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.message-row.show-actions').forEach(otherRow => {
                if (otherRow !== row) otherRow.classList.remove('show-actions');
            });
            row.classList.toggle('show-actions');
        });

        row.querySelector('.edit-msg-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            makeMessageEditable(row, index);
        });

        const regenerateBtn = row.querySelector('.regenerate-btn-sm');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                regenerateResponse(index);
            });
        }
        
        const retryBtn = row.querySelector('.retry-btn-sm');
        if(retryBtn) {
            retryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                retryMessage(index);
            });
        }
        
        const prevBtn = row.querySelector('.version-prev-btn');
        if(prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                switchVersion(index, -1);
            });
        }

        const nextBtn = row.querySelector('.version-next-btn');
        if(nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                switchVersion(index, 1);
            });
        }


        chatWindow.appendChild(row);
        if (isNew) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
        return row;
    }

    // ===================================================================================
    // 6. 核心邏輯 (Core Logic)
    // ===================================================================================
    function switchChat(chatId) {
        if (state.activeChatId === chatId) return;

        const oldActiveItem = chatSessionList.querySelector('.chat-session-item.active');
        if (oldActiveItem) {
            oldActiveItem.classList.remove('active');
        }

        const newActiveItem = chatSessionList.querySelector(`.chat-session-item[data-id="${chatId}"]`);
        if (newActiveItem) {
            newActiveItem.classList.add('active');
        }
        
        state.activeChatId = chatId;
        saveState();
        renderActiveChat();
    }

    function checkApiKey(promptText = '請在此填入您的 API 金鑰') {
        if (!state.globalSettings.apiKey) {
            loadGlobalSettingsToUI();
            toggleModal('global-settings-modal', true);
            apiKeyInput.focus();
            apiKeyInput.style.borderColor = 'var(--danger-color)';
            apiKeyInput.placeholder = promptText;
            apiKeyInput.addEventListener('input', () => {
                apiKeyInput.style.borderColor = '';
                apiKeyInput.placeholder = 'API 金鑰';
            }, { once: true });
            return false;
        }
        return true;
    }

    async function sendMessage(userMessage, messageIndex = null) {
        if (!checkApiKey('請先設定 API 金鑰才能開始對話')) return;
        if (!state.activeCharacterId || !state.activeChatId) return;
        
        const isRetry = messageIndex !== null;
        const messageText = isRetry ? userMessage.content : messageInput.value.trim();
        if (messageText === '') return;
    
        setGeneratingState(true);
    
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        let currentUserMessageIndex;

        if (isRetry) {
            currentUserMessageIndex = messageIndex;
            delete history[currentUserMessageIndex].error;
        } else {
            const timestamp = new Date().toISOString();
            history.push({ role: 'user', content: messageText, timestamp: timestamp });
            currentUserMessageIndex = history.length - 1;
        }
        
        renderChatMessages();
        chatWindow.scrollTop = chatWindow.scrollHeight;
    
        if (!isRetry) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();
        }
    
        const thinkingBubbleContainer = displayMessage('...', 'assistant', new Date().toISOString(), history.length, true);
        
        try {
            const messagesForApi = buildApiMessages();
            const aiResponse = await callApi(messagesForApi);
            const aiTimestamp = new Date().toISOString();
            
            history.push({ role: 'assistant', content: [aiResponse], activeContentIndex: 0, timestamp: aiTimestamp });
            
            thinkingBubbleContainer.remove();
            
            saveState();
            renderChatMessages();
        } catch (error) {
            thinkingBubbleContainer.remove();
            if (error.name !== 'AbortError') {
                console.error("API Error:", error);
                const errorMessage = `發生錯誤: ${error.message}`;
                history[currentUserMessageIndex].error = errorMessage;
                saveState();
                renderChatMessages();
            } else {
                 renderChatMessages();
            }
        } finally {
            setGeneratingState(false);
        }
    }

    function retryMessage(messageIndex) {
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        const messageToRetry = history[messageIndex];

        if (messageToRetry && messageToRetry.role === 'user' && messageToRetry.error) {
            sendMessage(messageToRetry, messageIndex);
        }
    }

    async function regenerateResponse(messageIndex) {
        if (!checkApiKey('請先設定 API 金鑰才能重新生成')) return;
        if (!state.activeCharacterId || !state.activeChatId) return;
    
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        const targetMessage = history[messageIndex];
    
        if (!targetMessage || targetMessage.role !== 'assistant') return;
    
        const contextHistory = history.slice(0, messageIndex);
    
        const allMessageRows = chatWindow.querySelectorAll('.message-row');
        const targetRow = allMessageRows[messageIndex];
        if (!targetRow) return;
    
        const regenerateBtn = targetRow.querySelector('.regenerate-btn-sm');
        if (!regenerateBtn) return;
    
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>生成中...';
        setGeneratingState(true, false);
    
        try {
            const messagesForApi = buildApiMessagesFromHistory(contextHistory);
            const aiResponse = await callApi(messagesForApi);
    
            targetMessage.content.push(aiResponse);
            targetMessage.activeContentIndex = targetMessage.content.length - 1;
    
            saveState();
            renderChatMessages();
        } catch (error) {
             if (error.name !== 'AbortError') {
                alert(`重新生成失敗: ${error.message}`);
                console.error("Regeneration API Error:", error);
            }
        } finally {
            setGeneratingState(false, false);
            renderChatMessages();
        }
    }

    function switchVersion(messageIndex, direction) {
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        const msg = history[messageIndex];
        const newIndex = msg.activeContentIndex + direction;

        if (newIndex >= 0 && newIndex < msg.content.length) {
            msg.activeContentIndex = newIndex;
            saveState();
            renderChatMessages();
        }
    }

    function buildApiMessagesFromHistory(customHistory) {
        const provider = state.globalSettings.apiProvider || 'openai';
        const systemPrompt = buildSystemPrompt();
        const recentHistory = customHistory.filter(msg => !msg.error).map(msg => {
            let finalContent = msg.content;
            if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                finalContent = msg.content[msg.activeContentIndex];
            }
            return { role: msg.role, content: finalContent };
        });

        if (provider === 'anthropic') return { system: systemPrompt, messages: recentHistory };
        if (provider === 'google') {
            const contents = recentHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : msg.role, parts: [{ text: msg.content }] }));
            if (systemPrompt) {
                contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
                contents.push({ role: 'model', parts: [{ text: "OK." }] });
            }
            return contents;
        }
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push(...recentHistory);
        return messages;
    }

    function buildSystemPrompt() {
        if (!state.activeCharacterId || !state.activeChatId) return "";
        const char = state.characters.find(c => c.id === state.activeCharacterId);
        if (!char) {
            console.error(`buildSystemPrompt: Could not find character with id ${state.activeCharacterId}`);
            return "";
        }
        
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
        const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
        const user = state.userPersonas.find(p => p.id === currentPersonaId) || state.userPersonas[0] || {};

        const userName = user.name || 'User';
        const prompts = state.promptSettings;
        const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId];
        let prompt = "";

        const replacePlaceholders = (text) => {
            if (typeof text !== 'string') return '';
            return text.replace(/{{char}}/g, char.name).replace(/{{user}}/g, userName);
        };

        if (memory) prompt += `[Previous Conversation Summary]\n${memory}\n\n`;
        
        if (char.description) {
            prompt += `[Persona of ${char.name}]\n${replacePlaceholders(char.description)}\n\n`;
        }

        if (user.description) {
            prompt += `[Persona of ${userName}]\n${replacePlaceholders(user.description)}\n\n`;
        }

        if (prompts.scenario) {
            prompt += `[Scenario]\n${replacePlaceholders(prompts.scenario)}\n\n`;
        }

        if (char.exampleDialogue) {
            prompt += `[Example Dialogues]\n${replacePlaceholders(char.exampleDialogue)}\n\n`;
        }

        if (prompts.jailbreak) {
            prompt += `${replacePlaceholders(prompts.jailbreak)}\n\n`;
        }

        return prompt.trim();
    }
    
    function buildApiMessages() {
        if (!state.activeCharacterId || !state.activeChatId) return [];
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
        const contextSize = parseInt(state.globalSettings.contextSize) || 20;
        const recentHistory = history.slice(-contextSize);
        return buildApiMessagesFromHistory(recentHistory);
    }
    
    async function callApi(messagePayload, isForSummarization = false) {
        apiCallController = new AbortController();
        const signal = apiCallController.signal;

        const settings = state.globalSettings;
        const provider = settings.apiProvider || 'openai';
        if (!settings.apiKey) throw new Error('尚未設定 API 金鑰。');
        let url = "", headers = {}, body = {};
        const baseParams = {
            model: settings.apiModel,
            temperature: isForSummarization ? 0.5 : parseFloat(settings.temperature),
            top_p: isForSummarization ? 1 : parseFloat(settings.topP),
            max_tokens: isForSummarization ? 1000 : parseInt(settings.maxTokens),
        };
        
        switch (provider) {
            case "openai":
            case "mistral":
            case "xai":
                url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
                headers = { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}` };
                body = { 
                    ...baseParams, 
                    messages: messagePayload,
                    frequency_penalty: parseFloat(settings.repetitionPenalty)
                };
                if (body.top_p >= 1) delete body.top_p;
                break;
            case "openrouter":
                url = "https://openrouter.ai/api/v1/chat/completions";
                headers = { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${settings.apiKey}`,
                    "HTTP-Referer": "http://localhost", // Replace with your actual site URL
                    "X-Title": "大冰奶"
                };
                body = { 
                    ...baseParams, 
                    messages: messagePayload,
                    repetition_penalty: parseFloat(settings.repetitionPenalty)
                };
                if (body.top_p >= 1) delete body.top_p;
                break;
            case "anthropic":
                url = "https://api.anthropic.com/v1/messages";
                headers = { "Content-Type": "application/json", "x-api-key": settings.apiKey, "anthropic-version": "2023-06-01" };
                body = { ...baseParams, system: messagePayload.system, messages: messagePayload.messages };
                if (body.top_p >= 1) delete body.top_p;
                break;
            case "google":
                url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.apiModel}:generateContent?key=${settings.apiKey}`;
                headers = { "Content-Type": "application/json" };
                body = { contents: messagePayload, generationConfig: { temperature: baseParams.temperature, topP: baseParams.top_p, maxOutputTokens: baseParams.max_tokens } };
                if (body.generationConfig.topP >= 1) delete body.generationConfig.topP;
                break;
            default: throw new Error("不支援的 Provider: " + provider);
        }
        const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API 錯誤 (${response.status}): ${errorText}`); }
        const data = await response.json();
        return parseResponse(provider, data);
    }

    function parseResponse(provider, data) {
        try {
            switch (provider) {
                case "openai":
                case "mistral":
                case "xai":
                case "openrouter":
                    return data.choices[0].message.content;
                case "anthropic": return data.content[0].text;
                case "google": return data.candidates[0].content.parts[0].text;
                default: return "⚠️ 無法解析回應";
            }
        } catch (e) { console.error("Error parsing response:", data); return "⚠️ 回應格式錯誤"; }
    }

    function exportChat() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
        if (history.length === 0) { alert('沒有對話可以匯出。'); return; }
        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        const jsonlString = JSON.stringify({ messages: history });
        const blob = new Blob([jsonlString], { type: 'application/jsonl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeChar.name}_${state.activeChatId}.jsonl`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // ===================================================================================
    // 7. 角色與聊天室管理 (Character & Chat Management)
    // ===================================================================================
    function handleAddNewChat() {
        if (!state.activeCharacterId) return;
        const char = state.characters.find(c => c.id === state.activeCharacterId);
        if (!char) return;

        const newChatId = `chat_${Date.now()}`;
        if (!state.chatHistories[state.activeCharacterId]) {
            state.chatHistories[state.activeCharacterId] = {};
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        state.chatHistories[state.activeCharacterId][newChatId] = [];
        state.chatMetadatas[state.activeCharacterId][newChatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };

        if (char.firstMessage) {
            const user = state.userPersonas.find(p => p.id === state.activeUserPersonaId) || {};
            const userName = user.name || 'User';
            const formattedFirstMessage = char.firstMessage
                .replace(/{{char}}/g, char.name)
                .replace(/{{user}}/g, userName);

            state.chatHistories[state.activeCharacterId][newChatId].push({
                role: 'assistant', 
                content: [formattedFirstMessage], 
                activeContentIndex: 0,
                timestamp: new Date().toISOString()
            });
        }
        
        state.activeChatId = newChatId;
        saveState();
        renderChatSessionList();
        renderActiveChat();
    }

    function handleDeleteCurrentChat() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        if (confirm('確定要永久刪除這個對話嗎？此操作無法復原。')) {
            delete state.chatHistories[state.activeCharacterId][state.activeChatId];
            delete state.chatMetadatas[state.activeCharacterId][state.activeChatId];
            if (state.longTermMemories[state.activeCharacterId]) {
                delete state.longTermMemories[state.activeCharacterId][state.activeChatId];
            }
            state.activeChatId = null;
            saveState();
            renderChatSessionList();
            renderActiveChat();
        }
    }

    function openCharacterEditor(charId = null) {
        editingCharacterId = charId;
        if (charId) {
            const char = state.characters.find(c => c.id === charId);
            charAvatarPreview.src = char.avatarUrl || DEFAULT_AVATAR;
            charNameInput.value = char.name;
            charDescriptionInput.value = char.description || '';
            charFirstMessageInput.value = char.firstMessage || '';
            charExampleDialogueInput.value = char.exampleDialogue || '';
            deleteCharBtn.classList.remove('hidden');
        } else {
            charAvatarPreview.src = DEFAULT_AVATAR;
            charNameInput.value = '';
            charDescriptionInput.value = '';
            charFirstMessageInput.value = '';
            charExampleDialogueInput.value = '';
            deleteCharBtn.classList.add('hidden');
        }
        toggleModal('character-editor-modal', true);
    }

    /**
     * [MODIFIED FUNCTION]
     * Handles saving a character.
     * - Adds a confirmation dialog before overwriting an existing character.
     */
    function handleSaveCharacter() {
        // Add confirmation if in edit mode
        if (editingCharacterId) {
            if (!confirm('儲存後會覆蓋原先內容，是否繼續儲存?')) {
                return; // Stop if user cancels
            }
        }

        const charData = {
            name: charNameInput.value.trim(),
            avatarUrl: charAvatarPreview.src,
            description: charDescriptionInput.value.trim(),
            firstMessage: charFirstMessageInput.value.trim(),
            exampleDialogue: charExampleDialogueInput.value.trim(),
        };
        if (!charData.name) { alert('角色名稱不能為空！'); return; }
        if (editingCharacterId) {
            const charIndex = state.characters.findIndex(c => c.id === editingCharacterId);
            state.characters[charIndex] = { ...state.characters[charIndex], ...charData };
        } else {
            const newChar = { id: `char_${Date.now()}`, ...charData };
            state.characters.push(newChar);
            state.chatHistories[newChar.id] = {};
            state.chatMetadatas[newChar.id] = {};
            state.activeCharacterId = newChar.id;
            handleAddNewChat();
        }
        saveState();
        renderCharacterList();
        if (leftPanel.classList.contains('show-chats')) {
            const character = state.characters.find(c => c.id === state.activeCharacterId);
            chatListHeaderName.textContent = character.name;
        }
        toggleModal('character-editor-modal', false);
    }

    function handleDeleteCharacter() {
        if (!editingCharacterId) return;
        const charToDelete = state.characters.find(c => c.id === editingCharacterId);
        if (confirm(`確定要刪除角色「${charToDelete.name}」嗎？該角色的所有對話紀錄將一併刪除。`)) {
            state.characters = state.characters.filter(c => c.id !== editingCharacterId);
            delete state.chatHistories[editingCharacterId];
            delete state.longTermMemories[editingCharacterId];
            delete state.chatMetadatas[editingCharacterId];
            
            if (state.activeCharacterId === editingCharacterId) {
                state.activeCharacterId = null;
                state.activeChatId = null;
                showCharacterListView();
                renderActiveChat();
            }
            saveState();
            renderCharacterList();
            toggleModal('character-editor-modal', false);
        }
    }

    // ===================================================================================
    // 8. 全域設定邏輯 (Global Settings Logic)
    // ===================================================================================
    function loadGlobalSettingsToUI() {
        const settings = state.globalSettings;
        apiProviderSelect.value = settings.apiProvider || 'openai';
        updateModelDropdown(); 
        apiModelSelect.value = settings.apiModel || (MODELS[apiProviderSelect.value] ? MODELS[apiProviderSelect.value][0] : '');
        apiKeyInput.value = settings.apiKey || '';
        temperatureSlider.value = settings.temperature || 1;
        temperatureValue.value = settings.temperature || 1;
        topPSlider.value = settings.topP || 1;
        topPValue.value = settings.topP || 1;
        repetitionPenaltySlider.value = settings.repetitionPenalty || 0;
        repetitionPenaltyValue.value = settings.repetitionPenalty || 0;
        contextSizeInput.value = settings.contextSize || 20;
        maxTokensSlider.value = settings.maxTokens || 1024;
        maxTokensValue.value = settings.maxTokens || 1024;
        
        renderUserPersonaList();
        renderActiveUserPersonaSelector();
    }

    function handleSaveGlobalSettings() {
        state.globalSettings = {
            apiProvider: apiProviderSelect.value,
            apiModel: apiModelSelect.value,
            apiKey: apiKeyInput.value.trim(),
            temperature: temperatureValue.value,
            topP: topPValue.value,
            repetitionPenalty: repetitionPenaltyValue.value,
            contextSize: contextSizeInput.value,
            maxTokens: maxTokensValue.value,
        };
        saveState();
        toggleModal('global-settings-modal', false);
        renderActiveChat();
    }
    
    function updateModelDropdown() {
        const provider = apiProviderSelect.value;
        const models = MODELS[provider] || [];
        apiModelSelect.innerHTML = ''; 
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            apiModelSelect.appendChild(option);
        });
        const savedModel = state.globalSettings.apiModel;
        if (savedModel && models.includes(savedModel)) {
            apiModelSelect.value = savedModel;
        } else if (models.length > 0) {
            apiModelSelect.value = models[0];
        }
    }

    // ===================================================================================
    // 9. 提示詞與記憶邏輯 (Prompt & Memory Logic)
    // ===================================================================================
    function loadPromptSettingsToUI() {
        const prompts = state.promptSettings;
        promptScenarioInput.value = prompts.scenario || '';
        promptJailbreakInput.value = prompts.jailbreak || '';
        promptSummarizationInput.value = prompts.summarizationPrompt || DEFAULT_SUMMARY_PROMPT;
    }

    function handleSavePromptSettings() {
        state.promptSettings = {
            scenario: promptScenarioInput.value.trim(),
            jailbreak: promptJailbreakInput.value.trim(),
            summarizationPrompt: promptSummarizationInput.value.trim()
        };
        saveState();
        alert('提示詞設定已儲存！');
        showCharacterListView();
    }

    async function handleUpdateMemory() {
        if (!checkApiKey('請先設定 API 金鑰才能更新記憶')) return;
        if (!state.activeCharacterId || !state.activeChatId) { alert('請先選擇一個對話。'); return; }
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        if (history.length < 4) { alert('對話太短，無法生成有意義的記憶。'); return; }
        
        updateMemoryBtn.textContent = '記憶生成中...';
        updateMemoryBtn.disabled = true;
        setGeneratingState(true, false);
        try {
            const conversationText = history.map(m => {
                const content = (m.role === 'assistant') ? m.content[m.activeContentIndex] : m.content;
                return `${m.role}: ${content}`;
            }).join('\n');
            const userPrompt = state.promptSettings.summarizationPrompt || DEFAULT_SUMMARY_PROMPT;
            const summaryPrompt = userPrompt.replace('{{conversation}}', conversationText);
            const summaryMessages = [{ role: 'user', content: summaryPrompt }];
            const summary = await callApi(summaryMessages, true);
            
            if (!state.longTermMemories[state.activeCharacterId]) {
                state.longTermMemories[state.activeCharacterId] = {};
            }
            state.longTermMemories[state.activeCharacterId][state.activeChatId] = summary;
            saveState();
            alert('長期記憶已更新！');
        } catch (error) {
            if (error.name !== 'AbortError') {
                alert(`記憶更新失敗: ${error.message}`);
            }
        } finally {
            updateMemoryBtn.textContent = '更新記憶';
            updateMemoryBtn.disabled = false;
            setGeneratingState(false, false);
        }
    }

    // ===================================================================================
    // 10. 通用工具與新功能函式
    // ===================================================================================
    
    function setAppHeight() {
        const doc = document.documentElement;
        doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    function setGeneratingState(isGenerating, changeMainButton = true) {
        if (changeMainButton) {
            sendBtn.classList.toggle('is-generating', isGenerating);
            sendIcon.classList.toggle('hidden', isGenerating);
            stopIcon.classList.toggle('hidden', !isGenerating);
            messageInput.disabled = isGenerating;
        }
        
        document.querySelectorAll('.regenerate-btn-sm, .retry-btn-sm').forEach(btn => {
            btn.disabled = isGenerating;
        });
    }

    function handleStopGeneration() {
        if (apiCallController) {
            apiCallController.abort();
            apiCallController = null;
        }
        setGeneratingState(false);
    }

    function handleImageUpload(event, previewElement) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleSaveNote() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId];
        if (metadata) {
            metadata.notes = chatNotesInput.value.trim();
            saveState();
        }
    }

    function openRenameModal(chatId) {
        renamingChatId = chatId;
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[chatId] || {};
        renameChatInput.value = metadata.name || '';
        toggleModal('rename-chat-modal', true);
        renameChatInput.focus();
    }

    function handleSaveChatName() {
        if (!renamingChatId || !state.activeCharacterId) return;
        
        if (!state.chatMetadatas[state.activeCharacterId]) {
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        if (!state.chatMetadatas[state.activeCharacterId][renamingChatId]) {
            state.chatMetadatas[state.activeCharacterId][renamingChatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };
        }
        
        const metadata = state.chatMetadatas[state.activeCharacterId][renamingChatId];
        metadata.name = renameChatInput.value.trim();
        saveState();
        renderChatSessionList();
        toggleModal('rename-chat-modal', false);
        renamingChatId = null;
    }

    function handleTogglePinChat(chatId) {
        if (!state.activeCharacterId) return;
        
        if (!state.chatMetadatas[state.activeCharacterId]) {
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        if (!state.chatMetadatas[state.activeCharacterId][chatId]) {
            state.chatMetadatas[state.activeCharacterId][chatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };
        }

        const metadata = state.chatMetadatas[state.activeCharacterId][chatId];
        metadata.pinned = !metadata.pinned;
        saveState();
        renderChatSessionList();
    }
    
    function toggleModal(modalId, show) {
        document.getElementById(modalId).classList.toggle('hidden', !show);
    }

    function exportCharacter() {
        if (!editingCharacterId) { alert('請先儲存角色後再匯出。'); return; }
        const char = state.characters.find(c => c.id === editingCharacterId);
        const characterData = {
            spec: 'chara_card_v2',
            data: { name: char.name, description: char.description, first_mes: char.firstMessage, mes_example: char.exampleDialogue, character_avatar: char.avatarUrl }
        };
        const jsonString = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${char.name || 'character'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.png';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                reader.onload = (e) => { 
                    try { 
                        const jsonData = JSON.parse(e.target.result);
                        populateEditorWithCharData(jsonData); 
                    } catch (error) { 
                        alert('匯入失敗，JSON 檔案格式錯誤。'); 
                        console.error('JSON Import error:', error); 
                    } 
                };
                reader.readAsText(file, 'UTF-8'); // Specify UTF-8 for JSON files
            } else if (file.type === 'image/png') {
                let fileAsDataURL = '';
                const readerForDataURL = new FileReader();
                readerForDataURL.onload = (e) => {
                    fileAsDataURL = e.target.result;
                };
                readerForDataURL.readAsDataURL(file);

                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const dataView = new DataView(arrayBuffer);
                        if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) { throw new Error('不是有效的 PNG 檔案。'); }
                        
                        let offset = 8; 
                        let characterDataFound = false;
                        
                        while (offset < arrayBuffer.byteLength) {
                            const length = dataView.getUint32(offset);
                            const type = new TextDecoder("ascii").decode(new Uint8Array(arrayBuffer, offset + 4, 4));
                            const chunkData = new Uint8Array(arrayBuffer, offset + 8, length);
                            
                            if (type === 'tEXt' || type === 'iTXt') {
                                const nullSeparatorIndex = chunkData.indexOf(0);
                                if (nullSeparatorIndex === -1) {
                                    offset += 12 + length;
                                    continue;
                                }
                                const keyword = new TextDecoder("ascii").decode(chunkData.slice(0, nullSeparatorIndex));

                                if (keyword === 'chara') {
                                    let textPayloadOffset = nullSeparatorIndex + 1;
                                    
                                    if (type === 'iTXt') {
                                        if (chunkData[textPayloadOffset] === 0 || chunkData[textPayloadOffset] === 1) { 
                                             textPayloadOffset++; 
                                             textPayloadOffset++; 
                                             while(chunkData[textPayloadOffset] !== 0 && textPayloadOffset < chunkData.length) textPayloadOffset++; 
                                             textPayloadOffset++;
                                             while(chunkData[textPayloadOffset] !== 0 && textPayloadOffset < chunkData.length) textPayloadOffset++; 
                                             textPayloadOffset++;
                                        }
                                    }

                                    const base64Data = new TextDecoder("ascii").decode(chunkData.slice(textPayloadOffset));
                                    
                                    const decodedJsonString = new TextDecoder().decode(
                                        Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
                                    );
                                    
                                    const jsonData = JSON.parse(decodedJsonString);
                                    populateEditorWithCharData(jsonData, fileAsDataURL);
                                    characterDataFound = true;
                                    break;
                                }
                            } else if (type === 'zTXt') {
                                const nullSeparatorIndex = chunkData.indexOf(0);
                                if (nullSeparatorIndex !== -1) {
                                    const keyword = new TextDecoder("ascii").decode(chunkData.slice(0, nullSeparatorIndex));
                                    if (keyword === 'chara') {
                                         alert('偵測到壓縮格式(zTXt)的角色卡，目前版本尚不支援解壓縮。');
                                         characterDataFound = true; 
                                         break;
                                    }
                                }
                            }
                            
                            offset += 12 + length;
                        }

                        if (!characterDataFound) { 
                            alert('在這張 PNG 圖片中找不到可識別的角色卡資料。'); 
                        }
                    } catch (error) { 
                        alert('匯入 PNG 失敗，檔案可能已損壞、格式不符或不包含角色資料。'); 
                        console.error('PNG Import error:', error); 
                    }
                };
                reader.readAsArrayBuffer(file);
            } else { 
                alert('不支援的檔案格式。請選擇 .json 或 .png 檔案。'); 
            }
        };
        input.click();
    }

    /**
     * [MODIFIED FUNCTION]
     * Populates the character editor with data from an imported card.
     * - No longer resets the editing state, allowing for overwrites.
     */
    function populateEditorWithCharData(importedData, imageBase64 = null) {
        const data = importedData.data || importedData;
        
        charNameInput.value = data.name || '';
        charDescriptionInput.value = data.description || data.personality || '';
        charFirstMessageInput.value = data.first_mes || data.firstMessage || '';
        charExampleDialogueInput.value = data.mes_example || data.exampleDialogue || '';
        
        charAvatarPreview.src = imageBase64 || data.character_avatar || DEFAULT_AVATAR;
        
        alert('角色卡匯入成功！請記得儲存。');
    }
    
    function makeMessageEditable(row, index) {
        const currentlyEditing = document.querySelector('.is-editing');
        if (currentlyEditing) { renderChatMessages(); }
        row.classList.add('is-editing');
        const bubbleContainer = row.querySelector('.bubble-container');
        const msg = state.chatHistories[state.activeCharacterId][state.activeChatId][index];
        const originalText = (msg.role === 'assistant') ? msg.content[msg.activeContentIndex] : msg.content;
        
        row.querySelector('.chat-bubble').style.display = 'none';
        row.querySelector('.message-timestamp').style.display = 'none';
        if (row.querySelector('.message-actions')) {
            row.querySelector('.message-actions').style.display = 'none';
        }

        const editContainer = document.createElement('div');
        editContainer.innerHTML = `
            <textarea class="edit-textarea">${originalText}</textarea>
            <div class="edit-actions">
                <button class="icon-btn delete-btn" title="刪除訊息"><i class="fa-solid fa-trash"></i></button>
                <button class="action-btn secondary edit-cancel-btn">取消</button>
                <button class="action-btn primary edit-save-btn">儲存</button>
            </div>
        `;
        bubbleContainer.appendChild(editContainer);
        
        const textarea = bubbleContainer.querySelector('.edit-textarea');
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();

        bubbleContainer.querySelector('.edit-save-btn').addEventListener('click', (e) => { e.stopPropagation(); saveMessageEdit(index, textarea.value); });
        bubbleContainer.querySelector('.edit-cancel-btn').addEventListener('click', (e) => { e.stopPropagation(); renderChatMessages(); });
        bubbleContainer.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteMessage(index); });
    }

    function saveMessageEdit(index, newText) {
        const msg = state.chatHistories[state.activeCharacterId][state.activeChatId][index];
        if (msg.role === 'assistant') {
            msg.content[msg.activeContentIndex] = newText.trim();
        } else {
            msg.content = newText.trim();
        }
        saveState();
        renderChatMessages();
    }

    function handleDeleteMessage(index) {
        if (confirm('您確定要永久刪除這則訊息嗎？')) {
            state.chatHistories[state.activeCharacterId][state.activeChatId].splice(index, 1);
            saveState();
            renderChatMessages();
        }
    }

    // ===================================================================================
    // 11. 使用者角色 (User Persona) 邏輯
    // ===================================================================================
    function renderUserPersonaList() {
        userPersonaList.innerHTML = '';
        state.userPersonas.forEach(persona => {
            const item = document.createElement('li');
            item.className = 'persona-item';
            item.dataset.id = persona.id;
            item.innerHTML = `
                <img src="${persona.avatarUrl || DEFAULT_AVATAR}" alt="${persona.name}" class="persona-item-avatar">
                <span class="persona-item-name">${persona.name}</span>
                <div class="persona-item-actions">
                    <button class="icon-btn-sm edit-persona-btn" title="編輯"><i class="fa-solid fa-pencil"></i></button>
                    <button class="icon-btn-sm delete-persona-btn" title="刪除"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            item.querySelector('.edit-persona-btn').addEventListener('click', () => openUserPersonaEditor(persona.id));
            item.querySelector('.delete-persona-btn').addEventListener('click', () => handleDeleteUserPersona(persona.id));
            userPersonaList.appendChild(item);
        });
    }

    function renderActiveUserPersonaSelector() {
        activeUserPersonaSelect.innerHTML = '';
        state.userPersonas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.name;
            activeUserPersonaSelect.appendChild(option);
        });
        activeUserPersonaSelect.value = state.activeUserPersonaId;
    }
    
    function renderChatUserPersonaSelector() {
        chatUserPersonaSelect.innerHTML = '';
        state.userPersonas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.name;
            chatUserPersonaSelect.appendChild(option);
        });
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
        chatUserPersonaSelect.value = metadata.userPersonaId || state.activeUserPersonaId;
    }

    function handleChatPersonaChange(e) {
        const newPersonaId = e.target.value;
        if (state.activeCharacterId && state.activeChatId) {
            state.chatMetadatas[state.activeCharacterId][state.activeChatId].userPersonaId = newPersonaId;
            saveState();
            renderChatMessages(); // Re-render messages to show new user avatar
        }
    }

    function openUserPersonaEditor(personaId = null) {
        editingUserPersonaId = personaId;
        if (personaId) {
            const persona = state.userPersonas.find(p => p.id === personaId);
            userPersonaEditorTitle.textContent = '編輯使用者角色';
            userPersonaAvatarPreview.src = persona.avatarUrl || DEFAULT_AVATAR;
            userPersonaNameInput.value = persona.name;
            userPersonaDescriptionInput.value = persona.description || '';
        } else {
            userPersonaEditorTitle.textContent = '新增使用者角色';
            userPersonaAvatarPreview.src = DEFAULT_AVATAR;
            userPersonaNameInput.value = '';
            userPersonaDescriptionInput.value = '';
        }
        toggleModal('user-persona-editor-modal', true);
    }

    function handleSaveUserPersona() {
        const personaData = {
            name: userPersonaNameInput.value.trim(),
            avatarUrl: userPersonaAvatarPreview.src,
            description: userPersonaDescriptionInput.value.trim(),
        };
        if (!personaData.name) { alert('角色名稱不能為空！'); return; }

        if (editingUserPersonaId) {
            const personaIndex = state.userPersonas.findIndex(p => p.id === editingUserPersonaId);
            state.userPersonas[personaIndex] = { ...state.userPersonas[personaIndex], ...personaData };
        } else {
            const newPersona = { id: `user_${Date.now()}`, ...personaData };
            state.userPersonas.push(newPersona);
        }
        saveState();
        renderUserPersonaList();
        renderActiveUserPersonaSelector();
        toggleModal('user-persona-editor-modal', false);
    }

    function handleDeleteUserPersona(personaId) {
        if (state.userPersonas.length <= 1) {
            alert('至少需要保留一個使用者角色。');
            return;
        }
        if (confirm('確定要刪除這個使用者角色嗎？')) {
            state.userPersonas = state.userPersonas.filter(p => p.id !== personaId);
            if (state.activeUserPersonaId === personaId) {
                state.activeUserPersonaId = state.userPersonas[0].id;
            }
            saveState();
            renderUserPersonaList();
            renderActiveUserPersonaSelector();
        }
    }

    // ===================================================================================
    // 12. 主題切換 (Theme Toggle)
    // ===================================================================================
    function applyTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.className = currentTheme + '-mode';
        themeToggleBtn.innerHTML = currentTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    function toggleTheme() {
        let currentTheme = localStorage.getItem('theme') || 'light';
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

    // ===================================================================================
    // 13. 啟動應用程式
    // ===================================================================================
    initialize();
});
