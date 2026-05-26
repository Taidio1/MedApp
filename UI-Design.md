# UI Design: Cell Architecture Studio dla MedApp

## Cel dokumentu

Ten dokument wyciąga zasady UI z template'u `MedAppTemplate/cell-architecture-studio`, aby można było odtworzyć jego styl w oryginalnej aplikacji MedApp, a następnie bezpiecznie usunąć folder `MedAppTemplate`.

Template nie powinien być kopiowany 1:1 jako osobna aplikacja. Traktujemy go jako kierunek wizualny i interakcyjny dla istniejącej aplikacji Next.js: `PanelLeft`, `Viewer3D`, `PanelRight`, `PanelBottom`, globalny layout oraz tryby nauki powinny zostać przeprojektowane według poniższych zasad.

## Ogólna Tożsamość UI

Template ma charakter jasnego, edukacyjnego "atlasu studyjnego", bardziej biologicznego notesu laboratoryjnego niż ciemnego narzędzia technicznego. Obecny MedApp jest zbudowany wokół ciemnego motywu `Anatomy Studio`; nowy kierunek powinien przejść w stronę:

- jasnego papierowego tła,
- centralnego, dużego modelu 3D,
- bocznych paneli przypominających karty atlasu,
- organicznych akcentów kolorystycznych zależnych od wybranego modelu,
- mieszanki eleganckiej typografii serif i odręcznych/naukowych podpisów,
- miękkiego światła, subtelnych cieni i małych ikon narzędziowych.

Nie jest to dashboard SaaS ani landing page. To interaktywne studio edukacyjne: użytkownik ma od razu widzieć model, strukturę, punkty nauki i kontekst biologiczny/anatomiczny.

## Paleta Kolorów

### Kolory Bazowe

Kolory bazowe template'u są ciepłe, papierowe i nisko-kontrastowe. Najważniejsze tokeny:

| Token | Wartość | Zastosowanie |
| --- | --- | --- |
| `--paper` | `#fbf7ee` | Tło kart, paneli, sceny i modalów |
| `--paper-deep` | `#f1eadc` | Głębsze papierowe tło, separatory, sekcje drugiego poziomu |
| `--app-bg` | `#f2ecdf` | Główne tło aplikacji |
| `--ink` | `#28231c` | Podstawowy tekst, nagłówki, ikony |
| `--muted` | `#80786d` | Opisy, meta informacje, drugorzędne etykiety |
| `--line` | `rgba(91, 78, 60, 0.16)` | Obramowania paneli i kontrolek |
| `--shadow-soft` | `0 8px 26px rgba(78, 66, 48, 0.10)` | Cienie paneli i mini kart |
| `--shadow` | `0 18px 50px rgba(78, 66, 48, 0.12)` | Cień modalów i większych warstw |

Tło aplikacji nie jest płaskie. Używa subtelnych gradientów:

- poziomy biały połysk po bokach,
- radialny akcent zależny od wybranego modelu u góry środka,
- papierowa baza `#f2ecdf`.

Docelowy efekt: ciepłe światło laboratoryjne, a nie sterylna biel.

### Akcenty Zależne Od Modelu

Każdy model ma własny zestaw kolorów:

| Model | Accent | Accent Soft | Color |
| --- | --- | --- | --- |
| Plant Cell | `#4f8a3f` | `#e5f1d8` | `#81b64b` |
| White Blood Cell | `#6d78a8` | `#e6eaf7` | `#b9bfd7` |
| Neuron | `#6578b5` | `#e4e9f8` | `#8c91d0` |
| Epithelial Cell | `#a56d7f` | `#f4e2e7` | `#d79baa` |
| Bacteria Cell | `#48a77d` | `#dbf1e7` | `#65b8ae` |
| Animal Cell | `#9b74b7` | `#efe5f6` | `#9db6dc` |
| Muscle Cell | `#bd514d` | `#f5dfdc` | `#ca6678` |

W MedApp analogicznie każdy wybrany układ, model lub struktura powinny ustawiać:

