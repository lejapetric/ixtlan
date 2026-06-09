- **ID in naziv**
- **Vhodni pogoji (precondition)**
- **Izhodni pogoji (postcondition)**
- **Opis poteka (flow)**
- **Izjeme in napake**
- **Prioriteta (MoSCoW)**
---
# 5.0 Funkcionalne zahteve – modul za izdajanje računov

## 5.1 Upravljanje s podatki – obstoječa šifranta

### FZ-01 – Pregled podatkov o kupcu

- **Vhodni pogoji:** Uporabnik je prijavljen in ima vsaj bralni dostop do modula računov.
- **Izhodni pogoji:** Pri izbiri kupca sistem prikaže vse shranjene podatke o kupcu.
- **Opis:**  
  Sistem prikaže naslednje podatke o kupcu: naziv, naslov, telefon, e-pošto (za fizične osebe opcijsko), davčno številko in vrsto kupca (pravna/fizična oseba). Prikaz je berljiv in neomogočen za urejanje (razen prek šifranta kupcev).
- **Izjeme:** Če kupec nima izpolnjene davčne številke in je pravna oseba, sistem ob izdaji računa prikaže opozorilo.
- **Prioriteta:** Must have

### FZ-02 – Iskanje in izbira kupca

- **Vhodni pogoji:** Uporabnik je na obrazcu za nov račun ali urejanje računa.
- **Izhodni pogoji:** Izbrani kupec je povezan z računom.
- **Opis:**  
  Uporabnik začne tipati vsaj 2 znaka v iskalno polje. Sistem sproti ponuja kupce, pri čemer išče po:
  - nazivu (delno ujemanje, neobčutljivo na velike/male črke),
  - davčni številki (natančno ujemanje od 3. znaka dalje),
  - e-pošti (delno ujemanje).  
  Po izbiri kupca se pod poljem prikažejo njegovi podatki (naziv, naslov, e-pošta, davčna).
- **Izjeme:** Če iskanje ne vrne nobenega kupca, sistem prikaže sporočilo »Ni zadetkov. Preverite črkovanje ali dodajte kupca v šifrant.«
- **Prioriteta:** Must have

### FZ-03 – Pregled podatkov o storitvi

- **Vhodni pogoji:** Uporabnik je prijavljen.
- **Izhodni pogoji:** Sistem prikaže podatke o izbrani storitvi iz šifranta.
- **Opis:**  
  Sistem za vsako storitev prikaže: šifro, naziv, ceno (v EUR), enoto mere (ura, km, dan, parcela, kos) in stopnjo DDV (22 %, 9,5 %, 5 %, 0 %).
- **Izjeme:** Če je cena ali stopnja DDV nedefinirana, sistem ob poskusu dodajanja na račun prikaže napako.
- **Prioriteta:** Must have

### FZ-04 – Iskanje in dodajanje storitve na račun

- **Vhodni pogoji:** Uporabnik je v postavki računa (modalno okno).
- **Izhodni pogoji:** Storitev je dodana kot vrstica v tabelo postavk.
- **Opis:**  
  Uporabnik išče storitev po šifri ali nazivu (avtodopolnjevanje). Po izbiri sistem samodejno izpolni: naziv, enoto, ceno in DDV. Uporabnik ročno doda količino. Po potrditvi se postavka doda v tabelo.
- **Izjeme:** Če količina ni vnesena ali je ≤ 0, sistem ne doda postavke in prikaže napako.
- **Prioriteta:** Must have

### FZ-05 – Dodajanje popusta na račun

- **Vhodni pogoji:** Račun ima vsaj eno postavko.
- **Izhodni pogoji:** Popust je upoštevan pri izračunu osnove za DDV in bruto zneska.
- **Opis:**  
  Uporabnik v polje »Popust (%)« vnese število med 0 in 100. Sistem takoj preračuna:
  - znesek popusta (skupaj neto × popust/100),
  - osnovo za DDV (skupaj neto – znesek popusta),
  - DDV po stopnjah in bruto.
- **Izjeme:** Če vnos ni število ali je izven območja, sistem zavrne in prikaže opozorilo.
- **Prioriteta:** Must have

---

## 5.2 Ustvarjanje, urejanje in izdajanje računa

### FZ-06 – Ustvarjanje novega praznega računa

