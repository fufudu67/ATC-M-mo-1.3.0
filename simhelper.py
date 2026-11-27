"""Lecteur SimConnect pour ATC Memo (Python 3, aucune dépendance obligatoire).

Envoie sur la sortie standard une ligne JSON par seconde : position, altitude, heure du simulateur,
carburant, prochain point GPS et variables GSX. ATC Memo le lance et le relance tout seul.

SimConnect.dll est cherchée à côté de ce script, dans le module Python « SimConnect » (pip install SimConnect)
ou dans le SDK de MSFS (variables MSFS2024_SDK / MSFS_SDK).
"""
import ctypes
import json
import os
import sys
import time

NUM = [("lat", "PLANE LATITUDE", "degrees"), ("lon", "PLANE LONGITUDE", "degrees"), ("alt", "PLANE ALTITUDE", "feet"),
       ("gs", "GROUND VELOCITY", "knots"), ("vs", "VERTICAL SPEED", "feet per minute"), ("zulu", "ZULU TIME", "seconds"),
       ("local", "LOCAL TIME", "seconds"), ("fuel_lb", "FUEL TOTAL QUANTITY WEIGHT", "pounds"),
       ("gps_dist_m", "GPS WP DISTANCE", "meters"), ("gps_ete", "GPS WP ETE", "seconds")]
GSX = ["COUATL_STARTED", "STATE", "BOARDING_STATE", "DEBOARDING_STATE", "REFUELING_STATE", "CATERING_STATE",
       "NUMPASSENGERS_BOARDING", "NUMPASSENGERS_BOARDING_TOTAL", "NUMPASSENGERS_DEBOARDING", "NUMPASSENGERS_DEBOARDING_TOTAL"]
NUM += [("gsx_" + n, "L:FSDT_GSX_" + n, "number") for n in GSX]
# Variables des automatismes (turnaround, navlog) : définition à part, pour qu'une variable refusée par un avion
# ne puisse jamais bloquer la lecture de base ci-dessus.
EXTRA = [("ground", "SIM ON GROUND", "bool"), ("brake", "BRAKE PARKING POSITION", "bool"),
         ("gsx_DEPARTURE_STATE", "L:FSDT_GSX_DEPARTURE_STATE", "number")]
EXTRA += [("exit%d" % i, "EXIT OPEN:%d" % i, "percent over 100") for i in range(4)]
# Variables de la checklist : définition 4 à part, pour qu'une variable inconnue d'un avion ne perturbe rien d'autre.
CHK = [("l_taxi", "LIGHT TAXI", "bool"), ("l_land", "LIGHT LANDING", "bool"), ("l_strobe", "LIGHT STROBE", "bool"),
       ("l_beacon", "LIGHT BEACON", "bool"), ("l_nav", "LIGHT NAV", "bool"), ("gear", "GEAR HANDLE POSITION", "bool"),
       ("flaps", "FLAPS HANDLE INDEX", "number"), ("spoil", "SPOILERS HANDLE POSITION", "percent over 100"),
       ("spoil_arm", "SPOILERS ARMED", "bool"), ("eng1", "GENERAL ENG COMBUSTION:1", "bool"), ("eng2", "GENERAL ENG COMBUSTION:2", "bool"),
       ("thr1", "GENERAL ENG THROTTLE LEVER POSITION:1", "percent"), ("thr2", "GENERAL ENG THROTTLE LEVER POSITION:2", "percent"),
       ("apu", "APU PCT RPM", "percent over 100"), ("batt", "ELECTRICAL MASTER BATTERY", "bool"),
       ("sbelt", "CABIN SEATBELTS ALERT SWITCH", "bool"), ("nosmk", "CABIN NO SMOKING ALERT SWITCH", "bool"),
       ("ap", "AUTOPILOT MASTER", "bool"), ("fd", "AUTOPILOT FLIGHT DIRECTOR ACTIVE", "bool"),
       ("kohl", "KOHLSMAN SETTING MB", "millibars"), ("ias", "AIRSPEED INDICATED", "knots"),
       ("com1", "COM ACTIVE FREQUENCY:1", "MHz"), ("com2", "COM ACTIVE FREQUENCY:2", "MHz"),
       ("hdgm", "PLANE HEADING DEGREES MAGNETIC", "degrees"), ("aphdg", "AUTOPILOT HEADING LOCK DIR", "degrees"),
       ("apalt", "AUTOPILOT ALTITUDE LOCK VAR", "feet"), ("apspd", "AUTOPILOT AIRSPEED HOLD VAR", "knots")]