- `--accent`,
- `--accent-soft`,
- opcjonalnie `--model-color`.

Te zmienne powinny sterować aktywnymi przyciskami, tłem wyboru w panelu lewym, orbem/profilowym wskaźnikiem, wykresami postępu, podświetleniem aktywnych struktur oraz światłem punktowym w scenie 3D.

### Kolory Funkcyjne

Template używa koloru funkcjonalnego oszczędnie. Nie ma wielu krzykliwych statusów. Zalecenia:

- aktywny element: `var(--accent)` + `var(--accent-soft)`,
- linie i granice: transparentne brązy/szarości, nie czyste szarości,
- tekst drugorzędny: ciepły szarobrąz `#80786d`,
- panele: `#fbf7ee` z lekkim białym gradientem,
- tło sceny 3D: `#fbf7ee` albo przezroczysty canvas na papierowej scenie.

Unikać:

- dominującego ciemnego granatu obecnego w aktualnym MedApp,
- czystej bieli `#ffffff` jako głównej płaszczyzny,
- dużych fioletowych gradientów,
- neonowych obramowań.

## Typografia

Template opiera charakter UI na kontraście dwóch rodzin:

| Rola | Font fallback | Zastosowanie |
| --- | --- | --- |
| Display/serif | `"Iowan Old Style", "Baskerville", "Libre Baskerville", Georgia, serif` | H1, H2, nazwy struktur, tytuły modeli, większe wartości |
| Note/handwritten | `"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive` | Etykiety paneli, mikrocopy, krótkie podpisy edukacyjne |
| Sans/system | `Inter, ui-sans-serif, system-ui, ...` | Nawigacja, przyciski, listy, drobne UI |

W MedApp warto zachować ten kontrast, ale używać go świadomie:

- H1/H2 oraz nazwy struktur powinny być serifowe, duże i spokojne.
- Nagłówki paneli mogą mieć charakter "notatki": uppercase, font odręczny, lekko edukacyjny.
- Dane, listy i przyciski pozostają czytelne w sans-serif.

Rozmiary z template'u:

- główny brand desktop: około `4.2rem`, line-height `0.95`,
- tytuł modelu w scenie: około `3.9rem`, line-height `0.92`,
- po breakpointach spada do `3.15rem`, `3rem`, `2.35rem`,
- tekst paneli: zwykle `0.9rem`-`1.1rem`,
- notatki biologiczne: serif `1.04rem`, line-height około `1.65`.

Ważna zasada: duża typografia jest zarezerwowana dla brandu i głównego modelu. Panelowe nagłówki są wyraźne, ale zwarte.

## Układ Ekranu

### Desktop Szeroki

Pełny układ template'u powyżej około `1400px`:

```text
Header
┌──────────────┬────────────────────────────┬──────────────────┐
│ Left Rail    │ Center Stack                │ Right Rail        │
│ Cell list    │ Stage 3D                    │ Details           │
│ Organelles   │ Bottom panels               │ Notes / AI / etc. │
└──────────────┴────────────────────────────┴──────────────────┘
```

Siatka:

- wrapper max-width: `1880px`,
- padding aplikacji: `22px`,
- gap: `20px`,
- kolumny: `minmax(240px, 300px) minmax(560px, 1fr) minmax(300px, 380px)`.

W aktualnym MedApp odpowiada temu:

- `PanelLeft` jako lewa szyna,
- `Viewer3D` jako główna scena,
- `PanelRight` jako panel szczegółów,
- `PanelBottom` jako dolna sekcja edukacyjna.

### Desktop Średni / Laptop

Poniżej około `1400px` template przechodzi do dwóch kolumn:

```text
Header
┌──────────────┬────────────────────────────┐
│ Left Rail    │ Stage + Bottom Panels       │
└──────────────┴────────────────────────────┘
┌───────────────────────────────────────────┐
│ Right Rail jako trzy karty pod spodem      │
└───────────────────────────────────────────┘
```

