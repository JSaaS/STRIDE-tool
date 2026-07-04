# Så använder du STRIDE-verktyget

Den här guiden förklarar hur du använder STRIDE-verktyget på ett enkelt sätt. Den är skriven för dig som är ny på hotmodellering.

## Vad verktyget är till för

Verktyget hjälper dig att titta på ett system och fråga:

> Vad kan gå fel, hur allvarligt är det, och vad behöver vi göra åt det?

Du ritar upp de viktiga delarna av systemet, lägger till flöden mellan dem och dokumenterar möjliga säkerhetshot med STRIDE. Sedan poängsätter du hoten med DREAD så att teamet kan se vad som är viktigast att hantera först.

## ELI5: Vad är STRIDE?

Tänk att systemet är ett hus.

STRIDE är en checklista för att tänka på dåliga saker som kan hända med huset:

- **S - Spoofing:** någon låtsas vara någon annan.
- **T - Tampering:** någon ändrar något som den inte ska ändra.
- **R - Repudiation:** någon gör något dåligt och säger "det var inte jag".
- **I - Information Disclosure:** någon ser hemligheter som den inte ska se.
- **D - Denial of Service:** någon gör så att systemet slutar fungera.
- **E - Elevation of Privilege:** någon får mer makt eller behörighet än den ska ha.

Du behöver inte hitta alla möjliga problem i hela världen. Målet är att tänka strukturerat och hitta de viktiga riskerna.

## ELI5: Vad är DREAD?

DREAD är ett enkelt sätt att poängsätta hur allvarligt ett hot är.

Varje hot får fem poäng från 1 till 10:

- **Damage:** hur stor blir skadan?
- **Reproducibility:** hur lätt är attacken att upprepa?
- **Affected users:** hur många användare, system eller dataposter påverkas?
- **Exploitability:** hur lätt är hotet att utnyttja?
- **Discoverability:** hur lätt är det för en angripare att hitta hotet?

Verktyget summerar poängen. Totalsumman är mellan 0 och 50.

Högre poäng betyder att hotet behöver mer uppmärksamhet. Standardtröskeln är 25. Hot på eller över tröskeln visas som kritiska.

## Innan du börjar

Du behöver en enkel bild av systemet:

- viktiga applikationer eller tjänster
- API:er
- databaser
- externa system
- användare eller klienter
- viktiga dataflöden
- trust boundaries, till exempel internet, DMZ, internt nät, molnprenumeration eller tredjepartssystem

Försök inte göra diagrammet perfekt. Börja enkelt och förbättra modellen när ni lär er mer.

## Steg 1: Öppna verktyget

Öppna `index.html` i en webbläsare.

Verktyget körs lokalt i webbläsaren. Det finns ingen server, inget byggsteg och ingen inloggning.

## Steg 2: Namnge analysen

Använd namnfältet högst upp för att ge analysen ett tydligt namn, till exempel:

- `Kundportal STRIDE`
- `Order API hotmodell`
- `Granskning av integrationsplattform`

Namnet används också i exporter och rapporter.

## Steg 3: Lägg till trust boundaries

En trust boundary är en gräns mellan områden med olika nivå av tillit.

Exempel:

- webbläsare till backend
- internet till internt nät
- applikation till databas
- ditt system till en tredjepartsleverantör
- en molnprenumeration till en annan

Använd **+ Gräns** för att lägga till en gräns.

Dra i gränsens rubrik för att flytta den. Använd handtaget nere till höger för att ändra storlek.

## Steg 4: Lägg till komponenter

En komponent är en viktig del av systemet.

Exempel:

- webbfrontend
- mobilapp
- API
- databas
- meddelandekö
- identitetsleverantör
- extern betaltjänst
- batchjobb

Använd **+ Komponent** för att lägga till en komponent. Om komponenten hör hemma i en trust boundary väljer du den gränsen när komponenten skapas.

Dra runt komponenterna på kartan så att modellen blir lätt att läsa.

## Steg 5: Lägg till flöden

Ett flöde är information som rör sig från en komponent till en annan.

Exempel:

- webbläsare skickar login-request till API
- API läser kunddata från databas
- ordertjänst publicerar meddelande till kö
- integrationstjänst anropar externt affärssystem

Så lägger du till ett flöde:

1. Klicka på flödesknappen.
2. Klicka på startkomponenten.
3. Klicka på målkomponenten.
4. Ge flödet ett kort namn om det behövs.

Flöden är viktiga eftersom många verkliga hot uppstår mellan komponenter, särskilt när data passerar en trust boundary.

