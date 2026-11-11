import type { Shape } from "@/i18n/core";
import type ru from "../ru/common";

const common: Shape<typeof ru> = {
  brand: "Meridian",
  tagline: "数字教务处",
  brandHome: "Meridian — 返回首页",
  disclaimerStrong: "莫斯科国际关系学院人工智能竞赛概念作品。",
  disclaimerRest: "并非学校官方服务。所有人物和数据均为虚构。",
  nav: {
    sections: "栏目", mainSections: "主要栏目", today: "今天", schedule: "课表", grades: "成绩", requests: "申请与证明",
    requestsShort: "申请", notifications: "通知", assistant: "助手", appointments: "预约教务员", profile: "个人资料", more: "更多",
    unreadCount: { other: "{n} 条未读" },
    staffQueue: "申请队列", staffAnnouncements: "公告", staffLessons: "调课", staffReception: "学生接待", staffDemo: "演示数据",
    hasUnread: "有未读通知", skip: "跳到正文", logout: "退出", studentRole: "{course} 年级 · 学生",
  },
  top: { search: "搜索与操作", searchAria: "搜索与操作（Ctrl+K）", notifications: "通知", notificationsUnread: "通知：{n} 条未读" },
  theme: { dark: "深色主题", light: "浅色主题", toDark: "切换到深色主题", toLight: "切换到浅色主题" },
  offline: "网络已断开。正在显示最近加载的版本，恢复连接后即可操作。",
  loading: "加载中…", loadingAria: "加载中",
  confirm: { yes: "是", keep: "不，保留", back: "不，返回" },
  actions: { back: "上一步", next: "下一步", save: "保存", saving: "保存中…", cancel: "取消", close: "关闭", all: "全部", more: "详情", retry: "重试", showMore: "显示更多" },
  avatar: "头像：{name}",
  status: { SUBMITTED: "已提交", IN_PROGRESS: "处理中", NEEDS_INFO: "需补充", READY: "已办好", ISSUED: "已领取", REJECTED: "已拒绝" },
  lessonType: { LECTURE: "讲座", SEMINAR: "研讨课", PRACTICE: "实践课", LANGUAGE: "外语", MILITARY: "军训", CONSULTATION: "答疑", EXAM: "考试", CREDIT: "考查" },
  control: { EXAM: "考试", CREDIT: "考查", GRADED_CREDIT: "评分考查" },
  lang: { label: "语言", note: "教务处发布的消息以原文显示。" },
  tour: {
    step: "提示 {i} / {n}", welcome: "{name}，欢迎", close: "关闭提示", start: "知道了，开始", reopen: "使用提示",
    s1t: "重要信息都在“今天”", s1: "下一节课的教室和倒计时，下方就是本周的调课和停课。不必再翻群聊。",
    s2t: "“成绩”告诉你从哪里开始", s2: "已有多少分、离免考还差多少、下一项作业是什么。每张卡片里都有“如果……”计算器。",
    s3t: "办证明不用排队", s3: "“申请”→ 选择文件 → 一分钟填完表。状态在这里更新，办好的证明附带验证二维码。",
    s4t: "搜索与助手", s4: "Ctrl+K（或顶部放大镜）可快速前往任何页面。“助手”依据校规回答，并可代填申请——由你提交。",
  },
  palette: {
    label: "站内搜索", placeholder: "栏目、课程、证明、操作…", empty: "没有找到。试试问问", emptyAssistant: "助手",
    quick: "快捷操作", order: "申请：{title}", book: "预约教务员", ask: "询问助手", calendar: "将课表加入手机日历",
    sections: "栏目", theme: "切换主题", myCourses: "我的课程", myRequests: "我的申请", lastRequests: "最近的申请",
    hintNav: "↑↓ 选择，Enter 打开", hintEsc: "Esc 关闭",
  },
  ics: { cancelled: "[停课]", moved: "[调课]", room: "{room} 教室", change: "变更：{note}", cancelNote: "已取消：{note}", moveDefault: "调课", calName: "Meridian — 课表" },
};
export default common;