# Variables propres au Fenix A320 (L-vars), définition 5 à part. Sur un autre avion elles valent 0 : e-NavLog ne s'en sert
# que pour confirmer un état « allumé » ou, une fois le Fenix reconnu (batterie, frein de parc...), « éteint ».
FNX = [("fx_bat1", "S_OH_ELEC_BAT1"), ("fx_bat2", "S_OH_ELEC_BAT2"), ("fx_apum", "S_OH_ELEC_APU_MASTER"),
       ("fx_apuav", "I_OH_ELEC_APU_START_U"), ("fx_apug", "S_OH_ELEC_APU_GENERATOR"), ("fx_ext", "S_OH_ELEC_EXT_PWR"),
       ("fx_gen1", "S_OH_ELEC_GEN1"), ("fx_gen2", "S_OH_ELEC_GEN2"), ("fx_beacon", "S_OH_EXT_LT_BEACON"),
       ("fx_strobe", "S_OH_EXT_LT_STROBE"), ("fx_nav", "S_OH_EXT_LT_NAV_LOGO"), ("fx_landl", "S_OH_EXT_LT_LANDING_L"),
       ("fx_landr", "S_OH_EXT_LT_LANDING_R"), ("fx_nose", "S_OH_EXT_LT_NOSE"), ("fx_signs", "S_OH_SIGNS"),
       ("fx_smoke", "S_OH_SIGNS_SMOKING"), ("fx_park", "S_MIP_PARKING_BRAKE"), ("fx_em1", "S_ENG_MASTER_1"),
       ("fx_em2", "S_ENG_MASTER_2"), ("fx_ap1", "I_FCU_AP1"), ("fx_ap2", "I_FCU_AP2"), ("fx_g1", "I_MIP_GEAR_1_L"),
       ("fx_g2", "I_MIP_GEAR_2_L"), ("fx_g3", "I_MIP_GEAR_3_L")]
STR = ("gps_id", "GPS WP NEXT ID")


def find_dll():
    cands = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "SimConnect.dll")]
    try:
        import SimConnect as sc
        cands.append(os.path.join(os.path.dirname(sc.__file__), "SimConnect.dll"))
    except Exception:
        pass
    for env in ("MSFS2024_SDK", "MSFS_SDK"):
        if os.environ.get(env):
            cands.append(os.path.join(os.environ[env], "SimConnect SDK", "lib", "SimConnect.dll"))
    here = os.path.dirname(os.path.abspath(__file__))
    cands.append(os.path.join(os.path.dirname(os.path.abspath(sys.executable)), "SimConnect.dll"))   # packaged simhelper.exe
    cands.append(os.path.join(getattr(sys, "_MEIPASS", here), "SimConnect.dll"))
    for base in (os.environ.get("APPDATA"), os.environ.get("LOCALAPPDATA"), os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)"), os.environ.get("USERPROFILE")):
        if base:   # DLL already present next to another copy of the helper (e-NavLog, ATC Memo) or in an MSFS SDK folder
            for sub in ("e-NavLog", "ATC-Memo", "ATC Memo", os.path.join("Programs", "e-NavLog"), os.path.join("MSFS SDK", "SimConnect SDK", "lib"), os.path.join("MSFS 2024 SDK", "SimConnect SDK", "lib"), os.path.join("MSFS SDK", "SimConnect SDK", "lib", "static")):
                cands.append(os.path.join(base, sub, "SimConnect.dll"))
    for d in (os.path.join(here, ".."), os.getcwd()):
        cands.append(os.path.join(d, "SimConnect.dll"))
    return next((c for c in cands if os.path.isfile(c)), None)


