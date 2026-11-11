import type { Shape } from "@/i18n/core";
import type ru from "../ru/campus";

const campus: Shape<typeof ru> = {
  "title": "怎么走",
  "subtitle": "校园示意图和到教室的路线",
  "disclaimer": "本示意图为虚构的简化图，仅用于演示概念，真实建筑布局不同。",
  "link": "怎么走",
  "form": {
    "aria": "查找教室",
    "room": "教室",
    "roomPlaceholder": "例如 3015",
    "building": "楼",
    "go": "显示路线"
  },
  "plan": {
    "aria": "校园示意图",
    "avenue": "维尔纳茨基大街",
    "entrance": "正门",
    "bridge": "连廊，2楼",
    "vucEntrance": "军训中心入口",
    "bus": "西南地铁站班车",
    "street": "新体育街",
    "basement": "体育馆—地下层",
    "target": "目的地"
  },
  "route": {
    "title": "前往 {room} 教室的路线",
    "titleBuilding": "怎么走：{building}",
    "floor": "{n} 楼",
    "noFloor": "未标明楼层",
    "empty": "输入教室和楼号，我们会告诉你怎么走。每张课程卡片上也有“怎么走”链接。"
  },
  "side": {
    "left": "左",
    "right": "右"
  },
  "steps": {
    "enterMain": "从维尔纳茨基大街一侧的正门进入，刷学生证通过闸机。",
    "floor1": "教室在1楼，无需上楼。",
    "liftA": "上到 {floor} 楼——电梯和楼梯就在闸机后面。",
    "center": "到楼层后直走——中央区。",
    "east": "向右转——东翼。",
    "west": "向左转——西翼。",
    "side": "{room} 教室在走廊{side}侧（单号在左，双号在右）。",
    "toBridge": "上到2楼，走到东翼尽头——那里有通往B楼的连廊。",
    "liftB": "在B楼上到 {floor} 楼。",
    "bus": "从莫斯科市区乘坐西南地铁站出发的校园班车，时刻表见校园网站。",
    "enterO": "教学楼入口在新体育街一侧。",
    "liftO": "上到 {floor} 楼。",
    "vuc": "军训中心有单独入口，位于主楼西端。着装按军训中心课表要求。",
    "sport": "过闸机后下到地下层——体育馆入口在楼梯对面。",
    "unknown": "示意图上没有这个教室——请核对编号，或参考该楼的提示。"
  },
  "vucCode": "军训中心",
  "buildings": "教学楼"
};
export default campus;
