import type { Shape } from "@/i18n/core";
import type ru from "../ru/today";

const today: Shape<typeof ru> = {
  greeting: { morning: "早上好，{name}", day: "下午好，{name}", evening: "晚上好，{name}", night: "晚安，{name}" },
  next: {
    teacher: "授课教师", position: { docent: "副教授", prof: "教授", senior: "高级讲师", lect: "讲师", colonel: "上校" },
    now: "正在上课", next: "下一节课", left: "还剩{time}", in: "{time}后",
    day: "日期", start: "开始", room: "教室", until: "至 {time}", nearWeekday: "{near}，{weekday}",
    aria: "{label}：{title}，{weekday}，{date}，{time}，教室 {room}",
    moved: "课程已调整", usually: "原定：{text}", prev: "{day}，{time}，{room}教室", progress: "本节课已进行时间",
    noMore: "没有更多课程", noMoreText: "学期已结束或课程尚未排定。考试安排请见“课表”。",
  },
  dur: {
    min: "{n}分钟", hm: "{h}小时{m}分钟", h: "{n}小时",
    days: { other: "{n}天" },
  },
  grades: {
    title: "学习情况", pace1: "已获得的分数比例", pace2: "本学期",
    dayPoints: "当天课程的分数", todayPoints: "今天课程的分数",
    auto: "免考", risk: "有风险", toAuto: "距免考还差 {n}", toAutoHint: "距免考还差的分数",
    autoDone: "已获免考：", autoOf: "{n}/{total}", avg: "成绩册平均分：", riskLabel: "风险：", noRisk: "没有风险，继续保持",
  },
  day: {
    week: "本周", tomorrow: "明天，{date}",
    lessons: { other: "{n}节课" },
    none: "无课", nextDayNote: "今天没有课，这是最近的上课日。",
    cancelled: "本节课取消", roomChanged: "现在在 {room} 教室（原 {prev}）", movedHere: "调至此时 · {room} 教室",
    meta: "{type} · {room} 教室，{building} 楼", empty: "今天没有课", nearest: "最近一节：{day} {time}。",
  },
  ai: {
    title: "教务助手", text: "依据规章和你的数据作答，还能帮你填写申请。",
    label: "向助手提问", placeholder: "你想问教务处的问题", ask: "提问",
  },
  deadlines: { workTitle: "{work} — {short}", workDesc: "{name} · 满分 {max} 分", title: "近期截止日期", empty: "近期没有截止日期" },
  requests: { title: "我的申请", needsInfo: "请回复教务处", ready: "请查看文件", due: "{date}前", empty: "没有进行中的申请。", order: "申请证明" },
  news: { title: "公告", important: "重要", empty: "没有新公告。", all: "全部通知" },
  more: {
    unread: { other: "{n}条未读" },
    allRead: "已全部阅读", assistant: "教务助手", assistantHint: "AI 依据规章和你的数据作答",
    appointmentsHint: "无需排队", profileHint: "个人信息、语言、登录会话",
  },
  quick: {"aria": "快捷操作", "cert": "申请证明", "week": "本周课表", "appointment": "预约教务员", "map": "去教室的路线", "request": "申请"},
};
export default today;
