import { AnatomyNode, AnatomicalStructure } from './types'

/** Drzewo nawigacji w lewym panelu */
export const anatomyTree: AnatomyNode[] = [
  {
    id: 'oun',
    label: 'Ośrodkowy Układ Nerwowy',
    icon: '🧠',
    children: [
      {
        id: 'mozgowie',
        label: 'Mózgowie',
        children: [
          { id: 'kora', label: 'Kora mózgowa', structureId: 'kora-mozgowa' },
          { id: 'mozdzek', label: 'Móżdżek', structureId: 'mozdzek' },
          { id: 'pien', label: 'Pień mózgu', structureId: 'pien-mozgu' },
          { id: 'glowa', label: 'Czaszka i mózg (3D)', structureId: 'glowa' },
        ],
      },
      { id: 'rdzen', label: 'Rdzeń kręgowy', structureId: 'rdzen-kregowy' },
    ],
  },
  {
    id: 'krazenie',
    label: 'Układ Krążenia',
    icon: '♥',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
      { id: 'naczynia', label: 'Naczynia krwionośne', structureId: 'naczynia' },
    ],
  },
  {
    id: 'oddechowy',
    label: 'Układ Oddechowy',
    icon: 'O₂',
    children: [
      { id: 'lung', label: 'Płuco', structureId: 'lung' },
    ],
  },
  {
    id: 'pokarmowy',
    label: 'Układ Pokarmowy',
    icon: 'GI',
    children: [
      { id: 'stomach', label: 'Żołądek', structureId: 'stomach' },
      { id: 'liver', label: 'Wątroba', structureId: 'liver' },
    ],
  },
  {
    id: 'moczowy',
    label: 'Układ Moczowy',
    icon: 'N',
    children: [
      { id: 'kidney', label: 'Nerka', structureId: 'kidney' },
    ],
  },
]