- **Vhodni pogoji:** Uporabnik ima pravico izdajanja računov.
- **Izhodni pogoji:** Odpre se prazen obrazec z generiranim začasnim ID-jem.
- **Opis:**  
  Klik na »Nov račun« → sistem prikaže prazen obrazec. Privzeto:
  - datum izdaje = danes,
  - rok plačila = iz sistemskih nastavitev,
  - status = osnutek.
- **Prioriteta:** Must have

### FZ-07 – Vnos podatkov na račun

- **Vhodni pogoji:** Odprt je obrazec novega računa.
- **Izhodni pogoji:** Podatki so shranjeni v kontekstu trenutnega računa.
- **Opis:**  
  Uporabnik izpolni:
  - kupec (iz FZ-02),
  - datum izdaje,
  - datum storitve od–do (opcijsko),
  - rok plačila (samo prikaz, ne ureja se),
  - opombe (prosto besedilo).
- **Izjeme:** Če kupec ni izbran, gumb »Izdaj račun« ostane onemogočen.
- **Prioriteta:** Must have

### FZ-08 – Dodajanje postavke na račun

- **Vhodni pogoji:** Odprt je obrazec računa.
- **Izhodni pogoji:** Postavka je dodana v tabelo in preračunani vsi zneski.
- **Opis:**  
  Klik »Dodaj postavko« → modalno okno. Uporabnik:
  - izbere ali ročno vpiše opis,
  - vnese količino (≥ 0,01),
  - izbere enoto,
  - ceno (lahko prepiše),
  - DDV (lahko prepiše, vendar se ob izbiri storitve samodejno nastavi).  
  Po shranjevanju se postavka prikaže v tabeli.
- **Izjeme:** Če manjka opis ali količina → onemogočen gub »Dodaj«.
- **Prioriteta:** Must have

### FZ-09 – Urejanje osnutka računa

- **Vhodni pogoji:** Račun ima status »osnutek«.
- **Izhodni pogoji:** Spremembe so shranjene, račun ostaja v statusu osnutek.
- **Opis:**  
  Uporabnik lahko kadarkoli spremeni vse podatke in postavke. Po izdaji statusa »izdan« urejanje ni več mogoče.
- **Prioriteta:** Must have

### FZ-10 – Brisanje postavke z računa

- **Vhodni pogoji:** Račun je v statusu osnutek in ima vsaj eno postavko.
- **Izhodni pogoji:** Postavka izbrisana, zneski preračunani.
- **Opis:**  
  Klik na koš (🗑) ob postavki → potrditveno okno »Ali ste prepričani?« → po potrditvi se postavka odstrani.
- **Izjeme:** Po brisanju zadnje postavke se skupni zneski postavijo na 0.
- **Prioriteta:** Must have

### FZ-11 – Samodejni izračun skupnih zneskov

- **Vhodni pogoji:** Vsaj ena postavka je v tabeli.
- **Izhodni pogoji:** Prikazani neto, DDV po stopnjah in bruto.
- **Opis:**  
  Sistem sproti računa:
  - neto po postavkah,
  - vsota neto,
  - popust (če obstaja),
  - osnova za DDV,
  - DDV ločeno po stopnjah (22 %, 9,5 %, 5 %, 0 %),
  - bruto = osnova + DDV.
- **Prioriteta:** Must have

---

## 5.3 Geodetske specifike

### FZ-12 – Geodetski podatki pri postavki

- **Vhodni pogoji:** Uporabnik dodaja/ureja postavko.
- **Izhodni pogoji:** Geodetski podatki so shranjeni in vidni na računu.
- **Opis:**  
  V modalnem oknu za postavko so opcijska polja:
  - številka parcele,
  - katastrska občina,
  - ime katastra,
  - ID zaznambe.  
  Vsi podatki se izpišejo pod opisom postavke na PDF.
- **Prioriteta:** Must have

### FZ-13 – Obračun terenskega dela

- **Opis:**  
  Terensko delo se obračuna preko storitve iz šifranta (npr. »Terensko delo – ura«). Uporabnik doda količino (ure). Brez dodatne logike.
- **Prioriteta:** Must have

### FZ-14 – Obračun potnih stroškov

- **Opis:**  
  Kilometrina, dnevnice, cestnina in parkirnina so ločene storitve v šifrantu. Vsaka se doda kot samostojna postavka.
- **Prioriteta:** Must have

### FZ-15 – Obračun čakalnih ur

