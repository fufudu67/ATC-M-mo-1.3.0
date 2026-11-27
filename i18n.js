/* ATC Memo : traductions de l'interface. Clé = texte français ; {0}, {1} = valeurs insérées.
   Chargé par le navigateur (window.ATC_I18N) et par Node (require). */
(function (g) {
  'use strict';
  const LANGS = [['fr', 'Français'], ['en', 'English'], ['de', 'Deutsch'], ['es', 'Español'], ['it', 'Italiano'], ['pt', 'Português']];
  /* fr | en | de | es | it | pt */
  const ROWS = [
    /* --- autorisations et procédures --- */
    ['Décollage', 'Takeoff', 'Start', 'Despegue', 'Decollo', 'Decolagem'],
    ['Atterrissage', 'Landing', 'Landung', 'Aterrizaje', 'Atterraggio', 'Pouso'],
    ['Alignement', 'Line up', 'Aufrollen', 'Alineación', 'Allineamento', 'Alinhamento'],
    ['Remise de gaz', 'Go-around', 'Durchstarten', 'Motor y al aire', 'Riattaccata', 'Arremetida'],
    ['Piste', 'Runway', 'Piste', 'Pista', 'Pista', 'Pista'],
    ['Transition', 'Transition', 'Transition', 'Transición', 'Transizione', 'Transição'],
    ['Approche', 'Approach', 'Anflug', 'Aproximación', 'Avvicinamento', 'Aproximação'],
    ['attendu', 'expected', 'erwartet', 'previsto', 'previsto', 'previsto'],
    ['piste', 'runway', 'Piste', 'pista', 'pista', 'pista'],
    /* --- détails des instructions --- */
    ['virage à gauche', 'left turn', 'Linkskurve', 'viraje a la izquierda', 'virata a sinistra', 'curva à esquerda'],
    ['virage à droite', 'right turn', 'Rechtskurve', 'viraje a la derecha', 'virata a destra', 'curva à direita'],
    ['prévu', 'expected', 'erwartet', 'previsto', 'previsto', 'previsto'],
    ['initiale', 'initial', 'initial', 'inicial', 'iniziale', 'inicial'],
    ['montée', 'climb', 'Steigflug', 'ascenso', 'salita', 'subida'],
    ['descente', 'descent', 'Sinkflug', 'descenso', 'discesa', 'descida'],
    ['maintenir', 'maintain', 'halten', 'mantener', 'mantenere', 'manter'],
    ['indiqué', 'stated', 'genannt', 'indicado', 'indicato', 'indicado'],
    ['Libre', 'Free', 'Frei', 'Libre', 'Libera', 'Livre'],
    ['vitesse normale', 'normal speed', 'normale Geschwindigkeit', 'velocidad normal', 'velocità normale', 'velocidade normal'],
    ['direct', 'direct', 'direkt', 'directo', 'diretto', 'direto'],
    ['vecteurs', 'vectors', 'Vektoren', 'vectores', 'vettori', 'vetores'],
    ['cap {0}', 'heading {0}', 'Kurs {0}', 'rumbo {0}', 'prua {0}', 'proa {0}'],
    ['navigation propre', 'own navigation', 'eigene Navigation', 'navegación propia', 'navigazione propria', 'navegação própria'],
    ['départ', 'departure', 'Abflug', 'salida', 'partenza', 'partida'],
    ['arrivée', 'arrival', 'Ankunft', 'llegada', 'arrivo', 'chegada'],
    /* --- état de connexion --- */
    ['Démarrage…', 'Starting…', 'Wird gestartet…', 'Iniciando…', 'Avvio…', 'Iniciando…'],
    ['Clé développeur SayIntentions manquante : ouvrez les réglages ATC.', 'SayIntentions developer key missing: open the ATC settings.', 'SayIntentions-Entwicklerschlüssel fehlt: ATC-Einstellungen öffnen.', 'Falta la clave de desarrollador de SayIntentions: abra los ajustes ATC.', 'Chiave sviluppatore SayIntentions mancante: apri le impostazioni ATC.', 'Chave de desenvolvedor SayIntentions ausente: abra as configurações ATC.'],
    ['SayIntentions injoignable sur {0}:43117 (client lancé ?)', 'SayIntentions unreachable at {0}:43117 (is the client running?)', 'SayIntentions unter {0}:43117 nicht erreichbar (Client gestartet?)', 'SayIntentions inaccesible en {0}:43117 (¿cliente iniciado?)', 'SayIntentions non raggiungibile su {0}:43117 (client avviato?)', 'SayIntentions inacessível em {0}:43117 (cliente iniciado?)'],
    ['En attente d’un vol…', 'Waiting for a flight…', 'Warte auf einen Flug…', 'Esperando un vuelo…', 'In attesa di un volo…', 'Aguardando um voo…'],
    ['Connecté · {0}', 'Connected · {0}', 'Verbunden · {0}', 'Conectado · {0}', 'Connesso · {0}', 'Conectado · {0}'],
    ['Erreur réseau : {0}', 'Network error: {0}', 'Netzwerkfehler: {0}', 'Error de red: {0}', 'Errore di rete: {0}', 'Erro de rede: {0}'],
    ['e-NavLog ne répond pas…', 'e-NavLog is not responding…', 'e-NavLog antwortet nicht…', 'e-NavLog no responde…', 'e-NavLog non risponde…', 'e-NavLog não responde…'],
    /* --- cases --- */
    ['Cap', 'Heading', 'Kurs', 'Rumbo', 'Prua', 'Proa'],
    ['Altitude', 'Altitude', 'Höhe', 'Altitud', 'Altitudine', 'Altitude'],
    ['Vitesse', 'Speed', 'Geschwindigkeit', 'Velocidad', 'Velocità', 'Velocidade'],
    ['Fréquence suivante', 'Next frequency', 'Nächste Frequenz', 'Próxima frecuencia', 'Prossima frequenza', 'Próxima frequência'],
    ['Fréquence', 'Frequency', 'Frequenz', 'Frecuencia', 'Frequenza', 'Frequência'],
    ['Direct / vecteurs', 'Direct / vectors', 'Direkt / Vektoren', 'Directo / vectores', 'Diretto / vettori', 'Direto / vetores'],
    ['pas encore donné', 'not given yet', 'noch nicht erteilt', 'aún no dado', 'non ancora dato', 'ainda não dado'],
    ['Pas encore donné', 'Not given yet', 'Noch nicht erteilt', 'Aún no dado', 'Non ancora dato', 'Ainda não dado'],
    ['Pas encore donné.', 'Not given yet.', 'Noch nicht erteilt.', 'Aún no dado.', 'Non ancora dato.', 'Ainda não dado.'],
    ['affiché sur le transpondeur : {0}', 'transponder shows: {0}', 'Transponder zeigt: {0}', 'el transpondedor muestra: {0}', 'il transponder mostra: {0}', 'transponder mostra: {0}'],
    ['conforme', 'matches', 'stimmt', 'correcto', 'conforme', 'conforme'],
    ['en attente du METAR', 'waiting for METAR', 'warte auf METAR', 'esperando el METAR', 'in attesa del METAR', 'aguardando o METAR'],
    ['pas encore de vol', 'no flight yet', 'noch kein Flug', 'aún no hay vuelo', 'nessun volo per ora', 'ainda sem voo'],
    ['Piste départ', 'Departure runway', 'Startbahn', 'Pista de salida', 'Pista di partenza', 'Pista de partida'],
    ['Piste arrivée', 'Arrival runway', 'Landebahn', 'Pista de llegada', 'Pista di arrivo', 'Pista de chegada'],
    ['ATIS : {0}', 'ATIS: {0}', 'ATIS: {0}', 'ATIS: {0}', 'ATIS: {0}', 'ATIS: {0}'],
    ['pas encore connue', 'not known yet', 'noch unbekannt', 'aún desconocida', 'non ancora nota', 'ainda desconhecida'],
    ['Roulage', 'Taxi', 'Rollen', 'Rodaje', 'Rullaggio', 'Táxi'],
    ['Roulage · inactif en vol', 'Taxi · inactive in flight', 'Rollen · im Flug inaktiv', 'Rodaje · inactivo en vuelo', 'Rullaggio · inattivo in volo', 'Táxi · inativo em voo'],
    ['avion en vol', 'airborne', 'in der Luft', 'en vuelo', 'in volo', 'em voo'],
    ['Inactif : avion en vol', 'Inactive: aircraft airborne', 'Inaktiv: Flugzeug in der Luft', 'Inactivo: avión en vuelo', 'Inattivo: aereo in volo', 'Inativo: aeronave em voo'],
    ['Autorisations et procédures', 'Clearances and procedures', 'Freigaben und Verfahren', 'Autorizaciones y procedimientos', 'Autorizzazioni e procedure', 'Autorizações e procedimentos'],
    ['Autorisation', 'Clearance', 'Freigabe', 'Autorización', 'Autorizzazione', 'Autorização'],
    ['Nouveau', 'New', 'Neu', 'Nuevo', 'Nuovo', 'Novo'],
    ['Nouvelle instruction : touchez pour valider', 'New instruction: tap to acknowledge', 'Neue Anweisung: zum Bestätigen tippen', 'Nueva instrucción: toque para confirmar', 'Nuova istruzione: tocca per confermare', 'Nova instrução: toque para confirmar'],
    /* --- suivi du vol --- */
    ['Suivi du vol', 'Flight tracking', 'Flugverfolgung', 'Seguimiento del vuelo', 'Monitoraggio del volo', 'Acompanhamento do voo'],
    ['connecté à MSFS', 'connected to MSFS', 'mit MSFS verbunden', 'conectado a MSFS', 'connesso a MSFS', 'conectado ao MSFS'],
    ['non connecté · {0}', 'not connected · {0}', 'nicht verbunden · {0}', 'no conectado · {0}', 'non connesso · {0}', 'não conectado · {0}'],
    ['en attente', 'waiting', 'wartet', 'en espera', 'in attesa', 'aguardando'],
    ['Plan (UTC)', 'Plan (UTC)', 'Plan (UTC)', 'Plan (UTC)', 'Piano (UTC)', 'Plano (UTC)'],
    ['décollage', 'takeoff', 'Start', 'despegue', 'decollo', 'decolagem'],
    ['atterrissage', 'landing', 'Landung', 'aterrizaje', 'atterraggio', 'pouso'],
    ['Réel (UTC)', 'Actual (UTC)', 'Ist (UTC)', 'Real (UTC)', 'Effettivo (UTC)', 'Real (UTC)'],
    ['Plan SayIntentions', 'SayIntentions plan', 'SayIntentions-Plan', 'Plan SayIntentions', 'Piano SayIntentions', 'Plano SayIntentions'],
    ['Route SI', 'SI route', 'SI-Route', 'Ruta SI', 'Rotta SI', 'Rota SI'],
    ['Écart avec SimBrief', 'Difference from SimBrief', 'Abweichung zu SimBrief', 'Diferencia con SimBrief', 'Differenza con SimBrief', 'Diferença com o SimBrief'],
    ['(* = tracé SimBrief non mis à jour)', '(* = SimBrief route not updated)', '(* = SimBrief-Route nicht aktualisiert)', '(* = ruta SimBrief no actualizada)', '(* = rotta SimBrief non aggiornata)', '(* = rota SimBrief não atualizada)'],
    ['Changements ATC', 'ATC changes', 'ATC-Änderungen', 'Cambios ATC', 'Modifiche ATC', 'Alterações ATC'],
    ['piste départ', 'departure runway', 'Startbahn', 'pista de salida', 'pista di partenza', 'pista de partida'],
    ['piste arrivée', 'arrival runway', 'Landebahn', 'pista de llegada', 'pista di arrivo', 'pista de chegada'],
    ['route', 'route', 'Route', 'ruta', 'rotta', 'rota'],
    ['modifiée', 'changed', 'geändert', 'modificada', 'modificata', 'modificada'],
    ['prochain', 'next', 'nächster', 'próximo', 'prossimo', 'próximo'],
    ['Prochain', 'Next', 'Nächster', 'Próximo', 'Prossimo', 'Próximo'],
    ['Points de passage', 'Waypoints', 'Wegpunkte', 'Puntos de paso', 'Waypoint', 'Waypoints'],
    ['renseignez votre identifiant SimBrief (réglages ATC) et générez un plan.', 'enter your SimBrief ID (ATC settings) and generate a plan.', 'SimBrief-ID eingeben (ATC-Einstellungen) und einen Plan erstellen.', 'introduzca su ID de SimBrief (ajustes ATC) y genere un plan.', 'inserisci il tuo ID SimBrief (impostazioni ATC) e genera un piano.', 'informe seu ID SimBrief (configurações ATC) e gere um plano.'],
    ['passé', 'passed', 'überflogen', 'pasado', 'passato', 'passado'],
    ['Arrivée', 'Arrival', 'Ankunft', 'Llegada', 'Arrivo', 'Chegada'],
    ['Progression', 'Progress', 'Fortschritt', 'Progreso', 'Avanzamento', 'Progresso'],
    ['MSFS et SimConnect nécessaires pour suivre le plan ({0} points chargés).', 'MSFS and SimConnect are required to follow the plan ({0} points loaded).', 'MSFS und SimConnect sind nötig, um dem Plan zu folgen ({0} Punkte geladen).', 'Se necesitan MSFS y SimConnect para seguir el plan ({0} puntos cargados).', 'Servono MSFS e SimConnect per seguire il piano ({0} punti caricati).', 'MSFS e SimConnect são necessários para acompanhar o plano ({0} pontos carregados).'],
    ['Pas de plan de vol.', 'No flight plan.', 'Kein Flugplan.', 'Sin plan de vuelo.', 'Nessun piano di volo.', 'Sem plano de voo.'],
    ['Prochain point', 'Next waypoint', 'Nächster Wegpunkt', 'Próximo punto', 'Prossimo punto', 'Próximo ponto'],
    ['Départ', 'Departure', 'Abflug', 'Salida', 'Partenza', 'Partida'],
    ['Destination', 'Destination', 'Ziel', 'Destino', 'Destinazione', 'Destino'],
    ['Points suivants', 'Next waypoints', 'Nächste Wegpunkte', 'Próximos puntos', 'Prossimi punti', 'Próximos pontos'],
    ['selon la vitesse sol', 'from ground speed', 'nach Grundgeschwindigkeit', 'según la velocidad suelo', 'secondo la velocità al suolo', 'pela velocidade solo'],
    ['horaire prévu', 'scheduled', 'geplant', 'programada', 'prevista', 'prevista'],
    ['MSFS n’est pas lancé (ou pas encore prêt).', 'MSFS is not running (or not ready yet).', 'MSFS läuft nicht (oder ist noch nicht bereit).', 'MSFS no está iniciado (o aún no está listo).', 'MSFS non è avviato (o non è ancora pronto).', 'O MSFS não está aberto (ou ainda não está pronto).'],
    ['Connecté à MSFS : en attente d’un vol chargé (pas en pause).', 'Connected to MSFS: waiting for a loaded flight (not paused).', 'Mit MSFS verbunden: warte auf einen geladenen Flug (keine Pause).', 'Conectado a MSFS: esperando un vuelo cargado (sin pausa).', 'Connesso a MSFS: in attesa di un volo caricato (non in pausa).', 'Conectado ao MSFS: aguardando um voo carregado (sem pausa).'],
    ['SimConnect.dll introuvable.', 'SimConnect.dll not found.', 'SimConnect.dll nicht gefunden.', 'SimConnect.dll no encontrado.', 'SimConnect.dll non trovato.', 'SimConnect.dll não encontrado.'],
    ['La position de l’avion s’affichera dès que MSFS sera lancé.', 'The aircraft position will appear as soon as MSFS is running.', 'Die Flugzeugposition erscheint, sobald MSFS läuft.', 'La posición del avión aparecerá en cuanto MSFS esté iniciado.', 'La posizione dell’aereo apparirà appena MSFS sarà avviato.', 'A posição da aeronave aparecerá assim que o MSFS estiver aberto.'],
    /* --- notes et échanges --- */
    ['Scratchpad', 'Scratchpad', 'Notizblock', 'Bloc de notas', 'Blocco note', 'Bloco de notas'],
    ['Notes de vol…', 'Flight notes…', 'Flugnotizen…', 'Notas de vuelo…', 'Note di volo…', 'Notas de voo…'],
    ['Échanges', 'Communications', 'Funkverkehr', 'Comunicaciones', 'Comunicazioni', 'Comunicações'],
    ['{0} messages', '{0} messages', '{0} Nachrichten', '{0} mensajes', '{0} messaggi', '{0} mensagens'],
    ['Aucun échange pour l’instant.', 'No communications yet.', 'Noch kein Funkverkehr.', 'Aún no hay comunicaciones.', 'Nessuna comunicazione per ora.', 'Nenhuma comunicação ainda.'],
    ['Équipage', 'Crew', 'Crew', 'Tripulación', 'Equipaggio', 'Tripulação'],
    ['à l’instant', 'just now', 'gerade eben', 'ahora mismo', 'adesso', 'agora mesmo'],
    ['il y a {0} min', '{0} min ago', 'vor {0} Min.', 'hace {0} min', '{0} min fa', 'há {0} min'],
    ['il y a {0} h {1} min', '{0} h {1} min ago', 'vor {0} Std. {1} Min.', 'hace {0} h {1} min', '{0} h {1} min fa', 'há {0} h {1} min'],
    ['Local avion', 'Aircraft local', 'Ortszeit Flugzeug', 'Hora local avión', 'Ora locale aereo', 'Hora local aeronave'],
    ['Heure PC', 'PC time', 'PC-Zeit', 'Hora PC', 'Ora PC', 'Hora do PC'],
    /* --- barre d'outils et fenêtres --- */
    ['Charts {0}', 'Charts {0}', 'Karten {0}', 'Cartas {0}', 'Carte {0}', 'Cartas {0}'],
    ['Lanceur', 'Launcher', 'Starter', 'Lanzador', 'Launcher', 'Inicializador'],
    ['Réglages', 'Settings', 'Einstellungen', 'Ajustes', 'Impostazioni', 'Configurações'],
    ['Fermer', 'Close', 'Schließen', 'Cerrar', 'Chiudi', 'Fechar'],
    ['Chargement…', 'Loading…', 'Wird geladen…', 'Cargando…', 'Caricamento…', 'Carregando…'],
    ['Piste en service : {0}', 'Runway in use: {0}', 'Aktive Piste: {0}', 'Pista en servicio: {0}', 'Pista in uso: {0}', 'Pista em uso: {0}'],
    ['Pas encore de vol ou d’aéroport connu.', 'No flight or known airport yet.', 'Noch kein Flug oder bekannter Flughafen.', 'Aún no hay vuelo ni aeropuerto conocido.', 'Nessun volo o aeroporto noto per ora.', 'Ainda sem voo ou aeroporto conhecido.'],
    ['Pas encore de vol SayIntentions.', 'No SayIntentions flight yet.', 'Noch kein SayIntentions-Flug.', 'Aún no hay vuelo de SayIntentions.', 'Nessun volo SayIntentions per ora.', 'Ainda sem voo SayIntentions.'],
    ['Pas d’ATIS disponible pour cet aéroport.', 'No ATIS available for this airport.', 'Kein ATIS für diesen Flughafen verfügbar.', 'No hay ATIS disponible para este aeropuerto.', 'Nessun ATIS disponibile per questo aeroporto.', 'Nenhum ATIS disponível para este aeroporto.'],
    ['{0} copié : collez-le dans la recherche de Navigraph', '{0} copied: paste it into the Navigraph search', '{0} kopiert: in die Navigraph-Suche einfügen', '{0} copiado: péguelo en la búsqueda de Navigraph', '{0} copiato: incollalo nella ricerca di Navigraph', '{0} copiado: cole na busca do Navigraph'],
    ['Aucun vol en cours : cherchez l’aéroport dans Navigraph', 'No flight in progress: search for the airport in Navigraph', 'Kein laufender Flug: Flughafen in Navigraph suchen', 'Ningún vuelo en curso: busque el aeropuerto en Navigraph', 'Nessun volo in corso: cerca l’aeroporto in Navigraph', 'Nenhum voo em andamento: procure o aeroporto no Navigraph'],
    /* --- réglages --- */
    ['Réglages ATC', 'ATC settings', 'ATC-Einstellungen', 'Ajustes ATC', 'Impostazioni ATC', 'Configurações ATC'],
    ['Les réglages se modifient depuis le PC uniquement.', 'Settings can only be changed from the PC.', 'Einstellungen lassen sich nur am PC ändern.', 'Los ajustes solo se cambian desde el PC.', 'Le impostazioni si modificano solo dal PC.', 'As configurações só podem ser alteradas no PC.'],
    ['Réglages modifiables depuis le PC uniquement.', 'Settings can only be changed from the PC.', 'Einstellungen lassen sich nur am PC ändern.', 'Los ajustes solo se cambian desde el PC.', 'Le impostazioni si modificano solo dal PC.', 'As configurações só podem ser alteradas no PC.'],
    ['Clé développeur SayIntentions', 'SayIntentions developer key', 'SayIntentions-Entwicklerschlüssel', 'Clave de desarrollador de SayIntentions', 'Chiave sviluppatore SayIntentions', 'Chave de desenvolvedor SayIntentions'],
    [' (déjà enregistrée : laissez vide pour la garder)', ' (already saved: leave empty to keep it)', ' (bereits gespeichert: leer lassen, um ihn zu behalten)', ' (ya guardada: déjela vacía para conservarla)', ' (già salvata: lascia vuoto per mantenerla)', ' (já salva: deixe vazio para mantê-la)'],
    ['Adresse du PC SayIntentions (localhost si c’est ce PC)', 'SayIntentions PC address (localhost if it is this PC)', 'Adresse des SayIntentions-PCs (localhost, wenn es dieser PC ist)', 'Dirección del PC de SayIntentions (localhost si es este PC)', 'Indirizzo del PC SayIntentions (localhost se è questo PC)', 'Endereço do PC SayIntentions (localhost se for este PC)'],
    ['Identifiant SimBrief (pseudo ou numéro de pilote)', 'SimBrief ID (username or pilot ID)', 'SimBrief-ID (Benutzername oder Pilot-ID)', 'ID de SimBrief (usuario o número de piloto)', 'ID SimBrief (nome utente o numero pilota)', 'ID SimBrief (usuário ou número de piloto)'],
    ['Adresse de Navigraph Charts', 'Navigraph Charts address', 'Adresse von Navigraph Charts', 'Dirección de Navigraph Charts', 'Indirizzo di Navigraph Charts', 'Endereço do Navigraph Charts'],
    ['Communications à afficher dans les échanges', 'Communications to show', 'Anzuzeigender Funkverkehr', 'Comunicaciones a mostrar', 'Comunicazioni da mostrare', 'Comunicações a exibir'],
    ['Radio ATC (vous + ATC), sans équipage', 'ATC radio (you + ATC), no crew', 'ATC-Funk (Sie + ATC), ohne Crew', 'Radio ATC (usted + ATC), sin tripulación', 'Radio ATC (tu + ATC), senza equipaggio', 'Rádio ATC (você + ATC), sem tripulação'],
    ['Tout, équipage compris', 'Everything, including crew', 'Alles, inklusive Crew', 'Todo, tripulación incluida', 'Tutto, equipaggio incluso', 'Tudo, incluindo a tripulação'],
    ['Bip à chaque nouvelle instruction', 'Beep on each new instruction', 'Signalton bei jeder neuen Anweisung', 'Pitido con cada nueva instrucción', 'Bip a ogni nuova istruzione', 'Bipe a cada nova instrução'],
    ['Langue', 'Language', 'Sprache', 'Idioma', 'Lingua', 'Idioma'],
    ['Automatique (langue du système)', 'Automatic (system language)', 'Automatisch (Systemsprache)', 'Automático (idioma del sistema)', 'Automatica (lingua di sistema)', 'Automático (idioma do sistema)'],
    ['Enregistrer', 'Save', 'Speichern', 'Guardar', 'Salva', 'Salvar'],
    ['Annuler', 'Cancel', 'Abbrechen', 'Cancelar', 'Annulla', 'Cancelar'],
    /* --- lanceur --- */
    ['Lanceur d’applications', 'App launcher', 'App-Starter', 'Lanzador de aplicaciones', 'Avvio applicazioni', 'Inicializador de aplicativos'],
    ['Auto : lancée à chaque démarrage de l’application. Barre : bouton dans la barre du haut.', 'Auto: launched each time the app starts. Bar: button in the top bar.', 'Auto: wird bei jedem App-Start gestartet. Leiste: Schaltfläche in der oberen Leiste.', 'Auto: se inicia en cada arranque de la aplicación. Barra: botón en la barra superior.', 'Auto: avviata a ogni avvio dell’app. Barra: pulsante nella barra in alto.', 'Auto: iniciado sempre que o aplicativo abre. Barra: botão na barra superior.'],
    ['Barre', 'Bar', 'Leiste', 'Barra', 'Barra', 'Barra'],
    ['Lancer', 'Launch', 'Starten', 'Iniciar', 'Avvia', 'Iniciar'],
    ['Ajouter une application (chemin du programme ou du raccourci)', 'Add an app (path to the program or shortcut)', 'App hinzufügen (Pfad zu Programm oder Verknüpfung)', 'Añadir una aplicación (ruta del programa o del acceso directo)', 'Aggiungi un’app (percorso del programma o del collegamento)', 'Adicionar aplicativo (caminho do programa ou atalho)'],
    ['Parcourir…', 'Browse…', 'Durchsuchen…', 'Examinar…', 'Sfoglia…', 'Procurar…'],
    ['Nom à afficher', 'Display name', 'Anzeigename', 'Nombre a mostrar', 'Nome visualizzato', 'Nome de exibição'],
    ['Ajouter', 'Add', 'Hinzufügen', 'Añadir', 'Aggiungi', 'Adicionar'],
    ['Le lanceur se gère depuis le PC uniquement.', 'The launcher is managed from the PC only.', 'Der Starter wird nur am PC verwaltet.', 'El lanzador solo se gestiona desde el PC.', 'Il launcher si gestisce solo dal PC.', 'O inicializador só é gerenciado no PC.'],
    ['Lanceur utilisable depuis le PC uniquement.', 'The launcher can only be used from the PC.', 'Der Starter ist nur am PC nutzbar.', 'El lanzador solo se puede usar desde el PC.', 'Il launcher si usa solo dal PC.', 'O inicializador só pode ser usado no PC.'],
    ['Tout lancer', 'Launch all', 'Alle starten', 'Iniciar todo', 'Avvia tutto', 'Iniciar tudo'],
    ['Programmes', 'Programs', 'Programme', 'Programas', 'Programmi', 'Programas'],
    ['Tous', 'All files', 'Alle Dateien', 'Todos', 'Tutti', 'Todos'],
    ['Python introuvable : SimConnect indisponible', 'Python not found: SimConnect unavailable', 'Python nicht gefunden: SimConnect nicht verfügbar', 'Python no encontrado: SimConnect no disponible', 'Python non trovato: SimConnect non disponibile', 'Python não encontrado: SimConnect indisponível'],
    /* --- menu de la fenêtre --- */
    ['Aide', 'Help', 'Hilfe', 'Ayuda', 'Aiuto', 'Ajuda'],
    ['À propos d’ATC Memo', 'About ATC Memo', 'Über ATC Memo', 'Acerca de ATC Memo', 'Informazioni su ATC Memo', 'Sobre o ATC Memo'],
    ['Ouvrir le dossier des données', 'Open data folder', 'Datenordner öffnen', 'Abrir carpeta de datos', 'Apri cartella dati', 'Abrir pasta de dados'],
    ['Mémo pour SayIntentions.AI sur Microsoft Flight Simulator.\nCréé par fullenwarth. Licence MIT.\n\nLogiciel non officiel : non affilié à SayIntentions.AI, Microsoft ou Asobo Studio, ni approuvé par eux. Toutes les marques appartiennent à leurs propriétaires.',
      'Memo for SayIntentions.AI on Microsoft Flight Simulator.\nCreated by fullenwarth. MIT licence.\n\nUnofficial software: not affiliated with or endorsed by SayIntentions.AI, Microsoft or Asobo Studio. All trademarks belong to their owners.',
      'Memo für SayIntentions.AI im Microsoft Flight Simulator.\nErstellt von fullenwarth. MIT-Lizenz.\n\nInoffizielle Software: nicht mit SayIntentions.AI, Microsoft oder Asobo Studio verbunden oder von ihnen unterstützt. Alle Marken gehören ihren Inhabern.',
      'Memo para SayIntentions.AI en Microsoft Flight Simulator.\nCreado por fullenwarth. Licencia MIT.\n\nSoftware no oficial: no afiliado ni respaldado por SayIntentions.AI, Microsoft o Asobo Studio. Todas las marcas pertenecen a sus propietarios.',
      'Memo per SayIntentions.AI su Microsoft Flight Simulator.\nCreato da fullenwarth. Licenza MIT.\n\nSoftware non ufficiale: non affiliato né approvato da SayIntentions.AI, Microsoft o Asobo Studio. Tutti i marchi appartengono ai rispettivi proprietari.',
      'Memo para SayIntentions.AI no Microsoft Flight Simulator.\nCriado por fullenwarth. Licença MIT.\n\nSoftware não oficial: não afiliado nem endossado pela SayIntentions.AI, Microsoft ou Asobo Studio. Todas as marcas pertencem aos seus proprietários.'],
  ];
  const CODES = LANGS.map(l => l[0]);
  const DICT = {};
  for (const r of ROWS) DICT[r[0]] = r;

  /** Langue effective : 'auto' → langue du système si elle est disponible, sinon anglais. */
  function resolve(pref, sys) {
    if (pref && pref !== 'auto' && CODES.includes(pref)) return pref;
    const s = String(sys || '').toLowerCase().slice(0, 2);
    return CODES.includes(s) ? s : 'en';
  }
  /** Traduit un texte français dans la langue demandée ; texte inconnu = renvoyé tel quel. */
  function tr(lang, s, ...args) {
    const row = DICT[s], i = CODES.indexOf(lang);
    let out = row && i > 0 ? (row[i] || s) : s;
    args.forEach((a, n) => { out = out.split('{' + n + '}').join(a); });
    return out;
  }
  /* modèles avec {0} : reconnus aussi une fois remplis (« cap 090° », « ATIS : 27L »…) */
  const PATTERNS = ROWS.filter(r => /\{\d\}/.test(r[0])).map(r => {
    const order = [];
    const src = r[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d)\\\}/g, (m, n) => { order.push(+n); return '(.+?)'; });
    return { key: r[0], re: new RegExp('^' + src + '$'), order };
  });
  function trOne(lang, p) {
    if (DICT[p]) return tr(lang, p);
    for (const P of PATTERNS) {
      const m = P.re.exec(p);
      if (m) { const a = []; P.order.forEach((n, i) => { a[n] = m[i + 1]; }); return tr(lang, P.key, ...a); }
    }
    return null;
  }
  /** Traduit un texte entier ou, à défaut, une suite « a · b · c » morceau par morceau (valeurs techniques gardées). */
  function trParts(lang, s) {
    s = String(s == null ? '' : s);
    const whole = trOne(lang, s);
    if (whole != null) return whole;
    return s.split(' · ').map(p => { const t = trOne(lang, p); return t == null ? p : t; }).join(' · ');
  }
  const api = { LANGS, CODES, resolve, tr, trParts };
  if (typeof module === 'object' && module.exports) module.exports = api; else g.ATC_I18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
