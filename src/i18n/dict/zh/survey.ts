import type { Shape } from "@/i18n/core";
import type ru from "../ru/survey";

const survey: Shape<typeof ru> = {
  "title": "课程评价",
  "subtitle": "匿名：教务处只能看到平均分，且至少三人作答后才可见",
  "how": {
    "title": "如何保证匿名",
    "p1": "你的回答不含姓名和具体时间，只记录日期。",
    "p2": "另存一个加密的“已作答”标记，防止重复投票。它无法与你的回答关联。",
    "p3": "一门课程至少有三份回答时，教务处才能看到结果。"
  },
  "q": {
    "clarity": "讲解是否清楚",
    "teacher": "你如何评价教师的工作",
    "workload": "课业负担是否合理",
    "comment": "有什么可以改进（选填）",
    "commentHint": "请不要写姓名或可能识别出你的细节。"
  },
  "scale": {
    "low": "差",
    "high": "很好",
    "aria": "{q}：{n}/5"
  },
  "send": "匿名提交",
  "sending": "提交中…",
  "done": "谢谢！你的回答已匿名记录。",
  "voted": "你已作答",
  "left": {
    "other": "还有 {n} 门课程待评价"
  },
  "allDone": "你已评价本学期所有课程，谢谢！",
  "empty": "本学期没有可评价的课程。",
  "banner": {
    "text": "匿名评价本学期课程，每门约 1 分钟。",
    "cta": "参加问卷"
  },
  "errors": {
    "fill": "请回答全部三个问题",
    "already": "你已评价过这门课程",
    "notFound": "未找到课程"
  }
};
export default survey;
