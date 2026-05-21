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
    icon: '🫀',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
      { id: 'naczynia', label: 'Naczynia krwionośne', structureId: 'naczynia' },
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
      { id: 'ann-serce-1', label: 'Komora lewa', position: [-0.5, 0, 0.5], structureId: 'serce' },
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
}