To ważne: prawy panel nie znika, tylko spada pod główny obszar i układa się w karty. W MedApp zamiast sztywnego `h-screen overflow-hidden` warto rozważyć przewijalny layout na mniejszych szerokościach.

### Tablet i Mobile

Poniżej około `1080px` layout staje się jedną kolumną:

- header w dwóch liniach,
- nawigacja poziomo scrollowana,
- scena 3D jako pierwszy priorytet,
- listy i panele pod sceną,
- karta trybu widoku pełnej szerokości,
- toolbar sceny przyklejony na dole sceny.

Poniżej około `720px`:

- etykiety w top nav znikają, zostają ikony,
- lista modeli jest jednokolumnowa,
- mikro-karty i porównanie są jednokolumnowe,
- toolbar sceny jest poziomo scrollowany,
- scena zachowuje dużą wysokość, aby model nadal był głównym bohaterem.

## Header

Header template'u jest wysoki, spokojny i brandowy:

- lewa część: okrągły orb z ikoną `Sparkles`, tytuł, podtytuł,
- prawa część: ikony nawigacji z podpisami, avatar/kontrolka użytkownika,
- brak ciężkiego paska w kontrastowym kolorze,
- brak klasycznego "adminowego" topbaru.

Zalecenie dla MedApp:

- zastąpić ciemny header jasnym, luźniejszym nagłówkiem,
- nazwa może pozostać medyczna/anatomiczna, ale powinna być większa i serifowa,
- UserMenu można stylizować jako okrągły avatar z akcentem wybranego modelu,
- nawigacja powinna używać ikon lucide z krótkimi etykietami.

## Panele

### Zasady Kart

Template używa kart, ale nie jako dekoracyjnych bąbli. Karty są narzędziowe:

- border-radius: `8px`,
- border: `1px solid var(--line)`,
- background: biały/papierowy gradient + `var(--paper)`,
- shadow: miękki, brązowy, niski kontrast,
- padding: zwykle `20px`, scena `28px`,
- nagłówki oddzielone dashed border.

Nie używać dużych zaokrągleń typu `24px`. Nie zagnieżdżać kart w kartach, jeśli sekcja może być zwykłym blokiem.

### Nagłówki Paneli

Nagłówki mają charakter etykiet z notatnika:

- uppercase,
- font odręczny/note,
- kolor `#3f345f`,
- ikona po lewej,
- dashed separator pod spodem,
- mały chevron lub akcja po prawej.

W MedApp można to zastosować do:

- list struktur,
- warstw,
- szczegółów anatomicznych,
- notatek klinicznych,
- quizu,
- trybu nauki.

## Lewy Panel

Lewy panel w template'cie ma dwie główne sekcje:

1. Lista typów komórek.
2. Lista organelli aktywnego modelu.

W MedApp odpowiednik:

1. Lista modeli / układów / struktur głównych.
2. Lista warstw, punktów lub podstruktur wybranego modelu.

### Element Listy

Wiersz modelu:

- grid `58px 1fr 28px`,
- miniatura po lewej,
- serifowa nazwa,
- mały opis pod spodem,
- gwiazdka/favorite po prawej,
- aktywny stan: `background: var(--accent-soft)`, obramowanie z `var(--accent)`, lekki cień, delikatne podniesienie.

Miniatury są ważne. Template nie używa abstrakcyjnych ikon dla modeli, tylko renderów PNG/GLB preview. Dla MedApp warto przygotować miniatury struktur lub screeny modeli, nawet jeśli będą statyczne.

### Lista Podstruktur

Wiersz organelli:

- mała kolorowa kropka,
- nazwa,
- aktywny stan jako jasna plama, bez ciężkiego borderu,
- hover przesuwa o `2px` w prawo.

W MedApp dla warstw i adnotacji można używać podobnego wzorca: kolorowa kropka = typ warstwy albo status punktu.

## Centralna Scena 3D

### Rola Sceny

