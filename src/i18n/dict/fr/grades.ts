import type { Shape } from "@/i18n/core";
import type ru from "../ru/grades";

const grades: Shape<typeof ru> = {
  plan: {
    riskHigh: "Risque d’échec",
    riskHighDetail: "{reason}. Prenez rendez-vous avec le bureau des étudiants ou l’enseignant.",
    okCredit: "Validation déjà acquise",
    okCreditDetail: "{earned} points sur 60 — plus de {target}, la validation est automatique.",
    okExcellent: "« Excellent » sans examen — déjà possible",
    okExcellentDetail: "{earned} points sur 60 — plus de {target}. Vous pouvez vous dispenser de l’examen et obtenir « excellent ».",
    goalCredit: "Validation automatique : encore {need} pts",
    goalCreditDetail: "Il reste des travaux pour {remaining} pts. Obtenez en moyenne {pct} % à chacun — et la validation est acquise sans épreuve.",
    goalExcellent: "« Excellent » automatique : encore {need} pts",
    goalExcellentDetail: "Il reste des travaux pour {remaining} pts. Obtenez en moyenne {pct} % à chacun — et « excellent » sans examen.",
    watch: "À rattraper : rythme {pace} %",
    creditExam: "Épreuve de validation à passer",
    creditNeed: "À ce rythme, il faut environ {need} sur 40 à l’épreuve.",
    creditImpossible: "Même la note maximale ne permettra pas d’atteindre 60 — voyez vite le bureau des étudiants.",
    exam: "Préparation à l’examen",
    examNeed: "Ce qu’il faut à l’examen (sur 40) à ce rythme : {parts}.",
    examImpossible: "Même la note maximale à l’examen ne permettra pas d’atteindre 60 — voyez vite le bureau des étudiants.",
    partExcellent: "« excellent » — ~{n}", partGood: "« bien » — ~{n}", partSat: "« passable » — ~{n}",
  },
  risk: {
    finalLow: "total inférieur à 60 — rattrapage nécessaire",
    unreachable: "même avec la note maximale à l’examen, 60 est hors d’atteinte",
    pace: "rythme {pace} % — il faut {need} pts à l’examen pour valider",
  },
};
export default grades;
