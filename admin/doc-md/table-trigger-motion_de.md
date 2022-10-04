Hier erfasst du deine Bewegungsmelder. Du kannst optional auch noch Helligkeits-Datenpunkte und Grenzwerte für diese festlegen.

| Spalte   |  Pflichtfeld |  Beschreibung |
|----------|:------------:|-------|
| ![image](https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/doc-md/img/check_box-24px.svg?raw=true) |  Ja          | Aktiviert/Deaktiviert diese Tabellenzeile. Falls nicht aktiviert, wird diese Tabellenzeile vom Adapter nicht beachtet. In den Adapter-Optionen, unter 'WEITERE OPTIONEN > Eingabe-Validierung' kannst du übrigens einstellen, dass auch deaktivierte Zeilen auf Gültigkeit geprüft werden. |
| Name für Bewegungsmelder | Ja | Beliebiger Name für den Bewegungsmelder.|
| Datenpunkt Bewegungsmelder | Ja | Datenpunkt des Bewegungsmelders. Es wird erwartet, dass dieser bei Bewegung auf `true` geht, und bei keiner Bewegung mehr auf `false`, dies ist nahezu bei allen Bewegungsmeldern so der Fall. Falls sich dein Bewegungsmelder-Datenpunkt anders verhält, so verwende bitte Alias. Siehe [Forum-Diskussion](https://forum.iobroker.net/post/492267). |
| Sek | Nein | Nach dieser Anzahl an Sekunden (und keiner weiteren zwischendurch erkannten Bewegung) werden die Zielgeräte ausgeschaltet.<br>Zum deaktivieren: Leer lassen oder 0 setzen.<br>Detail-Info: Sobald der Bewegungsmelder-Datenpunkt auf `false` geht, also keine Bewegung mehr erkannt wird, startet ein Timer mit den hier angegebenen Sekunden. Erst nach Ablauf dieser Sekunden werden die in der jeweiligen Zone definierten Zielgeräte ausgeschaltet. Erfolgt eine neue Bewegung (Bewegungsmelder-Datenpunkt auf `true`) während der Timer läuft, wird der Timer gelöscht und die Zielgeräte bleiben an.|
| (Symbol: Timer aus) | Nein | Wenn diese Option aktiviert ist, wird kein Ausschalt-Timer für die Zielgeräte gesetzt, die bereits an waren. Use Case: [siehe Forum-Beitrag](https://forum.iobroker.net/post/433871).|

### Optional: Helligkeit (Lux)

| Spalte   |  Pflichtfeld |  Beschreibung |
|----------|:------------:|-------|
| Datenpunkt Helligkeit | Nein | Datenpunkt, der die aktuelle Helligkeit widergibt.|
| Grenze | Nein | Grenzwert für die Helligkeit. Falls die aktuelle Helligkeit von 'Datenpunkt Helligkeit' größer als diese Zahl ist, wird die Bewegung ignoriert.<br>Bitte beachte hierzu auch die Option *Helligkeit (Bri) nicht prüfen falls Zone an* unter 'WEITERE OPTIONEN > Bewegungsmelder'.|

### Optional: Verknüpfte Auslöser

| Spalte   |  Pflichtfeld |  Beschreibung |
|----------|:------------:|-------|
| Verknüpfte Auslöser | Nein | Hier kannst du "Andere Auslöser" auswählen, diese lösen dann die entsprechende Zone ebenso aus, wie der Bewegungsmelder.<br>Den Auslöser legst du dazu unter "Andere Auslöser" in der Tabelle unten an, und fügst diesen neuen Auslöser in "Bewegungsmelder" unter "Verknüpfte Auslöser" hinzu.<br><br>*Beispiel-Use-Case:* Wenn der Wandschalter eingeschaltet wird, soll das Licht nach x Sekunden wieder ausgehen, sofern es keine Bewegung gibt (Beispiel: Ein Flur mit smartem Wandschalter, sowie Bewegungsmelder im Flur). Gibt es eine Bewegung, wird der Timer für den Wandschalter gelöscht und der Bewegungsmelder-Timer tritt in Kraft.<br><br>**Hinweis:** Falls du "Andere Auslöser" frisch angelegt hast und diese hier nicht gleich erscheinen, wechsle kurz zu einem anderen Reiter und wieder zurück (oder speichere und schließe die Adapter-Instanz und öffne sie erneut).|
| Sek | Nein | Für "Verknüpfte Auslöser": Trage hier die Anzahl an Sekunden ein, nach denen ohne registrierter Bewegung ausgeschaltet wird, wenn ein "Verknüpfter Auslöser" das Einschalten getriggert hat. <br>*Hinweis:* Diese Anzahl an Sekunden kannst du hier separat einstellen (und es wird nicht "Sek" von oben genommen), weil diese Anzahl an Sekunden von oben erst dann greift, wenn der Bewegungsmelder keine Bewegung mehr erkennt, und dies dauert z.B. bei Xiaomi 2 Minuten. Daher kannst du hier eine unterschiedliche Zeit einstellen.
| ✖ | Nein | Für "Verknüpfte Auslöser": Wenn aktiviert, erfolgt das Einschalten ausschließlich durch "Verknüpfte Auslöser" (z.B. Wandschalter), aber nie durch den Bewegungsmelder. Das heißt, bei Bewegung wird nicht eingeschaltet. Wird aber etwa per Wandschalter (in "Verknüpfte Auslöser") eingeschaltet, und erfolgt vor dem Ausschalten eine Bewegung, wird erst ausgeschaltet, sobald keine Bewegung mehr. Siehe [Issue #42](https://github.com/Mic-M/ioBroker.smartcontrol/issues/42) für Details.|