Scena jest najważniejszym elementem ekranu. Nie jest zamknięta w małym viewerze technicznym; jest wielką planszą atlasu.

Najważniejsze cechy:

- wysoka karta sceny: `min-height` około `820px` na szerokim desktopie, `700px` na średnim, `780-800px` na mniejszych widokach,
- tytuł modelu wewnątrz sceny, u góry po lewej,
- kontrolka trybu widoku u góry po prawej,
- canvas absolutnie pozycjonowany wewnątrz sceny,
- toolbary na dole sceny,
- dużo negatywnej przestrzeni wokół modelu.

### Kadrowanie Modelu

Model 3D jest kadrowany centralnie, ale często lekko przesunięty w prawo przez obecność tytułu i panelu widoku. Kamera:

- `position: [0, 0.2, 5.8]`,
- `fov: 38`,
- `minDistance: 3.2`,
- `maxDistance: 8.4`,
- `enableDamping: true`,
- `dampingFactor: 0.08`,
- `enablePan: true`.

Model powinien:

- zajmować około 35-55% wysokości sceny w stanie domyślnym,
- mieć widoczny miękki cień kontaktowy,
- unosić się lekko nad podłożem,
- obracać się powoli automatycznie, jeśli auto-rotate jest włączone,
- mieć zachowane miejsce na kontrolki, bez kolizji z toolbarem.

### Światło i Materiały

Template używa miękkiego, ciepłego oświetlenia:

- ambient light około `1.28-1.42`,
- hemisphere light z ciepłą górą `#fff8ea` / `#fffaf0`,
- directional light z przodu/góry: intensywność około `2.72-2.75`,
- spot light z kolorem `var(--accent-soft)` dla modeli studyjnych,
- point light z `var(--accent)`,
- `ContactShadows` pod modelem.

Dla assetów GLB:

- tryb `native` zachowuje oryginalne materiały, ale podbija jasność, nasycenie i kontrast,
- tryb `studio` generuje/koloryzuje vertex colors według palety modelu,
- materiały są dwustronne (`DoubleSide`),
- roughness jest raczej wysokie i miękkie,
- metalness minimalny.

MedApp powinien przenieść zasadę: model ma wyglądać jak eksponat w jasnym studiu, nie jak ciemny model CAD.

### Tryby Widoku

Template ma dwa tryby:

- `Mesh` - pełny model,
- `Focus` - aktywna struktura zostaje podkreślona, pozostałe są przygaszone.

Dodatkowo:

- `Cross Section` jako przełącznik,
- `Rotate`,
- `Isolate`,
- `Hide Others`,
- `Reset View`,
- `Screenshot`,
- `GLB Export`.

W MedApp odpowiadają temu istniejące/potencjalne funkcje:

- widoczność warstw,
- aktywna adnotacja,
- tryb nauki,
- tryb quizu,
- reset kamery,
- eksport/screenshot.

Zasada UX: przełączniki są małe i narzędziowe, ale stale widoczne w kontekście sceny. Nie przenosić ich do odległego menu.

## Prawy Panel

Prawy panel nie jest tylko "properties inspector". To panel edukacyjny. Template zawiera:

- `Organelle Details`,
- `Biological Notes`,
- `AI Tutor`,
- `Where It Occurs`.

Dla MedApp warto odwzorować to jako:

- `Szczegóły struktury`,
- `Notatki anatomiczne / kliniczne`,
- `Tryb nauki / AI Tutor`,
- `Gdzie występuje / relacje przestrzenne`.

### Szczegóły Struktury

Wzorzec:

- duża kolorowa kula/orb struktury,
- nazwa serif,
- podtytuł italic,
- lista atrybutów `dt/dd`,
- przełącznik label visibility,
- favorite/heart w nagłówku.

Dla anatomii:

- orb może oznaczać kolor warstwy lub układu,
- atrybuty: układ, region, funkcja, unerwienie, unaczynienie, klinicznie ważne,
- przełącznik label może sterować widocznością etykiety punktu w 3D.