## Steg 6: Analysera en komponent

Klicka på en komponent. Analyspanelen öppnas till höger.

Du ser sex STRIDE-kort:

- S - Spoofing
- T - Tampering
- R - Repudiation
- I - Information Disclosure
- D - Denial of Service
- E - Elevation of Privilege

Klicka på en kategori när du hittar ett relevant hot.

För varje hot skriver du:

- **Hur är attackvektorn möjlig?** Beskriv hur attacken kan gå till.
- **Befintliga skydd:** Vad skyddar redan mot hotet?
- **Luckor och brister:** Vad saknas eller är svagt?
- **DREAD-poäng:** Sätt 1 till 10 i varje DREAD-dimension.

Bra hotbeskrivningar är konkreta:

- Bra: `En stulen bearer token kan återanvändas eftersom audience inte valideras.`
- Svag: `Autentiseringsproblem.`

## Steg 7: Poängsätt med DREAD

Använd DREAD för att prioritera lättare.

En praktisk tumregel:

- **1-3:** låg
- **4-6:** medel
- **7-10:** hög

Lägg inte för mycket tid på att diskutera exakt siffra. Målet är att skilja mindre problem från allvarliga hot.

Bra frågor:

- Kan detta exponera känslig information?
- Kan en angripare upprepa attacken enkelt?
- Påverkas många användare eller system?
- Är attacken enkel eller automatiserbar?
- Skulle en angripare lätt hitta den här vägen?

## Steg 8: Använd tröskeln

Tröskeln är den poäng där verktyget markerar ett hot som kritiskt.

Standard: `25`

Om ett hot får poäng på eller över tröskeln markeras komponenten tydligare.

Använd tröskeln som prioriteringshjälp, inte som absolut sanning. Ett hot med 24 poäng kan fortfarande vara viktigt.

## Steg 9: Exportera rapporten

Använd **Exportera rapport** när du vill ha en läsbar rapport.

Rapporten innehåller:

- antal komponenter
- antal flöden
- antal dokumenterade hot
- antal kritiska hot
- flödeslista
- STRIDE-fynd
- DREAD-poäng
- befintliga skydd och luckor

Använd rapporten som diskussionsunderlag med arkitekter, utvecklare, säkerhetsgranskare, produktägare och systemägare.

## Förslag på workshopflöde

1. Rita systemet på hög nivå.
2. Lägg till trust boundaries.
3. Lägg till de viktigaste dataflödena.
4. Ta en komponent i taget.
5. Gå igenom S, T, R, I, D och E.
6. Dokumentera realistiska hot.
7. Poängsätt med DREAD.
8. Gå igenom de högsta poängen.
9. Gör om de viktigaste luckorna till åtgärder.

## Vad är ett bra hot?

Ett bra hot är tillräckligt konkret för att någon ska kunna agera på det.

Bra:

- `Osignerade webhook-payloads kan ändras innan de når order-API:t.`
- `Admin-API accepterar tokens utan att kontrollera rätt roll.`
- `Felsvar kan exponera kundidentifierare och backend-detaljer.`

För vagt:

- `Säkerhetsproblem`
- `API:t kan hackas`
- `Behöver bättre auth`

Använd den här regeln:

> Om två attackvägar skulle ha olika skydd, luckor eller DREAD-poäng, skriv dem som separata hot.

## Vanliga misstag

- Rita för mycket detaljer innan analysen startar.
- Behandla STRIDE som en checklista där varje kategori måste ge ett hot.
- Skriva vaga hot som inte går att åtgärda.
- Sätta hög poäng på allt.
- Glömma dataflöden och bara analysera lådor.
- Tolka låg DREAD-poäng som bevis på att ingen åtgärd behövs.

## Snabbt exempel

System:

- webbläsare
- webbapp
- API
- databas

Flöde:

- webbläsare skickar login-request till API

Möjliga STRIDE-fynd:

- **Spoofing:** stulen token kan återanvändas.
- **Tampering:** request-payload kan ändras om valideringen är svag.
- **Repudiation:** loginförsök loggas inte med tillräcklig detalj.
- **Information Disclosure:** felmeddelanden avslöjar om en e-postadress finns.
- **Denial of Service:** login-endpoint saknar rate limit.
- **Elevation of Privilege:** rollkontroller görs bara i frontend.

Varje relevant fynd ska dokumenteras och poängsättas separat.

## Sista rådet

Håll modellen användbar, inte perfekt. En liten modell med tydliga hot och riktiga åtgärder är bättre än ett snyggt diagram med vaga fynd.
