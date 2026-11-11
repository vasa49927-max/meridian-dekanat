import type { Shape } from "@/i18n/core";
import type ru from "../ru/portfolio";

const portfolio: Shape<typeof ru> = {
  "title": "个人档案",
  "subtitle": "在校期间的成绩与经历——一键生成简历",
  "cv": "简历（PDF）",
  "kinds": {
    "OLYMPIAD": "竞赛",
    "CONFERENCE": "学术会议",
    "INTERNSHIP": "实习",
    "CERTIFICATE": "证书",
    "VOLUNTEER": "志愿服务",
    "PUBLICATION": "发表"
  },
  "verified": "已由教务处确认",
  "unverified": "本人添加",
  "remove": "删除",
  "removeAria": "删除：{title}",
  "removeConfirm": {
    "title": "删除这条记录？",
    "body": "它将从个人档案和简历中消失。",
    "ok": "删除"
  },
  "empty": {
    "title": "个人档案还是空的",
    "text": "添加竞赛、实习、证书——简历会据此自动生成。"
  },
  "add": {
    "title": "添加成就",
    "kind": "类型",
    "name": "名称",
    "namePlaceholder": "例如：分析部门实习",
    "org": "机构",
    "date": "年月",
    "description": "简述成果",
    "submit": "添加",
    "sending": "保存中…",
    "done": "已添加到个人档案",
    "note": "核对材料后，教务处可将记录标记为已确认。"
  },
  "errors": {
    "fill": "请填写必填项",
    "title": "名称应为 3–200 个字符",
    "date": "请填写年月",
    "limit": "个人档案最多 50 条记录"
  },
  "cvPage": {
    "title": "简历",
    "print": "打印或保存为 PDF",
    "back": "返回个人档案",
    "education": "教育背景",
    "achievements": "成就",
    "languages": "语言",
    "contacts": "联系方式",
    "student": "{course} 年级学生",
    "program": "{code}「{name}」",
    "avg": "平均分：{avg}/100",
    "since": "自 {year} 年",
    "generated": "由“子午线”学生账户生成",
    "verifiedMark": "✓ 已确认"
  }
};
export default portfolio;