### Notatki

Notatki są krótkie, serifowe, liniowane wizualnie dashed separatorami. Dobrze pasują do edukacyjnego tonu.

W MedApp notatka powinna być konkretna i kliniczna, a nie marketingowa. Format:

- 1-2 krótkie akapity,
- fun fact lub clinical note jako wyróżnienie,
- brak wielkich bloków tekstu.

### AI Tutor / Nauka

Template pokazuje:

- mastery meter,
- aktualny cel lekcji,
- staged prompt,
- listę promptów.

W MedApp można to połączyć z istniejącym `PanelBottom` i trybami nauki:

- postęp nauki dla aktualnej struktury,
- liczba obejrzanych punktów,
- quiz score,
- pytania sugerowane,
- krótki "current lesson focus".

## Dolne Panele

Template ma dwie główne karty pod sceną:

1. `Microscope View`
2. `Compare Cells`

Dla MedApp odpowiedniki:

1. `Punkty / Nauka / Quiz` albo widoki materiałów pomocniczych.
2. `Porównaj struktury` / `Porównaj modele` / `Tryb egzaminu`.

### Microscope View

W template'cie są małe karty obrazów z proceduralnym wzorem:

- grid 4 kolumn,
- miniatura 116px wysokości,
- podpis na dole,
- karta "Add Image" z dashed border.

W MedApp może to być:

- galeria przekrojów,
- rzuty modelu,
- obrazy referencyjne,
- materiały diagnostyczne,
- screeny z modelu.

### Compare Cells

Wzorzec:

- aktualny model po lewej,
- okrągły `VS`,
- porównywany model po prawej,
- przycisk pełnej szerokości `Open Comparison View`.

W MedApp można wykorzystać do:

- porównania dwóch struktur,
- porównania stanu normalnego i patologicznego,
- porównania warstw,
- porównania modeli z różnych regionów.

## Ikony i Kontrolki

Template używa `lucide-react`. Oryginalna aplikacja powinna zachować lucide jako podstawowy język ikon.

Przykłady ikon z template'u:

- `Grid3X3` - galeria,
- `Library` - biblioteka,
- `BookOpen` - notatniki/nauka,
- `Settings` - ustawienia,
- `Box` - mesh/GLB,
- `CircleDot` - focus/isolate,
- `EyeOff` - hide,
- `RotateCcw` - rotate/reset,
- `Camera` - screenshot,
- `Brain` - AI tutor,
- `Gauge` - mastery,
- `Target` - lesson focus,
- `MessageCircle` - prompt.

Zasady:

- przyciski narzędziowe powinny mieć ikonę,
- ikony w top nav mogą mieć podpis na desktopie i być same na mobile,
- aktywne ikony przyjmują `var(--accent)`,
- stroke raczej delikatny, około `1.7-2`.

## Motion

Template używa bardzo spokojnych animacji:

- `rise-in`: opacity + translateY(12px),
- `fade-in`: opacity,
- `scale-in`: opacity + scale(0.985),
- hover row: translateY(-1px),
- hover organelle row: translateX(2px),
- canvas model: `Float` z niską intensywnością,
- auto-rotate: powolne `rotation.y += delta * 0.1`.

Zasada: ruch ma wspierać wrażenie żywego atlasu, ale nie powinien konkurować z modelem.

## Responsywność

Docelowe breakpointy do odwzorowania:

| Breakpoint | Zachowanie |
| --- | --- |
| `> 1400px` | 3 kolumny: lewa szyna, scena, prawa szyna |
| `<= 1400px` | 2 kolumny; prawy panel spada pod scenę w gridzie 3 kart |
| `<= 1080px` | 1 kolumna; scena priorytetowa, header pionowo |
| `<= 720px` | top nav ikonowy, listy jednokolumnowe, toolbary sceny scrollowane |

Aktualny MedApp ma `h-screen overflow-hidden`, co utrudnia odtworzenie template'u na mniejszych ekranach. Nowy UI powinien pozwolić stronie przewijać się tam, gdzie panele nie mieszczą się ergonomicznie.