- **Opis:**  
  Čakalne ure so storitev v šifrantu. Uporabnik doda količino (ure) in ceno. Brez dodatne logike.
- **Prioriteta:** Must have

---

## 5.4 DDV in davki

### FZ-16 – Podpora za vse stopnje DDV

- **Opis:**  
  Sistem podpira stopnje 22 %, 9,5 %, 5 %, 0 %. Stopnja se prevzame iz šifranta in je na ravni postavke ni mogoče ročno spremeniti (razen če gre za ročni vnos opisa – takrat uporabnik izbere stopnjo).
- **Prioriteta:** Must have

### FZ-17 – Prikaz neto, DDV in bruto po postavkah

- **Opis:**  
  Vsaka vrstica v tabeli postavk vsebuje stolpce: količina, cena, neto, DDV %, bruto.
- **Prioriteta:** Must have

### FZ-18 – Prikaz DDV ločeno po stopnjah

- **Opis:**  
  Na dnu računa (v PDF in na zaslonu) je skupinski prikaz:
  - stopnja DDV,
  - davčna osnova (neto),
  - znesek DDV.
- **Prioriteta:** Must have

### FZ-19 – Zakonska podlaga za 0 % DDV

- **Vhodni pogoji:** Vsaj ena postavka ima DDV 0 %.
- **Izhodni pogoji:** Račun ni mogoče izdati brez izbrane zakonske podlage.
- **Opis:**  
  Pri postavkah s 0 % DDV mora uporabnik izbrati razlog s spustnega seznama (npr. »91. člen ZDDV-1 – oprostitev pri izvozu«). Brez tega računa ni mogoče izdati.
- **Prioriteta:** Must have

---

## 5.5 Distribucija in arhiviranje

### FZ-20 – Samodejno generiranje in shranjevanje PDF

- **Vhodni pogoji:** Račun je pripravljen za izdajo (vsaj kupec in ena postavka).
- **Izhodni pogoji:** PDF shranjen na strežniku, račun dobi številko in status »izdan«.
- **Opis:**  
  Klik »Izdaj račun« → validacija → sistem dodeli številko (leto-zaporedna) → generira PDF po predlogi → shrani v arhivsko mapo → zabeleži v revizijsko sled.
- **Prioriteta:** Must have

### FZ-21 – Ročno pošiljanje računa po e-pošti

- **Vhodni pogoji:** Račun je izdan.
- **Izhodni pogoji:** E-pošta poslana, račun dobi oznako »poslano« (opcijsko).
- **Opis:**  
  Klik »Pošlji« → pogovorno okno z možnostjo urejanja spremljevalnega besedila. PDF je priložen. Pošiljanje se izvede šele po kliku na »Pošlji«.
- **Prioriteta:** Must have

### FZ-22 – Natis računa

- **Opis:**  
  Klik »Natisni« → brskalnikov tiskalni predogled. Uporabnik sam izbere tiskalnik.
- **Prioriteta:** Must have

### FZ-23 – Samodejno označevanje statusa »Poslano« (po e-pošti)

- **Opis:**  
  Ko je e-pošta uspešno poslana (brez napake SMTP), sistem nastavi status na »poslano« in shrani čas pošiljanja. Pri navadni pošti se označi ročno.
- **Prioriteta:** Should have

### FZ-24 – Iskanje in filtriranje v arhivu

- **Opis:**  
  Uporabnik lahko išče po:
  - številki računa (delno ujemanje),
  - kupcu (naziv ali davčna),
  - datumu izdaje (od–do),
  - znesku (min–max),
  - statusu (izbran s seznama).  
  Rezultati se takoj posodobijo.
- **Prioriteta:** Must have

### FZ-25 – Izvoz računov v Excel

- **Opis:**  
  Uporabnik izbere časovno obdobje in morebitne filtre. Klik »Izvoz Excel« → sistem ustvari .xlsx datoteko z vsemi stolpci tabele (vključno z bruto, neto, DDV).
- **Prioriteta:** Must have

---

## 5.6 Plačila in QR koda

### FZ-26 – UPN QR koda na računu

- **Opis:**  
  Vsak izdan račun vsebuje QR kodo s podatki:
  - ime in naslov podjetja,
  - TRR (IBAN),
  - znesek (bruto),
  - sklic (format SI00 + leto + zaporedna številka),
  - namen (številka računa).  
  Koda je generirana na PDF.
