# STRIDE – grunderna

## Syfte
Det här dokumentet ger en praktisk introduktion till STRIDE som metod för att identifiera säkerhetshot i system, lösningar och arkitektur.

STRIDE används ofta i threat modeling för att strukturera tänkandet kring vilka typer av angrepp eller missbruk som kan drabba ett system.

Det är inte en komplett riskanalys i sig, men det är ett mycket bra sätt att upptäcka säkerhetshål, särskilt tidigt i design eller i samband med granskning av befintlig arkitektur.

---

## Vad är STRIDE?
STRIDE är en minnesregel där varje bokstav representerar en typ av hot:

- **S – Spoofing**
- **T – Tampering**
- **R – Repudiation**
- **I – Information Disclosure**
- **D – Denial of Service**
- **E – Elevation of Privilege**

Poängen är att systematiskt gå igenom ett system och fråga:

- Kan någon utge sig för att vara någon annan?
- Kan någon ändra data eller flöden otillåtet?
- Kan någon förneka att de gjort något?
- Kan information läcka?
- Kan tjänsten störas eller slås ut?
- Kan någon skaffa sig mer rättigheter än de borde ha?

---

## Varför STRIDE är användbart
STRIDE hjälper ett team att tänka bredare än bara "är lösenorden starka?" eller "har vi kryptering?".

Metoden passar bra när man vill:

- granska en arkitektur
- analysera API:er och integrationer
- gå igenom dataflöden
- förstå om det finns dold säkerhetsskuld
- hitta luckor i befintliga skydd

Den är särskilt bra i workshopformat, eftersom den ger en enkel struktur för diskussion.

---

## De sex hotkategorierna

## 1. Spoofing
### Vad det betyder
Spoofing handlar om att någon utger sig för att vara en annan användare, tjänst, komponent eller identitet.

### Typiska exempel
- en angripare använder stulna inloggningsuppgifter
- en tjänst litar på ett anrop utan att verifiera avsändaren ordentligt
- ett API tar emot tokens eller certifikat utan korrekt validering
- ett internt system antar att trafik från det interna nätet alltid är legitim

### Frågor att ställa
- Hur verifieras användare och system?
- Kan en klient, tjänst eller integration utge sig för att vara någon annan?
- Litar vi på nätverksplacering i stället för stark identitet?
- Hur skyddas hemligheter, tokens, nycklar och certifikat?

### Vanliga skydd
- stark autentisering
- korrekt token- och certifikatvalidering
- hantering av hemligheter i säkra valv
- kortlivade tokens och rotationsrutiner
- mutual TLS eller annan stark maskinidentitet där det behövs

---

## 2. Tampering
### Vad det betyder
Tampering innebär att data, meddelanden, filer, konfiguration eller programkod ändras på ett otillåtet sätt.

### Typiska exempel
- någon manipulerar ett API-anrop eller en payload
- meddelanden i en integrationskedja ändras på vägen
- konfigurationsfiler ändras utan kontroll
- loggar eller revisionsspår manipuleras

### Frågor att ställa
- Kan data ändras otillåtet i transit eller i vila?
- Hur vet vi att ett meddelande eller en fil är oförändrad?
- Hur skyddas konfiguration, kod och deployments?
- Finns det tillräcklig validering av inkommande data?

### Vanliga skydd
- signering, checksummor eller andra integritetskontroller
- kryptering under transport
- strikt validering av input
- skyddade deployments och ändringskontroller
- immutabla loggar eller starkt kontrollerad loggåtkomst

---

## 3. Repudiation
### Vad det betyder
Repudiation betyder att en användare eller aktör kan förneka att de utfört en handling, och att systemet saknar tillräckligt bevis för motsatsen.

### Typiska exempel
- en administratör ändrar något utan spårbarhet
- ett affärskritiskt beslut tas i systemet men det går inte att se av vem
- loggning saknas eller är för svag för att användas vid incidentutredning

### Frågor att ställa
- Kan vi i efterhand bevisa vem som gjorde vad?
- Loggas kritiska händelser på ett tillförlitligt sätt?
- Har vi spårbarhet för administrativa åtgärder?
- Kan loggar manipuleras eller raderas?

### Vanliga skydd
- tydliga revisionsspår
- centraliserad och skyddad loggning
- tidsstämplar och identitetskoppling till åtgärder
- separering mellan den som agerar och den som granskar

---

## 4. Information Disclosure
### Vad det betyder
Information Disclosure handlar om att information exponeras för någon som inte ska ha tillgång till den.

### Typiska exempel
- personuppgifter läcker via API-svar eller loggar
- felaktiga behörigheter gör att användare ser för mycket
- testmiljöer innehåller kopior av produktionsdata
- databackuper, filer eller meddelanden lagras oskyddat

### Frågor att ställa
- Vilken information är känslig här?
- Kan någon se data de inte borde se?
- Läcker vi information via loggar, felmeddelanden eller integrationer?
- Är data krypterad där det behövs?
- Har vi kontroll på exporter, backup och testdata?

### Vanliga skydd
- åtkomstkontroll och dataminimering
- kryptering i vila och under transport
- maskning eller anonymisering av testdata
- granskning av loggar, felmeddelanden och API-svar
- klassificering av data och tydliga hanteringsregler

---

## 5. Denial of Service
### Vad det betyder
Denial of Service innebär att ett system, en tjänst eller ett flöde överbelastas eller görs otillgängligt.

### Typiska exempel
- ett API saknar begränsning av trafikmängd
- en integrationskomponent kan blockeras av ett fåtal dyra anrop
- en extern beroendekedja gör att hela lösningen stannar
- ett felaktigt meddelande skapar köbildning eller resurslåsning

