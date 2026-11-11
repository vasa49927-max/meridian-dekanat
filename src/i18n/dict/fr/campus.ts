import type { Shape } from "@/i18n/core";
import type ru from "../ru/campus";

const campus: Shape<typeof ru> = {
  "title": "Comment y aller",
  "subtitle": "Plan du campus et itinéraire jusqu’à la salle",
  "disclaimer": "Ce plan est schématique et fictif — il sert à démontrer le concept ; les vrais bâtiments sont organisés autrement.",
  "link": "Comment y aller",
  "form": {
    "aria": "Trouver une salle",
    "room": "Salle",
    "roomPlaceholder": "p. ex. 3015",
    "building": "Bâtiment",
    "go": "Afficher l’itinéraire"
  },
  "plan": {
    "aria": "Plan schématique du campus",
    "avenue": "av. Vernadski",
    "entrance": "Entrée principale",
    "bridge": "passerelle, 2e étage",
    "vucEntrance": "entrée CFM",
    "bus": "bus depuis le métro Iougo-Zapadnaïa",
    "street": "rue Novosportivnaïa",
    "basement": "Sport — sous-sol",
    "target": "Destination"
  },
  "route": {
    "title": "Itinéraire jusqu’à la salle {room}",
    "titleBuilding": "Comment y aller : {building}",
    "floor": "{n}e étage",
    "noFloor": "Étage non indiqué",
    "empty": "Indiquez la salle et le bâtiment : nous vous montrerons le chemin. Chaque carte de cours a aussi un lien « Comment y aller »."
  },
  "side": {
    "left": "gauche",
    "right": "droite"
  },
  "steps": {
    "enterMain": "Entrez par l’entrée principale côté avenue Vernadski et passez les tourniquets avec votre carte d’étudiant.",
    "floor1": "La salle est au rez-de-chaussée — inutile de monter.",
    "liftA": "Montez au {floor}e étage — ascenseurs et escalier juste après les tourniquets.",
    "center": "À l’étage, allez tout droit — bloc central.",
    "east": "Tournez à droite — aile est.",
    "west": "Tournez à gauche — aile ouest.",
    "side": "La salle {room} est du côté {side} du couloir (numéros impairs à gauche, pairs à droite).",
    "toBridge": "Montez au 2e étage et allez au bout de l’aile est — la passerelle vers le bâtiment B s’y trouve.",
    "liftB": "Dans le bâtiment B, montez au {floor}e étage.",
    "bus": "Depuis Moscou, prenez la navette du campus au métro Iougo-Zapadnaïa ; horaires sur le site du campus.",
    "enterO": "L’entrée du bâtiment d’enseignement donne sur la rue Novosportivnaïa.",
    "liftO": "Montez au {floor}e étage.",
    "vuc": "Le Centre de formation militaire a une entrée séparée, à l’extrémité ouest du bâtiment principal. Tenue selon l’emploi du temps du CFM.",
    "sport": "Après les tourniquets, descendez au sous-sol — l’entrée du complexe sportif est en face de l’escalier.",
    "unknown": "Cette salle ne figure pas sur le plan — vérifiez le numéro ou suivez l’indication du bâtiment."
  },
  "vucCode": "CFM",
  "buildings": "Bâtiments"
};
export default campus;