- **Prioriteta:** Must have

### FZ-27 – Ročno označevanje plačila

- **Opis:**  
  Tajništvo v arhivu pri računu klikne gumb »Plačano« → status se spremeni v »plačano«, doda se timestamp in uporabnik.
- **Prioriteta:** Must have

### FZ-28 – Samodejno označevanje zapadlih računov

- **Opis:**  
  Vsak dan ob 00:00 sistem preveri datum zapadlosti. Če je datum zapadlosti < današnji datum in status ni plačan/storniran, se status nastavi na »zapadlo«.
- **Prioriteta:** Must have

### FZ-29 – Opozorilo o zapadlih računih

- **Opis:**  
  7 dni po zapadlosti se v vmesniku tajništva prikaže rdeče opozorilo s seznamom zapadlih računov (številka, kupec, znesek, dni zamude).
- **Prioriteta:** Should have

---

## 5.7 Predračuni

### FZ-30 – Izdaja predračuna

- **Opis:**  
  Enaka struktura kot račun, vendar:
  - številčenje PR-2026-0001,
  - vodotisk »PREDRAČUN – nima pravne veljave«,
  - ne vpliva na zaporedje računov.
- **Prioriteta:** Should have

### FZ-31 – Povezava predračuna s končnim računom

- **Opis:**  
  Pri izdaji končnega računa lahko uporabnik izbere predračun s spustnega seznama. Sistem doda opombo: »Na podlagi predračuna št. PR-2026-0001«.
- **Prioriteta:** Could have

---

## 5.8 Uporabniške vloge in pravice

### FZ-32 – Dodeljevanje vlog

- **Opis:**  
  Administrator dodeli vlogo: tajništvo, direktor, projektant, zunanji sodelavec, admin.
- **Prioriteta:** Must have

### FZ-33 – Matrika pravic (glej tabelo v specifikaciji)

- **Prioriteta:** Must have

### FZ-34 – Revizijska sled

- **Opis:**  
  Vsaka sprememba se beleži: uporabnik, datum, čas, stara vrednost, nova vrednost. Dnevnik je bralno dostopen.
- **Prioriteta:** Must have

### FZ-35 – Stornacija računa

- **Opis:**  
  Tajništvo klikne »Storniraj« → vnese obvezen razlog → status postane »stornirano«, račun ostane v arhivu.
- **Prioriteta:** Should have

---

## 5.9 Opozorila in avtomatizacija

### FZ-36 – Opozorilo ob manjkajočih podatkih

- **Opis:**  
  Pred izdajo računa sistem preveri:
  - kupec izbran,
  - vsaj ena postavka,
  - pri pravni osebi: davčna številka.  
  Ob napaki se prikaže rdeč seznam.
- **Prioriteta:** Must have

### FZ-37 – Samodejna odjava po nedejavnosti

- **Opis:**  
  Po 30 minutah neaktivnosti se prikaže opozorilo z odštevalcem (60 sekund). Če uporabnik ne reagira → odjava.
- **Prioriteta:** Should have

---

## 5.10 Uporabniški vmesnik

### FZ-38 – Obrazec za izdajo računa

- **Opis:**  
  Obrazec vsebuje: podatke o računu, tabelo postavk, gumbe za shranjevanje, izdajo, predračun, tisk. Vse preračune v realnem času.
- **Prioriteta:** Must have

### FZ-39 – Filtriranje v arhivu

- **Opis:**  
  Stran z arhivom vsebuje filtre (številka, kupec, datum, znesek, status) in tabelo z razvrščanjem.
- **Prioriteta:** Must have

### FZ-40 – Izpisi in poročila

- **Opis:**  
  Uporabnik izbere vrsto poročila (seznam izdanih, neplačani, zapadli, zbirno po kupcih), obdobje in morebitnega kupca. Sistem prikaže tabelo in omogoči izvoz v Excel/PDF.
- **Prioriteta:** Should have



Seveda. Spodaj je **celoten popravljen seznam funkcionalnih zahtev (FZ) v strukturi GIVEN-WHEN-THEN**, ki je primeren za:
- testerje (neposredno pisanje testnih primerov),
- razvijalce (natančno obnašanje),
- naročnika (razumljiv opis).

Poleg vsake zahteve je navedena še **prioriteta (MoSCoW)** in **povezava na izvirno FZ številko**.

---

