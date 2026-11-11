import type { Shape } from "@/i18n/core";
import type ru from "../ru/assistant";

const assistant: Shape<typeof ru> = {
  title: "教务助手",
  modeLlm: "GigaChat · ",
  modeOffline: "条例检索模式 · ",
  subtitle: "依据条例和您的数据回答，并注明条款。只能看到您本人的数据。",
  offlineLang: "离线模式（不使用AI）以俄语回答。",
  hello: "{name}，您好！可以询问证明、考试、课表或规定，也可以让我帮您填写申请。",
  suggest: {
    s1: "我的考试情况怎么样？",
    s2: "办西班牙签证需要哪种证明？",
    s3: "怎样才能免考通过考查？",
    s4: "我需要一份兵役登记处的证明",
    s5: "因参加学科竞赛可以推迟考试吗？",
    s6: "教务员什么时候接待？",
  },
  sources: "条例：",
  point: "第 {id} 条",
  fill: "填写：{title}",
  offlineAnswer: "答案摘自条例，未使用AI（俄语）",
  typing: "助手正在输入",
  inputLabel: "您的问题",
  placeholder: "例如：兵役登记处需要哪种证明？",
  send: "发送",
  disclaimer: "助手可能出错，请以条例为准。它不会自行提交申请：由您核对表单并发送。",
  errors: {
    generic: "出错了",
    network: "无法连接服务器。请检查网络后重试。",
    badRequest: "请求无效",
    tooMany: "本小时提问过多。请稍后再试，或预约教务员。",
  },
};
export default assistant;