### Frågor att ställa
- Vad händer om någon skickar för många anrop eller stora payloads?
- Finns det skydd mot överbelastning?
- Kan ett delsystem slå ut hela kedjan?
- Hur återhämtar sig lösningen vid fel eller toppbelastning?

### Vanliga skydd
- rate limiting och throttling
- köer, buffertar och circuit breakers
- isolering mellan kritiska komponenter
- timeout-hantering och backoff-strategier
- övervakning och autoskalning där det passar

---

## 6. Elevation of Privilege
### Vad det betyder
Elevation of Privilege betyder att någon får högre rättigheter än de borde ha.

### Typiska exempel
- en vanlig användare kan nå adminfunktioner
- en tjänst har bredare rättigheter än nödvändigt
- ett systemkonto används för flera syften och blir för kraftfullt
- en kombination av brister gör att en angripare kan ta sig från låg till hög behörighet

### Frågor att ställa
- Kan någon eskalera sina rättigheter?
- Är roller och rättigheter tillräckligt avgränsade?
- Finns det administrativa funktioner som nås för lätt?
- Har tjänster, integrationer eller pipelines fler privilegier än de behöver?

### Vanliga skydd
- minsta privilegium
- rollbaserad eller attributbaserad åtkomstkontroll
- separering av administrativa funktioner
- härdning av tjänstidentiteter och pipelines
- regelbunden granskning av behörigheter

---

## Hur STRIDE används i praktiken
En vanlig metod är att utgå från en enkel arkitekturbild eller ett dataflöde och sedan analysera varje komponent och varje övergång.

Exempel:
- klient
- webbapp eller frontend
- API
- integrationslager
- databas
- externa system
- meddelandeköer och batchflöden

För varje del frågar man:
- vilka STRIDE-hot är relevanta här?
- vilka skydd finns redan?
- vilka luckor eller osäkerheter finns?
- vilka hot är realistiska och allvarliga?

Det viktiga är inte att tvinga in alla sex kategorier överallt, utan att använda dem för att tänka strukturerat.

---

## Enkel workshopmodell

### Steg 1: Rita upp lösningen enkelt
Beskriv huvudkomponenter, dataflöden, externa beroenden och trust boundaries.

### Steg 2: Gå igenom komponent för komponent
Fråga vilka STRIDE-hot som är rimliga för varje del.

### Steg 3: Dokumentera skydd och luckor
Notera både befintliga kontroller och kända svagheter.

### Steg 4: Prioritera
Alla hot är inte lika viktiga. Värdera sannolikhet, konsekvens och exponering.

### Steg 5: Översätt till åtgärder
Resultatet ska helst mynna ut i konkreta förbättringar, inte bara en lista med hot.

---

## Exempel: enkel analys av ett API
Anta ett API som tar emot anrop från externa klienter och sparar data i en databas.

### Möjliga STRIDE-frågor
**Spoofing**
- Hur vet API:et att klienten verkligen är den den utger sig för att vara?

**Tampering**
- Kan requestdata manipuleras utan att upptäckas?

**Repudiation**
- Kan vi i efterhand se vem som skickade vilket anrop?

**Information Disclosure**
- Riskerar API:et att lämna ut för mycket data i svar eller felmeddelanden?

**Denial of Service**
- Vad händer om klienten skickar extremt många anrop?

**Elevation of Privilege**
- Kan en användare med låg behörighet nå funktioner som kräver högre privilegier?

Det här gör STRIDE konkret och lätt att använda även i relativt korta genomgångar.

---

## Vad STRIDE inte ersätter
STRIDE är användbart, men det ersätter inte:

- riskbedömning av affärskonsekvenser
- säkerhetskrav och arkitekturprinciper
- penetrationstester och teknisk verifiering
- sårbarhetsskanning och patchhantering
- juridiska och regulatoriska bedömningar

Se det som ett sätt att hitta och strukturera hot, inte som hela säkerhetsarbetet.

---

## Tecken på att STRIDE-arbetet fungerar
Ett bra STRIDE-arbete leder ofta till att teamet:

- upptäcker antaganden man tidigare tagit för givna
- hittar gränsytor där tillit varit för hög
- synliggör gammal säkerhetsskuld
- får en bättre gemensam bild av vad som faktiskt behöver åtgärdas

---

## Kort sammanfattning
STRIDE hjälper er att tänka på sex grundläggande hottyper:

- **Spoofing** – falsk identitet
- **Tampering** – otillåten ändring
- **Repudiation** – brist på spårbarhet
- **Information Disclosure** – informationsläckage
- **Denial of Service** – otillgänglighet
- **Elevation of Privilege** – otillåten behörighetsökning

Som arbetsmodell är STRIDE enkel, men kraftfull. Den passar särskilt bra när ni vill förstå om en lösning bara har mindre brister – eller om det finns verklig säkerhetsskuld som bör hanteras nu.
Samla ihop analysen per komponent och informationsflöde. Plotta vilka typer av STRIDE-hot som gäller. Nyttja DREAD:

**D**amage
**R**eproducability
**A**ffected users
**E**xploitability
**D**iscoverability

Varje del i DREAD får en poäng 1-10, sen summeras detta och en tröskel sätts. Över tröskeln = mer kritiskt att fixa.

1. **Rita ett dataflödesdiagram (DFD)** över systemet — identifiera komponenter, dataflöden, förtroendegränser och externa aktörer.
2. **Gå igenom varje element** i diagrammet och fråga: vilka STRIDE-hot är relevanta här?
3. **Dokumentera varje identifierat hot** med: beskrivning, angriparens mål, och potentiell påverkan.
4. **Prioritera hoten** baserat på risk (sannolikhet × konsekvens). DREAD eller CVSS kan användas.
5. **Definiera åtgärder** för varje hot och lägg in dem i backloggen med tydlig prioritering.