## Assety 3D i Miniatury

Template korzysta z:

- GLB w `public/models/`,
- preview PNG w `public/nih-previews/`,
- renderów w `public/cell-renders/`,
- renderów transparentnych w `public/cell-renders-transparent/`.

Przed usunięciem `MedAppTemplate` trzeba zdecydować, które assety są potrzebne w MedApp i przenieść je do `public/` oryginalnej aplikacji.

Szczególnie ważne:

- miniatury listy nie powinny zniknąć po usunięciu template'u,
- GLB nie mogą być referencjonowane z folderu template'u,
- źródła assetów z NIH i lokalnych plików powinny zostać opisane w dokumentacji lub metadanych.

## Mapowanie Na Obecną Aplikację

| Obecny element MedApp | Kierunek według template'u |
| --- | --- |
| `app/page.tsx` ciemny shell | Jasny papierowy shell z dużym headerem |
| `PanelLeft` | Karta/lista struktur z miniaturami i akcentami |
| `Viewer3D` | Duża karta studyjna z tytułem, canvasem i toolbarami |
| `LayerPanel` | Kompaktowe listy warstw/podstruktur z kolorowymi kropkami |
| `PanelRight` | Edukacyjny panel szczegółów, notatek, AI/nauki |
| `PanelBottom` | Karty nauki, quizu, porównania i materiałów referencyjnych |
| `UserMenu` | Okrągły avatar/kontrolka w jasnym headerze |
| `app/globals.css` | Nowe tokeny paper/accent/serif/note i responsive shell |

## Zasady Implementacji W Następnym Kroku

1. Najpierw przenieść tokeny kolorów i layout shell do globalnych styli.
2. Przebudować `app/page.tsx` na layout podobny do template'u, bez zmiany logiki danych.
3. Ostylować `PanelLeft` jako listę atlasową z miniaturami.
4. Ostylować `Viewer3D` jako dużą scenę studyjną z tytułem i toolbarami.
5. Przenieść panel szczegółów do wzorca `Organelle Details` / `Biological Notes`.
6. Przebudować `PanelBottom` na edukacyjne karty zgodne z trybami `Punkty`, `Nauka`, `Quiz`.
7. Dopiero potem usunąć `MedAppTemplate`.

## Kryteria Akceptacji UI

Po wdrożeniu kierunku UI aplikacja powinna spełniać te warunki:

- pierwszy ekran pokazuje duży model 3D jako centrum doświadczenia,
- tło i panele są jasne, papierowe, ciepłe i zgodne z paletą template'u,
- aktywny model/struktura zmienia `--accent` i `--accent-soft`,
- lewy panel ma miniatury, nie tylko tekst,
- prawa strona ma edukacyjny charakter, nie tylko techniczne właściwości,
- toolbary 3D są widoczne w kontekście sceny,
- na laptopie prawy panel spada pod scenę zamiast ściskać viewer,
- na mobile top nav redukuje się do ikon, a scena pozostaje używalna,
- model 3D ma jasne światło, miękki cień i powolny ruch,
- UI nie używa dominującego ciemnego granatu z obecnej wersji.

## Ryzyka I Uwagi

- Template ma część tekstów z uszkodzonym kodowaniem w toastach; nie przenosić ich.
- Niektóre modele w template'cie są assetami lokalnymi użytkownika, nie tylko NIH; trzeba sprawdzić prawa i źródła przed produkcyjnym użyciem.
- Aktualna aplikacja używa Next.js 16.2.6. Przed zmianami kodu należy czytać aktualne dokumenty Next z `node_modules/next/dist/docs/`, zgodnie z `AGENTS.md`.
- Template jest Vite/React, więc przenosimy wzorce, nie strukturę projektu.
- Oryginalny MedApp ma już biblioteki Three/Fiber/Drei, więc nie trzeba zmieniać podstawowego stosu 3D.