# Funkcionalne zahteve – Modul za izdajanje računov
## Oblika: GIVEN – WHEN – THEN

---

## 5.1 Upravljanje s podatki – obstoječa šifranta

### FZ-01 (GIVEN-WHEN-THEN) – Pregled podatkov o kupcu
- **GIVEN** sem prijavljen v sistem in imam vsaj bralne pravice do računov  
- **WHEN** v obrazcu za račun izberem kupca iz spustnega seznama  
- **THEN** sistem pod poljem za kupca prikaže: naziv, naslov, telefon, e-pošto, davčno številko in vrsto kupca (pravna/fizična oseba)  
- **PRIORITETA:** Must have

### FZ-02 (GIVEN-WHEN-THEN) – Iskanje in izbira kupca
- **GIVEN** sem na obrazcu za nov račun  
- **WHEN** v iskalno polje za kupca vtipkam vsaj 2 znaka  
- **THEN** sistem prikaže spustni seznam kupcev, ki se ujemajo po: nazivu (delno), davčni številki ali e-pošti  
- **AND** ko izberem kupca, se pod poljem prikažejo njegovi podrobni podatki  
- **PRIORITETA:** Must have

### FZ-03 (GIVEN-WHEN-THEN) – Pregled podatkov o storitvi
- **GIVEN** sem prijavljen v sistem  
- **WHEN** odprem modalno okno za dodajanje postavke  
- **THEN** sistem za vsako storitev iz šifranta prikaže: šifro, naziv, ceno, enoto mere in stopnjo DDV  
- **PRIORITETA:** Must have

### FZ-04 (GIVEN-WHEN-THEN) – Iskanje in dodajanje storitve na račun
- **GIVEN** imam odprto modalno okno za dodajanje postavke  
- **WHEN** začnem tipati naziv ali šifro storitve  
- **THEN** sistem ponudi ustrezne storitve  
- **AND** ko izberem storitev, samodejno izpolni: naziv, ceno, enoto, DDV  
- **AND** po vnosu količine in kliku »Dodaj« se postavka doda v tabelo  
- **PRIORITETA:** Must have

### FZ-05 (GIVEN-WHEN-THEN) – Dodajanje popusta na račun
- **GIVEN** imam račun z vsaj eno postavko  
- **WHEN** v polje »Popust (%)« vnesem število med 0 in 100  
- **THEN** sistem takoj preračuna: znesek popusta, osnovo za DDV, DDV po stopnjah in bruto znesek  
- **PRIORITETA:** Must have

---

## 5.2 Ustvarjanje, urejanje in izdajanje računa

### FZ-06 (GIVEN-WHEN-THEN) – Ustvarjanje novega praznega računa
- **GIVEN** imam pravico izdajanja računov  
- **WHEN** kliknem gumb »Nov račun«  
- **THEN** sistem odpre prazen obrazec z datumom izdaje = danes, rokom plačila = privzeti iz nastavitev in statusom »osnutek«  
- **PRIORITETA:** Must have

### FZ-07 (GIVEN-WHEN-THEN) – Vnos podatkov na račun
- **GIVEN** imam odprt obrazec novega računa  
- **WHEN** izpolnim kupca, datum izdaje in opcijsko datum storitve od–do  
- **THEN** sistem te podatke shrani v kontekst računa  
- **PRIORITETA:** Must have

### FZ-08 (GIVEN-WHEN-THEN) – Dodajanje postavke na račun
- **GIVEN** imam odprt obrazec računa  
- **WHEN** kliknem »Dodaj postavko«, izberem storitev, vnesem količino in kliknem »Shrani«  
- **THEN** sistem doda vrstico v tabelo postavk in preračuna vse skupne zneske  
- **PRIORITETA:** Must have

### FZ-09 (GIVEN-WHEN-THEN) – Urejanje osnutka računa
- **GIVEN** imam račun s statusom »osnutek«  
- **WHEN** spremenim kateri koli podatek ali postavko in kliknem »Shrani osnutek«  
- **THEN** sistem shrani spremembe, status pa ostane »osnutek«  
- **PRIORITETA:** Must have

### FZ-10 (GIVEN-WHEN-THEN) – Brisanje postavke z računa
- **GIVEN** imam račun v statusu osnutek z vsaj eno postavko  
- **WHEN** kliknem ikono koša (🗑) ob postavki in potrdim brisanje  
- **THEN** sistem postavko odstrani in takoj preračuna skupne zneske  
- **PRIORITETA:** Must have

