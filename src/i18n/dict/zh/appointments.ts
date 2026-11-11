import type { Shape } from "@/i18n/core";
import type ru from "../ru/appointments";

const appointments: Shape<typeof ru> = {
  title: "预约教务员",
  subtitle: "无需在门口排队：选好时间，准时到达即可",
  mine: "我的预约",
  dayNear: "{near}，{weekday}",
  cancel: "取消",
  cancelTitle: "取消预约？",
  cancelText: "{day}，{time} — “{topic}”。该时段将被释放，其他同学可以预约。",
  cancelConfirm: "是，取消预约",
  newTitle: "新预约",
  emptyTitle: "暂无空闲时段",
  emptyText: "每周一会开放新的时段。如有急事，请询问助手。",
  history: "以往及已取消的预约",
  cancelled: "已取消",
  done: "已完成",
  topics: {
    docs: "证明与文件",
    plan: "个人学习计划",
    retake: "补考 / 学分差额",
    transfer: "转专业、复学、休学",
    thesis: "毕业论文选题",
    misc: "其他",
  },
  book: {
    success: "完成！预约已显示在上方，提醒将发送到你的通知中。",
    again: "再预约一次",
    day: "日期",
    slots: { other: "{n} 个时段" },
    time: "时间（20 分钟）",
    topic: "来访事由",
    comment: "需携带的材料 / 详细说明",
    optional: "选填",
    submitting: "正在预约…",
    submit: "预约",
    pick: "请选择时间",
  },
  errors: {
    slot: "请选择时间",
    topic: "请简要说明来访事由",
    limit: "最多只能保留两个有效预约——请先取消其中一个",
    taken: "该时段刚刚被预约。请选择其他时间。",
  },
};
export default appointments;
