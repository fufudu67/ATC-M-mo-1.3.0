# ATC Memo

**English** · [Français](#français)

A desktop notepad for [SayIntentions.AI](https://sayintentions.ai) on Microsoft Flight Simulator.
It reads your ATC exchanges and keeps the instructions in front of you: heading, altitude, speed, squawk,
next frequency, direct/vectors, taxi and pushback instructions, clearances and procedures (SID, STAR,
approach, transition), ATIS and QNH.

> Unofficial software. Not affiliated with or endorsed by SayIntentions.AI, Microsoft or Asobo Studio.
> "SayIntentions.AI", "Microsoft Flight Simulator" and "MSFS" belong to their respective owners.

## Features
- Instruction tiles with an alert until you act on them
- With SimConnect, alerts stop by themselves when you set the instructed frequency, heading, altitude or speed
- Clearances and procedures (e.g. `ILS W 25R (expected)`, `STAR NIXI5B`)
- ATIS read-back with letter and time, QNH updated from the ATIS you read
- Taxi / pushback boxes (hidden in flight), flight progress, scratchpad, message history
- Local only: the app does not open any network port

## Install
1. Download `ATC-Memo.exe` from the [Releases](../../releases) page and run it (Windows may show a SmartScreen warning because the file is not code-signed: *More info → Run anyway*).
2. Open **Settings** and paste your own SayIntentions API key.
3. Nothing else to install: the SimConnect helper is built in. Start MSFS with a flight loaded and the app connects by itself.

## Build from source
Requires [Node.js](https://nodejs.org) and Python 3 (build time only). `start.bat` runs from source (needs `pip install SimConnect`); `build-exe.bat` builds `dist\ATC-Memo.exe` with the helper bundled.

## Credits
Created by **fullenwarth**. Released under the MIT licence (see `LICENSE`).

---

## Français

Un bloc-notes ATC pour [SayIntentions.AI](https://sayintentions.ai) sur Microsoft Flight Simulator.
Il lit vos échanges avec l'ATC et garde les instructions sous vos yeux : cap, altitude, vitesse, squawk,
fréquence suivante, direct/vecteurs, roulage et pushback, autorisations et procédures (SID, STAR, approche,
transition), ATIS et QNH.

> Logiciel non officiel, sans lien avec SayIntentions.AI, Microsoft ou Asobo Studio.
> « SayIntentions.AI », « Microsoft Flight Simulator » et « MSFS » appartiennent à leurs propriétaires.

### Fonctions
- Tuiles d'instructions avec alerte tant que vous n'avez pas agi
- Avec SimConnect, les alertes s'arrêtent seules quand vous réglez la fréquence, le cap, l'altitude ou la vitesse demandés
- Autorisations et procédures (ex. `ILS W 25R (attendu)`, `STAR NIXI5B`)
- ATIS avec lettre et heure, QNH mis à jour depuis l'ATIS lu
- Encadrés roulage / pushback (masqués en vol), suivi du vol, scratchpad, historique des messages
- Entièrement local : l'application n'ouvre aucun port réseau

### Installation
1. Téléchargez `ATC-Memo.exe` dans la page [Releases](../../releases) et lancez-le (Windows peut afficher un avertissement SmartScreen, le fichier n'étant pas signé : *Informations complémentaires → Exécuter quand même*).
2. Ouvrez **Réglages** et collez votre propre clé API SayIntentions.
3. Rien d'autre à installer : le lecteur SimConnect est intégré. Lancez MSFS avec un vol chargé, l'application se connecte seule.

### Compiler depuis les sources
Nécessite [Node.js](https://nodejs.org) et Python 3 (uniquement pour fabriquer l'exe). `start.bat` lance depuis les sources (nécessite `pip install SimConnect`) ; `build-exe.bat` fabrique `dist\ATC-Memo.exe` avec le lecteur intégré.

### Crédits
Créé par **fullenwarth**. Licence MIT (voir `LICENSE`).
