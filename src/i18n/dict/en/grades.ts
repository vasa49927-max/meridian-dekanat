import type { Shape } from "@/i18n/core";
import type ru from "../ru/grades";

const grades: Shape<typeof ru> = {
  plan: {
    riskHigh: "Risk of failing",
    riskHighDetail: "{reason}. Book a meeting with the coordinator or your teacher.",
    okCredit: "Credit is already yours",
    okCreditDetail: "{earned} of 60 points — more than {target}, so the credit is automatic.",
    okExcellent: "“Excellent” without the exam — already possible",
    okExcellentDetail: "{earned} of 60 points — more than {target}. You can skip the exam and get “excellent”.",
    goalCredit: "To an automatic credit: {need} more pts",
    goalCreditDetail: "Remaining work is worth {remaining} pts. Score {pct}% on average on each — and get the credit without a test.",
    goalExcellent: "To an automatic “excellent”: {need} more pts",
    goalExcellentDetail: "Remaining work is worth {remaining} pts. Score {pct}% on average on each — and get “excellent” without the exam.",
    watch: "Time to catch up: pace {pace}%",
    creditExam: "You need to take the credit test",
    creditNeed: "At your current pace you need about {need} of 40 on the test.",
    creditImpossible: "Even full marks on the test won’t reach 60 — see the coordinator urgently.",
    exam: "Preparing for the exam",
    examNeed: "What you need on the exam (of 40) at your current pace: {parts}.",
    examImpossible: "Even full marks on the exam won’t reach 60 — see the coordinator urgently.",
    partExcellent: "“excellent” — ~{n}", partGood: "“good” — ~{n}", partSat: "“pass” — ~{n}",
  },
  risk: {
    finalLow: "total below 60 — a resit is needed",
    unreachable: "even full marks on the exam won’t reach 60",
    pace: "pace {pace}% — you need {need} pts on the exam to pass",
  },
};
export default grades;