class Reader:
    """Lecture par SimConnect : définition 1 = nombres (FLOAT64), définition 2 = une chaîne (STRING32)."""

    def __init__(self, dll_path):
        C = ctypes
        self.C, self.ok = C, []
        d = self.dll = C.WinDLL(dll_path)
        d.SimConnect_Open.argtypes = [C.POINTER(C.c_void_p), C.c_char_p, C.c_void_p, C.c_uint32, C.c_void_p, C.c_uint32]
        d.SimConnect_AddToDataDefinition.argtypes = [C.c_void_p, C.c_uint32, C.c_char_p, C.c_char_p, C.c_uint32, C.c_float, C.c_uint32]
        d.SimConnect_RequestDataOnSimObject.argtypes = [C.c_void_p] + [C.c_uint32] * 8
        d.SimConnect_GetNextDispatch.argtypes = [C.c_void_p, C.POINTER(C.c_void_p), C.POINTER(C.c_uint32)]
        d.SimConnect_Close.argtypes = [C.c_void_p]
        for f in (d.SimConnect_Open, d.SimConnect_AddToDataDefinition, d.SimConnect_RequestDataOnSimObject,
                  d.SimConnect_GetNextDispatch, d.SimConnect_Close):
            f.restype = C.c_long
        h = C.c_void_p()
        hr = d.SimConnect_Open(C.byref(h), b"e-NavLog-ATC", None, 0, None, 0)
        if hr != 0:
            raise ConnectionError("SimConnect_Open : 0x%08X" % (hr & 0xFFFFFFFF))
        self.h = h
        for key, name, unit in NUM:   # type 4 = FLOAT64, 0xFFFFFFFF = SIMCONNECT_UNUSED
            if d.SimConnect_AddToDataDefinition(h, 1, name.encode(), unit.encode(), 4, 0.0, 0xFFFFFFFF) == 0:
                self.ok.append(key)
        self.str_ok = d.SimConnect_AddToDataDefinition(h, 2, STR[1].encode(), None, 6, 0.0, 0xFFFFFFFF) == 0   # 6 = STRING32
        self.ok3, self.extra = [], {}
        for key, name, unit in EXTRA:   # définition 3 : variables en plus (optionnelles)
            if d.SimConnect_AddToDataDefinition(h, 3, name.encode(), unit.encode(), 4, 0.0, 0xFFFFFFFF) == 0:
                self.ok3.append(key)
        # période 4 = une fois par seconde ; objet 0 = avion de l'utilisateur
        for req in (1, 2) if self.str_ok else (1,):
            hr = d.SimConnect_RequestDataOnSimObject(h, req, req, 0, 4, 0, 0, 0, 0)
            if hr != 0:
                raise ConnectionError("SimConnect_RequestDataOnSimObject : 0x%08X" % (hr & 0xFFFFFFFF))
        if self.ok3:
            d.SimConnect_RequestDataOnSimObject(h, 3, 3, 0, 4, 0, 0, 0, 0)
        self.ok4, self.chk = [], {}
        for key, name, unit in CHK:   # définition 4 : variables de la checklist (optionnelles)
            if d.SimConnect_AddToDataDefinition(h, 4, name.encode(), unit.encode(), 4, 0.0, 0xFFFFFFFF) == 0:
                self.ok4.append(key)
        if self.ok4:
            d.SimConnect_RequestDataOnSimObject(h, 4, 4, 0, 4, 0, 0, 0, 0)
        self.ok5, self.fnx = [], {}
        for key, name in FNX:   # définition 5 : L-vars du Fenix
            if d.SimConnect_AddToDataDefinition(h, 5, ("L:" + name).encode(), b"number", 4, 0.0, 0xFFFFFFFF) == 0:
                self.ok5.append(key)
        if self.ok5:
            d.SimConnect_RequestDataOnSimObject(h, 5, 5, 0, 4, 0, 0, 0, 0)

    def _next(self):
        C = self.C
        p, cb = C.c_void_p(), C.c_uint32()
        hr = self.dll.SimConnect_GetNextDispatch(self.h, C.byref(p), C.byref(cb))
        return p.value if hr == 0 and p.value else None

    def poll(self):
        """Dernier échantillon {clé: valeur} reçu depuis le dernier appel, ou None."""
        C, out = self.C, None
        for _ in range(80):
            addr = self._next()
            if not addr:
                break
            hdr = (C.c_uint32 * 10).from_address(addr)  # taille, version, id, requête, objet, définition, drapeaux, n°, sur, nombre
            if hdr[2] == 3:   # SIMCONNECT_RECV_ID_QUIT : MSFS se ferme
                raise ConnectionError("MSFS fermé")
            if hdr[2] != 8:   # SIMCONNECT_RECV_ID_SIMOBJECT_DATA
                continue
            if hdr[3] == 1:
                vals = (C.c_double * hdr[9]).from_address(addr + 40)
                out = dict(zip(self.ok, list(vals)))
            elif hdr[3] == 3:
                vals = (C.c_double * hdr[9]).from_address(addr + 40)
                self.extra = dict(zip(self.ok3, list(vals)))
            elif hdr[3] == 4:
                vals = (C.c_double * hdr[9]).from_address(addr + 40)
                self.chk = dict(zip(self.ok4, list(vals)))
            elif hdr[3] == 5:
                vals = (C.c_double * hdr[9]).from_address(addr + 40)
                self.fnx = dict(zip(self.ok5, list(vals)))
            elif hdr[3] == 2 and out is not None:
                raw = ctypes.string_at(addr + 40, 32)
                out["gps_id"] = raw.split(b"\x00")[0].decode("ascii", "ignore").strip()
        if out is not None:
            out.update(self.extra)
            out.update(self.chk)
            out.update(self.fnx)
        return out

    def close(self):
        try:
            self.dll.SimConnect_Close(self.h)
        except Exception:
            pass


