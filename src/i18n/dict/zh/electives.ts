import type { Shape } from "@/i18n/core";
import type ru from "../ru/electives";

const electives: Shape<typeof ru> = {
  "title": "选修课",
  "tab": "选修课",
  "subtitle": "2027 年春季学期 · 跨院系课程",
  "window": {
    "open": "选课开放至 {date}",
    "openLeft": {"other": "还剩 {n} 天"},
    "closed": "选课已于 {date} 结束。如需更改，请向教学办公室提交申请。",
    "soon": "选课将于 {date} 开放"
  },
  "rules": {
    "title": "规则",
    "r1": "最多可选 {n} 门课程。",
    "r2": "有名额即直接选上；名额已满则进入候补名单。",
    "r3": "有人退选时，候补第一位自动选上并收到通知。"
  },
  "mine": "已选 {n}/{max}",
  "seats": "{taken}/{capacity} 名额",
  "free": {
    "other": "剩余 {n} 个名额"
  },
  "full": "名额已满",
  "waiting": "候补人数：{n}",
  "credits": "{n} 学分",
  "status": {
    "ENROLLED": "已选上",
    "WAITLIST": "候补第 {pos} 位"
  },
  "actions": {
    "enroll": "选课",
    "waitlist": "加入候补",
    "drop": "退选",
    "dropConfirm": {
      "title": "确定退选？",
      "body": "名额将转给候补第一位。只有再次出现空位时才能重新选上。",
      "ok": "确定退选"
    }
  },
  "done": {
    "ENROLLED": "已选上该课程",
    "WAITLIST": "已加入候补——有空位时会通知你",
    "drop": "已退选该课程"
  },
  "errors": {
    "closed": "选课已结束",
    "course": "该课程仅面向高年级学生",
    "limit": "最多选两门课——请先退选一门",
    "exists": "你已选过这门课",
    "notFound": "未找到课程",
    "notChosen": "你未选这门课"
  },
  "slot": "{day} {time} · {room} 教室",
  "fromCourse": "{n} 年级起"
};
export default electives;
