import type { Shape } from "@/i18n/core";
import type ru from "../ru/campus";

const campus: Shape<typeof ru> = {
  "title": "How to get there",
  "subtitle": "Campus plan and route to your room",
  "disclaimer": "This plan is schematic and fictional — made to demonstrate the concept; the real buildings are laid out differently.",
  "link": "How to get there",
  "form": {
    "aria": "Find a room",
    "room": "Room",
    "roomPlaceholder": "e.g. 3015",
    "building": "Building",
    "go": "Show route"
  },
  "plan": {
    "aria": "Schematic campus plan",
    "avenue": "Vernadsky Ave.",
    "entrance": "Main entrance",
    "bridge": "walkway, 2nd floor",
    "vucEntrance": "MTC entrance",
    "bus": "bus from Yugo-Zapadnaya metro",
    "street": "Novosportivnaya St.",
    "basement": "Sports — basement",
    "target": "Destination"
  },
  "route": {
    "title": "Route to room {room}",
    "titleBuilding": "How to get there: {building}",
    "floor": "Floor {n}",
    "noFloor": "Floor not specified",
    "empty": "Enter a room and building and we will show the way. Every class card also has a “How to get there” link."
  },
  "side": {
    "left": "left",
    "right": "right"
  },
  "steps": {
    "enterMain": "Enter through the main entrance on Vernadsky Avenue and pass the turnstiles with your student ID.",
    "floor1": "The room is on the 1st floor — no need to go up.",
    "liftA": "Go up to floor {floor} — the lifts and stairs are right after the turnstiles.",
    "center": "On the floor, go straight ahead — central block.",
    "east": "Turn right — east wing.",
    "west": "Turn left — west wing.",
    "side": "Room {room} is on the {side} side of the corridor (odd numbers on the left, even on the right).",
    "toBridge": "Go up to the 2nd floor and walk to the end of the east wing — the walkway to Building B is there.",
    "liftB": "In Building B, go up to floor {floor}.",
    "bus": "From Moscow, take the campus bus from Yugo-Zapadnaya metro station; the timetable is on the campus website.",
    "enterO": "The academic building entrance is on Novosportivnaya Street.",
    "liftO": "Go up to floor {floor}.",
    "vuc": "The Military Training Centre has a separate entrance at the west end of the main building. Dress code follows the MTC timetable.",
    "sport": "After the turnstiles, go down to the basement — the sports complex entrance is opposite the stairs.",
    "unknown": "This room is not on the plan — check the number or use the building hint."
  },
  "vucCode": "MTC",
  "buildings": "Buildings"
};
export default campus;