def emit(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def gsx_dict(d):
    """Regroupe les variables GSX dans d['gsx'] (noms sans préfixe)."""
    g = {k[4:].upper(): v for k, v in d.items() if k.startswith("gsx_")}
    out = {k: v for k, v in d.items() if not k.startswith("gsx_")}
    out["gsx"] = g
    return out


def run(make_reader=None, sleep=time.sleep, loops=None):
    """Boucle principale. make_reader et loops servent aux tests."""
    n = 0
    while loops is None or n < loops:
        n += 1
        r = None
        try:
            if make_reader is None:
                path = find_dll()
                if not path:
                    emit({"error": "SimConnect.dll introuvable (pip install SimConnect, ou copiez SimConnect.dll dans " + os.path.dirname(os.path.abspath(__file__)) + ")"})
                    sleep(30)
                    continue
                r = Reader(path)
            else:
                r = make_reader()
            last = time.time()
            while True:
                d = r.poll()
                if d is not None:
                    last = time.time()
                    emit(gsx_dict(d))
                elif time.time() - last > 90:   # simulateur en pause ou dans un menu : on attend, sans se reconnecter
                    raise ConnectionError("plus de réponse de MSFS")
                sleep(0.5)
                if loops is not None:
                    break
        except Exception as e:
            emit({"error": "MSFS non détecté (%s)" % e})
            if r:
                r.close()
            sleep(5)


if __name__ == "__main__":
    run()
