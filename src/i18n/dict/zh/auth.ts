import type { Shape } from "@/i18n/core";
import type ru from "../ru/auth";

const auth: Shape<typeof ru> = {
  login: {
    title: "登录",
    about: "关于本服务",
    kicker: "未来的数字教务办",
    heroTitle: "学习事务一站搞定，轻点几下即可",
    heroText: "学生个人中心：课表、成绩、证明以及与教务办的联系。",
    heading: "登录个人中心",
    subtitle: "学生和教务办工作人员——使用登录名和密码。",
    reset: "演示数据已重新生成。请重新登录。",
    forgot: "忘记密码？请携带学生证到学生事务中心（A楼1012室）领取新密码。",
    login: "登录名",
    password: "密码",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    signingIn: "正在登录…",
    signIn: "登录",
    demoTitle: "评委演示账号",
    demoText: "虚构账号。点击即可填入登录名和密码。",
    demoStudent: "{name}，{faculty}，{course}年级",
    demoWithExtra: "{base}，{extra}",
    demoMilitary: "军事训练",
    demoOdintsovo: "奥金佐沃",
    demoStaff: "{name}，教务办",
  },
  errors: {
    enterLogin: "请输入登录名",
    enterPassword: "请输入密码",
    invalid: "登录名或密码错误",
    invalidLeft: "登录名或密码错误。剩余尝试次数：{n}",
    tooMany: "失败次数过多。请等待15分钟后再试。",
  },
  pages: {
    verify: {
      title: "文件验证",
      valid: "文件真实有效",
      revoked: "文件已作废",
      expired: "文件已过期",
      document: "文件",
      number: "编号",
      issued: "签发日期",
      validUntil: "有效期至",
      student: "学生",
      notFound: "未找到文件",
      notFoundText: "请检查链接或二维码。如果文件是从学生处获得的，请索取新文件。",
    },
    notFound: {
      title: "页面未找到",
      text: "该页面不存在或您无权访问。请检查地址或返回首页。",
      home: "返回首页",
    },
    offline: {
      title: "无网络",
      heading: "没有网络连接",
      text: "网络恢复后即可打开个人中心。我们不会在设备上保存个人数据——在他人或公用电脑上更安全。",
    },
    error: {
      title: "出了点问题",
      text: "无法加载此栏目。您的数据是安全的——请过几秒再试。",
      retry: "重试",
    },
  },
};
export default auth;
