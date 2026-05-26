export interface NaukaCard {
  id: string
  question: string
  answer: string
  system: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  mnemonic: string
  details: string
  struct: string
}

export interface ReadingSection {
  id: string
  title: string
  content: string
}

export interface ReadingMaterial {
  sys: string
  title: string
  readTime: number
  sections: ReadingSection[]
}

export const NAUKA_SYSTEMS = [
  { name: 'Wszystkie układy', color: '#2a7a60' },
  { name: 'Układ Krążenia',   color: '#bd514d' },
  { name: 'Układ Oddechowy',  color: '#4f8a3f' },
  { name: 'Układ Pokarmowy',  color: '#9b74b7' },
  { name: 'OUN',              color: '#6578b5' },
  { name: 'Układ Moczowy',    color: '#48a77d' },
]

export const SYSTEM_PROGRESS: Record<string, { done: number; total: number }> = {
  'Układ Krążenia':  { done: 8,  total: 14 },
  'Układ Oddechowy': { done: 6,  total: 12 },
  'Układ Pokarmowy': { done: 10, total: 18 },
  'OUN':             { done: 5,  total: 20 },
  'Układ Moczowy':   { done: 4,  total: 11 },
}

export const NAUKA_CARDS: NaukaCard[] = [
  {
    id: 'nc1',
    question: 'Ile komór ma ludzkie serce i jakie są ich nazwy?',
    answer: 'Serce człowieka ma cztery komory: dwa przedsionki (prawy i lewy) oraz dwie komory właściwe (prawa i lewa). Przedsionki zbierają krew napływającą, komory wypompowują ją do krążenia.',
    system: 'Układ Krążenia',
    difficulty: 'basic',
    mnemonic: 'Pomyśl o sercu jak o domu z 4 pokojami — 2 na górze (przedsionki), 2 na dole (komory).',
    details: 'Serce to czterojamowy narząd mięśniowy. Ściana lewej komory jest ok. 3× grubsza niż prawej ze względu na wyższe ciśnienie systemowe.',
    struct: 'Serce',
  },
  {
    id: 'nc2',
    question: 'Co to jest zastawka mitralna i jaką pełni funkcję?',
    answer: 'Zastawka mitralna (dwudzielna) leży między lewym przedsionkiem a lewą komorą. Zapobiega cofaniu się krwi do przedsionka podczas skurczu komory.',
    system: 'Układ Krążenia',
    difficulty: 'intermediate',
    mnemonic: 'Mitra = biret biskupi z 2 rogami = 2 płatki zastawki między lewymi jamami serca.',
    details: 'Zastawka mitralna składa się z 2 płatków (przedniego i tylnego) podtrzymywanych przez struny ścięgniste i mięśnie brodawkowate.',
    struct: 'Serce',
  },
  {
    id: 'nc3',
    question: 'Jaką funkcję pełni surfaktant w płucach?',
    answer: 'Surfaktant to mieszanina lipoprotein produkowana przez pneumocyty II. Zmniejsza napięcie powierzchniowe w pęcherzykach, zapobiegając ich zapadaniu się i ułatwiając wymianę gazową.',
    system: 'Układ Oddechowy',
    difficulty: 'intermediate',
    mnemonic: 'SURFaktant SURFuje po pęcherzykach, utrzymując je otwarte jak bańki mydlane.',
    details: 'Surfaktant to głównie DPPC (dipalmitoilofosfatydylocholina). Brak u wcześniaków → choroba błon szklistych (RDS).',
    struct: 'Płuca',
  },
  {
    id: 'nc4',
    question: 'Opisz podział dróg oddechowych na strefę przewodzącą i oddechową.',
    answer: 'Strefa przewodząca (nos → tchawica → oskrzela → oskrzeliki) transportuje powietrze, bez wymiany gazowej. Strefa oddechowa (oskrzeliki oddechowe → przewody → pęcherzyki) to miejsce wymiany O₂/CO₂.',
    system: 'Układ Oddechowy',
    difficulty: 'intermediate',
    mnemonic: 'Przewodząca = autostrada do płuc; Oddechowa = stacja benzynowa gdzie tankujesz O₂.',
    details: 'Przestrzeń martwa anatomiczna: ~150 ml. Łączna powierzchnia pęcherzyków: ok. 70 m². Krew przechodzi przez płuca w ~0,75 s.',
    struct: 'Płuca',
  },
  {
    id: 'nc5',
    question: 'Jakie są główne funkcje wątroby?',
    answer: 'Wątroba pełni ponad 500 funkcji: metabolizm białek, tłuszczów i węglowodanów; detoksykacja; produkcja żółci; synteza czynników krzepnięcia; magazynowanie glikogenu, witamin i żelaza.',
    system: 'Układ Pokarmowy',
    difficulty: 'basic',
    mnemonic: 'WĄTROBA = Wielka fabryka ciała: Wytwarza, czyści Toksyny, Reguluje, Odkłada Białka Aktywnie.',
    details: 'Wątroba ma podwójne unaczynienie: tętnica wątrobowa (krew utlenowana) + żyła wrotna (z przewodu pokarmowego). Masa: ok. 1,5 kg.',
    struct: 'Wątroba',
  },
  {
    id: 'nc6',
    question: 'Co to jest bariera krew-mózg (BBB)?',
    answer: 'BBB to wyspecjalizowana bariera anatomiczno-fizjologiczna tworzona przez śródbłonek naczyń mózgowych z ciasno przylegającymi połączeniami, astrocyty i perycyty. Chroni OUN przed toksynami i patogenami.',
    system: 'OUN',
    difficulty: 'advanced',
    mnemonic: 'BBB = Barikata Broniąca Bystrości mózgu — przepuszcza O₂, glukozę, ale blokuje leki i bakterie.',
    details: 'Większość leków nie przenika przez BBB. Wyjątki: substancje lipidorozpuszczalne, alkohol. Naruszona w zapaleniu opon mózgowo-rdzeniowych.',
    struct: 'Mózg',
  },
  {
    id: 'nc7',
    question: 'Opisz funkcje móżdżku.',
    answer: 'Móżdżek koordynuje ruchy i utrzymuje równowagę, reguluje napięcie mięśniowe, dostosowuje precyzję ruchów dowolnych i uczestniczy w motorycznym uczeniu się.',
    system: 'OUN',
    difficulty: 'basic',
    mnemonic: 'Móżdżek = GPS dla mięśni: przelicza błędy ruchu i koryguje je na bieżąco.',
    details: 'Móżdżek zawiera >50% neuronów mózgu. Uszkodzenie → ataksja, dysmetria, drżenie zamiarowe. Podzielony na robak i półkule.',
    struct: 'Móżdżek',
  },
  {
    id: 'nc8',
    question: 'Jak nerka reguluje ciśnienie tętnicze przez układ RAA?',
    answer: 'Niedokrwienie nerki → renina → przekształca angiotensynogen w angiotensynę I → ACE zamienia w angiotensynę II → skurcz naczyń + aldosteron → retencja Na⁺/H₂O → wzrost ciśnienia.',
    system: 'Układ Moczowy',
    difficulty: 'advanced',
    mnemonic: 'RAA = Renina→Angiotensyna→Aldosteron: "Rak naciska, żeby ciśnienie rosło".',
    details: 'Cel leków: inhibitory ACE (kaptopryl), sartany (losartan), antagoniści aldosteronu (spironolakton). Nadaktywacja → nadciśnienie.',
    struct: 'Nerka',
  },
]