### FZ-11 (GIVEN-WHEN-THEN) – Samodejni izračun skupnih zneskov
- **GIVEN** imam vsaj eno postavko v tabeli  
- **WHEN** dodam, spremenim ali izbrišem postavko ali spremenim popust  
- **THEN** sistem v realnem času prikaže: skupaj neto, osnovo za DDV, DDV ločeno po stopnjah in bruto znesek  
- **PRIORITETA:** Must have

---

## 5.3 Geodetske specifike

### FZ-12 (GIVEN-WHEN-THEN) – Geodetski podatki pri postavki
- **GIVEN** imam odprto modalno okno za dodajanje/urejanje postavke  
- **WHEN** izpolnim opcijska polja: številka parcele, katastrska občina, ime katastra, ID zaznambe  
- **THEN** sistem te podatke shrani in jih na PDF izpise pod opisom postavke  
- **PRIORITETA:** Must have

### FZ-13 (GIVEN-WHEN-THEN) – Obračun terenskega dela
- **GIVEN** v šifrantu obstaja storitev »Terensko delo – ura«  
- **WHEN** dodam to storitev kot postavko in vnesem število ur  
- **THEN** sistem obračuna terensko delo enako kot vsako drugo storitev (količina × cena)  
- **PRIORITETA:** Must have

### FZ-14 (GIVEN-WHEN-THEN) – Obračun potnih stroškov
- **GIVEN** v šifrantu obstajajo storitve: kilometrina, dnevnice, cestnina, parkirnina  
- **WHEN** dodam vsako kot samostojno postavko  
- **THEN** sistem vsako obračuna posebej z lastno ceno in količino  
- **PRIORITETA:** Must have

### FZ-15 (GIVEN-WHEN-THEN) – Obračun čakalnih ur
- **GIVEN** v šifrantu obstaja storitev »Čakalne ure«  
- **WHEN** dodam to storitev in vnesem število ur  
- **THEN** sistem jo obračuna kot običajno postavko  
- **PRIORITETA:** Must have

---

## 5.4 DDV in davki

### FZ-16 (GIVEN-WHEN-THEN) – Podpora za vse stopnje DDV
- **GIVEN** v šifrantu storitev imam določene stopnje DDV (22 %, 9,5 %, 5 %, 0 %)  
- **WHEN** dodam storitev na račun  
- **THEN** sistem prevzame njeno DDV stopnjo in je na ravni postavke ne morem ročno spremeniti (razen pri ročnem opisu)  
- **PRIORITETA:** Must have

### FZ-17 (GIVEN-WHEN-THEN) – Prikaz neto, DDV in bruto po postavkah
- **GIVEN** imam vsaj eno postavko na računu  
- **WHEN** pogledam tabelo postavk  
- **THEN** vsaka vrstica vsebuje stolpce: količina, cena, neto, DDV %, bruto  
- **PRIORITETA:** Must have

### FZ-18 (GIVEN-WHEN-THEN) – Prikaz DDV ločeno po stopnjah
- **GIVEN** imam račun s postavkami z različnimi DDV stopnjami  
- **WHEN** pogledam dno računa (v PDF ali na zaslonu)  
- **THEN** sistem prikaže za vsako stopnjo posebej: davčno osnovo (neto) in znesek DDV  
- **PRIORITETA:** Must have

### FZ-19 (GIVEN-WHEN-THEN) – Zakonska podlaga za 0 % DDV
- **GIVEN** imam postavko s stopnjo DDV 0 %  
- **WHEN** poskušam izdati račun  
- **THEN** sistem zahteva izbiro zakonske podlage s spustnega seznama (npr. »91. člen ZDDV-1«) in brez tega ne dovoli izdaje  
- **PRIORITETA:** Must have

---

## 5.5 Distribucija in arhiviranje

### FZ-20 (GIVEN-WHEN-THEN) – Samodejno generiranje in shranjevanje PDF
- **GIVEN** imam račun z izbranim kupcem in vsaj eno postavko  
- **WHEN** kliknem »Izdaj račun« in sistem potrdi veljavnost  
- **THEN** sistem dodeli številko (leto-zaporedna), generira PDF po predlogi, ga shrani na strežnik, nastavi status »izdan« in zabeleži v revizijsko sled  
- **PRIORITETA:** Must have

