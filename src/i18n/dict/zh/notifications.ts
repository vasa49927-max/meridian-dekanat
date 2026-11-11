import type { Shape } from "@/i18n/core";
import type ru from "../ru/notifications";

const notifications: Shape<typeof ru> = {
  filters: "筛选",
  filter: { unread: "未读", important: "重要", SCHEDULE: "课表", REQUEST: "申请", ANNOUNCEMENT: "公告", DEADLINE: "截止日期" },
  unread: "未读：{n}", allRead: "已全部阅读", markAll: "全部标为已读", closeAnnouncement: "关闭公告",
  emptyUnread: "没有未读通知", empty: "暂无内容",
  emptyText: "课表变动、申请状态和教务处公告会自动显示在这里。",
  kind: { SCHEDULE: "课表", REQUEST: "申请", ANNOUNCEMENT: "公告", DEADLINE: "截止", APPOINTMENT: "预约", GRADE: "成绩" },
  important: "重要", notRead: "未读",
};
export default notifications;