export const READING_MATERIALS: ReadingMaterial[] = [
  {
    sys: 'Układ Krążenia',
    title: 'Anatomia serca i naczyń',
    readTime: 12,
    sections: [
      {
        id: 'budowa',
        title: 'Budowa',
        content: `Układ krążenia składa się z serca oraz naczyń krwionośnych tworzących dwa obiegi krwi. Krążenie małe (płucne) transportuje krew odtlenowaną z prawej komory do płuc, skąd krew utlenowana wraca do lewego przedsionka. Krążenie duże (systemowe) rozprowadza natlenioną krew z lewej komory do całego organizmu.\n\nSerce waży ok. 300 g i wykonuje ok. 100 000 uderzeń dziennie. Jego ściana zbudowana jest z trzech warstw: wsierdzia (endocardium), mięśniówki sercowej (myocardium) i osierdzia (pericardium).`,
      },
      {
        id: 'fizjologia',
        title: 'Fizjologia',
        content: `Cykl pracy serca obejmuje skurcz (systolę) i rozkurcz (diastolę). Podczas systoly ciśnienie w lewej komorze wzrasta do ~120 mmHg, otwierając zastawkę aortalną. Objętość wyrzutowa w spoczynku wynosi ~70 ml, co daje pojemność minutową ok. 5 l/min.\n\nPodczas intensywnego wysiłku fizycznego pojemność minutowa serca może wzrosnąć nawet do 25 l/min. Regulacja pracy serca odbywa się przez autonomiczny układ nerwowy i hormony (adrenalina, noradrenalina).`,
      },
      {
        id: 'klinika',
        title: 'Klinika',
        content: `Choroby układu sercowo-naczyniowego są główną przyczyną zgonów w krajach wysoko rozwiniętych. Zawał serca (MI) to martwica mięśnia sercowego wskutek zamknięcia tętnicy wieńcowej. Kluczowy objaw: ból zamostkowy promieniujący do lewego ramienia lub żuchwy.\n\nPrzewlekła niewydolność serca (CHF) to stan, w którym serce nie zapewnia odpowiedniego przepływu krwi. Klasyfikacja NYHA (I–IV) określa stopień ograniczenia aktywności fizycznej.`,
      },
    ],
  },
  {
    sys: 'Układ Oddechowy',
    title: 'Anatomia układu oddechowego',
    readTime: 10,
    sections: [
      {
        id: 'budowa',
        title: 'Budowa',
        content: `Układ oddechowy dzieli się na górne drogi oddechowe (nos, gardło, krtań) i dolne drogi oddechowe (tchawica, oskrzela, oskrzeliki, pęcherzyki). Tchawica rozgałęzia się w miejscu zwanym kariną na prawe i lewe oskrzele główne.\n\nPłuca zawierają ok. 300–500 milionów pęcherzyków płucnych o łącznej powierzchni wymiany gazowej ~70 m². Każdy pęcherzyk otoczony jest siecią naczyń włosowatych.`,
      },
      {
        id: 'fizjologia',
        title: 'Fizjologia',
        content: `Wentylacja płuc obejmuje wdech (aktywny — skurcz przepony i mięśni międzyżebrowych) i wydech (pasywny — sprężystość płuc). Objętość oddechowa w spoczynku wynosi ~500 ml; całkowita pojemność płuc ~6 l.\n\nDyfuzja gazów przez barierę pęcherzykowo-włośniczkową przebiega zgodnie z prawem Ficka — zależy od powierzchni, grubości bariery i gradientu ciśnień parcjalnych O₂ i CO₂.`,
      },
      {
        id: 'klinika',
        title: 'Klinika',
        content: `Astma oskrzelowa to przewlekły stan zapalny dróg oddechowych z odwracalnym skurczem oskrzeli. Leczenie: beta2-agoniści (salbutamol), kortykosteroidy wziewne.\n\nPOChP (przewlekła obturacyjna choroba płuc) obejmuje przewlekłe zapalenie oskrzeli i rozedmę. Główna przyczyna: palenie tytoniu. Nieodwracalna obturacja przepływu powietrza.`,
      },
    ],
  },
  {
    sys: 'Układ Pokarmowy',
    title: 'Anatomia układu pokarmowego',
    readTime: 11,
    sections: [
      {
        id: 'budowa',
        title: 'Budowa',
        content: `Układ pokarmowy tworzy ciągły przewód od jamy ustnej do odbytu. Główne elementy: jama ustna, gardło, przełyk, żołądek, jelito cienkie (dwunastnica, jelito czcze, kręte), jelito grube (okrężnica, esica, odbytnica) i odbyt. Gruczoły dodatkowe: wątroba, trzustka, pęcherzyk żółciowy.\n\nCałkowita długość przewodu pokarmowego wynosi ok. 7–8 metrów. Powierzchnia wchłaniania jelita cienkiego jest powiększona przez kosmki i mikrokosmki do ok. 250 m².`,
      },
      {
        id: 'fizjologia',
        title: 'Fizjologia',
        content: `Trawienie odbywa się mechanicznie (żucie, ruchy perystaltyczne) i chemicznie (enzymy: amylaza, pepsyna, lipaza, trypsyna). Wchłanianie składników odżywczych głównie w jelicie cienkim przez transport aktywny i bierny.\n\nRuchy perystaltyczne koordynowane są przez jelitowy układ nerwowy (ENS) — zawierający ok. 500 mln neuronów — oraz hormony (gastryna, sekretyna, CCK).`,
      },
      {
        id: 'klinika',
        title: 'Klinika',
        content: `Choroba Crohna i wrzodziejące zapalenie jelita grubego (WZJG) to nieswoiste choroby zapalne jelit (IBD). Crohn obejmuje cały przewód pokarmowy (pełnościenne zapalenie), WZJG ogranicza się do błony śluzowej okrężnicy.\n\nRak jelita grubego jest jednym z najczęstszych nowotworów. Sekwencja: gruczolak → rak (polipy → nowotwór). Kluczowa profilaktyka: kolonoskopia po 50. r.ż.`,
      },
    ],
  },
  {
    sys: 'OUN',
    title: 'Ośrodkowy układ nerwowy',
    readTime: 15,
    sections: [
      {
        id: 'budowa',
        title: 'Budowa',
        content: `OUN składa się z mózgowia i rdzenia kręgowego. Mózgowie dzieli się na kresomózgowie (cerebrum), śródmózgowie, tyłomózgowie (móżdżek i most) oraz rdzeń przedłużony. Kora mózgowa zawiera ok. 14–16 mld neuronów i jest pofałdowana w zakręty i bruzdy.\n\nRdzeń kręgowy biegnie przez kanał kręgowy od otworu wielkiego do poziomu L1–L2. Zawiera szarą istotę (neurony) i białą istotę (szlaki nerwowe).`,
      },
      {
        id: 'fizjologia',
        title: 'Fizjologia',
        content: `Neurony komunikują się przez synapsy chemiczne (neuroprzekaźniki: glutaminian, GABA, dopamina, serotonina) lub elektryczne. Potencjał czynnościowy generowany jest po osiągnięciu progu depolaryzacji ~−55 mV.\n\nPlastyczność synaptyczna — wzmacnianie i osłabianie połączeń neuronalnych — jest podstawą uczenia się, pamięci i adaptacji mózgu po urazach.`,
      },
      {
        id: 'klinika',
        title: 'Klinika',
        content: `Udar mózgu: nagłe zaburzenie przepływu krwi (87% niedokrwienny, 13% krwotoczny). Akronim FAST: Face (asymetria twarzy), Arm (osłabienie ręki), Speech (mowa), Time (zadzwoń 112).\n\nChoroby neurodegeneracyjne: Alzheimer (β-amyloid i tau), Parkinson (utrata neuronów dopaminergicznych w istocie czarnej). Stwardnienie rozsiane (MS) — autoimmunologiczne uszkodzenie mieliny.`,
      },
    ],
  },
  {
    sys: 'Układ Moczowy',
    title: 'Anatomia układu moczowego',
    readTime: 9,
    sections: [
      {
        id: 'budowa',
        title: 'Budowa',
        content: `Układ moczowy składa się z nerek (2), moczowodów (2), pęcherza moczowego i cewki moczowej. Nerki leżą zaotrzewnowo na poziomie Th12–L3. Każda nerka zawiera ok. 1 milion nefronów — podstawowych jednostek czynnościowych.\n\nNefron składa się z ciałka nerkowego (kłębuszek + torebka Bowmana), kanalika bliższego, pętli Henlego, kanalika dalszego i kanalika zbiorczego.`,
      },
      {
        id: 'fizjologia',
        title: 'Fizjologia',
        content: `Nerki filtrują ok. 180 litrów moczu pierwotnego dziennie; finalnie wydala się 1–2 litry. Procesy: filtracja kłębuszkowa (GFR ~125 ml/min), reabsorpcja cewkowa (99%) i sekrecja cewkowa.\n\nRegulacja osmolalności i objętości krwi przez hormony: ADH (wazopresyna) zwiększa reabsorpcję wody, aldosteron — sodu, ANP — sprzyja natriurezie.`,
      },
      {
        id: 'klinika',
        title: 'Klinika',
        content: `Przewlekła choroba nerek (CKD) to stopniowe i nieodwracalne zmniejszanie filtracji kłębuszkowej (GFR). Stadia I–V; stadium V (GFR <15 ml/min) wymaga dializy lub przeszczepu nerki.\n\nOstry zespół nerczycowy (AKI): nagły spadek GFR, wzrost kreatyniny. Przyczyny: niedokrwienie (wstrząs), nefrotoksyny (leki, kontrasty), choroby kłębuszków.`,
      },
    ],
  },
]