### FZ-21 (GIVEN-WHEN-THEN) – Ročno pošiljanje računa po e-pošti
- **GIVEN** imam izdan račun  
- **WHEN** kliknem »Pošlji po e-pošti«, morebiti uredim spremljevalno besedilo in kliknem »Pošlji«  
- **THEN** sistem pošlje e-pošto s priloženim PDF-jem  
- **PRIORITETA:** Must have

### FZ-22 (GIVEN-WHEN-THEN) – Natis računa
- **GIVEN** imam izdan račun  
- **WHEN** kliknem »Natisni račun«  
- **THEN** sistem odpre brskalnikov tiskalni predogled  
- **PRIORITETA:** Must have

### FZ-23 (GIVEN-WHEN-THEN) – Samodejno označevanje statusa »Poslano«
- **GIVEN** sem izbral račun in kliknil »Pošlji po e-pošti«  
- **WHEN** e-pošta je uspešno poslana (brez SMTP napake)  
- **THEN** sistem samodejno nastavi status računa na »poslano« in zabeleži čas pošiljanja  
- **PRIORITETA:** Should have

### FZ-24 (GIVEN-WHEN-THEN) – Iskanje in filtriranje v arhivu
- **GIVEN** sem na strani Arhiv računov  
- **WHEN** izpolnim enega ali več filtrov: številka, kupec, datum od–do, znesek min–max, status in kliknem »Išči«  
- **THEN** sistem prikaže samo račune, ki ustrezajo vsem kriterijem  
- **PRIORITETA:** Must have

### FZ-25 (GIVEN-WHEN-THEN) – Izvoz računov v Excel
- **GIVEN** sem na strani Arhiv računov ali Poročila  
- **WHEN** izberem časovno obdobje in kliknem »Izvoz Excel«  
- **THEN** sistem ustvari .xlsx datoteko z vsemi stolpci tabele (vključno z neto, bruto, DDV)  
- **PRIORITETA:** Must have

---

## 5.6 Plačila in QR koda

### FZ-26 (GIVEN-WHEN-THEN) – UPN QR koda na računu
- **GIVEN** sem izdal račun  
- **WHEN** pogledam PDF računa  
- **THEN** na računu je generirana UPN QR koda z naslednjimi podatki: ime in naslov podjetja, TRR (IBAN), bruto znesek, sklic (npr. SI002026-0048) in namen (številka računa)  
- **PRIORITETA:** Must have

### FZ-27 (GIVEN-WHEN-THEN) – Ročno označevanje plačila
- **GIVEN** imam izdan ali poslan račun  
- **WHEN** v arhivu pri računu kliknem gumb »Plačano«  
- **THEN** sistem spremeni status na »plačano«, doda timestamp in uporabnika ter zabeleži v revizijsko sled  
- **PRIORITETA:** Must have

### FZ-28 (GIVEN-WHEN-THEN) – Samodejno označevanje zapadlih računov
- **GIVEN** imam račun s statusom »izdan« ali »poslan« in datumom zapadlosti, ki je pretekel  
- **WHEN** sistem ob 00:00 izvede dnevno preverjanje  
- **THEN** samodejno nastavi status tega računa na »zapadlo« in zabeleži spremembo  
- **PRIORITETA:** Must have

### FZ-29 (GIVEN-WHEN-THEN) – Opozorilo o zapadlih računih
- **GIVEN** imam enega ali več računov s statusom »zapadlo«, ki so zapadli pred vsaj 7 dnevi  
- **WHEN** se prijavim kot tajništvo  
- **THEN** sistem na vrhu strani prikaže rdeče opozorilo s seznamom: številka, kupec, znesek, dni zamude  
- **PRIORITETA:** Should have

---

## 5.7 Predračuni

### FZ-30 (GIVEN-WHEN-THEN) – Izdaja predračuna
- **GIVEN** sem na obrazcu za nov račun  
- **WHEN** izpolnim podatke in kliknem »Predračun«  
- **THEN** sistem shrani dokument z ločenim številčenjem (PR-2026-0001), doda vodotisk »PREDRAČUN – nima pravne veljave« in ga ne šteje v zaporedje računov  
- **PRIORITETA:** Should have

### FZ-31 (GIVEN-WHEN-THEN) – Povezava predračuna s končnim računom
- **GIVEN** imam v sistemu shranjen predračun  
- **WHEN** izdajam končni račun in izberem ta predračun s spustnega seznama  
- **THEN** sistem na račun doda opombo: »Na podlagi predračuna št. PR-2026-0001«  
- **PRIORITETA:** Could have

