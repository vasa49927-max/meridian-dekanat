import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Меридиан — цифровой деканат (концепт)",
    short_name: "Меридиан",
    description: "Концепт личного кабинета студента для конкурса МГИМО по ИИ. Не является официальным сервисом МГИМО.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#14244b",
    lang: "ru",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Расписание", url: "/schedule" },
      { name: "Заказать справку", url: "/requests/new" },
      { name: "Помощник", url: "/assistant" },
    ],
  };
}
