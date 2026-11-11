import type { Shape } from "@/i18n/core";
import type ru from "../ru/grades";

const grades: Shape<typeof ru> = {
  plan: {
    riskHigh: "有不及格风险",
    riskHighDetail: "{reason}。请预约教务员或任课教师答疑。",
    okCredit: "考查已通过",
    okCreditDetail: "已得 {earned}/60 分，超过 {target} 分，考查自动通过。",
    okExcellent: "无需考试即可获得“优秀”",
    okExcellentDetail: "已得 {earned}/60 分，超过 {target} 分。可以不参加考试直接获得“优秀”。",
    goalCredit: "距免考通过还差 {need} 分",
    goalCreditDetail: "剩余作业共 {remaining} 分。每项平均拿到 {pct}%，即可免考通过。",
    goalExcellent: "距免考“优秀”还差 {need} 分",
    goalExcellentDetail: "剩余作业共 {remaining} 分。每项平均拿到 {pct}%，即可免考获得“优秀”。",
    watch: "需要追分：得分率 {pace}%",
    creditExam: "需要参加考查",
    creditNeed: "按目前进度，考查需拿到约 {need}/40 分。",
    creditImpossible: "即使考查满分也达不到60分——请尽快联系教务员。",
    exam: "准备考试",
    examNeed: "按目前进度，考试（满分40）需要：{parts}。",
    examImpossible: "即使考试满分也达不到60分——请尽快联系教务员。",
    partExcellent: "“优秀”约 {n} 分", partGood: "“良好”约 {n} 分", partSat: "“及格”约 {n} 分",
  },
  risk: {
    finalLow: "总分低于60——需要补考",
    unreachable: "即使考试满分也达不到60分",
    pace: "得分率 {pace}%——考试需拿到 {need} 分才能及格",
  },
};
export default grades;