---

## 5.8 Uporabniške vloge in pravice

### FZ-32 (GIVEN-WHEN-THEN) – Dodeljevanje vlog uporabnikom
- **GIVEN** sem prijavljen kot administrator  
- **WHEN** odprem masko »Uporabniki«, dodam ali uredim uporabnika in mu dodelim vlogo (tajništvo, direktor, projektant, zunanji, admin)  
- **THEN** sistem shrani vlogo in uporabnik dobi ustrezne pravice po matriki FZ-33  
- **PRIORITETA:** Must have

### FZ-33 (GIVEN-WHEN-THEN) – Matrika pravic (tabela)
- **GIVEN** sem prijavljen kot določena vloga  
- **WHEN** poskušam izvesti akcijo nad računom (izdaja, urejanje, brisanje, stornacija, pregled)  
- **THEN** sistem dovoli ali zavrne akcijo glede na vnaprej določeno matriko (tajništvo: polno razen brisanja; direktor: samo branje; projektant: samo lastni; zunanji: samo vnos; admin: administracija)  
- **PRIORITETA:** Must have

### FZ-34 (GIVEN-WHEN-THEN) – Revizijska sled
- **GIVEN** izvedem katero koli akcijo nad računom (izdaja, urejanje, stornacija, označitev plačila)  
- **WHEN** sistem zabeleži akcijo  
- **THEN** v revizijsko sled se shrani: uporabnik, datum, čas, tip akcije, stara vrednost, nova vrednost  
- **PRIORITETA:** Must have

### FZ-35 (GIVEN-WHEN-THEN) – Stornacija računa
- **GIVEN** imam izdan ali poslan račun (ne že storniran) in sem tajništvo  
- **WHEN** kliknem »Storniraj« in vnesem obvezen razlog  
- **THEN** sistem nastavi status na »stornirano«, račun ostane v arhivu in ni več mogoče urejati  
- **PRIORITETA:** Should have

---

## 5.9 Opozorila in avtomatizacija

### FZ-36 (GIVEN-WHEN-THEN) – Opozorilo ob manjkajočih podatkih
- **GIVEN** sem na obrazcu za izdajo računa  
- **WHEN** kliknem »Izdaj račun«, vendar manjka: kupec, vsaj ena postavka ali pri pravni osebi davčna številka  
- **THEN** sistem prepreči izdajo in prikaže rdeč seznam manjkajočih polj  
- **PRIORITETA:** Must have

### FZ-37 (GIVEN-WHEN-THEN) – Samodejna odjava po nedejavnosti
- **GIVEN** sem prijavljen v sistem  
- **WHEN** ne izvedem nobene akcije 30 minut  
- **THEN** sistem prikaže opozorilo z odštevalcem 60 sekund; če ne kliknem »Nadaljuj«, me samodejno odjavi in preusmeri na prijavno stran  
- **PRIORITETA:** Should have

---

## 5.10 Uporabniški vmesnik

### FZ-38 (GIVEN-WHEN-THEN) – Spletni obrazec za izdajo računa
- **GIVEN** sem na maski »Nov račun«  
- **THEN** obrazec vsebuje: polja za kupca, datume, rok plačila, opombe, tabelo postavk, gumbe za shranjevanje, izdajo, predračun, tisk in prikaz izračunov v realnem času  
- **PRIORITETA:** Must have

### FZ-39 (GIVEN-WHEN-THEN) – Filtriranje in iskanje v arhivu
- **GIVEN** sem na strani Arhiv računov  
- **THEN** vidim filtre: številka, kupec, datum od–do, znesek min–max, status (zavihki s številom zadetkov)  
- **AND** tabela omogoča razvrščanje po vsakem stolpcu  
- **PRIORITETA:** Must have

### FZ-40 (GIVEN-WHEN-THEN) – Izpisi in poročila
- **GIVEN** sem na maski Poročila in izpisi  
- **WHEN** izberem vrsto poročila (seznam izdanih, neplačani, zapadli, zbirno po kupcih), obdobje in kliknem »Prikaži«  
- **THEN** sistem prikaže tabelo z rezultati in omogoči izvoz v Excel ali PDF  
- **PRIORITETA:** Should have

---