/** Słownik wszystkich struktur anatomicznych */
export const structures: Record<string, AnatomicalStructure> = {
  'kora-mozgowa': {
    id: 'kora-mozgowa',
    namePL: 'Kora mózgowa',
    nameLAT: 'Cortex cerebri',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Zewnętrzna warstwa mózgu zbudowana z istoty szarej. Odpowiada za wyższe funkcje poznawcze, świadomość, percepcję zmysłową i kontrolę ruchów dowolnych. Podzielona czynnościowo na obszary wg mapy Brodmanna.',
    biologicalNotes:
      'Grubość: 2–4 mm. Zawiera ~16 mld neuronów. 4 płaty: czołowy (planowanie), ciemieniowy (czucie), skroniowy (słuch/pamięć), potyliczny (wzrok).',
    annotations: [
      { id: 'ann-kora-1', label: 'Płat czołowy', position: [0, 1.5, 1], structureId: 'kora-mozgowa' },
      { id: 'ann-kora-2', label: 'Płat ciemieniowy', position: [0, 1.8, 0], structureId: 'kora-mozgowa' },
      { id: 'ann-kora-3', label: 'Płat potyliczny', position: [0, 1.2, -1], structureId: 'kora-mozgowa' },
    ],
  },
  mozdzek: {
    id: 'mozdzek',
    namePL: 'Móżdżek',
    nameLAT: 'Cerebellum',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Część mózgu odpowiedzialna za koordynację ruchów, utrzymanie równowagi i postawy ciała. Odgrywa kluczową rolę w uczeniu się motorycznym i precyzji ruchów.',
    biologicalNotes:
      'Stanowi ~10% objętości mózgu, ale zawiera ponad 50% wszystkich neuronów. Składa się z dwóch półkul i robaka (vermis cerebelli). Komórki Purkiniego — unikalne neurony hamujące.',
    annotations: [
      { id: 'ann-mozdzek-1', label: 'Półkula lewa', position: [-1, -0.5, 0], structureId: 'mozdzek' },
      { id: 'ann-mozdzek-2', label: 'Robak (vermis)', position: [0, -0.5, 0], structureId: 'mozdzek' },
      { id: 'ann-mozdzek-3', label: 'Półkula prawa', position: [1, -0.5, 0], structureId: 'mozdzek' },
    ],
  },
  'pien-mozgu': {
    id: 'pien-mozgu',
    namePL: 'Pień mózgu',
    nameLAT: 'Truncus encephali',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Łączy mózg z rdzeniem kręgowym. Kontroluje podstawowe funkcje życiowe: oddychanie, bicie serca, ciśnienie tętnicze. Zawiera jądra nerwów czaszkowych III–XII.',
    biologicalNotes:
      'Składa się z: śródmózgowia (mesencephalon), mostu (pons Varoli) i rdzenia przedłużonego (medulla oblongata). Twór siatkowaty reguluje poziom świadomości.',
    annotations: [],
  },
  glowa: {
    id: 'glowa',
    namePL: 'Czaszka i mózg',
    nameLAT: 'Cranium et Encephalon',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Czaszka (cranium) chroni mózgowie. Składa się z czaszki mózgowej (neurocranium) i trzewioczaszki (viscerocranium). Wewnątrz: mózg właściwy, móżdżek i pień mózgu.',
    biologicalNotes:
      'Czaszka: 22 kości. Mózg: ~1300 g, ~86 mld neuronów. Płyn mózgowo-rdzeniowy (CSF) amortyzuje wstrząsy.',
    annotations: [],
    layers: [
      {
        id: 'skull_left',
        label: 'Czaszka — lewa połówka',
        defaultVisible: true,
        isPair: true,
        splitAxis: 'x',
        splitDistance: 1.5,
        splitDirection: -1,
        explodeOffset: [-0.8, 0.2, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'skull_right',
        label: 'Czaszka — prawa połówka',
        defaultVisible: true,
        isPair: true,
        splitAxis: 'x',
        splitDistance: 1.5,
        splitDirection: 1,
        explodeOffset: [0.8, 0.2, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'brain',
        label: 'Mózg',
        defaultVisible: true,
        explodeOffset: [0, 1.0, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'brainstem',
        label: 'Pień mózgu',
        defaultVisible: true,
        explodeOffset: [0, -0.5, 0.6],
        basePosition: [0, 0, 0],
      },
    ],
  },
  'rdzen-kregowy': {
    id: 'rdzen-kregowy',
    namePL: 'Rdzeń kręgowy',
    nameLAT: 'Medulla spinalis',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Część OUN przebiegająca w kanale kręgowym. Przewodzi impulsy nerwowe między mózgiem a resztą ciała. Zawiera ośrodki odruchów rdzeniowych.',
    biologicalNotes:
      'Długość: 40–50 cm. 31 par nerwów rdzeniowych. Segmenty: szyjne C1–C8, piersiowe T1–T12, lędźwiowe L1–L5, krzyżowe S1–S5, guziczne Co1.',
    annotations: [],
  },
  serce: {
    id: 'serce',
    namePL: 'Serce',
    nameLAT: 'Cor',
    system: 'Układ Krążenia',
    description:
      'Narząd mięśniowy pompujący krew przez układ krwionośny. Leży w śródpiersiu, między płucami. Wykonuje ok. 100 000 uderzeń dziennie, przepompowując ~7000 litrów krwi.',
    biologicalNotes:
      'Masa: 250–350 g. 4 jamy: 2 przedsionki + 2 komory. Układ bodźco-przewodzący: węzeł SA (rozrusznik) → węzeł AV → pęczek Hisa → włókna Purkiniego.',
    annotations: [
      {
        id: 'ann-serce-1',
        label: 'Komora lewa',
        nameLAT: 'Ventriculus sinister',
        description: 'Pompuje krew do krążenia ogólnoustrojowego przez aortę. Największa jama serca.',
        position: [-0.5, 0, 0.5],
        structureId: 'serce'
      },
      { id: 'ann-serce-2', label: 'Zastawka mitralna', position: [-0.3, 0.5, 0.3], structureId: 'serce' },
      { id: 'ann-serce-3', label: 'Aorta', position: [0, 1.2, 0], structureId: 'serce' },
    ],
  },
  naczynia: {
    id: 'naczynia',
    namePL: 'Naczynia krwionośne',
    nameLAT: 'Vasa sanguinea',
    system: 'Układ Krążenia',
    description:
      'Sieć naczyń transportujących krew: tętnice (od serca), żyły (do serca) i naczynia włosowate (wymiana substancji z tkankami).',
    biologicalNotes:
      'Łączna długość naczyń w organizmie: ~100 000 km. Aorta — największa tętnica, Ø ~25 mm. Kapilary — Ø 5–10 μm, wymiana gazowa.',
    annotations: [],
  },
  lung: {
    id: 'lung',
    namePL: 'Płuco',
    nameLAT: 'Pulmo',
    system: 'Układ Oddechowy',
    description:
      'Narząd parzysty odpowiedzialny za wymianę gazową — pobieranie tlenu i usuwanie dwutlenku węgla z krwi. Leży w klatce piersiowej, po obu stronach serca.',
    biologicalNotes:
      'Płuco prawe: 3 płaty. Płuco lewe: 2 płaty (miejsce na serce). Powierzchnia wymiany gazowej: ~70 m². Pojemność życiowa: ~4–6 l.',
    annotations: [
      {
        id: 'ann-lung-1',
        label: 'Oskrzele główne',
        nameLAT: 'Bronchus principalis',
        description: 'Doprowadza powietrze do płuca i rozgałęzia się na oskrzela płatowe oraz segmentowe.',
        position: [0, 0.45, 0.55],
        structureId: 'lung',
      },
      {
        id: 'ann-lung-2',
        label: 'Płat górny',
        nameLAT: 'Lobus superior',
        description: 'Górna część płuca wentylowana przez oskrzele płatowe górne; ważny punkt orientacyjny w badaniu obrazowym.',
        position: [-0.55, 0.95, 0.2],
        structureId: 'lung',
      },
      {
        id: 'ann-lung-3',
        label: 'Podstawa płuca',
        nameLAT: 'Basis pulmonis',
        description: 'Dolna powierzchnia płuca spoczywająca na przeponie; porusza się wraz z oddechem.',
        position: [0.35, -0.9, 0.15],
        structureId: 'lung',
      },
    ],
  },
  stomach: {
    id: 'stomach',
    namePL: 'Żołądek',
    nameLAT: 'Gaster',
    system: 'Układ Pokarmowy',
    description:
      'Workowy narząd mięśniowy łączący przełyk z jelitem cienkim. Miesza pokarm z sokiem żołądkowym i wstępnie trawi białka.',
    biologicalNotes:
      'Pojemność: 1–1,5 l. pH soku żołądkowego: 1,5–3,5. Produkuje pepsynę (trawienie białek) i lipazę (trawienie tłuszczów). Czas pasażu: 2–6 h.',
    annotations: [
      {
        id: 'ann-stomach-1',
        label: 'Wpust',
        nameLAT: 'Cardia',
        description: 'Miejsce przejścia przełyku w żołądek; okolica istotna przy refluksie żołądkowo-przełykowym.',
        position: [-0.7, 0.45, 0.35],
        structureId: 'stomach',
      },
      {
        id: 'ann-stomach-2',
        label: 'Dno żołądka',
        nameLAT: 'Fundus gastricus',
        description: 'Górna kopuła żołądka magazynująca powietrze i treść pokarmową po posiłku.',
        position: [-0.25, 0.9, 0.2],
        structureId: 'stomach',
      },
      {
        id: 'ann-stomach-3',
        label: 'Odźwiernik',
        nameLAT: 'Pylorus',
        description: 'Kontroluje przechodzenie treści żołądkowej do dwunastnicy dzięki mięśniowi zwieraczowi.',
        position: [0.95, -0.35, 0.25],
        structureId: 'stomach',
      },
    ],
  },
  liver: {
    id: 'liver',
    namePL: 'Wątroba',
    nameLAT: 'Hepar',
    system: 'Układ Pokarmowy',
    description:
      'Największy gruczoł w organizmie człowieka. Pełni ponad 500 funkcji metabolicznych: detoksykacja, produkcja żółci, synteza białek osocza, magazynowanie glikogenu.',
    biologicalNotes:
      'Masa: ~1500 g. 2 płaty: prawy (większy) i lewy. Zaopatrzona przez żyłę wrotną (krew z jelit) i tętnicę wątrobową. Zdolna do regeneracji.',
    annotations: [
      {
        id: 'ann-liver-1',
        label: 'Płat prawy',
        nameLAT: 'Lobus dexter hepatis',
        description: 'Największa część wątroby; dominuje objętościowo i jest częstym punktem odniesienia w USG.',
        position: [0.55, 0.25, 0.35],
        structureId: 'liver',
      },
      {
        id: 'ann-liver-2',
        label: 'Płat lewy',
        nameLAT: 'Lobus sinister hepatis',
        description: 'Mniejszy płat wątroby położony bardziej ku lewej stronie, częściowo nad żołądkiem.',
        position: [-0.85, 0.15, 0.25],
        structureId: 'liver',
      },
      {
        id: 'ann-liver-3',
        label: 'Wrota wątroby',
        nameLAT: 'Porta hepatis',
        description: 'Miejsce wejścia żyły wrotnej i tętnicy wątrobowej oraz wyjścia przewodów żółciowych.',
        position: [0, -0.35, 0.6],
        structureId: 'liver',
      },
    ],
  },
  kidney: {
    id: 'kidney',
    namePL: 'Nerka',
    nameLAT: 'Ren',
    system: 'Układ Moczowy',
    description:
      'Narząd parzysty filtrujący krew i produkujący mocz. Reguluje gospodarkę wodno-elektrolitową, ciśnienie krwi i równowagę kwasowo-zasadową.',
    biologicalNotes:
      'Masa: ~150 g. Filtruje ~180 l osocza/dobę, produkuje ~1,5 l moczu. Jednostka funkcjonalna: nefron (~1 mln/nerkę). Hormon: erytropoetyna (EPO).',
    annotations: [
      {
        id: 'ann-kidney-1',
        label: 'Kora nerki',
        nameLAT: 'Cortex renalis',
        description: 'Zewnętrzna warstwa nerki zawierająca ciałka nerkowe, gdzie zaczyna się filtracja osocza.',
        position: [-0.55, 0.55, 0.2],
        structureId: 'kidney',
      },
      {
        id: 'ann-kidney-2',
        label: 'Rdzeń nerki',
        nameLAT: 'Medulla renalis',
        description: 'Wewnętrzna część z piramidami nerkowymi, które zagęszczają mocz i kierują go do kielichów.',
        position: [0.05, 0, 0.35],
        structureId: 'kidney',
      },
      {
        id: 'ann-kidney-3',
        label: 'Miedniczka nerkowa',
        nameLAT: 'Pelvis renalis',
        description: 'Zbiera mocz z kielichów nerkowych i przechodzi w moczowód.',
        position: [0.55, -0.25, 0.5],
        structureId: 'kidney',
      },
    ],
  },
}
